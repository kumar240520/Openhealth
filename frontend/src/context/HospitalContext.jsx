import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const HospitalContext = createContext(null);

export const DEFAULT_HOSPITAL_ID = '68fcde0a-0563-4853-a3fb-34bd47e7510e'; // Apollo Hospitals, Indore

export function HospitalProvider({ children }) {
  const { user, profile } = useAuth();

  const [activeHospital, setActiveHospital] = useState(null);
  const [activeHospitalId, setActiveHospitalId] = useState(() => {
    return localStorage.getItem('openhealth_active_hospital_id') || null;
  });
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Tenant Resolution: Bind strictly to the logged-in hospital user's assigned facility
  const loadHospitalTenant = useCallback(async () => {
    try {
      setLoading(true);

      const isHospitalUser = profile?.role === 'hospital_admin' || 
                             profile?.role === 'hospital_staff' || 
                             user?.user_metadata?.role === 'hospital_admin' ||
                             user?.user_metadata?.role === 'hospital_staff';

      // 1. If authenticated as a hospital admin/staff, resolve strictly from their membership
      if (user?.id && isHospitalUser) {
        let { data: membership, error: memErr } = await supabase
          .from('hospital_memberships')
          .select('*, hospital:hospitals(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membership?.hospital) {
          setActiveHospital(membership.hospital);
          setActiveHospitalId(membership.hospital.id);
          localStorage.setItem('openhealth_active_hospital_id', membership.hospital.id);
          setLoading(false);
          return;
        }

        // 2. If user has hospital_name in metadata but no membership yet, provision via secure RPC
        const hospitalNameFromMeta = user.user_metadata?.hospital_name;
        if (hospitalNameFromMeta && hospitalNameFromMeta.trim().length >= 2) {
          try {
            const { data: provHosp, error: provErr } = await supabase.rpc('provision_hospital_account', {
              p_hospital_name: hospitalNameFromMeta.trim(),
              p_city: profile?.city || 'Indore',
              p_phone: user.phone || user.user_metadata?.phone || null
            });

            if (provHosp && !provErr) {
              setActiveHospital(provHosp);
              setActiveHospitalId(provHosp.id);
              localStorage.setItem('openhealth_active_hospital_id', provHosp.id);
              setLoading(false);
              return;
            }
          } catch (rpcErr) {
            console.warn('Auto-provisioning facility failed:', rpcErr);
          }
        }

        // 3. Authenticated hospital user without a facility: NEVER fall back to Apollo!
        // Leave activeHospital null so the onboarding / facility setup modal opens.
        localStorage.removeItem('openhealth_active_hospital_id');
        setActiveHospital(null);
        setActiveHospitalId(null);
        setLoading(false);
        return;
      }

      // 4. Fallback ONLY for unauthenticated public demo / testing visitors
      if (!user) {
        const savedId = localStorage.getItem('openhealth_active_hospital_id');
        const targetId = savedId || DEFAULT_HOSPITAL_ID;
        const { data: hospData } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (hospData) {
          setActiveHospital(hospData);
          setActiveHospitalId(hospData.id);
        } else {
          setActiveHospital({
            id: DEFAULT_HOSPITAL_ID,
            name: 'Apollo Hospitals',
            city: 'Indore',
            state: 'Madhya Pradesh',
            emergency_available: true,
            transparency_score: 96,
            address: 'Sector D, Scheme No 74C, Vijay Nagar',
            phone: '+91-731-2445566'
          });
          setActiveHospitalId(DEFAULT_HOSPITAL_ID);
        }
      }
    } catch (err) {
      console.warn('Error resolving hospital tenant:', err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    loadHospitalTenant();
  }, [loadHospitalTenant, refreshIndex]);

  // Real-time update to hospitals table
  const updateHospital = async (updates) => {
    if (!activeHospitalId) return { error: 'No active hospital ID' };
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', activeHospitalId)
        .select()
        .single();

      if (!error && data) {
        setActiveHospital(data);
      }
      return { data, error };
    } catch (e) {
      console.error('Failed to update hospital:', e);
      return { error: e };
    }
  };

  // Toggle 24x7 Casualty Emergency Status directly in Supabase
  const toggleEmergency = async () => {
    if (!activeHospital) return;
    const newStatus = !activeHospital.emergency_available;
    
    // Optimistic UI update
    setActiveHospital(prev => ({ ...prev, emergency_available: newStatus }));

    try {
      await supabase
        .from('hospitals')
        .update({ 
          emergency_available: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeHospital.id);
    } catch (e) {
      console.warn('Failed to persist emergency status toggle:', e);
      // Revert on error
      setActiveHospital(prev => ({ ...prev, emergency_available: !newStatus }));
    }
  };

  const refreshHospital = () => setRefreshIndex(prev => prev + 1);

  const provisionHospital = async ({ name, city, phone, type }) => {
    try {
      const { data, error } = await supabase.rpc('provision_hospital_account', {
        p_hospital_name: name.trim(),
        p_city: city || 'Indore',
        p_phone: phone || null,
        p_type: type || 'Multi-Speciality Hospital'
      });
      if (error) throw error;
      if (data) {
        setActiveHospital(data);
        setActiveHospitalId(data.id);
        localStorage.setItem('openhealth_active_hospital_id', data.id);
      }
      return { data, error: null };
    } catch (e) {
      console.error('Failed to provision hospital:', e);
      return { data: null, error: e };
    }
  };

  const value = {
    activeHospital,
    activeHospitalId: activeHospital?.id || activeHospitalId,
    loading,
    toggleEmergency,
    updateHospital,
    provisionHospital,
    refreshHospital,
    reload: refreshHospital
  };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
}
