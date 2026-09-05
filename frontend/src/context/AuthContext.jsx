import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  resolveUserLocation, 
  requestGpsLocation, 
  setManualCity, 
  getCachedLocation 
} from '../services/geolocationService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userLocation, setUserLocation] = useState(getCachedLocation);
  const [loading, setLoading] = useState(true);

  // Fetch application profile from public.profiles with optional patient_details
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, patient_details:patient_profiles(*)')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback to simple select if join has RLS or null
        const { data: simpleData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return simpleData;
      }
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
      if (userProfile) {
        const loc = await resolveUserLocation(userProfile);
        setUserLocation(loc);
      }
      return userProfile;
    }
    return null;
  };

  useEffect(() => {
    // 1. Get initial active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
        // Resolve location once on login / app start (GPS once, fallback to DB profile city)
        const loc = await resolveUserLocation(userProfile);
        setUserLocation(loc);
      } else {
        // Guest user fallback
        const loc = await resolveUserLocation(null);
        setUserLocation(loc);
      }
      setLoading(false);
    });

    // 2. Listen to auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);
          const loc = await resolveUserLocation(userProfile);
          setUserLocation(loc);
          // Clean URL hash if logged in via magic link access_token
          if (window.location.hash && window.location.hash.includes('access_token=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // 3. Listen for global location changes (e.g. city selector, GPS toggle)
    const handleLocationUpdate = (e) => {
      if (e.detail) {
        setUserLocation(e.detail);
      }
    };
    window.addEventListener('openhealth_location_changed', handleLocationUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('openhealth_location_changed', handleLocationUpdate);
    };
  }, []);

  // Sign up with Email & Password
  const signUpWithEmail = async ({ email, password, fullName, phone, role = 'patient', hospitalName, providerName }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
            hospital_name: hospitalName,
            provider_name: providerName,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in with Email & Password
  const signInWithEmail = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in with Google (OAuth ready)
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Send OTP to Email (Supports both Login & Signup)
  const sendOtp = async ({ email, shouldCreateUser = true, metadata = {} }) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser,
          data: metadata,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Verify 6-digit OTP Code
  const verifyOtp = async ({ email, token, type = 'email' }) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: type,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Check if an email is already registered in OpenHealth
  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        check_email: email.trim(),
      });
      if (error) {
        console.warn('check_email_exists RPC error:', error.message);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('checkEmailExists error:', err);
      return false;
    }
  };

  // Check if a phone number is already registered in OpenHealth
  const checkPhoneExists = async (phone) => {
    try {
      const { data, error } = await supabase.rpc('check_phone_exists', {
        check_phone: phone.trim(),
      });
      if (error) {
        console.warn('check_phone_exists RPC error:', error.message);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('checkPhoneExists error:', err);
      return false;
    }
  };

  // Look up account email by mobile number or email identifier
  const getEmailByIdentifier = async (identifier) => {
    try {
      const { data, error } = await supabase.rpc('get_email_by_identifier', {
        p_identifier: identifier.trim(),
      });
      if (error || !data) {
        return null;
      }
      return data;
    } catch (err) {
      console.error('getEmailByIdentifier error:', err);
      return null;
    }
  };

  // Check if organization / hospital name is already registered or similar
  const checkOrgNameConflict = async (type, name) => {
    try {
      const { data, error } = await supabase.rpc('check_org_name_conflict', {
        p_type: type,
        p_name: name.trim(),
      });
      if (error || !data) {
        return { exists: false, conflict_name: null };
      }
      return data;
    } catch (err) {
      console.error('checkOrgNameConflict error:', err);
      return { exists: false, conflict_name: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      localStorage.removeItem('openhealth_active_hospital_id');
      sessionStorage.removeItem('hospital_onboarding_dismissed');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const requestUserGps = async () => {
    try {
      const loc = await requestGpsLocation(profile);
      setUserLocation(loc);
      return loc;
    } catch (err) {
      console.warn('Manual GPS request failed:', err.message);
      throw err;
    }
  };

  const disableUserGps = () => {
    localStorage.removeItem('openhealth_user_location');
    const dbLoc = {
      lat: 22.7196,
      lng: 75.8577,
      source: 'database',
      cityName: profile?.city || 'Indore',
      label: profile?.city ? `${profile.city}, MP` : 'Indore, MP'
    };
    setUserLocation(dbLoc);
    return dbLoc;
  };

  const handleSetUserCity = (cityName) => {
    const loc = setManualCity(cityName);
    setUserLocation(loc);
    return loc;
  };

  const value = {
    user,
    session,
    profile,
    userLocation,
    requestUserGps,
    disableUserGps,
    setUserCity: handleSetUserCity,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    sendOtp,
    verifyOtp,
    checkEmailExists,
    checkPhoneExists,
    getEmailByIdentifier,
    checkOrgNameConflict,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
