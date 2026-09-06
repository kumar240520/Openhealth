import { supabase } from '../lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function getAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

export const bookingService = {
  /**
   * Book specialist doctor appointment through secure backend Express gateway
   */
  bookAppointment: async ({
    doctorId,
    hospitalId = null,
    appointmentDate,
    appointmentTime,
    consultationType = 'in_clinic',
    patientNotes = ''
  }) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required. Please log in to book an appointment.');
    }

    const res = await fetch(`${API_BASE}/bookings/appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({
        doctorId,
        hospitalId,
        appointmentDate,
        appointmentTime,
        consultationType,
        patientNotes
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || json.message || 'Failed to book appointment.');
    }

    return json.data;
  },

  /**
   * Fetch all bookings for authenticated patient
   */
  getPatientBookings: async (filterType = 'all') => {
    const authHeaders = await getAuthHeaders();
    if (authHeaders.Authorization) {
      try {
        const res = await fetch(`${API_BASE}/bookings/my-bookings?type=${filterType}`, {
          headers: { ...authHeaders }
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.all && json.data.all.length > 0) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Backend bookings fetch notice, falling back to direct database query:', err);
      }
    }

    // Direct Supabase Resilient Fallback
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { all: [], doctorAppointments: [], bedReservations: [], totalCount: 0, allCount: 0, upcomingCount: 0, completedCount: 0, cancelledCount: 0 };

      const { data: patProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const patientId = patProfile?.id || user.id;

      // 1. Fetch doctor appointments
      const apptsRes = await supabase
        .from('doctor_appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          consultation_type,
          consultation_fee,
          status,
          created_at,
          doctors (id, name, specialization, image_url),
          hospitals (id, name, city, address, phone, image_url, latitude, longitude)
        `)
        .or(`patient_id.eq.${patientId},patient_id.eq.${user.id}`)
        .order('appointment_date', { ascending: false });

      // 2. Fetch bed reservations
      const bedsRes = await supabase
        .from('bed_reservations')
        .select(`
          id,
          deposit_amount,
          status,
          payment_status,
          reserved_at,
          expires_at,
          created_at,
          distance_km,
          drive_time,
          travel_minutes,
          hold_minutes,
          location_captured,
          patient_notes,
          bed_types (id, name),
          hospitals (id, name, city, address, phone, image_url, latitude, longitude)
        `)
        .or(`patient_id.eq.${patientId},patient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      const mappedAppts = (apptsRes.data || []).map(a => {
        const rawName = a.doctors?.name || 'Doctor';
        const docTitle = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
        const hospName = a.hospitals?.name || 'Medical Center';
        const aptDate = a.appointment_date ? new Date(a.appointment_date + 'T00:00:00') : new Date();
        const formattedDate = aptDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const createdDate = new Date(a.created_at);

        return {
          id: a.id,
          bookingType: 'doctor_appointment',
          bookingCode: `DOC-${a.id.slice(0, 8).toUpperCase()}`,
          title: `Appointment with ${docTitle}`,
          doctorName: docTitle,
          specialization: a.doctors?.specialization || 'Specialist Doctor',
          qualification: a.doctors?.qualification || 'MBBS, MD',
          doctorImage: a.doctors?.image_url,
          doctorRating: a.doctors?.rating || 4.8,
          hospitalName: hospName,
          hospitalCity: a.hospitals?.city || 'Indore',
          hospitalAddress: a.hospitals?.address || 'Indore, MP',
          hospitalPhone: a.hospitals?.phone || '+91 731 249 9000',
          hospitalImage: a.hospitals?.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
          hospitalLatitude: a.hospitals?.latitude ? parseFloat(a.hospitals.latitude) : null,
          hospitalLongitude: a.hospitals?.longitude ? parseFloat(a.hospitals.longitude) : null,
          date: formattedDate,
          rawDate: a.appointment_date,
          time: a.appointment_time || '10:00 AM',
          timeSlot: `${a.appointment_time || '10:00 AM'} Session`,
          mode: a.consultation_type === 'video' ? 'Online Video Teleconsultation' : 'In-Clinic OPD Consultation',
          consultationType: a.consultation_type,
          chamber: a.consultation_type === 'video' ? 'Secure HD Video Call' : 'Room 302, OPD Wing A',
          fee: a.consultation_fee || 800,
          payableAmount: `₹${a.consultation_fee || 800}`,
          paymentNote: 'Payment confirmed online.',
          status: a.status || 'confirmed',
          patientNotes: a.patient_notes || 'Clinical consultation',
          requestedOn: createdDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          createdAt: a.created_at
        };
      });

      const mappedBeds = (bedsRes.data || []).map(b => {
        const hospName = b.hospitals?.name || 'Hospital';
        const bedName = b.bed_types?.name || 'ICU';
        const reservedDate = b.reserved_at ? new Date(b.reserved_at) : new Date(b.created_at);
        const isExpired = b.status === 'expired' || b.status === 'cancelled' || (b.expires_at && new Date(b.expires_at).getTime() <= Date.now() && b.status !== 'completed');
        const resolvedStatus = isExpired ? 'cancelled' : b.status;

        return {
            id: b.id,
            bookingType: 'bed_reservation',
            bookingCode: `${hospName.slice(0, 2).toUpperCase()}-${bedName.slice(0, 3).toUpperCase()}-${b.id.slice(0, 6).toUpperCase()}`,
            title: `${bedName} Reservation`,
            bedTypeName: bedName,
            hospitalName: hospName,
            hospitalCity: b.hospitals?.city || 'Indore',
            hospitalAddress: b.hospitals?.address || 'Indore, MP',
            hospitalPhone: b.hospitals?.phone || '+91 731 249 9000',
            hospitalImage: b.hospitals?.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
            hospitalLatitude: b.hospitals?.latitude ? parseFloat(b.hospitals.latitude) : null,
            hospitalLongitude: b.hospitals?.longitude ? parseFloat(b.hospitals.longitude) : null,
            date: reservedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            rawDate: b.reserved_at || b.created_at,
            time: reservedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            timeSlot: `${reservedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - Onwards`,
            specialization: bedName === 'ICU' ? 'Critical Care' : 'General Medicine',
            department: bedName === 'ICU' ? 'Critical Care (ICU)' : 'General Medicine (Ward)',
            payableAmount: 'Payable at Hospital',
            expiresAt: b.expires_at,
            distanceKm: b.distance_km != null ? parseFloat(b.distance_km) : null,
            driveTime: b.drive_time || null,
            travelMinutes: b.travel_minutes != null ? Number(b.travel_minutes) : null,
            holdMinutes: b.hold_minutes != null ? Number(b.hold_minutes) : null,
            locationCaptured: b.location_captured || null,
            isLocationLocked: true,
            status: resolvedStatus,
            createdAt: b.created_at
          };
        });

        const all = [...mappedBeds, ...mappedAppts];

        const isBookingActiveUpcoming = (b) => {
          if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'expired') return false;
          if (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now()) return false;
          return ['confirmed', 'held', 'pending'].includes(b.status);
        };

        const upcoming = all.filter(isBookingActiveUpcoming);
        const completed = all.filter(b => b.status === 'completed');
        const cancelled = all.filter(b => !isBookingActiveUpcoming(b) && b.status !== 'completed');

        return {
          all,
          doctorAppointments: mappedAppts,
          bedReservations: mappedBeds,
          totalCount: all.length,
          allCount: all.length,
          upcomingCount: upcoming.length,
          completedCount: completed.length,
          cancelledCount: cancelled.length
        };
    } catch (dbErr) {
      console.error('Direct bookings query fallback error:', dbErr);
      return { all: [], doctorAppointments: [], bedReservations: [], totalCount: 0, allCount: 0, upcomingCount: 0, completedCount: 0, cancelledCount: 0 };
    }
  },

  /**
   * Cancel an appointment
   */
  cancelAppointment: async (appointmentId, reason = '') => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/bookings/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ reason })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to cancel appointment.');
    }

    return json.data;
  },

  /**
   * Cancel a hospital bed reservation with backend API and direct Supabase fallback
   */
  cancelReservation: async (reservationId, reason = '') => {
    const authHeaders = await getAuthHeaders();
    if (authHeaders.Authorization) {
      try {
        const res = await fetch(`${API_BASE}/bookings/reservations/${reservationId}/cancel`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify({ reason })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) return json.data;
        }
      } catch (e) {
        console.warn('Backend reservation cancel notice, trying direct Supabase client:', e.message);
      }
    }

    // Direct Supabase Fallback
    const { data, error } = await supabase
      .from('bed_reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check patient daily appointment slots and doctor uniqueness for a specific date
   */
  checkDailySlotAvailability: async (doctorId, appointmentDate) => {
    if (!appointmentDate) {
      return {
        date: null,
        maxSlots: 2,
        activeSlotsCount: 0,
        remainingSlots: 2,
        canBook: true,
        isSameDoctorBooked: false,
        bookedDoctorName: null
      };
    }

    const authHeaders = await getAuthHeaders();
    if (authHeaders.Authorization) {
      try {
        const queryParams = new URLSearchParams({
          date: appointmentDate,
          ...(doctorId ? { doctorId } : {})
        });
        const res = await fetch(`${API_BASE}/bookings/daily-slots?${queryParams.toString()}`, {
          headers: { ...authHeaders }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Backend daily slots check notice, falling back to Supabase:', err);
      }
    }

    // Direct Supabase RPC Fallback
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_patient_daily_appointment_status', {
        p_date: appointmentDate,
        p_doctor_id: doctorId || null
      });

      if (!rpcErr && rpcData) {
        return {
          date: appointmentDate,
          maxSlots: rpcData.max_slots ?? 2,
          activeSlotsCount: rpcData.active_slots_count ?? 0,
          remainingSlots: rpcData.remaining_slots ?? 2,
          canBook: rpcData.can_book ?? true,
          isSameDoctorBooked: rpcData.is_same_doctor_booked ?? false,
          bookedDoctorName: null
        };
      }
    } catch (rpcCatchErr) {
      console.warn('RPC check notice, trying query fallback:', rpcCatchErr);
    }

    // Direct Supabase query fallback
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          date: appointmentDate,
          maxSlots: 2,
          activeSlotsCount: 0,
          remainingSlots: 2,
          canBook: true,
          isSameDoctorBooked: false,
          bookedDoctorName: null
        };
      }

      const { data: patProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const patientId = patProfile?.id || user.id;

      const { data: appointments, error: aErr } = await supabase
        .from('doctor_appointments')
        .select('id, doctor_id, status, doctors(name)')
        .or(`patient_id.eq.${patientId},patient_id.eq.${user.id}`)
        .eq('appointment_date', appointmentDate);

      if (aErr) throw aErr;

      const maxSlots = 2;
      const activeSlots = (appointments || []).filter(a =>
        ['confirmed', 'pending', 'scheduled'].includes(a.status)
      );
      const activeSlotsCount = activeSlots.length;
      const remainingSlots = Math.max(0, maxSlots - activeSlotsCount);

      let isSameDoctorBooked = false;
      let bookedDoctorName = null;
      if (doctorId && appointments) {
        const match = appointments.find(
          a => a.doctor_id === doctorId && ['confirmed', 'pending', 'scheduled', 'completed'].includes(a.status)
        );
        if (match) {
          isSameDoctorBooked = true;
          bookedDoctorName = match.doctors?.name || 'This doctor';
        }
      }

      return {
        date: appointmentDate,
        maxSlots,
        activeSlotsCount,
        remainingSlots,
        canBook: activeSlotsCount < maxSlots && !isSameDoctorBooked,
        isSameDoctorBooked,
        bookedDoctorName
      };
    } catch (e) {
      console.error('Error checking daily slots:', e);
      return {
        date: appointmentDate,
        maxSlots: 2,
        activeSlotsCount: 0,
        remainingSlots: 2,
        canBook: true,
        isSameDoctorBooked: false,
        bookedDoctorName: null
      };
    }
  }
};

export default bookingService;
