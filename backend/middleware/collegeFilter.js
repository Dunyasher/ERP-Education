/**
 * Middleware to automatically filter data by college
 * This ensures data isolation between colleges
 */

/**
 * Add college filter to request for automatic query filtering
 * This should be used after authenticate middleware
 */
const addCollegeFilter = (req, res, next) => {
  if (req.user && req.user.collegeId) {
    req.collegeId = req.user.collegeId;
  } else if (req.user && req.user.role === 'super_admin') {
    // Super admin can access all colleges
    // collegeId can be passed as query param or body param
    req.collegeId = req.query.collegeId || req.body.collegeId || null;
  } else if (req.user && (req.user.role === 'admin' || req.user.role === 'accountant')) {
    // Allow admin/accountant without collegeId for backward compatibility
    // They can access data without collegeId (legacy data)
    req.collegeId = null;
  } else {
    return res.status(403).json({ 
      message: 'College access not available. Please contact administrator.' 
    });
  }
  next();
};

/**
 * Middleware to ensure collegeId is set in request body for create operations
 */
const requireCollegeId = (req, res, next) => {
  if (req.user && req.user.collegeId) {
    // Automatically set collegeId from user's college
    if (req.body && !req.body.collegeId) {
      req.body.collegeId = req.user.collegeId;
    }
  } else if (req.user && req.user.role === 'super_admin') {
    // Super admin must explicitly provide collegeId
    if (!req.body.collegeId && !req.query.collegeId) {
      return res.status(400).json({ 
        message: 'collegeId is required for super admin operations' 
      });
    }
    req.body.collegeId = req.body.collegeId || req.query.collegeId;
  }
  next();
};

/**
 * Helper function to build query with college filter
 */
const buildCollegeQuery = (req, baseQuery = {}) => {
  if (req.collegeId) {
    return { ...baseQuery, collegeId: req.collegeId };
  }
  // If no collegeId, return base query without college filter (for backward compatibility)
  return baseQuery;
};

module.exports = {
  addCollegeFilter,
  requireCollegeId,
  buildCollegeQuery
};

