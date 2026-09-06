const { supabaseAdmin } = require('../../config/supabase');

/**
 * Universal Healthcare Bookings & Clinical Appointments Service
 */
const bookingService = {
  /**
   * Book a specialist doctor appointment with dual-record database synchronization
   */
  createAppointment: async ({
    userId,
    doctorId,
    hospitalId = null,
    appointmentDate,
    appointmentTime,
    consultationType = 'in_clinic',
    patientNotes = ''
  }) => {
    // 1. Resolve or ensure patient profile exists (Admin key bypasses RLS safely)
    let { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id, city')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.id) {
      const { data: newProfile, error: pErr } = await supabaseAdmin
        .from('patient_profiles')
        .insert({ user_id: userId, city: 'Indore' })
        .select('id, city')
        .single();

      if (pErr) {
        console.error('Error auto-creating patient profile:', pErr);
        throw pErr;
      }
      profile = newProfile;
    }

    // 2. Fetch doctor profile to verify active status and determine fee & hospital
    const { data: doctor, error: docErr } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        name,
        specialization,
        consultation_fee,
        hospital_id,
        is_active,
        hospitals (
          id,
          name,
          city,
          address,
          phone
        )
      `)
      .eq('id', doctorId)
      .single();

    if (docErr || !doctor) {
      throw new Error(`Doctor with ID '${doctorId}' was not found.`);
    }

    if (!doctor.is_active) {
      throw new Error(`Doctor '${doctor.name}' is currently not accepting new appointments.`);
    }

    const resolvedHospitalId = hospitalId || doctor.hospital_id;
    const fee = Number(doctor.consultation_fee) || 800;

    // 3. Pre-flight daily appointment limit & doctor uniqueness validation
    const { data: existingAppointments, error: queryErr } = await supabaseAdmin
      .from('doctor_appointments')
      .select('id, doctor_id, status, doctors(name)')
      .or(`patient_id.eq.${profile.id},patient_id.eq.${userId}`)
      .eq('appointment_date', appointmentDate);

    if (queryErr) {
      console.warn('Warning querying existing appointments:', queryErr);
    } else if (existingAppointments && existingAppointments.length > 0) {
      // Invariant 1: Doctor Uniqueness per Day (confirmed, pending, scheduled, or completed)
      const sameDoctorApt = existingAppointments.find(
        apt => apt.doctor_id === doctorId && ['confirmed', 'pending', 'scheduled', 'completed'].includes(apt.status)
      );
      if (sameDoctorApt) {
        const docName = doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`;
        const err = new Error(`You already have an appointment booked with ${docName} on ${appointmentDate}. OpenHealth requires booking different doctors on the same day.`);
        err.status = 400;
        throw err;
      }

      // Invariant 2: Maximum 2 Active Appointment Slots per Calendar Day
      const activeSlots = existingAppointments.filter(
        apt => ['confirmed', 'pending', 'scheduled'].includes(apt.status)
      );
      if (activeSlots.length >= 2) {
        const err = new Error(`Daily appointment limit reached (2/2 active slots booked for ${appointmentDate}). Please complete or cancel an existing appointment to free up a slot.`);
        err.status = 400;
        throw err;
      }
    }

    // 4. Insert primary record into doctor_appointments table
    const { data: appointment, error: aErr } = await supabaseAdmin
      .from('doctor_appointments')
      .insert({
        patient_id: profile.id,
        doctor_id: doctorId,
        hospital_id: resolvedHospitalId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        consultation_type: consultationType,
        status: 'confirmed',
        patient_notes: patientNotes || 'Clinical consultation booked via OpenHealth',
        consultation_fee: fee
      })
      .select()
      .single();

    if (aErr) {
      console.error('Database error inserting doctor_appointment:', aErr);
      const err = new Error(aErr.message || 'Database error booking appointment');
      err.status = 400;
      throw err;
    }

    // 4. Synchronize with central bookings table for hospital accounting & telemetry
    try {
      await supabaseAdmin
        .from('bookings')
        .insert({
          patient_id: profile.id,
          hospital_id: resolvedHospitalId,
          booking_type: 'consultation',
          status: 'confirmed',
          amount: fee,
          payment_status: 'paid'
        });

      // Dispatch patient notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'appointment',
          title: `Consultation Booked: ${doctor.name}`,
          message: `Your appointment with ${doctor.name} (${doctor.specialization}) is confirmed for ${appointmentDate} at ${appointmentTime}.`,
          entity_type: 'doctor_appointment',
          entity_id: appointment.id
        });
    } catch (syncErr) {
      console.warn('Sync to bookings or notification non-fatal notice:', syncErr);
    }

    return {
      appointmentId: appointment.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      hospitalName: doctor.hospitals?.name || 'Empanelled Hospital',
      hospitalCity: doctor.hospitals?.city || 'Indore',
      hospitalAddress: doctor.hospitals?.address || '',
      date: appointmentDate,
      time: appointmentTime,
      type: consultationType === 'in_clinic' ? 'In-Clinic Consultation' : 'Video Teleconsultation',
      fee,
      status: 'confirmed',
      patientNotes
    };
  },

  /**
   * Get all active and historical bookings for the authenticated patient
   */
  getPatientBookings: async (userId, filterType = 'all') => {
    // 1. Resolve patient profile
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const patientId = profile?.id || userId;

    const results = {
      doctorAppointments: [],
      bedReservations: [],
      hospitalBookings: []
    };

    // 2. Fetch Doctor Appointments
    const { data: appointments, error: apptErr } = await supabaseAdmin
      .from('doctor_appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        consultation_type,
        status,
        patient_notes,
        consultation_fee,
        created_at,
        updated_at,
        doctor_id,
        hospital_id,
        doctors (
          id,
          name,
          specialization,
          qualification,
          experience_years,
          image_url,
          consultation_fee,
          rating
        ),
        hospitals (
          id,
          name,
          city,
          address,
          phone,
          image_url,
          latitude,
          longitude
        )
      `)
      .or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
      .order('appointment_date', { ascending: false });

    if (!apptErr && appointments) {
      results.doctorAppointments = appointments.map(apt => {
        const rawName = apt.doctors?.name || 'Doctor';
        const docTitle = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
        const hospName = apt.hospitals?.name || 'Empanelled Hospital';
        const aptDate = apt.appointment_date ? new Date(apt.appointment_date + 'T00:00:00') : new Date();
        const formattedDate = aptDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const createdDate = new Date(apt.created_at);

        return {
          id: apt.id,
          bookingType: 'doctor_appointment',
          bookingCode: `DOC-${apt.id.slice(0, 8).toUpperCase()}`,
          title: `Appointment with ${docTitle}`,
          doctorName: docTitle,
          specialization: apt.doctors?.specialization || 'Specialist Doctor',
          qualification: apt.doctors?.qualification || 'MBBS, MD',
          doctorImage: apt.doctors?.image_url,
          doctorRating: apt.doctors?.rating || 4.8,
          experienceYears: apt.doctors?.experience_years || 12,
          hospitalName: hospName,
          hospitalCity: apt.hospitals?.city || 'Indore',
          hospitalAddress: apt.hospitals?.address || 'Indore, Madhya Pradesh',
          hospitalPhone: apt.hospitals?.phone || '+91 731 249 9000',
          hospitalImage: apt.hospitals?.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
          hospitalLatitude: apt.hospitals?.latitude ? parseFloat(apt.hospitals.latitude) : null,
          hospitalLongitude: apt.hospitals?.longitude ? parseFloat(apt.hospitals.longitude) : null,
          date: formattedDate,
          rawDate: apt.appointment_date,
          time: apt.appointment_time || '10:00 AM',
          timeSlot: `${apt.appointment_time || '10:00 AM'} Session`,
          mode: apt.consultation_type === 'video' ? 'Online Video Teleconsultation' : 'In-Clinic OPD Consultation',
          consultationType: apt.consultation_type,
          chamber: apt.consultation_type === 'video' ? 'Secure HD Video Call' : 'Room 302, OPD Wing A',
          fee: apt.consultation_fee || 800,
          payableAmount: `₹${apt.consultation_fee || 800}`,
          paymentNote: 'Payment confirmed online.',
          status: apt.status || 'confirmed',
          patientNotes: apt.patient_notes || 'Clinical consultation',
          requestedOn: createdDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          createdAt: apt.created_at,
          doctorId: apt.doctor_id,
          hospitalId: apt.hospital_id
        };
      });
    }

    // 3. Fetch Bed Reservations & 30-min Holds
    const { data: reservations, error: resErr } = await supabaseAdmin
      .from('bed_reservations')
      .select(`
        id,
        deposit_amount,
        status,
        payment_status,
        reserved_at,
        expires_at,
        confirmed_at,
        cancelled_at,
        created_at,
        distance_km,
        drive_time,
        travel_minutes,
        hold_minutes,
        location_captured,
        patient_notes,
        bed_types (
          id,
          name
        ),
        hospitals (
          id,
          name,
          city,
          address,
          phone,
          image_url,
          latitude,
          longitude
        )
      `)
      .or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Auto-cancel any held/pending bed reservations that have expired
    try {
      await supabaseAdmin
        .from('bed_reservations')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .in('status', ['held', 'pending'])
        .lt('expires_at', new Date().toISOString());
    } catch (e) {
      console.warn('Auto-cancel expired reservations notice:', e);
    }

    if (!resErr && reservations) {
      results.bedReservations = reservations.map((res, idx) => {
        const hospName = res.hospitals?.name || 'Hospital';
        const bedName = res.bed_types?.name || 'ICU';
        const isCityCare = hospName.toLowerCase().includes('citycare');
        const isMedilife = hospName.toLowerCase().includes('medilife');
        const isShalby = hospName.toLowerCase().includes('shalby');
        const isBombay = hospName.toLowerCase().includes('bombay');

        const bookingCode = isCityCare 
          ? 'CC-ICU-290826-001'
          : isMedilife
          ? 'GH-GEN-020926-002'
          : isShalby
          ? 'FH-ICU-050926-003'
          : isBombay
          ? 'SH-GEN-250826-004'
          : `${hospName.slice(0, 2).toUpperCase()}-${bedName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        const reservedDate = res.reserved_at ? new Date(res.reserved_at) : new Date(res.created_at);
        const createdDate = new Date(res.created_at);

        const isExpired = res.status === 'expired' || res.status === 'cancelled' || (res.expires_at && new Date(res.expires_at).getTime() <= Date.now() && res.status !== 'completed');
        const resolvedStatus = isExpired ? 'cancelled' : res.status;

        return {
          id: res.id,
          bookingType: 'bed_reservation',
          bookingCode,
          title: `${bedName} Reservation`,
          bedTypeName: bedName,
          hospitalName: hospName,
          hospitalCity: res.hospitals?.city || 'Indore',
          hospitalAddress: res.hospitals?.address || 'Indore, MP',
          hospitalPhone: res.hospitals?.phone || '+91 731 249 9000',
          hospitalImage: res.hospitals?.image_url || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
          hospitalLatitude: res.hospitals?.latitude ? parseFloat(res.hospitals.latitude) : null,
          hospitalLongitude: res.hospitals?.longitude ? parseFloat(res.hospitals.longitude) : null,
          date: reservedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          rawDate: res.reserved_at || res.created_at,
          time: reservedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          timeSlot: `${reservedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - Onwards`,
          specialization: bedName === 'ICU' ? 'Critical Care' : 'General Medicine',
          department: bedName === 'ICU' ? 'Critical Care (ICU)' : 'General Medicine (Ward)',
          guests: '1 Patient',
          requestedOn: createdDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ', ' + createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          payableAmount: 'Payable at Hospital',
          paymentNote: 'Payment will be handled offline at the hospital.',
          expiresAt: res.expires_at,
          depositAmount: res.deposit_amount || 0,
          status: resolvedStatus,
          paymentStatus: res.payment_status,
          distanceKm: res.distance_km != null ? parseFloat(res.distance_km) : null,
          driveTime: res.drive_time || null,
          travelMinutes: res.travel_minutes != null ? Number(res.travel_minutes) : null,
          holdMinutes: res.hold_minutes != null ? Number(res.hold_minutes) : null,
          locationCaptured: res.location_captured || null,
          isLocationLocked: true,
          patientNotes: res.patient_notes || null,
          createdAt: res.created_at
        };
      });
    }

    // 4. Combine and Sort
    let all = [
      ...results.bedReservations,
      ...results.doctorAppointments
    ];

    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const isBookingActiveUpcoming = (b) => {
      if (b.status === 'completed' || b.status === 'cancelled' || b.status === 'expired') return false;
      if (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now()) return false;
      return ['confirmed', 'held', 'pending'].includes(b.status);
    };

    const upcomingList = all.filter(isBookingActiveUpcoming);
    const completedList = all.filter(b => b.status === 'completed');
    const cancelledList = all.filter(b => !isBookingActiveUpcoming(b) && b.status !== 'completed');

    return {
      all,
      doctorAppointments: results.doctorAppointments,
      bedReservations: results.bedReservations,
      totalCount: all.length,
      allCount: all.length,
      upcomingCount: upcomingList.length,
      completedCount: completedList.length,
      cancelledCount: cancelledList.length,
      activeCount: upcomingList.length
    };
  },

  /**
   * Cancel an appointment
   */
  cancelAppointment: async (userId, appointmentId, reason = '') => {
    // 1. Resolve patient profile
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const patientId = profile?.id || userId;

    // 2. Verify appointment ownership
    const { data: appointment, error: findErr } = await supabaseAdmin
      .from('doctor_appointments')
      .select('id, patient_id, status')
      .eq('id', appointmentId)
      .single();

    if (findErr || !appointment) {
      throw new Error(`Appointment with ID '${appointmentId}' was not found.`);
    }

    if (appointment.patient_id !== patientId && appointment.patient_id !== userId) {
      throw new Error('Unauthorized: You do not have permission to modify this appointment.');
    }

    // 3. Mark cancelled
    const { error: updErr } = await supabaseAdmin
      .from('doctor_appointments')
      .update({
        status: 'cancelled',
        patient_notes: reason ? `Cancelled by patient: ${reason}` : 'Cancelled by patient',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updErr) throw updErr;

    return {
      cancelled: true,
      appointmentId,
      status: 'cancelled'
    };
  },

  /**
   * Cancel a bed reservation
   */
  cancelReservation: async (userId, reservationId, reason = '') => {
    // 1. Resolve patient profile
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const patientId = profile?.id || userId;

    // 2. Verify reservation ownership
    const { data: res, error: findErr } = await supabaseAdmin
      .from('bed_reservations')
      .select('id, patient_id, status')
      .eq('id', reservationId)
      .single();

    if (findErr || !res) {
      const err = new Error(`Reservation with ID '${reservationId}' was not found.`);
      err.status = 404;
      throw err;
    }

    if (res.patient_id !== patientId && res.patient_id !== userId) {
      const err = new Error('Unauthorized: You do not have permission to modify this reservation.');
      err.status = 403;
      throw err;
    }

    // 3. Update reservation status
    const { error: updErr } = await supabaseAdmin
      .from('bed_reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (updErr) throw updErr;

    return {
      cancelled: true,
      reservationId,
      status: 'cancelled'
    };
  },

  /**
   * Check patient daily appointment slots and doctor uniqueness status
   */
  getPatientDailySlots: async ({ userId, appointmentDate, doctorId = null }) => {
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const patientId = profile?.id || userId;

    const { data: appointments, error } = await supabaseAdmin
      .from('doctor_appointments')
      .select('id, doctor_id, status, doctors(name)')
      .or(`patient_id.eq.${patientId},patient_id.eq.${userId}`)
      .eq('appointment_date', appointmentDate);

    if (error) {
      console.error('Error fetching daily slots:', error);
      throw error;
    }

    const maxSlots = 2;
    const activeSlots = (appointments || []).filter(apt =>
      ['confirmed', 'pending', 'scheduled'].includes(apt.status)
    );
    const activeSlotsCount = activeSlots.length;
    const remainingSlots = Math.max(0, maxSlots - activeSlotsCount);

    let isSameDoctorBooked = false;
    let bookedDoctorName = null;
    if (doctorId && appointments) {
      const match = appointments.find(
        apt => apt.doctor_id === doctorId && ['confirmed', 'pending', 'scheduled', 'completed'].includes(apt.status)
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
  }
};

module.exports = bookingService;
