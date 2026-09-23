import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import Admin from '../models/Admin.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const token = authHeader.substring(7);

    // Check if JWT_SECRET is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key-change-in-production') {
      console.error('⚠️ JWT_SECRET not properly configured!');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret || 'your-secret-key');

    // Get user from database
    let user = await User.findById(decoded.id);

    // If not found in User collection, check Staff collection (for Employee App)
    if (!user) {
      const staff = await Staff.findById(decoded.id);
      if (staff) {
        user = staff;
      }
    }

    // If still not found, check Admin collection (for CRM)
    if (!user) {
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        user = admin;
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check active status (handle both User.isActive and Staff.status)
    if (user.isActive === false || (user.status && user.status === 'Inactive')) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Enhanced error logging
    console.error('Authentication error:', {
      name: error.name,
      message: error.message,
      url: req.url,
      method: req.method,
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Staff Authentication Middleware
 */
export const authenticateStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const staff = await Staff.findById(decoded.id);

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Staff not found' });
    }

    // Check if staff is active (if status field exists)
    if (staff.status && staff.status === 'Inactive') {
      return res.status(401).json({ success: false, message: 'Staff account is inactive' });
    }

    req.user = staff; // Attach to req.user for consistency
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


