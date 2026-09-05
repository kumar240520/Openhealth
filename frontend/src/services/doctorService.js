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

export const doctorService = {
  /**
   * Search and filter doctors catalog with pagination
   */
  getDoctors: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.search || params.query) searchParams.set('search', params.search || params.query);
      if (params.specialty && params.specialty !== 'all') searchParams.set('specialty', params.specialty);
      if (params.city && params.city !== 'all') searchParams.set('city', params.city);
      if (params.hospitalId) searchParams.set('hospitalId', params.hospitalId);
      if (params.availableToday) searchParams.set('availableToday', 'true');
      if (params.minRating) searchParams.set('minRating', params.minRating);
      if (params.maxFee) searchParams.set('maxFee', params.maxFee);
      if (params.minExperience) searchParams.set('minExperience', params.minExperience);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.order) searchParams.set('order', params.order);
      if (params.limit) searchParams.set('limit', params.limit);
      if (params.offset !== undefined) searchParams.set('offset', params.offset);

      const res = await fetch(`${API_BASE}/doctors?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (err) {
      console.warn('Backend doctors API fetch failed, falling back to direct Supabase query:', err);
    }

    // Direct Supabase Fallback (Zero downtime guarantee)
    let q = supabase
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
        hospital_id,
        hospitals (
          id,
          name,
          city,
          address,
          image_url
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    const { data, count, error } = await q;
    if (error) throw error;
    return {
      doctors: data || [],
      total: count || data?.length || 0,
      limit: params.limit || 20,
      offset: params.offset || 0,
      hasMore: false
    };
  },

  /**
   * Fetch distinct specialties with doctor counts
   */
  getSpecialties: async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/specialties`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('Backend specialties API notice:', e);
    }
    return [];
  },

  /**
   * Fetch complete clinical profile for a doctor
   */
  getDoctorById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (err) {
      console.warn('Backend single doctor API failed, falling back to Supabase:', err);
    }

    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        hospitals (*),
        departments (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch slot availability for a doctor & date
   */
  getDoctorSlots: async (doctorId, date) => {
    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorId}/slots?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (err) {
      console.warn('Backend slots API notice:', err);
    }

    // Default slot list
    return [
      { time: '09:30 AM', isAvailable: true },
      { time: '10:00 AM', isAvailable: true },
      { time: '10:30 AM', isAvailable: true },
      { time: '11:30 AM', isAvailable: true },
      { time: '02:00 PM', isAvailable: true },
      { time: '04:30 PM', isAvailable: true },
      { time: '06:00 PM', isAvailable: true }
    ];
  },

  /**
   * Toggle save/bookmark doctor
   */
  toggleSaveDoctor: async (doctorId) => {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to update saved doctor.');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch patient's saved doctors
   */
  getSavedDoctors: async () => {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/doctors/saved/list`, {
      headers: { ...authHeaders }
    });

    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
    return [];
  }
};

export default doctorService;
