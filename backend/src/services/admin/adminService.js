const { supabaseAdmin } = require('../../config/supabase');

class AdminService {
  /**
   * 1. Dashboard Overview & Real-time Platform Metrics
   */
  async getDashboardMetrics() {
    try {
      const [
        patientsRes,
        hospitalsRes,
        doctorsRes,
        bedsRes,
        bookingsRes,
        apptsRes,
        docsRes,
        billsRes,
        emergRes,
        auditRes
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, role', { count: 'exact' }),
        supabaseAdmin.from('hospitals').select('id, name, verification_status, city, license_number, created_at'),
        supabaseAdmin.from('doctors').select('id, name, specialization, verification_status, is_active'),
        supabaseAdmin.from('hospital_beds').select('total_beds, available_beds, occupied_beds, reserved_beds'),
        supabaseAdmin.from('bookings').select('id, status', { count: 'exact' }),
        supabaseAdmin.from('doctor_appointments').select('id, status', { count: 'exact' }),
        supabaseAdmin.from('medical_documents').select('id', { count: 'exact' }),
        supabaseAdmin.from('bills').select('id, total_amount', { count: 'exact' }),
        supabaseAdmin.from('emergency_sessions').select('id, status', { count: 'exact' }),
        supabaseAdmin.from('audit_logs').select('*, profiles(full_name, email, role)').order('created_at', { ascending: false }).limit(6)
      ]);

      const allProfiles = patientsRes.data || [];
      const patientsCount = allProfiles.filter(p => p.role === 'patient').length;
      const totalUsers = allProfiles.length;

      const hospitals = hospitalsRes.data || [];
      const verifiedHospitals = hospitals.filter(h => h.verification_status === 'verified').length;
      const pendingHospitals = hospitals.filter(h => h.verification_status !== 'verified').length;

      const doctors = doctorsRes.data || [];
      const verifiedDoctors = doctors.filter(d => d.verification_status === 'verified').length;
      const pendingDoctors = doctors.filter(d => d.verification_status !== 'verified').length;

      const beds = bedsRes.data || [];
      const totalBeds = beds.reduce((acc, b) => acc + (b.total_beds || 0), 0);
      const availableBeds = beds.reduce((acc, b) => acc + (b.available_beds || 0), 0);
      const occupiedBeds = beds.reduce((acc, b) => acc + (b.occupied_beds || 0), 0);
      const reservedBeds = beds.reduce((acc, b) => acc + (b.reserved_beds || 0), 0);

      const totalBookings = (bookingsRes.count || 0) + (apptsRes.count || 0);
      const totalDocuments = (docsRes.count || 0) + (billsRes.count || 0);
      const activeEmergency = emergRes.count || 0;

      return {
        totalUsers,
        patientsCount,
        totalHospitals: hospitals.length,
        verifiedHospitals,
        pendingHospitals,
        totalDoctors: doctors.length,
        verifiedDoctors,
        pendingDoctors,
        totalBeds,
        availableBeds,
        occupiedBeds,
        reservedBeds,
        totalBookings,
        totalDocuments,
        activeEmergency,
        recentAudits: auditRes.data || [],
        pendingHospitalList: hospitals.filter(h => h.verification_status !== 'verified').slice(0, 5),
        pendingDoctorList: doctors.filter(d => d.verification_status !== 'verified').slice(0, 5)
      };
    } catch (err) {
      console.error('adminService.getDashboardMetrics error:', err);
      throw err;
    }
  }

  /**
   * 2. User Management
   */
  async getUsers({ role, status, query }) {
    let q = supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });

    if (role && role !== 'all') {
      q = q.eq('role', role);
    }
    if (status === 'active') {
      q = q.eq('is_active', true);
    } else if (status === 'suspended') {
      q = q.eq('is_active', false);
    }
    if (query) {
      q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async updateUserRole(userId, newRole, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('USER_ROLE_CHANGED', 'profile', userId, { newRole }, adminUserId, ipAddress);
    return data;
  }

  async updateUserStatus(userId, isActive, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('USER_STATUS_TOGGLED', 'profile', userId, { is_active: isActive }, adminUserId, ipAddress);
    return data;
  }

  /**
   * 3. Hospital Node Management & Verification
   */
  async getHospitals({ status, city, query }) {
    let q = supabaseAdmin.from('hospitals').select('*, hospital_beds(total_beds, available_beds)').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      q = q.eq('verification_status', status);
    }
    if (city && city !== 'all') {
      q = q.ilike('city', `%${city}%`);
    }
    if (query) {
      q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%,license_number.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async getHospitalById(id) {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .select('*, departments(*), doctors(*), hospital_beds(*), transparency_scores(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async verifyHospital(hospitalId, status, notes, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({
        verification_status: status,
        verification_notes: notes || '',
        verified_by: adminUserId || null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', hospitalId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent(
      status === 'verified' ? 'HOSPITAL_VERIFIED' : 'HOSPITAL_VERIFICATION_REJECTED',
      'hospital',
      hospitalId,
      { status, notes },
      adminUserId,
      ipAddress
    );
    return data;
  }

  async toggleHospitalStatus(hospitalId, isActive, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', hospitalId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('HOSPITAL_STATUS_TOGGLED', 'hospital', hospitalId, { is_active: isActive }, adminUserId, ipAddress);
    return data;
  }

  /**
   * 4. Doctor Management & Verification
   */
  async getDoctors({ status, hospitalId, query }) {
    let q = supabaseAdmin.from('doctors').select('*, hospitals(name, city), departments(name)').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      q = q.eq('verification_status', status);
    }
    if (hospitalId && hospitalId !== 'all') {
      q = q.eq('hospital_id', hospitalId);
    }
    if (query) {
      q = q.or(`name.ilike.%${query}%,specialization.ilike.%${query}%,registration_number.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async verifyDoctor(doctorId, status, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({
        verification_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent(
      status === 'verified' ? 'DOCTOR_VERIFIED' : 'DOCTOR_VERIFICATION_REVOKED',
      'doctor',
      doctorId,
      { status },
      adminUserId,
      ipAddress
    );
    return data;
  }

  async toggleDoctorStatus(doctorId, isActive, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('DOCTOR_STATUS_TOGGLED', 'doctor', doctorId, { is_active: isActive }, adminUserId, ipAddress);
    return data;
  }

  /**
   * 5. Government Schemes
   */
  async getSchemes() {
    const { data, error } = await supabaseAdmin
      .from('government_schemes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createScheme(schemeData, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('government_schemes')
      .insert([schemeData])
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('SCHEME_CREATED', 'government_schemes', data.id, { name: data.name }, adminUserId, ipAddress);
    return data;
  }

  async updateScheme(schemeId, schemeData, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('government_schemes')
      .update({ ...schemeData, updated_at: new Date().toISOString() })
      .eq('id', schemeId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('SCHEME_UPDATED', 'government_schemes', schemeId, { name: data.name }, adminUserId, ipAddress);
    return data;
  }

  async toggleSchemeStatus(schemeId, isActive, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('government_schemes')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', schemeId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('SCHEME_STATUS_TOGGLED', 'government_schemes', schemeId, { is_active: isActive }, adminUserId, ipAddress);
    return data;
  }

  async deleteScheme(schemeId, adminUserId, ipAddress) {
    const { error } = await supabaseAdmin.from('government_schemes').delete().eq('id', schemeId);
    if (error) throw error;
    await this.logAuditEvent('SCHEME_DELETED', 'government_schemes', schemeId, {}, adminUserId, ipAddress);
    return { success: true };
  }

  /**
   * 6. Insurance & TPA Providers
   */
  async getInsuranceProviders() {
    const { data, error } = await supabaseAdmin
      .from('insurance_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createInsuranceProvider(providerData, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('insurance_providers')
      .insert([providerData])
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('INSURANCE_PROVIDER_CREATED', 'insurance_providers', data.id, { name: data.name }, adminUserId, ipAddress);
    return data;
  }

  async updateInsuranceProvider(providerId, providerData, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('insurance_providers')
      .update(providerData)
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('INSURANCE_PROVIDER_UPDATED', 'insurance_providers', providerId, { name: data.name }, adminUserId, ipAddress);
    return data;
  }

  async toggleInsuranceStatus(providerId, isActive, adminUserId, ipAddress) {
    const { data, error } = await supabaseAdmin
      .from('insurance_providers')
      .update({ is_active: isActive })
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;
    await this.logAuditEvent('INSURANCE_PROVIDER_TOGGLED', 'insurance_providers', providerId, { is_active: isActive }, adminUserId, ipAddress);
    return data;
  }

  async deleteInsuranceProvider(providerId, adminUserId, ipAddress) {
    const { error } = await supabaseAdmin.from('insurance_providers').delete().eq('id', providerId);
    if (error) throw error;
    await this.logAuditEvent('INSURANCE_PROVIDER_DELETED', 'insurance_providers', providerId, {}, adminUserId, ipAddress);
    return { success: true };
  }

  /**
   * 7. Platform Analytics
   */
  async getPlatformAnalytics(timeRange = '30d') {
    const [hospRes, docRes, bedRes, bookRes, emergRes, billRes] = await Promise.all([
      supabaseAdmin.from('hospitals').select('city, verification_status, type, created_at'),
      supabaseAdmin.from('doctors').select('specialization, verification_status'),
      supabaseAdmin.from('hospital_beds').select('total_beds, available_beds, occupied_beds, bed_types(name)'),
      supabaseAdmin.from('bookings').select('status, created_at'),
      supabaseAdmin.from('emergency_sessions').select('status, created_at'),
      supabaseAdmin.from('bills').select('total_amount, status, created_at')
    ]);

    const cityMap = {};
    (hospRes.data || []).forEach(h => {
      const c = h.city || 'Bangalore';
      cityMap[c] = (cityMap[c] || 0) + 1;
    });
    const cityDistribution = Object.entries(cityMap).map(([city, count]) => ({ city, count }));

    const bedCategoryMap = {};
    (bedRes.data || []).forEach(b => {
      const name = b.bed_types?.name || 'General Bed';
      if (!bedCategoryMap[name]) {
        bedCategoryMap[name] = { total: 0, occupied: 0, available: 0 };
      }
      bedCategoryMap[name].total += b.total_beds || 0;
      bedCategoryMap[name].occupied += b.occupied_beds || 0;
      bedCategoryMap[name].available += b.available_beds || 0;
    });
    const bedBreakdown = Object.entries(bedCategoryMap).map(([name, stat]) => ({
      category: name,
      ...stat,
      occupancyRate: stat.total ? Math.round((stat.occupied / stat.total) * 100) : 0
    }));

    return {
      cityDistribution,
      bedBreakdown,
      hospitalsCount: hospRes.data?.length || 0,
      doctorsCount: docRes.data?.length || 0,
      bookingsCount: bookRes.data?.length || 0,
      emergenciesCount: emergRes.data?.length || 0,
      totalBilledValue: (billRes.data || []).reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0)
    };
  }

  /**
   * 8. Audit Logs
   */
  async getAuditLogs({ action, entity, query, limit = 50 }) {
    let q = supabaseAdmin
      .from('audit_logs')
      .select('*, profiles(full_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action && action !== 'all') {
      q = q.eq('action', action);
    }
    if (entity && entity !== 'all') {
      q = q.eq('entity_type', entity);
    }
    if (query) {
      q = q.or(`action.ilike.%${query}%,entity_type.ilike.%${query}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async logAuditEvent(action, entityType, entityId, metadata = {}, userId = null, ipAddress = '127.0.0.1') {
    try {
      await supabaseAdmin.from('audit_logs').insert([{
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
        ip_address: ipAddress || '127.0.0.1',
        created_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn('Silent audit log write error:', e);
    }
  }
}

module.exports = new AdminService();
