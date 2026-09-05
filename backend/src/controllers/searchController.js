const { supabaseAdmin } = require('../config/supabase');

/**
 * Search Telemetry & History Controller
 */
const searchController = {
  // Log patient search query
  logSearch: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { query, location, searchType, filters } = req.body;

      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Search query string is required.' }
        });
      }

      // Fetch patient_profile id
      const { data: patientData, error: pErr } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (pErr || !patientData) {
        return res.status(404).json({
          success: false,
          error: { message: 'Patient profile not found. Please complete onboarding first.' }
        });
      }

      const searchFilters = {
        location: location ? location.trim() : 'Indore, MP',
        ...(filters || {})
      };

      // Record to search_history table
      const { data, error } = await supabaseAdmin
        .from('search_history')
        .insert({
          patient_id: patientData.id,
          query: query.trim(),
          search_type: searchType || 'general',
          filters: searchFilters,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Search query logged.',
        data: {
          id: data.id,
          query: data.query,
          location: searchFilters.location,
          created_at: data.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get recent searches for authenticated patient
  getRecentSearches: async (req, res, next) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 5;

      // Fetch patient_profile id
      const { data: patientData } = await supabaseAdmin
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!patientData) {
        return res.status(200).json({ success: true, data: [] });
      }

      const { data, error } = await supabaseAdmin
        .from('search_history')
        .select('id, query, search_type, filters, created_at')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formatted = (data || []).map(s => ({
        id: s.id,
        query: s.query,
        location: s.filters?.location || 'Indore, MP',
        created_at: s.created_at
      }));

      return res.status(200).json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = searchController;
