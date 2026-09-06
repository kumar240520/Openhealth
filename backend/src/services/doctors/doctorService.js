const { supabaseAdmin } = require('../../config/supabase');

/**
 * Doctor Discovery & Clinical Dossier Service
 */
const doctorService = {
  /**
   * Search & filter doctors with multi-criteria queries and pagination
   */
  getDoctors: async ({
    query = '',
    specialty = '',
    city = '',
    hospitalId = null,
    availableToday = null,
    minRating = 0,
    maxFee = null,
    minExperience = 0,
    sortBy = 'rating',
    order = 'desc',
    limit = 20,
    offset = 0
  }) => {
    const hasCityFilter = city && city.trim() && city.toLowerCase() !== 'all';
    const hospSelect = hasCityFilter ? 'hospitals!inner' : 'hospitals';

    let q = supabaseAdmin
      .from('doctors')
      .select(`
        id,
        name,
        specialization,
        qualification,
        registration_number,
        experience_years,
        consultation_fee,
        rating,
        review_count,
        image_url,
        about,
        education,
        languages,
        available_today,
        available_days,
        available_slots,
        opd_timings,
        awards,
        verification_status,
        is_active,
        hospital_id,
        department_id,
        ${hospSelect} (
          id,
          name,
          city,
          state,
          address,
          image_url,
          rating,
          review_count,
          transparency_score
        ),
        departments (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Filter by City at database level
    if (hasCityFilter) {
      const cleanCity = city.split(',')[0].trim();
      q = q.ilike('hospitals.city', `%${cleanCity}%`);
    }

    // Filter by Hospital
    if (hospitalId) {
      q = q.eq('hospital_id', hospitalId);
    }

    // Filter by Specialty
    if (specialty && specialty !== 'all') {
      q = q.ilike('specialization', `%${specialty}%`);
    }

    // Filter by Available Today
    if (availableToday === true || availableToday === 'true') {
      q = q.eq('available_today', true);
    }

    // Filter by Min Rating
    if (minRating > 0) {
      q = q.gte('rating', minRating);
    }

    // Filter by Max Fee
    if (maxFee) {
      q = q.lte('consultation_fee', maxFee);
    }

    // Filter by Min Experience
    if (minExperience > 0) {
      q = q.gte('experience_years', minExperience);
    }

    // Text Search
    if (query && query.trim().length > 0) {
      const cleanQ = query.trim();
      q = q.or(`name.ilike.%${cleanQ}%,specialization.ilike.%${cleanQ}%,qualification.ilike.%${cleanQ}%`);
    }

    // Sorting
    const isAsc = order === 'asc';
    if (sortBy === 'rating') {
      q = q.order('rating', { ascending: isAsc });
    } else if (sortBy === 'experience') {
      q = q.order('experience_years', { ascending: isAsc });
    } else if (sortBy === 'fee_asc') {
      q = q.order('consultation_fee', { ascending: true });
    } else if (sortBy === 'fee_desc') {
      q = q.order('consultation_fee', { ascending: false });
    } else if (sortBy === 'name') {
      q = q.order('name', { ascending: isAsc });
    } else {
      q = q.order('rating', { ascending: false });
    }

    // Pagination
    q = q.range(offset, offset + limit - 1);

    const { data, count, error } = await q;

    if (error) {
      console.error('Doctor search database error:', error);
      throw error;
    }

    let doctors = data || [];

    // Filter by Hospital City client-side if requested (since city is in joined hospitals)
    if (city && city !== 'all') {
      const cityClean = city.toLowerCase();
      doctors = doctors.filter(doc => doc.hospitals?.city?.toLowerCase()?.includes(cityClean));
    }

    return {
      doctors,
      total: count || doctors.length,
      limit,
      offset,
      hasMore: offset + doctors.length < (count || doctors.length)
    };
  },

  /**
   * List distinct specialties with doctor counts
   */
  getSpecialties: async () => {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select('specialization, rating')
      .eq('is_active', true);

    if (error) throw error;

    const specialtyMap = {};
    (data || []).forEach(doc => {
      const spec = doc.specialization?.trim();
      if (!spec) return;
      if (!specialtyMap[spec]) {
        specialtyMap[spec] = {
          name: spec,
          count: 0,
          avgRating: 0,
          totalRating: 0
        };
      }
      specialtyMap[spec].count += 1;
      specialtyMap[spec].totalRating += Number(doc.rating) || 4.5;
    });

    const list = Object.values(specialtyMap).map(s => ({
      name: s.name,
      doctorCount: s.count,
      avgRating: Number((s.totalRating / s.count).toFixed(1))
    })).sort((a, b) => b.doctorCount - a.doctorCount);

    return list;
  },

  /**
   * Fetch complete clinical dossier of a single doctor by UUID
   */
  getDoctorById: async (id) => {
    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        name,
        specialization,
        qualification,
        registration_number,
        experience_years,
        consultation_fee,
        rating,
        review_count,
        image_url,
        about,
        education,
        languages,
        available_today,
        available_days,
        available_slots,
        opd_timings,
        awards,
        verification_status,
        is_active,
        hospital_id,
        department_id,
        hospitals (
          id,
          name,
          city,
          state,
          address,
          postal_code,
          phone,
          website,
          image_url,
          rating,
          review_count,
          transparency_score,
          opening_hours,
          description
        ),
        departments (
          id,
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get dynamic slot availability for a given doctor & date
   */
  getDoctorSlots: async (doctorId, date) => {
    // 1. Fetch doctor configured slots
    const { data: doctor, error: docErr } = await supabaseAdmin
      .from('doctors')
      .select('available_slots, opd_timings')
      .eq('id', doctorId)
      .single();

    if (docErr) throw docErr;

    const defaultSlots = [
      '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '04:30 PM', '05:30 PM', '06:00 PM', '06:30 PM'
    ];

    let slots = doctor?.available_slots;
    if (!Array.isArray(slots) || slots.length === 0) {
      slots = defaultSlots;
    }

    // 2. Query booked appointments for this date
    const targetDate = date || new Date().toISOString().split('T')[0];
    const { data: existingAppts } = await supabaseAdmin
      .from('doctor_appointments')
      .select('appointment_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', targetDate)
      .neq('status', 'cancelled');

    const bookedTimes = new Set((existingAppts || []).map(a => a.appointment_time));

    return slots.map(time => ({
      time,
      isAvailable: !bookedTimes.has(time)
    }));
  },

  /**
   * Toggle save/bookmark doctor
   */
  toggleSaveDoctor: async (userId, doctorId) => {
    // 1. Resolve or create patient profile
    let { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.id) {
      const { data: newProfile, error: pErr } = await supabaseAdmin
        .from('patient_profiles')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (pErr) throw pErr;
      profile = newProfile;
    }

    // 2. Check if already saved
    const { data: existing } = await supabaseAdmin
      .from('saved_doctors')
      .select('id')
      .eq('patient_id', profile.id)
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('saved_doctors')
        .delete()
        .eq('id', existing.id);
      return { saved: false };
    } else {
      await supabaseAdmin
        .from('saved_doctors')
        .insert({
          patient_id: profile.id,
          doctor_id: doctorId
        });
      return { saved: true };
    }
  },

  /**
   * List saved doctors for authenticated patient
   */
  getSavedDoctors: async (userId) => {
    const { data: profile } = await supabaseAdmin
      .from('patient_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile?.id) return [];

    const { data, error } = await supabaseAdmin
      .from('saved_doctors')
      .select(`
        id,
        created_at,
        doctors (
          id,
          name,
          specialization,
          qualification,
          experience_years,
          consultation_fee,
          rating,
          review_count,
          image_url,
          hospitals (
            id,
            name,
            city
          )
        )
      `)
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

module.exports = doctorService;
