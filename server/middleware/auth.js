const jwt = require('jsonwebtoken');

/**
 * verifyToken Middleware
 * Checks if a valid JWT token is present in the Authorization header
 * Format: "Bearer <token>"
 * Decodes the token and attaches user info to req.user for downstream use
 */
const verifyToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
    }

    // Get token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify token using JWT_SECRET from environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user info to request object for use in route handlers
    req.user = decoded; // Contains: { userId, username, role }

    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    // Token is invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * authorize Middleware Factory
 * Creates a middleware that checks if the user's role is in the allowed roles list
 * Usage: router.post('/students', verifyToken, authorize('admin'), createStudent)
 * 
 * @param {...string} allowedRoles - List of roles that can access this route
 * @returns {Function} Express middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user info exists (verifyToken should run before this)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next(); // User is authorized, proceed
  };
};

module.exports = { verifyToken, authorize };
