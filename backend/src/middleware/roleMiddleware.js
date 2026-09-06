/**
 * RBAC Role Authorization Middleware
 * @param {string|string[]} allowedRoles
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User authentication required before evaluating permissions.',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    // Platform admin always has access
    if (req.userRole === 'platform_admin' || roles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        message: `Forbidden: This resource requires one of [${roles.join(', ')}] role privileges. Your role: '${req.userRole}'.`,
        code: 'FORBIDDEN_ROLE_ACCESS'
      }
    });
  };
};

module.exports = {
  requireRole
};
