const { supabaseAdmin } = require('../config/supabase');

/**
 * Supabase JWT Authentication Middleware
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication token is required. Please log in.',
          code: 'AUTH_TOKEN_MISSING'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid, expired, or revoked authentication session.',
          code: 'AUTH_SESSION_INVALID'
        }
      });
    }

    // Fetch user profile for RBAC role verification
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, is_active, onboarding_completed')
      .eq('id', authData.user.id)
      .single();

    req.user = {
      ...authData.user,
      profile: profileData || null,
      role: profileData?.role || authData.user.user_metadata?.role || 'patient'
    };
    req.userId = authData.user.id;
    req.userRole = req.user.role;

    next();
  } catch (error) {
    console.error('Auth middleware exception:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal error validating authentication credentials.',
        code: 'AUTH_VERIFICATION_ERROR'
      }
    });
  }
};

/**
 * Optional Authentication Middleware
 * Decodes user token if provided, but allows unauthenticated emergency flow to proceed.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: authData } = await supabaseAdmin.auth.getUser(token);

    if (authData?.user) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', authData.user.id)
        .maybeSingle();

      req.user = {
        ...authData.user,
        profile: profileData || null,
        role: profileData?.role || 'patient'
      };
      req.userId = authData.user.id;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (err) {
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth
};
