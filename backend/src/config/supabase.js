const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  throw new Error('FATAL: Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
}

// 1. Admin Supabase Client (Service Role for trusted server-side DB operations)
const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. Anonymous Client for public token verification
const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey || config.supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = {
  supabaseAdmin,
  supabaseAnon,
};
