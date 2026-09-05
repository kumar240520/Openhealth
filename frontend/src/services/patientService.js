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

export const patientService = {
  /**
   * Fetch complete patient profile & health identity
   */
  getProfile: async () => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/profile`, {
      headers: { ...authHeaders }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch patient profile.');
    }

    return json.data;
  },

  /**
   * Update mutable patient profile fields (immutable fields are protected on backend)
   */
  updateProfile: async (payload) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to update profile.');
    }

    return json.data;
  },

  /**
   * Get patient settings & notification preferences
   */
  getSettings: async () => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/settings`, {
      headers: { ...authHeaders }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch settings.');
    }

    return json.data;
  },

  /**
   * Update patient settings & notification preferences
   */
  updateSettings: async (settings) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(settings)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to update settings.');
    }

    return json.data;
  },

  /**
   * Fetch all saved hospitals and saved doctors
   */
  getSavedItems: async () => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      return { hospitals: [], doctors: [], totalCount: 0 };
    }

    const res = await fetch(`${API_BASE}/patient/saved`, {
      headers: { ...authHeaders }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { hospitals: [], doctors: [], totalCount: 0 };
    }

    return json.data;
  },

  /**
   * Toggle save/bookmark hospital
   */
  toggleSaveHospital: async (hospitalId) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/save`, {
      method: 'POST',
      headers: { ...authHeaders }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to update hospital bookmark.');
    }

    return json.data;
  },

  /**
   * Toggle save/bookmark doctor
   */
  toggleSaveDoctor: async (doctorId) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/doctors/${doctorId}/save`, {
      method: 'POST',
      headers: { ...authHeaders }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to update doctor bookmark.');
    }

    return json.data;
  },

  /**
   * Submit KYC Document for Patient
   */
  submitKYC: async (payload) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit KYC documents.');
    }

    return json.data;
  },

  /**
   * Submit appeal for locked credential correction
   */
  submitAppeal: async (payload) => {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Authentication required.');
    }

    const res = await fetch(`${API_BASE}/patient/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit credential appeal.');
    }

    return json;
  }
};

export default patientService;
