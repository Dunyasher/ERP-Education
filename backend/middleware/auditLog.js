const AuditLog = require('../models/AuditLog');

/** 8
 * Audit logging middleware
 * Logs all actions performed by users, especially teachers
 */
const logAction = async (req, action, description, targetType = null, targetId = null, changes = {}, requiresApproval = false) => {
  try {
    if (!req.user) {
      return; // Don't log if user is not authenticated
    }

    const auditLog = {
      action,
      performedBy: {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.profile?.firstName
          ? `${req.user.profile.firstName} ${req.user.profile.lastName || ''}`.trim()
          : req.user.email
      },
      targetType,
      targetId,
      description,
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      requiresApproval: requiresApproval && req.user.role === 'teacher', // Only teachers need approval
      status: 'success'
    };

    await AuditLog.create(auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - logging should not break the main functionality
  }
};

/**
 * Middleware to automatically log requests
 */
const auditMiddleware = (action, description, targetType = null, requiresApproval = false) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function (data) {
      // Log the action after response is sent
      if (res.statusCode < 400) { // Only log successful actions
        const targetId = req.params.id || req.body._id || data._id || data.id || null;
        const changes = {
          ...req.body,
          ...(req.method === 'PUT' || req.method === 'PATCH' ? { updatedFields: Object.keys(req.body) } : {})
        };

        logAction(req, action, description, targetType, targetId, changes, requiresApproval)
          .catch(err => console.error('Audit log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  logAction,
  auditMiddleware
};

