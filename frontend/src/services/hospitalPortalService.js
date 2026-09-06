import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class HospitalPortalService {
  /**
   * Helper to perform Express API calls with silent fallback to direct Supabase queries
   */
  async fetchWithFallback(endpoint, options = {}, fallbackFn) {
    try {
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/hospital-portal${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data !== undefined ? json.data : json;
      } else if (res.status >= 400 && res.status < 500) {
        // Explicit client validation error from Express
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Request failed with status ${res.status}`);
      }
    } catch (e) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('Failed to fetch')) {
        throw e;
      }
      // Backend not running or network unreachable; proceed seamlessly to client-side Supabase
    }
    return await fallbackFn();
  }

  // =========================================================================
  // 1. DASHBOARD OVERVIEW (Page 1)
  // =========================================================================
  async getDashboardMetrics(hospitalId) {
    return this.fetchWithFallback(`/dashboard?hospitalId=${hospitalId}`, {}, async () => {
      const [bedsRes, docsRes, apptsRes, resvsRes, hospRes, transpRes, pkgsRes, admsRes] = await Promise.all([
        supabase.from('hospital_beds').select('*, bed_types(*)').eq('hospital_id', hospitalId),
        supabase.from('doctors').select('*, departments(name)').eq('hospital_id', hospitalId),
        supabase.from('doctor_appointments').select('*, doctors(name, specialization), patient_profiles(user_id, profiles(full_name, phone))').eq('hospital_id', hospitalId).order('created_at', { ascending: false }),
        supabase.from('bed_reservations').select('*, bed_types(*)').eq('hospital_id', hospitalId).order('created_at', { ascending: false }),
        supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle(),
        supabase.from('transparency_scores').select('*').eq('hospital_id', hospitalId).maybeSingle(),
        supabase.from('treatment_packages').select('id, name, price').eq('hospital_id', hospitalId).limit(6),
        supabase.from('hospital_admissions').select('*, bed_types(*)').eq('hospital_id', hospitalId)
      ]);

      const beds = bedsRes.data || [];
      const doctors = docsRes.data || [];
      const appointments = apptsRes.data || [];
      const reservations = resvsRes.data || [];
      const hospital = hospRes.data || {};
      const transp = transpRes.data || {};
      const packages = pkgsRes.data || [];
      const admissions = admsRes?.data || [];

      const totalBeds = beds.reduce((acc, b) => acc + (Number(b.total_beds) || 0), 0);
      const occupiedBeds = beds.reduce((acc, b) => acc + (Number(b.occupied_beds) || 0), 0);
      const reservedBeds = beds.reduce((acc, b) => acc + (Number(b.reserved_beds) || 0), 0);
      const availableBeds = beds.reduce((acc, b) => acc + (Number(b.available_beds) || 0), 0);
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';

      const icuBed = beds.find(b => b.bed_types?.name?.toLowerCase().includes('icu')) || { total_beds: 0, occupied_beds: 0, available_beds: 0 };

      const totalDocs = doctors.length;
      const availableDocs = doctors.filter(d => d.available_today !== false).length;

      // Active items calculation: strictly exclude discharged inpatients and completed reservations
      const activeAdmissions = admissions.filter(a => a.status === 'admitted');
      const activeAppts = appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled');
      const activeResvs = reservations.filter(r => (r.status === 'held' || r.status === 'pending') && !admissions.some(a => a.reservation_id === r.id));
      const activeBookingsCount = activeAdmissions.length + activeAppts.length + activeResvs.length;

      let transparencyScore = Number(hospital.transparency_score || transp.overall_score || 0);
      if (!transparencyScore) {
        const pricedBeds = beds.filter(b => Number(b.price_per_day) > 0).length;
        const priceClarity = beds.length > 0 ? Math.round(30 + (pricedBeds / beds.length) * 70) : 25;
        const activePkgs = packages.filter(p => Number(p.price) > 0);
        const pkgClarity = activePkgs.length > 0 ? Math.min(100, 30 + activePkgs.length * 15) : 20;
        const infoQual = Math.min(100, Math.max(30, (hospital.name ? 20 : 0) + (hospital.phone ? 20 : 0) + (hospital.address ? 20 : 0) + Math.min(30, doctors.length * 5)));
        const verif = (hospital.verification_status === 'verified' || hospital.kyc_status === 'verified' || hospital.kyc_status === 'approved') ? 100 : (hospital.kyc_status === 'submitted' ? 60 : 30);
        transparencyScore = Math.round(priceClarity * 0.3 + pkgClarity * 0.25 + infoQual * 0.25 + verif * 0.2);
      }

      // Combined bookings from real patient admissions, appointments, and active reservations
      const recentBookings = [];
      activeAdmissions.forEach(adm => {
        recentBookings.push({
          id: adm.id,
          bookingCode: `ADM-${adm.id.slice(0, 8).toUpperCase()}`,
          patientName: adm.patient_name || 'Inpatient',
          department: `Ward Bed (${adm.bed_number || 'General'})`,
          date: adm.admission_date ? new Date(adm.admission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
          timeSlot: 'Admitted',
          status: 'Active Inpatient'
        });
      });

      appointments.slice(0, 5).forEach(a => {
        recentBookings.push({
          id: a.id,
          bookingCode: `APT-${a.id.slice(0, 8).toUpperCase()}`,
          patientName: a.patient_profiles?.profiles?.full_name || 'Patient',
          department: a.doctors?.specialization || a.doctors?.name || 'Specialist Consultation',
          date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
          timeSlot: a.appointment_time || '10:00 AM',
          status: a.status ? (a.status.charAt(0).toUpperCase() + a.status.slice(1)) : 'Confirmed'
        });
      });

      activeResvs.slice(0, 5).forEach(r => {
        recentBookings.push({
          id: r.id,
          bookingCode: `RES-${r.id.slice(0, 8).toUpperCase()}`,
          patientName: r.patient_notes || 'Emergency Inpatient',
          department: r.bed_types?.name || 'General Bed',
          date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timeSlot: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Pending'
        });
      });

      return {
        hospitalName: hospital.name || 'Hospital Facility',
        city: hospital.city || 'Indore',
        casualtyActive: hospital.emergency_available !== false,
        dateDisplay: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' }),
        kpis: {
          availableBeds: { count: availableBeds, total: totalBeds, trend: 12 },
          icuAvailable: { count: Number(icuBed.available_beds) || 0, total: Number(icuBed.total_beds) || 0, trend: 5 },
          activeBookings: { count: activeBookingsCount, label: 'Active', trend: 8 },
          doctorsAvailable: { count: availableDocs, total: totalDocs, trend: 10 },
          transparencyScore: { score: transparencyScore, status: transparencyScore >= 85 ? 'Good' : 'Moderate', trend: 6 },
          totalBeds: { value: totalBeds, trend: 0 },
          occupancyRate: { value: `${occupancyRate}%`, trend: 2.1 },
          todayBookings: { value: activeBookingsCount, trend: 12.5 }
        },
        bedOverview: beds.length > 0 ? beds.map(b => ({
          type: b.bed_types?.name || 'General Bed',
          total: Number(b.total_beds) || 0,
          occupied: Number(b.occupied_beds) || 0,
          reserved: Number(b.reserved_beds) || 0,
          available: Number(b.available_beds) || 0,
          badge: b.bed_types?.name?.toLowerCase().includes('icu') ? 'rose' : 'blue'
        })) : [
          { type: 'No beds configured', total: 0, occupied: 0, reserved: 0, available: 0, badge: 'slate' }
        ],
        recentBookings: recentBookings.slice(0, 5),
        todayBookings: recentBookings.slice(0, 5),
        transparencySnapshot: {
          overallScore: transparencyScore,
          factors: [
            { label: 'Price Clarity', score: Number(transp.price_clarity_score || 96) },
            { label: 'Package Clarity', score: Number(transp.package_clarity_score || 94) },
            { label: 'Data Freshness', score: Number(transp.data_freshness_score || 98) },
            { label: 'Information Quality', score: Number(transp.information_score || 95) },
            { label: 'Billing Consistency', score: Number(transp.billing_consistency_score || 92) }
          ]
        },
        performance: {
          popularTreatments: packages.map((p, idx) => ({
            name: p.name,
            value: Math.max(15, Math.min(45, Math.round(Number(p.price) / 2500) || (20 + idx * 4)))
          }))
        }
      };
    });
  }

  // =========================================================================
  // 2. HOSPITAL PROFILE (Page 2)
  // =========================================================================
  async getProfile(hospitalId) {
    return this.fetchWithFallback(`/profile?hospitalId=${hospitalId}`, {}, async () => {
      const [hospRes, bedsRes, docsRes] = await Promise.all([
        supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle(),
        supabase.from('hospital_beds').select('*, bed_types(*)').eq('hospital_id', hospitalId),
        supabase.from('doctors').select('specialization, departments(name)').eq('hospital_id', hospitalId)
      ]);

      const data = hospRes.data || {};
      const beds = bedsRes.data || [];
      const doctors = docsRes.data || [];

      const totalBeds = beds.reduce((acc, b) => acc + (Number(b.total_beds) || 0), 0);
      const icuBed = beds.find(b => b.bed_types?.name?.toLowerCase().includes('icu'));
      const icuBeds = icuBed ? (Number(icuBed.total_beds) || 0) : 0;

      const deptSet = new Set();
      doctors.forEach(d => {
        if (d.departments?.name) deptSet.add(d.departments.name);
        if (d.specialization) deptSet.add(d.specialization);
      });
      if (Array.isArray(data?.specialties)) {
        data.specialties.forEach(s => deptSet.add(s));
      }
      const departmentsList = deptSet.size > 0 
        ? Array.from(deptSet) 
        : ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Critical Care', 'Oncology'];

      return {
        id: data?.id || hospitalId,
        name: data?.name || 'Apollo Hospitals',
        tagline: 'World-Class Clinical Care, Compassion & Transparency',
        type: data?.type || 'Multi Super Speciality Hospital',
        ownershipType: 'Healthcare Enterprise',
        yearEstablished: 1983,
        totalBeds: totalBeds || 145,
        icuBeds: icuBeds || 25,
        emergencyAvailable: data?.emergency_available !== false,
        emergency_available: data?.emergency_available !== false,
        phone: data?.phone || '+91-731-2445566',
        alternatePhone: '+91-731-2445500',
        email: 'emergency.indore@apollohospitals.com',
        website: data?.website || 'https://apollohospitals.com/indore',
        address: data?.address || 'Sector D, Scheme No 74C, Vijay Nagar',
        city: data?.city || 'Indore',
        state: data?.state || 'Madhya Pradesh',
        country: data?.country || 'India',
        postalCode: data?.postal_code || '452010',
        postal_code: data?.postal_code || '452010',
        description: data?.description || 'Apollo Hospitals is a premier quaternary care healthcare institution in Indore.',
        imageUrl: data?.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
        image_url: data?.image_url || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
        openingHours: data?.opening_hours || 'Open 24 Hours',
        opening_hours: data?.opening_hours || 'Open 24 Hours',
        specialties: data?.specialties || ['Cardiology', 'Oncology', 'Organ Transplant', 'Neurology', 'Orthopedics'],
        completeness: 92,
        departments: departmentsList.slice(0, 10),
        emergencyFeatures: [
          '24x7 Emergency Trauma Center',
          'Advanced Cardiac ICU Support',
          'Dedicated Emergency Stroke Unit',
          '24x7 Ambulance & Mobile ICU',
          'Rapid Emergency Diagnostics'
        ],
        facilities: [
          { name: '24x7 Emergency', icon: 'PhoneCall', active: data?.emergency_available !== false },
          { name: 'ICU & Critical Care', icon: 'HeartPulse', active: true },
          { name: 'Modern OT Complex', icon: 'Scissors', active: true },
          { name: 'Advanced Diagnostics & MRI', icon: 'Scan', active: true },
          { name: 'Blood Bank & Component Lab', icon: 'Droplets', active: true },
          { name: '24x7 In-House Pharmacy', icon: 'Pill', active: true },
          { name: 'Critical Care Ambulance', icon: 'Ambulance', active: true },
          { name: 'Hemodialysis Unit', icon: 'Activity', active: true }
        ],
        verification: {
          status: data?.verification_status || 'verified',
          verifiedOn: data?.verified_at ? new Date(data.verified_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 May 2025',
          verifiedBy: 'OpenHealth Clinical Standards Board',
          documents: 'NABH Accreditation, AERB License, Bio-Medical Waste Clearance, Fire Safety NOC'
        }
      };
    });
  }

  async updateProfile(hospitalId, updates) {
    const payload = {
      name: updates.name,
      type: updates.type,
      description: updates.description,
      address: updates.address,
      city: updates.city,
      state: updates.state,
      country: updates.country,
      postal_code: updates.postal_code || updates.postalCode,
      phone: updates.phone,
      website: updates.website,
      emergency_available: updates.emergency_available !== undefined ? updates.emergency_available : updates.emergencyAvailable,
      image_url: updates.image_url || updates.imageUrl,
      opening_hours: updates.opening_hours || updates.openingHours,
      specialties: updates.specialties,
      updated_at: new Date().toISOString()
    };

    // Remove undefined keys
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    return this.fetchWithFallback(`/profile?hospitalId=${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, async () => {
      const { data, error } = await supabase
        .from('hospitals')
        .update(payload)
        .eq('id', hospitalId)
        .select()
        .single();
      if (error) throw error;
      return data;
    });
  }

  // =========================================================================
  // 3. BEDS INVENTORY & LIVE STATUS (Page 3)
  // =========================================================================
  async getBeds(hospitalId) {
    return this.fetchWithFallback(`/beds?hospitalId=${hospitalId}`, {}, async () => {
      // 1. Fetch available bed types from global catalog
      const { data: bedTypes } = await supabase.from('bed_types').select('*').order('name');

      // 2. Fetch configured beds for this specific hospital
      const { data: hospitalBeds } = await supabase
        .from('hospital_beds')
        .select('*, bed_types(*)')
        .eq('hospital_id', hospitalId)
        .order('created_at');

      const beds = hospitalBeds || [];

      const total = beds.reduce((acc, b) => acc + (Number(b.total_beds) || 0), 0);
      const occupied = beds.reduce((acc, b) => acc + (Number(b.occupied_beds) || 0), 0);
      const reserved = beds.reduce((acc, b) => acc + (Number(b.reserved_beds) || 0), 0);
      const available = beds.reduce((acc, b) => acc + (Number(b.available_beds) || 0), 0);

      const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0.0';

      const categories = beds.map(b => {
        const typeName = b.bed_types?.name || 'General Ward';
        const isICU = typeName.toLowerCase().includes('icu');
        const isHDU = typeName.toLowerCase().includes('hdu');
        const isNICU = typeName.toLowerCase().includes('nicu');
        const defaultRate = isICU ? 6500 : isHDU ? 4000 : isNICU ? 5000 : 1500;
        const rate = (b.price_per_day !== null && b.price_per_day !== undefined) ? Number(b.price_per_day) : defaultRate;
        const tot = Number(b.total_beds) || 0;
        const occ = Number(b.occupied_beds) || 0;
        const resv = Number(b.reserved_beds) || 0;
        const avail = Number(b.available_beds) || 0;

        return {
          id: b.id,
          bed_type_id: b.bed_type_id,
          name: typeName,
          total: tot,
          occupied: occ,
          reserved: resv,
          available: avail,
          rate,
          price_per_day: rate,
          status: avail > 0 ? 'Available' : 'Full'
        };
      });

      return {
        bedTypesCatalog: bedTypes || [],
        kpis: {
          total,
          occupied,
          available,
          reserved,
          maintenance: 0,
          occupancyRate: `${occupancyRate}%`
        },
        categories,
        beds: beds.map((b, idx) => {
          const typeName = b.bed_types?.name || 'General';
          const isICU = typeName.toLowerCase().includes('icu');
          const isHDU = typeName.toLowerCase().includes('hdu');
          const bedTypeClean = isICU ? 'ICU' : isHDU ? 'HDU' : 'General';
          const defaultRate = isICU ? 6500 : isHDU ? 4000 : 1500;
          const rate = (b.price_per_day !== null && b.price_per_day !== undefined) ? Number(b.price_per_day) : defaultRate;
          const avail = Number(b.available_beds) || 0;
          const occ = Number(b.occupied_beds) || 0;
          const resv = Number(b.reserved_beds) || 0;
          const tot = Number(b.total_beds) || 0;
          return {
            id: b.id,
            bed_type_id: b.bed_type_id,
            bedNumber: `${bedTypeClean.toUpperCase()}-W${idx + 1}`,
            name: typeName,
            category: typeName,
            bedType: bedTypeClean,
            department: isICU ? 'Critical Care Unit' : isHDU ? 'Step-Down HDU' : 'Inpatient Medicine',
            floor: isICU ? '3rd Floor - Wing A' : '2nd Floor - Wing B',
            status: avail > 0 ? 'Available' : 'Occupied',
            patient: occ > 0 ? `${occ} Admitted (${avail} Vacant)` : 'None (Ready)',
            rate,
            price_per_day: rate,
            total_beds: tot,
            occupied_beds: occ,
            reserved_beds: resv,
            available_beds: avail,
            lastUpdated: b.last_updated_at ? new Date(b.last_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10 mins ago',
            last_updated: b.last_updated_at || b.updated_at
          };
        })
      };
    });
  }

  async saveBedCategory(hospitalId, bedTypeId, totalBeds, occupiedBeds, reservedBeds = 0, pricePerDay = 1500) {
    const total = Number(totalBeds) || 0;
    const occupied = Number(occupiedBeds) || 0;
    const reserved = Number(reservedBeds) || 0;
    const available = Math.max(0, total - occupied - reserved);
    const rate = Number(pricePerDay) || 1500;

    return this.fetchWithFallback(`/beds`, {
      method: 'POST',
      body: JSON.stringify({ 
        hospitalId, 
        bedTypeId, 
        totalBeds: total, 
        occupiedBeds: occupied, 
        reservedBeds: reserved,
        pricePerDay: rate,
        price_per_day: rate
      })
    }, async () => {
      const { data, error } = await supabase
        .from('hospital_beds')
        .upsert({
          hospital_id: hospitalId,
          bed_type_id: bedTypeId,
          total_beds: total,
          occupied_beds: occupied,
          reserved_beds: reserved,
          available_beds: available,
          price_per_day: rate,
          last_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'hospital_id,bed_type_id' })
        .select('*, bed_types(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async updateBedCounts(bedId, updates) {
    return this.fetchWithFallback(`/beds/${bedId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, async () => {
      const { data, error } = await supabase
        .from('hospital_beds')
        .update({
          ...updates,
          last_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bedId)
        .select('*, bed_types(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async deleteBedCategory(bedId) {
    return this.fetchWithFallback(`/beds/${bedId}`, {
      method: 'DELETE'
    }, async () => {
      const { error } = await supabase.from('hospital_beds').delete().eq('id', bedId);
      if (error) throw error;
      return { success: true };
    });
  }

  // =========================================================================
  // 4. DOCTORS & SPECIALISTS ROSTER (Page 4)
  // =========================================================================
  async getDoctors(hospitalId) {
    return this.fetchWithFallback(`/doctors?hospitalId=${hospitalId}`, {}, async () => {
      const [docsRes, deptsRes] = await Promise.all([
        supabase.from('doctors').select('*, departments(name)').eq('hospital_id', hospitalId).order('name'),
        supabase.from('departments').select('id, name').eq('hospital_id', hospitalId).order('name')
      ]);

      const docs = docsRes.data || [];
      const depts = deptsRes.data || [];

      const total = docs.length;
      const onDuty = docs.filter(d => d.available_today === true && d.is_active !== false).length;
      const onCall = docs.filter(d => d.available_today !== true && d.is_active !== false).length;
      const inactive = docs.filter(d => d.is_active === false).length;
      const avgFee = total > 0 ? Math.round(docs.reduce((acc, d) => acc + (Number(d.consultation_fee) || 0), 0) / total) : 500;

      return {
        departmentsCatalog: depts,
        kpis: {
          total,
          availableToday: onDuty,
          onDuty,
          onLeave: onCall,
          inactive,
          avgFee
        },
        doctors: docs.map(d => ({
          id: d.id,
          name: d.name,
          department_id: d.department_id,
          department: d.departments?.name || d.specialization || 'General Speciality',
          specialization: d.specialization || '',
          qualification: d.qualification || 'MBBS',
          experience: `${d.experience_years || 5} Years`,
          experience_years: d.experience_years || 5,
          consultation_fee: Number(d.consultation_fee) || 500,
          fee: Number(d.consultation_fee) || 500,
          shift: d.opd_timings || '10:00 AM - 02:00 PM',
          available_today: d.available_today !== false,
          is_active: d.is_active !== false,
          status: d.is_active !== false ? 'Active' : 'Inactive',
          rating: d.rating || 4.8,
          reviews: d.review_count || 12,
          photo: d.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'
        }))
      };
    });
  }

  async addDoctor(doctorData) {
    return this.fetchWithFallback('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData)
    }, async () => {
      const { data, error } = await supabase
        .from('doctors')
        .insert({
          ...doctorData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, departments(name)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async updateDoctor(doctorId, updates) {
    return this.fetchWithFallback(`/doctors/${doctorId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, async () => {
      const { data, error } = await supabase
        .from('doctors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', doctorId)
        .select('*, departments(name)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async toggleDoctorDuty(doctorId) {
    return this.fetchWithFallback(`/doctors/${doctorId}/duty`, {
      method: 'PATCH'
    }, async () => {
      const { data: current } = await supabase.from('doctors').select('available_today').eq('id', doctorId).single();
      const { data, error } = await supabase
        .from('doctors')
        .update({ available_today: !current?.available_today, updated_at: new Date().toISOString() })
        .eq('id', doctorId)
        .select('*, departments(name)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async toggleDoctorActive(doctorId, isActive) {
    return this.fetchWithFallback(`/doctors/${doctorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    }, async () => {
      const { data, error } = await supabase
        .from('doctors')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', doctorId)
        .select('*, departments(name)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async deleteDoctor(doctorId) {
    return this.fetchWithFallback(`/doctors/${doctorId}`, {
      method: 'DELETE'
    }, async () => {
      const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
      if (error) throw error;
      return { success: true };
    });
  }

  // =========================================================================
  // 5. CLINICAL DEPARTMENTS (Page 5)
  // =========================================================================
  async getDepartments(hospitalId) {
    return this.fetchWithFallback(`/departments?hospitalId=${hospitalId}`, {}, async () => {
      const [deptsRes, docsRes] = await Promise.all([
        supabase.from('departments').select('*').eq('hospital_id', hospitalId).order('name'),
        supabase.from('doctors').select('id, department_id').eq('hospital_id', hospitalId)
      ]);

      const list = deptsRes.data || [];
      const docs = docsRes.data || [];

      const docCountByDept = {};
      docs.forEach(doc => {
        if (doc.department_id) {
          docCountByDept[doc.department_id] = (docCountByDept[doc.department_id] || 0) + 1;
        }
      });

      const activeCount = list.filter(d => d.is_active !== false).length;

      return {
        kpis: {
          total: list.length,
          active: activeCount,
          services: list.length * 6,
          staff: docs.length + (list.length * 8),
          avgPatientsPerDay: list.length * 28,
          clinical: list.filter(d => !d.emergency_available).length,
          critical: list.filter(d => d.emergency_available).length,
          totalDoctors: docs.length,
          totalBeds: 0
        },
        departments: list.map((d, idx) => ({
          id: d.id,
          name: d.name,
          subtitle: d.description || 'Clinical Specialty',
          head: 'Clinical Specialist',
          headQual: 'MD, Senior Consultant',
          code: `DEPT-${idx + 101}`,
          type: d.emergency_available ? 'Critical Care Unit' : 'Clinical Specialty',
          emergency_available: d.emergency_available === true,
          status: d.is_active !== false ? 'Active' : 'Inactive',
          is_active: d.is_active !== false,
          description: d.description || `${d.name} Clinical Department`,
          doctors: docCountByDept[d.id] || (idx % 3 + 2),
          services: 6,
          patientsPerDay: 25 + (idx * 5),
          icon: d.emergency_available ? 'Siren' : 'Activity'
        }))
      };
    });
  }

  async addDepartment(deptData) {
    return this.fetchWithFallback('/departments', {
      method: 'POST',
      body: JSON.stringify(deptData)
    }, async () => {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          ...deptData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    });
  }

  async updateDepartment(deptId, updates) {
    const allowed = ['name', 'description', 'emergency_available', 'is_active'];
    const cleanUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    }

    return this.fetchWithFallback(`/departments/${deptId}`, {
      method: 'PUT',
      body: JSON.stringify(cleanUpdates)
    }, async () => {
      const { data, error } = await supabase
        .from('departments')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', deptId)
        .select()
        .single();
      if (error) throw error;
      return data;
    });
  }

  async deleteDepartment(deptId) {
    return this.fetchWithFallback(`/departments/${deptId}`, {
      method: 'DELETE'
    }, async () => {
      const { error } = await supabase.from('departments').delete().eq('id', deptId);
      if (error) throw error;
      return { success: true };
    });
  }

  // =========================================================================
  // 6. TREATMENTS & SURGICAL PROCEDURES (Page 6)
  // =========================================================================
  async getTreatments(hospitalId) {
    return this.fetchWithFallback(`/treatments?hospitalId=${hospitalId}`, {}, async () => {
      const { data: hospTreats } = await supabase
        .from('hospital_treatments')
        .select('*, treatments(*)')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      const items = hospTreats || [];
      const total = items.length;
      const active = items.filter(t => t.available !== false).length;
      const avgCost = total > 0 ? Math.round(items.reduce((acc, t) => acc + (((Number(t.estimated_min_cost) || 0) + (Number(t.estimated_max_cost) || 0)) / 2), 0) / total) : 25000;

      return {
        kpis: {
          total,
          active,
          categories: new Set(items.map(t => t.treatments?.category)).size,
          avgCost,
          totalBookings: total * 18
        },
        treatments: items.map(t => ({
          id: t.id,
          treatment_id: t.treatment_id,
          name: t.treatments?.name || 'Treatment Procedure',
          sub: t.treatments?.description || 'Standard Medical Procedure',
          category: t.treatments?.category || 'General Speciality',
          department: t.treatments?.category || 'General Medicine',
          duration: '1 - 3 Days',
          minCost: Number(t.estimated_min_cost) || 10000,
          maxCost: Number(t.estimated_max_cost) || 25000,
          avgCost: Math.round(((Number(t.estimated_min_cost) || 10000) + (Number(t.estimated_max_cost) || 25000)) / 2),
          available: t.available !== false,
          status: t.available !== false ? 'Active' : 'Inactive',
          bookingsThisMonth: 22
        }))
      };
    });
  }

  async addTreatment(treatmentData) {
    return this.fetchWithFallback('/treatments', {
      method: 'POST',
      body: JSON.stringify(treatmentData)
    }, async () => {
      const { data, error } = await supabase
        .from('hospital_treatments')
        .upsert(treatmentData, { onConflict: 'hospital_id,treatment_id' })
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async updateTreatment(id, updates) {
    return this.fetchWithFallback(`/treatments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, async () => {
      const { data, error } = await supabase
        .from('hospital_treatments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async toggleTreatmentAvailability(id) {
    return this.fetchWithFallback(`/treatments/${id}/toggle`, {
      method: 'PATCH'
    }, async () => {
      const { data: current } = await supabase.from('hospital_treatments').select('available').eq('id', id).single();
      const { data, error } = await supabase
        .from('hospital_treatments')
        .update({ available: !current?.available, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async deleteTreatment(id) {
    return this.fetchWithFallback(`/treatments/${id}`, {
      method: 'DELETE'
    }, async () => {
      const { error } = await supabase.from('hospital_treatments').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    });
  }

  // =========================================================================
  // 7. FIXED PACKAGES (Page 7)
  // =========================================================================
  async getPackages(hospitalId) {
    return this.fetchWithFallback(`/packages?hospitalId=${hospitalId}`, {}, async () => {
      const { data: pkgs } = await supabase
        .from('treatment_packages')
        .select('*, treatments(*)')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      const items = pkgs || [];
      const total = items.length;
      const active = items.filter(p => p.active !== false).length;
      const avgPrice = total > 0 ? Math.round(items.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / total) : 35000;

      return {
        kpis: {
          total,
          active,
          avgPrice,
          packageLockAvailable: items.filter(p => p.package_lock_available).length,
          emiAvailable: items.filter(p => p.emi_available).length,
          bookingsThisMonth: total * 18,
          revenueThisMonth: `₹${(total * avgPrice).toLocaleString('en-IN')}`
        },
        packages: items.map(p => ({
          id: p.id,
          name: p.name,
          sub: p.room_category || 'Surgery Bundle',
          category: p.treatments?.category || 'Clinical Care',
          department: p.treatments?.category || 'General Specialty',
          price: Number(p.price) || 25000,
          duration: `${p.duration_days || 2} Days`,
          duration_days: p.duration_days || 2,
          room_category: p.room_category || 'General Ward',
          inclusions: Array.isArray(p.included_services) ? `${p.included_services.length} Services` : 'Standard Package',
          included_services: Array.isArray(p.included_services) ? p.included_services : [],
          excluded_services: Array.isArray(p.excluded_services) ? p.excluded_services : [],
          package_lock_available: p.package_lock_available !== false,
          emi_available: p.emi_available !== false,
          availability: p.active !== false ? 'Available' : 'Unavailable',
          status: p.active !== false ? 'Active' : 'Inactive',
          active: p.active !== false,
          bookingsCount: 24
        }))
      };
    });
  }

  async addPackage(packageData) {
    return this.fetchWithFallback('/packages', {
      method: 'POST',
      body: JSON.stringify(packageData)
    }, async () => {
      const { data, error } = await supabase
        .from('treatment_packages')
        .insert({
          ...packageData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async updatePackage(packageId, updates) {
    return this.fetchWithFallback(`/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, async () => {
      const { data, error } = await supabase
        .from('treatment_packages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', packageId)
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async togglePackageActive(packageId) {
    return this.fetchWithFallback(`/packages/${packageId}/toggle`, {
      method: 'PATCH'
    }, async () => {
      const { data: current } = await supabase.from('treatment_packages').select('active').eq('id', packageId).single();
      const { data, error } = await supabase
        .from('treatment_packages')
        .update({ active: !current?.active, updated_at: new Date().toISOString() })
        .eq('id', packageId)
        .select('*, treatments(*)')
        .single();
      if (error) throw error;
      return data;
    });
  }

  async deletePackage(packageId) {
    return this.fetchWithFallback(`/packages/${packageId}`, {
      method: 'DELETE'
    }, async () => {
      const { error } = await supabase.from('treatment_packages').delete().eq('id', packageId);
      if (error) throw error;
      return { success: true };
    });
  }

  // =========================================================================
  // 8. BOOKINGS & ADMISSION QUEUE (Page 8)
  // =========================================================================
  async getBookings(hospitalId, statusFilter = 'Pending') {
    return this.fetchWithFallback(`/bookings?hospitalId=${hospitalId}&status=${statusFilter}`, {}, async () => {
      const [resvsRes, apptsRes] = await Promise.all([
        supabase
          .from('bed_reservations')
          .select('*, bed_types(*)')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false }),
        supabase
          .from('doctor_appointments')
          .select('*, doctors(*)')
          .eq('hospital_id', hospitalId)
          .order('created_at', { ascending: false })
      ]);

      const resvs = resvsRes.data || [];
      const appts = apptsRes.data || [];

      const resvItems = resvs.map(r => ({
        id: r.id,
        recordType: 'reservation',
        code: `BK-${r.id.slice(0, 8).toUpperCase()}`,
        patientName: r.patient_notes || 'Verified Patient',
        patient_id: r.patient_id,
        ageGender: 'Adult / Inpatient',
        phone: '+91 8269812521',
        bedType: r.bed_types?.name || 'General Bed',
        bed_type_id: r.bed_type_id,
        department: r.bed_types?.name?.toLowerCase().includes('icu') ? 'Critical Care Unit' : 'Inpatient Medicine',
        bookingDate: new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        admissionDate: new Date(r.reserved_at || r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        duration: `${r.hold_minutes || 30} Mins Hold`,
        status: r.status ? (r.status === 'held' ? 'Pending' : r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Pending',
        rawStatus: r.status,
        isHeld: r.status === 'held',
        expires_at: r.expires_at,
        distance_km: r.distance_km,
        drive_time: r.drive_time,
        requestedBy: 'Patient Bed Reservation',
        notes: r.patient_notes || 'Direct Hospital Bed Reservation'
      }));

      const apptItems = appts.map(a => ({
        id: a.id,
        recordType: 'appointment',
        code: `BK-DOC-${a.id.slice(0, 6).toUpperCase()}`,
        patientName: 'Verified Patient',
        patient_id: a.patient_id,
        doctorName: a.doctors?.name || 'Assigned Specialist',
        doctor: a.doctors?.name || 'Assigned Specialist',
        ageGender: 'Adult / Patient',
        phone: '+91 9876543210',
        bedType: 'OPD Consultation',
        department: a.doctors?.specialization || 'Outpatient Clinic',
        bookingDate: new Date(a.created_at || a.appointment_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        admissionDate: a.appointment_date || 'Scheduled',
        duration: a.appointment_time || '30 Mins Slot',
        status: a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Confirmed',
        rawStatus: a.status || 'confirmed',
        isHeld: false,
        amount: Number(a.consultation_fee) || 500,
        notes: `Specialist Consultation with ${a.doctors?.name || 'Doctor'}`
      }));

      const all = [...resvItems, ...apptItems];

      let filtered = all;
      if (statusFilter && statusFilter.toLowerCase() !== 'all') {
        const sf = statusFilter.toLowerCase();
        filtered = all.filter(b => b.status.toLowerCase() === sf);
      }

      return {
        counts: {
          pending: all.filter(r => r.status.toLowerCase() === 'pending').length,
          confirmed: all.filter(r => r.status.toLowerCase() === 'confirmed').length,
          active: all.filter(r => r.status.toLowerCase() === 'active').length,
          completed: all.filter(r => r.status.toLowerCase() === 'completed').length,
          cancelled: all.filter(r => r.status.toLowerCase() === 'cancelled').length
        },
        bookings: filtered
      };
    });
  }

  async updateBookingStatus(bookingId, status, notes = null) {
    return this.fetchWithFallback(`/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }, async () => {
      const updates = { 
        status: status.toLowerCase(), 
        updated_at: new Date().toISOString() 
      };
      if (notes) updates.patient_notes = notes;

      const { data, error } = await supabase
        .from('bed_reservations')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      return { data, error };
    });
  }

  // =========================================================================
  // 8b. DOCTOR OPD APPOINTMENTS (Page 8b)
  // =========================================================================
  async getAppointments(hospitalId, filters = {}) {
    const { status = 'all', doctorId = 'all', departmentId = 'all', search = '', date = '' } = filters;
    const params = {
      hospitalId,
      status,
      doctorId,
      departmentId,
      search
    };
    if (date) params.date = date;
    const q = new URLSearchParams(params).toString();

    return this.fetchWithFallback(`/appointments?${q}`, {}, async () => {
      let query = supabase
        .from('doctor_appointments')
        .select(`
          *,
          doctors (
            id,
            name,
            specialization,
            qualification,
            image_url,
            department_id,
            departments (
              id,
              name
            )
          ),
          patient_profiles (
            id,
            user_id,
            age,
            gender,
            blood_group,
            abha_id,
            emergency_contact_phone,
            profiles (
              id,
              full_name,
              phone,
              avatar_url
            )
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('appointment_date', { ascending: false });

      if (doctorId && doctorId !== 'all') {
        query = query.eq('doctor_id', doctorId);
      }

      const { data: rawAppointments, error } = await query;
      if (error) throw error;

      const items = (rawAppointments || []).map(a => {
        const patient = a.patient_profiles;
        const profile = patient?.profiles;
        const doc = a.doctors;
        const dept = doc?.departments;
        const rawSt = (a.status || 'scheduled').toLowerCase();

        let displayStatus = 'Scheduled';
        if (rawSt === 'scheduled' || rawSt === 'pending') displayStatus = 'Scheduled';
        else if (rawSt === 'confirmed' || rawSt === 'checked_in') displayStatus = 'Confirmed';
        else if (rawSt === 'completed') displayStatus = 'Completed';
        else if (rawSt === 'cancelled') displayStatus = 'Cancelled';
        else displayStatus = a.status.charAt(0).toUpperCase() + a.status.slice(1);

        return {
          id: a.id,
          code: `OPD-${a.id.slice(0, 6).toUpperCase()}`,
          doctor_id: a.doctor_id,
          doctorName: doc?.name || 'Assigned Specialist',
          doctorSpecialization: doc?.specialization || 'Consultant Physician',
          doctorQualification: doc?.qualification || 'MBBS, MD',
          doctorImage: doc?.image_url || null,
          department_id: doc?.department_id,
          departmentName: dept?.name || doc?.specialization || 'Clinical Outpatient',
          patient_id: a.patient_id,
          patientUid: patient?.id || a.patient_id,
          patientName: profile?.full_name || 'Registered Patient',
          patientPhone: profile?.phone || patient?.emergency_contact_phone || '+91 9876543210',
          abhaId: patient?.abha_id || '91-XXXX-XXXX-XXXX',
          bloodGroup: patient?.blood_group || 'O+',
          ageGender: `${patient?.age || 30} Y / ${patient?.gender || 'Patient'}`,
          appointmentDate: a.appointment_date,
          appointmentTime: a.appointment_time || '10:00 AM',
          consultationType: a.consultation_type || 'in_clinic',
          status: displayStatus,
          rawStatus: rawSt,
          consultationFee: Number(a.consultation_fee) || 800,
          patientNotes: a.patient_notes || 'Outpatient Consultation',
          createdAt: a.created_at,
          updatedAt: a.updated_at
        };
      });

      const counts = {
        all: items.length,
        scheduled: items.filter(a => a.rawStatus === 'scheduled' || a.rawStatus === 'pending').length,
        confirmed: items.filter(a => a.rawStatus === 'confirmed' || a.rawStatus === 'checked_in').length,
        completed: items.filter(a => a.rawStatus === 'completed').length,
        cancelled: items.filter(a => a.rawStatus === 'cancelled').length
      };

      let filtered = items;
      if (status && status.toLowerCase() !== 'all') {
        const stLow = status.toLowerCase();
        if (stLow === 'scheduled' || stLow === 'pending') {
          filtered = items.filter(a => a.rawStatus === 'scheduled' || a.rawStatus === 'pending');
        } else if (stLow === 'confirmed' || stLow === 'checked_in') {
          filtered = items.filter(a => a.rawStatus === 'confirmed' || a.rawStatus === 'checked_in');
        } else {
          filtered = items.filter(a => a.rawStatus === stLow);
        }
      }

      if (departmentId && departmentId !== 'all') {
        filtered = filtered.filter(a => a.department_id === departmentId);
      }

      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(a => 
          a.patientName.toLowerCase().includes(s) ||
          a.doctorName.toLowerCase().includes(s) ||
          a.departmentName.toLowerCase().includes(s) ||
          a.abhaId.toLowerCase().includes(s) ||
          a.code.toLowerCase().includes(s)
        );
      }

      const [docsRes, deptsRes] = await Promise.all([
        supabase.from('doctors').select('id, name, specialization, department_id').eq('hospital_id', hospitalId),
        supabase.from('departments').select('id, name').eq('hospital_id', hospitalId)
      ]);

      return {
        counts,
        appointments: filtered,
        doctors: docsRes.data || [],
        departments: deptsRes.data || []
      };
    });
  }

  /**
   * Helper to resolve appointment ID from payload or patient UID
   */
  async _resolveAppointmentId({ appointmentId, appointment_id, patientUid, patient_uid, hospitalId, hospital_id, targetStatuses }) {
    const explicitId = appointmentId || appointment_id;
    if (explicitId) return explicitId;

    const hId = hospitalId || hospital_id;
    const rawUid = patientUid || patient_uid;
    if (!rawUid) {
      throw new Error('Appointment identifier or Patient QR UID is required.');
    }

    const cleanUid = String(rawUid).trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUid);

    // 1. Locate patient profile
    let patientProfileId = null;
    let patientUserId = null;

    let pQuery = supabase.from('patient_profiles').select('id, user_id, abha_id');
    if (isUUID) {
      pQuery = pQuery.or(`id.eq.${cleanUid},user_id.eq.${cleanUid}`);
    } else {
      pQuery = pQuery.eq('abha_id', cleanUid);
    }
    const { data: pData } = await pQuery.maybeSingle();
    if (pData) {
      patientProfileId = pData.id;
      patientUserId = pData.user_id;
    } else if (isUUID) {
      patientProfileId = cleanUid;
    }

    if (!patientProfileId && !patientUserId) {
      throw new Error(`Patient record "${cleanUid}" was not found in registry.`);
    }

    // 2. Query doctor_appointments for active appointment matching this patient
    let apptQuery = supabase
      .from('doctor_appointments')
      .select('id, status, appointment_date, appointment_time, hospital_id')
      .in('status', targetStatuses || ['scheduled', 'confirmed', 'pending', 'checked_in']);

    if (hId) {
      apptQuery = apptQuery.eq('hospital_id', hId);
    }

    if (patientProfileId && patientUserId) {
      apptQuery = apptQuery.or(`patient_id.eq.${patientProfileId},patient_id.eq.${patientUserId}`);
    } else if (patientProfileId) {
      apptQuery = apptQuery.eq('patient_id', patientProfileId);
    } else if (patientUserId) {
      apptQuery = apptQuery.eq('patient_id', patientUserId);
    }

    const { data: matches, error } = await apptQuery
      .order('appointment_date', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('Error querying appointment for patient:', error);
      throw error;
    }

    if (!matches || matches.length === 0) {
      // Fallback: match any appointment for this patient at this hospital
      let anyQuery = supabase
        .from('doctor_appointments')
        .select('id, status, appointment_date')
        .order('created_at', { ascending: false })
        .limit(1);

      if (hId) anyQuery = anyQuery.eq('hospital_id', hId);
      if (patientProfileId && patientUserId) {
        anyQuery = anyQuery.or(`patient_id.eq.${patientProfileId},patient_id.eq.${patientUserId}`);
      } else if (patientProfileId) {
        anyQuery = anyQuery.eq('patient_id', patientProfileId);
      }

      const { data: anyMatch } = await anyQuery;
      if (anyMatch && anyMatch.length > 0) {
        return anyMatch[0].id;
      }

      throw new Error(`No active appointment found for patient (${cleanUid}) at this hospital.`);
    }

    return matches[0].id;
  }

  async confirmAppointmentQr(payload) {
    return this.fetchWithFallback('/appointments/confirm-qr', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, async () => {
      const apptId = await this._resolveAppointmentId({
        appointmentId: payload.appointmentId || payload.appointment_id,
        patientUid: payload.patientUid || payload.patient_uid,
        hospitalId: payload.hospitalId || payload.hospital_id,
        targetStatuses: ['scheduled', 'pending']
      });

      const scanNote = payload.notes || 'Verified & Checked-in at Hospital Reception via QR Scan';
      
      const { data, error } = await supabase
        .from('doctor_appointments')
        .update({
          status: 'confirmed',
          patient_notes: scanNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', apptId)
        .select(`
          *,
          doctors(id, name, specialization),
          patient_profiles(id, abha_id, blood_group, gender, age, profiles(full_name, phone))
        `)
        .single();

      if (error) throw error;
      return { 
        success: true, 
        message: 'Patient check-in confirmed via QR scan!',
        appointment: data 
      };
    });
  }

  async completeAppointmentQr(payload) {
    return this.fetchWithFallback('/appointments/complete-qr', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, async () => {
      const apptId = await this._resolveAppointmentId({
        appointmentId: payload.appointmentId || payload.appointment_id,
        patientUid: payload.patientUid || payload.patient_uid,
        hospitalId: payload.hospitalId || payload.hospital_id,
        targetStatuses: ['confirmed', 'scheduled', 'checked_in', 'pending']
      });

      const completeNote = payload.notes || 'Clinical encounter verified & completed automatically via QR Scan';
      
      const { data, error } = await supabase
        .from('doctor_appointments')
        .update({
          status: 'completed',
          patient_notes: completeNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', apptId)
        .select(`
          *,
          doctors(id, name, specialization),
          patient_profiles(id, abha_id, blood_group, gender, age, profiles(full_name, phone))
        `)
        .single();

      if (error) throw error;
      return { 
        success: true, 
        message: 'Clinical encounter completed successfully via QR scan!',
        appointment: data 
      };
    });
  }

  async updateAppointmentStatus(appointmentId, status, notes = null) {
    return this.fetchWithFallback(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }, async () => {
      const updates = {
        status: status.toLowerCase(),
        updated_at: new Date().toISOString()
      };
      if (notes) updates.patient_notes = notes;

      const { data, error } = await supabase
        .from('doctor_appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    });
  }

  /**
   * Scan patient QR code and retrieve verified clinical telemetry
   */
  async scanPatient(uid) {
    if (!uid) return null;
    const cleanUid = String(uid).trim();

    try {
      const res = await fetch(`${API_BASE_URL}/patient/scan/${encodeURIComponent(cleanUid)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {
      console.warn('Backend scan API unreachable, querying Supabase directly:', e);
    }

    // Direct Supabase fallback
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUid);
    let q = supabase
      .from('patient_profiles')
      .select('id, user_id, age, gender, blood_group, abha_id, emergency_contact_name, emergency_contact_phone, height_cm, weight_kg, profiles(full_name, phone)');

    if (isUUID) {
      q = q.or(`id.eq.${cleanUid},user_id.eq.${cleanUid}`);
    } else {
      q = q.eq('abha_id', cleanUid);
    }

    const { data } = await q.maybeSingle();
    if (!data) return null;

    return {
      patientUid: data.user_id || data.id,
      userId: data.user_id || data.id,
      fullName: data.profiles?.full_name || data.emergency_contact_name || 'Patient',
      phone: data.profiles?.phone || data.emergency_contact_phone || '',
      age: data.age,
      gender: data.gender,
      bloodGroup: data.blood_group,
      abhaId: data.abha_id,
      emergencyContact: {
        name: data.emergency_contact_name,
        phone: data.emergency_contact_phone
      },
      vitals: {
        heightCm: data.height_cm,
        weightKg: data.weight_kg
      }
    };
  }

  /**
   * Atomic Admission Intake Engine
   */
  async admitPatient(admissionData) {
    return this.fetchWithFallback('/admit', {
      method: 'POST',
      body: JSON.stringify(admissionData)
    }, async () => {
      // Supabase direct fallback
      const {
        hospital_id,
        patient_uid,
        reservation_id,
        bed_type_id,
        bed_number = 'BED-101',
        diagnosis = 'General Inpatient Admission',
        vitals_summary = {},
        notes = ''
      } = admissionData;

      // 1. Resolve patient
      const patient = await this.scanPatient(patient_uid);
      if (!patient) throw new Error('Patient profile not found in database');

      // 1b. Guarantee unique bed/unit number among active admissions
      let finalBedNumber = (bed_number || '').trim();
      const { data: activeAdmissions } = await supabase
        .from('hospital_admissions')
        .select('bed_number')
        .eq('hospital_id', hospital_id)
        .eq('status', 'admitted');

      const occupiedBeds = new Set((activeAdmissions || []).map(a => (a.bed_number || '').trim().toUpperCase()));

      let bedPrefix = 'BED';
      if (bed_type_id) {
        const { data: bt } = await supabase.from('bed_types').select('name').eq('id', bed_type_id).maybeSingle();
        const bName = bt?.name ? bt.name.toUpperCase() : '';
        if (bName.includes('ICU')) bedPrefix = 'ICU';
        else if (bName.includes('HDU')) bedPrefix = 'HDU';
        else if (bName.includes('GENERAL')) bedPrefix = 'GEN';
        else if (bName.includes('PRIVATE')) bedPrefix = 'PVT';
        else if (bName.includes('SEMI')) bedPrefix = 'SP';
        else if (bName.includes('EMERGENCY')) bedPrefix = 'EMG';
      }

      if (!finalBedNumber || occupiedBeds.has(finalBedNumber.toUpperCase())) {
        let unitNum = 101;
        while (occupiedBeds.has(`${bedPrefix}-${unitNum}`.toUpperCase())) {
          unitNum++;
        }
        finalBedNumber = `${bedPrefix}-${unitNum}`;
      }

      // 2. Insert into hospital_admissions
      const { data: adm, error: admErr } = await supabase
        .from('hospital_admissions')
        .insert({
          hospital_id,
          patient_id: patient.patientUid || patient_uid,
          reservation_id: reservation_id || null,
          bed_type_id,
          bed_number: finalBedNumber,
          admission_date: new Date().toISOString(),
          status: 'admitted',
          patient_name: patient.fullName,
          abha_id: patient.abhaId,
          blood_group: patient.bloodGroup,
          emergency_contact: patient.emergencyContact?.phone || patient.phone,
          diagnosis,
          vitals_summary,
          notes: notes || `Admitted via QR intake. Bed: ${bed_number}`
        })
        .select()
        .single();

      if (admErr) throw admErr;

      // 3. Increment occupied beds
      if (bed_type_id) {
        const { data: b } = await supabase
          .from('hospital_beds')
          .select('*')
          .eq('hospital_id', hospital_id)
          .eq('bed_type_id', bed_type_id)
          .single();

        if (b) {
          const occ = (Number(b.occupied_beds) || 0) + 1;
          const resv = reservation_id ? Math.max(0, (Number(b.reserved_beds) || 0) - 1) : (Number(b.reserved_beds) || 0);
          const avail = reservation_id ? (Number(b.available_beds) || 0) : Math.max(0, (Number(b.available_beds) || 0) - 1);
          await supabase
            .from('hospital_beds')
            .update({ occupied_beds: occ, reserved_beds: resv, available_beds: avail, updated_at: new Date().toISOString() })
            .eq('id', b.id);
        }
      }

      // 4. Update reservation if exists
      if (reservation_id) {
        await supabase
          .from('bed_reservations')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', reservation_id);
      }

      return { success: true, admission: adm };
    });
  }

  async getAdmissions(hospitalId) {
    return this.fetchWithFallback(`/admissions?hospitalId=${hospitalId}`, {}, async () => {
      const { data, error } = await supabase
        .from('hospital_admissions')
        .select('*, bed_types(*)')
        .eq('hospital_id', hospitalId)
        .order('admission_date', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  async dischargePatient(admissionId) {
    return this.fetchWithFallback(`/admissions/${admissionId}/discharge`, {
      method: 'PATCH'
    }, async () => {
      const { data: adm } = await supabase
        .from('hospital_admissions')
        .select('*')
        .eq('id', admissionId)
        .single();

      const { data: updated, error } = await supabase
        .from('hospital_admissions')
        .update({ status: 'discharged', discharge_date: new Date().toISOString() })
        .eq('id', admissionId)
        .select()
        .single();

      if (error) throw error;

      if (adm?.bed_type_id) {
        const { data: b } = await supabase
          .from('hospital_beds')
          .select('*')
          .eq('hospital_id', adm.hospital_id)
          .eq('bed_type_id', adm.bed_type_id)
          .single();

        if (b) {
          await supabase
            .from('hospital_beds')
            .update({
              occupied_beds: Math.max(0, (Number(b.occupied_beds) || 1) - 1),
              available_beds: (Number(b.available_beds) || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', b.id);
        }
      }

      // Mark linked bed reservation as completed
      if (adm?.reservation_id) {
        await supabase
          .from('bed_reservations')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', adm.reservation_id);
      }

      return { success: true, data: updated };
    });
  }

  // =========================================================================
  // 8c. ONBOARDING PROVISIONING & SETUP
  // =========================================================================
  async saveOnboarding(hospitalId, { profile, beds, departments, kyc }) {
    return this.fetchWithFallback(`/onboarding`, {
      method: 'POST',
      body: JSON.stringify({ hospitalId, profile, beds, departments, kyc })
    }, async () => {
      const { data, error } = await supabase.rpc('save_hospital_onboarding', {
        p_hospital_id: hospitalId,
        p_profile: profile,
        p_beds: beds || [],
        p_departments: departments || [],
        p_kyc: kyc || {}
      });
      if (error) throw error;
      return data;
    });
  }

  // =========================================================================
  // 9. ANALYTICS (Page 9)
  // =========================================================================
  async getAnalytics(hospitalId, timeRange = '7d') {
    return this.fetchWithFallback(`/analytics?hospitalId=${hospitalId}&timeRange=${timeRange}`, {}, async () => {
      const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
      const [resvsRes, apptsRes, bedsRes, docsRes, treatsRes] = await Promise.all([
        supabase.from('bed_reservations').select('*').eq('hospital_id', hospitalId),
        supabase.from('doctor_appointments').select('*').eq('hospital_id', hospitalId),
        supabase.from('hospital_beds').select('*, bed_types(*)').eq('hospital_id', hospitalId),
        supabase.from('doctors').select('*').eq('hospital_id', hospitalId),
        supabase.from('hospital_treatments').select('*, treatments(*)').eq('hospital_id', hospitalId)
      ]);

      const resvs = resvsRes.data || [];
      const appts = apptsRes.data || [];
      const beds = bedsRes.data || [];
      const docs = docsRes.data || [];
      const treats = treatsRes.data || [];

      const allBookings = [...resvs, ...appts];
      const totalBookingsCount = allBookings.length;

      const totalBeds = beds.reduce((acc, b) => acc + (Number(b.total_beds) || 0), 0);
      const occupiedBeds = beds.reduce((acc, b) => acc + (Number(b.occupied_beds) || 0), 0);
      const occPct = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';

      // Compute actual calendar days
      const bookingTrendsMap = {};
      const dateLabels = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        const displayDate = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        bookingTrendsMap[key] = { date: displayDate, bookings: 0 };
        dateLabels.push(key);
      }

      allBookings.forEach(b => {
        const created = (b.created_at || b.appointment_date || b.reserved_at || '').slice(0, 10);
        if (bookingTrendsMap[created]) {
          bookingTrendsMap[created].bookings += 1;
        }
      });

      const bookingTrends = dateLabels.map(k => ({
        date: bookingTrendsMap[k]?.date || k,
        bookings: bookingTrendsMap[k]?.bookings || 0
      }));

      const generalBed = beds.find(b => b.bed_types?.name?.toLowerCase().includes('general'));
      const icuBed = beds.find(b => b.bed_types?.name?.toLowerCase().includes('icu'));
      const hduBed = beds.find(b => b.bed_types?.name?.toLowerCase().includes('semi') || b.bed_types?.name?.toLowerCase().includes('deluxe') || b.bed_types?.name?.toLowerCase().includes('hdu'));

      const genOcc = Number(generalBed?.occupied_beds) || 0;
      const icuOcc = Number(icuBed?.occupied_beds) || 0;
      const hduOcc = Number(hduBed?.occupied_beds) || 0;

      const bedDemand = dateLabels.slice(-7).map(k => ({
        date: new Date(k).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        general: genOcc,
        icu: icuOcc,
        hdu: hduOcc
      }));

      const popularTreatments = treats.length > 0 
        ? treats.slice(0, 5).map(t => ({
            name: t.treatments?.name || t.name || 'Medical Procedure',
            bookings: Math.max(1, appts.filter(a => a.treatment_id === t.id).length)
          }))
        : [
            { name: 'Cardiology Consultation', bookings: Math.max(1, Math.round(appts.length * 0.4)) },
            { name: 'General Medicine Review', bookings: Math.max(1, Math.round(appts.length * 0.3)) },
            { name: 'ICU Critical Care', bookings: Math.max(1, resvs.length) }
          ];

      const startLabel = dateLabels[0] ? new Date(dateLabels[0]).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '';
      const endLabel = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

      return {
        dateRange: `${startLabel} - ${endLabel} (${days} Days)`,
        kpis: {
          totalBookings: { value: totalBookingsCount, trend: 14.2 },
          bedOccupancyRate: { value: `${occPct}%`, trend: 4.8 },
          treatmentsPerformed: { value: treats.length || docs.length * 2, trend: 10.1 },
          packageViews: { value: '240', trend: 18.3 },
          searchQueries: { value: String(Math.max(totalBookingsCount * 12, 45)), trend: 12.8 }
        },
        bookingTrends,
        bedDemand,
        popularTreatments,
        searchInterest: dateLabels.slice(-7).map((k, idx) => ({
          date: new Date(k).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
          count: Math.max(8, Math.round(totalBookingsCount * 2) + (idx % 2 === 0 ? 3 : -1))
        })),
        packageViews: dateLabels.slice(-7).map((k, idx) => ({
          date: new Date(k).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
          views: Math.max(12, Math.round(docs.length * 3) + (idx % 3 === 0 ? 4 : -2))
        }))
      };
    });
  }

  // =========================================================================
  // 10. TRANSPARENCY (Page 10)
  // =========================================================================
  async getTransparency(hospitalId) {
    return this.fetchWithFallback(`/transparency?hospitalId=${hospitalId}`, {}, async () => {
      const [hospRes, bedsRes, pkgsRes, docsRes, billsRes, transpRes] = await Promise.all([
        supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle(),
        supabase.from('hospital_beds').select('id, price_per_day, total_beds, available_beds, updated_at').eq('hospital_id', hospitalId),
        supabase.from('treatment_packages').select('id, name, price, description, is_active').eq('hospital_id', hospitalId),
        supabase.from('doctors').select('id, name, specialization, updated_at').eq('hospital_id', hospitalId),
        supabase.from('hospital_bills').select('id, status, is_disputed').eq('hospital_id', hospitalId),
        supabase.from('transparency_scores').select('*').eq('hospital_id', hospitalId).maybeSingle()
      ]);

      const hospital = hospRes.data || {};
      const beds = bedsRes.data || [];
      const packages = pkgsRes.data || [];
      const doctors = docsRes.data || [];
      const bills = billsRes.data || [];
      const data = transpRes.data || {};

      // 1. Price Clarity (25%): % of beds with published prices
      const totalBedTypes = beds.length;
      const pricedBedTypes = beds.filter(b => Number(b.price_per_day) > 0).length;
      const priceClarity = totalBedTypes > 0 
        ? Math.round(30 + (pricedBedTypes / totalBedTypes) * 70) 
        : (data.price_clarity_score ? Number(data.price_clarity_score) : 25);

      // 2. Package Clarity (20%): Treatment bundles published
      const activePackages = packages.filter(p => p.is_active !== false && Number(p.price) > 0);
      const itemizedPackages = packages.filter(p => p.description && p.description.trim().length > 15);
      const packageClarity = activePackages.length > 0 
        ? Math.min(100, Math.max(30, Math.min(60, activePackages.length * 15) + Math.min(40, itemizedPackages.length * 10))) 
        : (data.package_clarity_score ? Number(data.package_clarity_score) : 20);

      // 3. Information Quality (20%): Profile completeness and registered doctors
      let infoPoints = 0;
      if (hospital.name && hospital.name.length > 2) infoPoints += 10;
      if (hospital.phone) infoPoints += 10;
      if (hospital.address && hospital.city) infoPoints += 15;
      if (hospital.description && hospital.description.length > 20) infoPoints += 10;
      if (hospital.image_url) infoPoints += 10;
      if (Array.isArray(hospital.specialties) && hospital.specialties.length > 0) infoPoints += 10;
      if (doctors.length > 0) infoPoints += Math.min(35, 10 + doctors.length * 5);
      const informationScore = Math.min(100, Math.max(25, infoPoints || Number(data.information_score || 35)));

      // 4. Data Freshness (15%): Recency of telemetry updates
      const allUpdates = [
        hospital.updated_at ? new Date(hospital.updated_at).getTime() : 0,
        ...beds.map(b => b.updated_at ? new Date(b.updated_at).getTime() : 0),
        ...doctors.map(d => d.updated_at ? new Date(d.updated_at).getTime() : 0)
      ].filter(t => t > 0);
      const mostRecentUpdate = allUpdates.length > 0 ? Math.max(...allUpdates) : 0;
      const diffHours = mostRecentUpdate > 0 ? (Date.now() - mostRecentUpdate) / 3600000 : 9999;
      let dataFreshness = 35;
      if (diffHours <= 24) dataFreshness = 96;
      else if (diffHours <= 72) dataFreshness = 85;
      else if (diffHours <= 168) dataFreshness = 72;
      else if (diffHours <= 720) dataFreshness = 55;

      // 5. Billing Consistency (10%)
      let billingConsistency = 85;
      if (bills.length > 0) {
        const disputed = bills.filter(b => b.is_disputed).length;
        billingConsistency = Math.max(40, Math.round(100 - (disputed / bills.length) * 60));
      } else if (data.billing_consistency_score) {
        billingConsistency = Number(data.billing_consistency_score);
      }

      // 6. Regulatory Verification (10%)
      const isVerified = hospital.verification_status === 'verified' || hospital.kyc_status === 'verified' || hospital.kyc_status === 'approved';
      const isSubmitted = hospital.kyc_status === 'submitted' || hospital.kyc_status === 'in_review';
      let verificationScore = 30;
      if (isVerified) verificationScore = 100;
      else if (isSubmitted) verificationScore = 65;
      else if (hospital.verification_status === 'rejected') verificationScore = 10;

      const overallScore = Math.round(
        priceClarity * 0.25 +
        packageClarity * 0.20 +
        informationScore * 0.20 +
        dataFreshness * 0.15 +
        billingConsistency * 0.10 +
        verificationScore * 0.10
      );

      // Contextual Suggestions
      const suggestions = [];
      if (priceClarity < 75) {
        suggestions.push({
          id: 1,
          title: 'Publish Ward Bed Tariffs',
          desc: 'Add room charges and bed tariffs for general and ICU wards to boost price transparency.',
          impact: 'High Impact',
          impactColor: 'blue'
        });
      }
      if (packageClarity < 75) {
        suggestions.push({
          id: 2,
          title: 'Add Fixed-Price Bundled Packages',
          desc: 'Publish comprehensive surgical and medical packages with clear inclusions.',
          impact: 'High Impact',
          impactColor: 'blue'
        });
      }
      if (informationScore < 75) {
        suggestions.push({
          id: 3,
          title: 'Complete Hospital Profile & Roster',
          desc: 'Add hospital photos, detailed address, and register active specialists.',
          impact: 'Medium Impact',
          impactColor: 'amber'
        });
      }
      if (dataFreshness < 75) {
        suggestions.push({
          id: 4,
          title: 'Refresh Daily Bed Telemetry',
          desc: 'Regularly update bed occupancies to maintain top ranking in emergency dispatch.',
          impact: 'Medium Impact',
          impactColor: 'amber'
        });
      }
      if (verificationScore < 80) {
        suggestions.push({
          id: 5,
          title: 'Complete Statutory KYC Verification',
          desc: 'Submit clinical establishment license and statutory registrations for verification.',
          impact: 'High Impact',
          impactColor: 'blue'
        });
      }
      if (suggestions.length === 0) {
        suggestions.push({
          id: 1,
          title: 'Keep Telemetry Synchronized',
          desc: 'Update bed counts as admissions and discharges occur.',
          impact: 'Maintain Score',
          impactColor: 'blue'
        });
      }

      // Persist real score in database
      supabase.from('transparency_scores').upsert({
        hospital_id: hospitalId,
        price_clarity_score: priceClarity,
        package_clarity_score: packageClarity,
        information_score: informationScore,
        data_freshness_score: dataFreshness,
        billing_consistency_score: billingConsistency,
        verification_score: verificationScore,
        overall_score: overallScore,
        scoring_version: 'dynamic-v2',
        calculated_at: new Date().toISOString()
      }, { onConflict: 'hospital_id' }).then(() => {});

      supabase.from('hospitals').update({
        transparency_score: overallScore,
        updated_at: new Date().toISOString()
      }).eq('id', hospitalId).then(() => {});

      return {
        overallScore,
        status: overallScore >= 85 ? 'Superior Transparency Rating' : (overallScore >= 65 ? 'Good Standing' : 'Building Profile'),
        lastUpdated: 'Live Auto-Computed',
        breakdown: [
          { name: 'Price Clarity', score: priceClarity, rating: priceClarity >= 80 ? 'Excellent' : (priceClarity >= 50 ? 'Good' : 'Needs Attention'), desc: 'Itemized procedure and bed tariffs without hidden charges.', color: priceClarity >= 75 ? '#0d9488' : '#f59e0b' },
          { name: 'Package Clarity', score: packageClarity, rating: packageClarity >= 80 ? 'Excellent' : (packageClarity >= 50 ? 'Good' : 'Needs Attention'), desc: 'Surgical bundles fully list inclusions and exclusions.', color: packageClarity >= 75 ? '#0d9488' : '#f59e0b' },
          { name: 'Information Quality', score: informationScore, rating: informationScore >= 80 ? 'Good' : 'Basic', desc: 'Doctor profiles, OPD timings, and facility info verified.', color: informationScore >= 75 ? '#0d9488' : '#f59e0b' },
          { name: 'Data Freshness', score: dataFreshness, rating: dataFreshness >= 80 ? 'Excellent' : (dataFreshness >= 60 ? 'Moderate' : 'Stale'), desc: 'Bed telemetry and emergency availability updated in real-time.', color: dataFreshness >= 75 ? '#0d9488' : '#f59e0b' },
          { name: 'Billing Consistency', score: billingConsistency, rating: billingConsistency >= 80 ? 'Good' : 'Moderate', desc: 'Zero discrepancy between quoted package tariffs and final invoices.', color: billingConsistency >= 75 ? '#0d9488' : '#f59e0b' },
          { name: 'Verification', score: verificationScore, rating: verificationScore >= 80 ? 'Excellent' : (verificationScore >= 50 ? 'Under Review' : 'Pending'), desc: 'Statutory clinical establishment license and regulatory clearance.', color: verificationScore >= 75 ? '#0d9488' : '#f59e0b' }
        ],
        suggestions
      };
    });
  }

  async recalculateTransparency(hospitalId) {
    return this.fetchWithFallback('/transparency/recalculate', {
      method: 'POST',
      body: JSON.stringify({ hospital_id: hospitalId })
    }, async () => {
      return await this.getTransparency(hospitalId);
    });
  }

  // =========================================================================
  // 11. HOSPITAL PROFILE & KYC (Page 11)
  // =========================================================================
  async getProfile(hospitalId) {
    return this.fetchWithFallback(`/profile?hospitalId=${hospitalId}`, {}, async () => {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', hospitalId)
        .single();
      if (error) throw error;
      const isVerified = data?.verification_status === 'verified' || data?.kyc_status === 'verified' || data?.kyc_status === 'approved';
      return {
        ...data,
        kyc_status: isVerified ? 'verified' : (data.kyc_status || 'pending'),
        verification_status: isVerified ? 'verified' : (data.verification_status || 'pending'),
        verification_notes: data.verification_notes || ''
      };
    });
  }

  async updateProfile(hospitalId, payload) {
    return this.fetchWithFallback(`/profile?hospitalId=${hospitalId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, async () => {
      const { data, error } = await supabase
        .from('hospitals')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', hospitalId)
        .select()
        .single();
      if (error) throw error;
      return data;
    });
  }
}

const hospitalPortalService = new HospitalPortalService();
export default hospitalPortalService;
