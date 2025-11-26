// server/middleware/adminMiddleware.js
export const requireAdmin = (req, res, next) => {
  // req.user is set by authenticateToken middleware
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // userType was set in authMiddleware (AuthController -> middleware sets userType)
  // It may be 'admin' (lowercase)
  const userType = req.user.userType ?? req.user.user_type ?? req.user.userType;
  if (String(userType).toLowerCase() !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export default requireAdmin;
