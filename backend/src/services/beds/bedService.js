const { supabaseAdmin } = require('../../config/supabase');

/**
 * Bed Allocation & 30-Minute Hold Lock Service (Enforces Rules 17.1, 17.2, 17.3)
 */
const bedService = {
  /**
   * Create a 30-Minute Live Bed Hold for an emergency/consultation admission
   */
  reserveBedHold: async ({ userId, hospitalId, bedType = 'ICU', patientNotes = '', holdMinutes = 30, driveTime = '', distanceKm = null, travelMinutes = null, locationCaptured = null }) => {
    // 1. Resolve patient profile and user info
    const [patRes, profRes] = await Promise.all([
      supabaseAdmin.from('patient_profiles').select('id').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('profiles').select('full_name, phone').eq('id', userId).maybeSingle()
    ]);

    let patientId = patRes.data?.id;

    if (!patientId) {
      const { data: newPat } = await supabaseAdmin
        .from('patient_profiles')
        .insert({
          user_id: userId,
          city: 'Indore'
        })
        .select('id')
        .single();
      patientId = newPat?.id || userId;
    }

    const patientName = profRes.data?.full_name || 'Patient';

    // =========================================================================
    // INVARIANT CHECK 1: Disallow booking if patient is currently admitted to this hospital
    // =========================================================================
    const { data: activeAdm } = await supabaseAdmin
      .from('hospital_admissions')
      .select('id, bed_number')
      .eq('hospital_id', hospitalId)
      .eq('patient_id', patientId)
      .eq('status', 'admitted')
      .maybeSingle();

    if (activeAdm) {
      throw new Error(`You are currently admitted to unit ${activeAdm.bed_number} at this hospital. You cannot hold another bed until you are discharged.`);
    }

    // =========================================================================
    // INVARIANT CHECK 2: Disallow holding 2 beds at the same hospital
    // =========================================================================
    const { data: existingHospHold } = await supabaseAdmin
      .from('bed_reservations')
      .select('id, expires_at')
      .eq('hospital_id', hospitalId)
      .eq('patient_id', patientId)
      .in('status', ['held', 'pending'])
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingHospHold) {
      throw new Error(`You already have an active bed reservation at this hospital. Multiple bed holds at the same hospital are not permitted.`);
    }

    // =========================================================================
    // INVARIANT CHECK 3: Max 2 bed holds across all different hospitals
    // =========================================================================
    const { data: allActiveHolds } = await supabaseAdmin
      .from('bed_reservations')
      .select('hospital_id')
      .eq('patient_id', patientId)
      .in('status', ['held', 'pending'])
      .gt('expires_at', new Date().toISOString());

    if (allActiveHolds && new Set(allActiveHolds.map(h => h.hospital_id)).size >= 2) {
      throw new Error(`You have reached the maximum limit of 2 active bed holds across different hospitals. Please cancel an existing hold before reserving another bed.`);
    }

    // 2. Fetch target bed inventory
    const { data: allHospBeds, error: bErr } = await supabaseAdmin
      .from('hospital_beds')
      .select('*, bed_types(*)')
      .eq('hospital_id', hospitalId);

    if (bErr || !allHospBeds || allHospBeds.length === 0) {
      throw new Error(`No bed inventory found for this hospital.`);
    }

    const bedRecord = allHospBeds.find(b => 
      (b.bed_types?.name || '').toLowerCase().includes(bedType.toLowerCase())
    ) || allHospBeds[0];

    // Rule 17.1: Invariant Check (available_beds >= 1)
    if (bedRecord.available_beds <= 0) {
      throw new Error(`No available ${bedType} beds remaining at this facility.`);
    }

    // 3. Set dynamic hold window based on user's drive time
    const durationMinutes = (holdMinutes && holdMinutes > 0) ? Number(holdMinutes) : 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const notesWithDrive = driveTime 
      ? `[Drive: ${driveTime} | ${distanceKm ? `${distanceKm} km` : ''}] ${patientNotes || ''}`.trim()
      : (patientNotes || null);

    // 4. Create bed reservation record with locked location and timer metadata
    const { data: reservation, error: rErr } = await supabaseAdmin
      .from('bed_reservations')
      .insert({
        patient_id: patientId,
        hospital_id: hospitalId,
        bed_type_id: bedRecord.bed_type_id || bedRecord.bed_types?.id,
        status: 'held',
        deposit_amount: 0,
        payment_status: 'pending',
        reserved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        distance_km: distanceKm != null ? parseFloat(distanceKm) : null,
        drive_time: driveTime || null,
        travel_minutes: travelMinutes != null ? Number(travelMinutes) : null,
        hold_minutes: durationMinutes,
        location_captured: locationCaptured || null,
        patient_notes: notesWithDrive
      })
      .select()
      .single();

    if (rErr) throw rErr;

    // Dispatch automated patient notification
    try {
      const { data: pData } = await supabaseAdmin
        .from('patient_profiles')
        .select('user_id')
        .eq('id', patientId)
        .maybeSingle();

      const notifUserId = pData?.user_id || patientId;
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: notifUserId,
          type: 'booking',
          title: `Bed Hold Active: ${bedRecord.bed_types?.name || 'Emergency Bed'}`,
          message: `Your bed reservation is held. Please arrive for admission within ${durationMinutes} minutes.`,
          entity_type: 'bed_reservation',
          entity_id: reservation.id
        });
    } catch (nErr) {
      console.warn('Bed notification insert notice:', nErr);
    }

    // 5. Update beds inventory (decrement available_beds, increment reserved_beds)
    const newReserved = (bedRecord.reserved_beds || 0) + 1;
    const newAvailable = Math.max(0, (bedRecord.available_beds || 1) - 1);

    await supabaseAdmin
      .from('hospital_beds')
      .update({
        reserved_beds: newReserved,
        available_beds: newAvailable,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', bedRecord.id);

    const bedCategoryName = bedRecord.bed_types?.name || 'Selected Bed';

    return {
      holdId: reservation.id,
      hospitalId,
      bedType: bedCategoryName,
      status: 'held',
      reservedAt: reservation.reserved_at,
      expiresAt: reservation.expires_at,
      validMinutes: durationMinutes,
      driveTime: driveTime || null,
      distanceKm: distanceKm != null ? parseFloat(distanceKm) : null,
      travelMinutes: travelMinutes != null ? Number(travelMinutes) : null,
      locationCaptured,
      isLocationLocked: true,
      patientName,
      message: `${durationMinutes}-minute dynamic hold active on ${bedCategoryName}. Please arrive or confirm admission before expiry.`
    };
  },

  /**
   * Release a bed hold immediately (Rule 17.2: instant resource release)
   */
  releaseBedHold: async ({ userId, holdId }) => {
    // 1. Resolve patient profile
    let { data: patient } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!patient) {
      const { data: userProf } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (userProf) patient = userProf;
    }

    if (!patient) throw new Error('Patient profile not found.');

    // 2. Fetch reservation
    const { data: reservation, error: rErr } = await supabaseAdmin
      .from('bed_reservations')
      .select('*')
      .eq('id', holdId)
      .maybeSingle();

    if (rErr || !reservation) {
      throw new Error('Bed reservation hold not found.');
    }

    if (reservation.patient_id !== patient.id) {
      throw new Error('Unauthorized: You do not own this reservation hold.');
    }

    if (reservation.status !== 'held') {
      return {
        holdId,
        status: reservation.status,
        message: `Reservation hold is already ${reservation.status}.`
      };
    }

    // 3. Mark reservation cancelled
    await supabaseAdmin
      .from('bed_reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', holdId);

    // 4. Return resource to bed inventory
    if (reservation.bed_type_id && reservation.hospital_id) {
      const { data: bed } = await supabaseAdmin
        .from('hospital_beds')
        .select('*')
        .eq('hospital_id', reservation.hospital_id)
        .eq('bed_type_id', reservation.bed_type_id)
        .maybeSingle();

      if (bed) {
        await supabaseAdmin
          .from('hospital_beds')
          .update({
            reserved_beds: Math.max(0, (bed.reserved_beds || 1) - 1),
            available_beds: (bed.available_beds || 0) + 1,
            last_updated_at: new Date().toISOString()
          })
          .eq('id', bed.id);
      }
    }

    return {
      holdId,
      status: 'cancelled',
      message: 'Bed hold successfully released and returned to inventory.'
    };
  },

  /**
   * Automated cleanup of expired holds (Enforces Rules 17.1, 17.2, 17.3)
   * Automatically restores expired beds to vacant inventory in hospital_beds
   */
  cleanupExpiredHolds: async () => {
    try {
      // 1. Invoke atomic PostgreSQL stored function (locks rows, marks expired, increments available_beds)
      const { data, error } = await supabaseAdmin.rpc('expire_stale_bed_holds');
      if (!error && data) {
        return {
          success: true,
          cleanedCount: data.expired_count || 0,
          timestamp: data.timestamp
        };
      }
    } catch (rpcErr) {
      console.warn('expire_stale_bed_holds RPC notice, executing fallback sweep:', rpcErr.message);
    }

    // 2. Resilient fallback query
    const now = new Date().toISOString();
    const { data: expiredHolds, error } = await supabaseAdmin
      .from('bed_reservations')
      .select('id, hospital_id, bed_type_id')
      .eq('status', 'held')
      .lt('expires_at', now);

    if (error || !expiredHolds || expiredHolds.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    let cleanedCount = 0;
    for (const hold of expiredHolds) {
      await supabaseAdmin
        .from('bed_reservations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', hold.id);

      if (hold.hospital_id && hold.bed_type_id) {
        const { data: bed } = await supabaseAdmin
          .from('hospital_beds')
          .select('id, available_beds, reserved_beds')
          .eq('hospital_id', hold.hospital_id)
          .eq('bed_type_id', hold.bed_type_id)
          .maybeSingle();

        if (bed) {
          await supabaseAdmin
            .from('hospital_beds')
            .update({
              reserved_beds: Math.max(0, (bed.reserved_beds || 1) - 1),
              available_beds: (bed.available_beds || 0) + 1,
              last_updated_at: new Date().toISOString()
            })
            .eq('id', bed.id);
        }
      }
      cleanedCount++;
    }

    return { success: true, cleanedCount };
  }
};

module.exports = bedService;
