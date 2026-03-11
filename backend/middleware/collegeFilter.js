/**
 * Middleware to automatically filter data by college
 * This ensures data isolation between colleges
 */

/**
 * Normalize collegeId to ObjectId/string (handles populated refs)
 */
const normalizeCollegeId = (collegeId) => {
  if (!collegeId) return null;
  if (typeof collegeId === 'object' && collegeId._id) return collegeId._id;
  return collegeId;
};

/**
 * Add college filter to request for automatic query filtering
 * This should be used after authenticate middleware
 */
const addCollegeFilter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const role = (req.user.role || '').toLowerCase();

  if (role === 'super_admin') {
    req.collegeId = normalizeCollegeId(req.query.collegeId || req.body.collegeId) || null;
  } else if (role === 'admin' || role === 'accountant' || role === 'teacher') {
    req.collegeId = req.user.collegeId ? normalizeCollegeId(req.user.collegeId) : null;
  } else if (req.user.collegeId) {
    req.collegeId = normalizeCollegeId(req.user.collegeId);
  } else {
    return res.status(403).json({ 
      message: 'Access denied. College access not available. Please contact administrator.' 
    });
  }
  next();
};

/**
 * Middleware to ensure collegeId is set in request body for create operations
 */
const requireCollegeId = (req, res, next) => {
  if (req.user && req.user.collegeId) {
    if (req.body && !req.body.collegeId) {
      req.body.collegeId = normalizeCollegeId(req.user.collegeId);
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

