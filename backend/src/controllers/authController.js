const { supabaseAdmin } = require('../config/supabase');

/**
 * Auth & Identifier Controller
 */
const authController = {
  // Check if an email is already registered in profiles or auth
  checkEmailAvailability: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: { message: 'A valid email address is required.' }
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return res.status(200).json({
        success: true,
        data: {
          email: cleanEmail,
          exists: Boolean(data)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Check if a mobile phone number is already registered
  checkPhoneAvailability: async (req, res, next) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: { message: 'A phone number is required.' }
        });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return res.status(200).json({
        success: true,
        data: {
          phone: cleanPhone,
          exists: Boolean(data)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Check hospital or insurance provider name similarity conflict
  checkOrgSimilarity: async (req, res, next) => {
    try {
      const { accountType, orgName } = req.body;
      if (!accountType || !orgName) {
        return res.status(400).json({
          success: false,
          error: { message: 'Both accountType and orgName are required.' }
        });
      }

      const cleanName = orgName.trim();
      let exists = false;

      if (accountType === 'hospital') {
        const { data, error } = await supabaseAdmin
          .from('hospitals')
          .select('id, name')
          .ilike('name', `%${cleanName}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          exists = true;
        }
      } else if (accountType === 'insurance_provider') {
        const { data, error } = await supabaseAdmin
          .from('insurance_providers')
          .select('id, name')
          .ilike('name', `%${cleanName}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          exists = true;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          orgName: cleanName,
          exists
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Resolve email from phone identifier for login
  resolveIdentifier: async (req, res, next) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: { message: 'Identifier (email or phone) is required.' }
        });
      }

      const raw = identifier.trim();
      if (raw.includes('@')) {
        return res.status(200).json({
          success: true,
          data: { resolvedEmail: raw.toLowerCase() }
        });
      }

      const cleanPhone = raw.replace(/\D/g, '').slice(-10);
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return res.status(200).json({
        success: true,
        data: {
          resolvedEmail: data?.email || null
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
