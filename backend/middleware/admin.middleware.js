import { verifyAdminAccessToken, extractTokenFromHeader } from '../utils/adminJwtUtils.js';
import Admin from '../models/Admin.js';

/**
 * Admin Authentication Middleware
 * Verifies JWT token and ensures user has admin role
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    // CRITICAL: Check for public routes FIRST - before ANY token extraction
    // Public routes: /signup, /login, /refresh-token
    // IMPORTANT: Router is mounted at '/api/admin', so routes are relative
    const publicRoutes = ['signup', 'login', 'refresh-token'];

    // Get all possible path variations
    const currentPath = req.path || '';
    const urlPath = req.url?.split('?')[0] || '';
    const originalPath = req.originalUrl?.split('?')[0] || '';
    const baseUrl = req.baseUrl || '';

    // Get relative path (remove /api/admin prefix)
    let relativePath = originalPath;
    if (originalPath.startsWith('/api/admin')) {
      relativePath = originalPath.replace('/api/admin', '');
    } else if (originalPath.startsWith('/api')) {
      relativePath = originalPath.replace('/api', '');
    }

    // Normalize paths (remove leading/trailing slashes, lowercase)
    const normalizePath = (path) => path.replace(/^\/+|\/+$/g, '').toLowerCase();

    const normalizedPaths = [
      normalizePath(currentPath),
      normalizePath(urlPath),
      normalizePath(originalPath),
      normalizePath(relativePath),
    ];

    // Log for debugging
    console.log('\n🔍 MIDDLEWARE CHECK:', {
      method: req.method,
      currentPath,
      urlPath,
      originalPath,
      relativePath,
      baseUrl,
      normalizedPaths,
    });

    // Check if this is a public route
    const isPublicRoute = publicRoutes.some(route => {
      const routeLower = route.toLowerCase();

      // Check if any normalized path matches the route
      const matches = normalizedPaths.some(normalized => {
        return normalized === routeLower ||
          normalized.endsWith(`/${routeLower}`) ||
          normalized.includes(`/${routeLower}/`) ||
          normalized.includes(`/${routeLower}`);
      });

      if (matches) {
        console.log(`\n✅✅✅ PUBLIC ROUTE DETECTED: "${route}"`);
        console.log('Matching path:', normalizedPaths.find(p => p.includes(routeLower)));
      }

      return matches;
    });

    if (isPublicRoute) {
      // This is a public route - skip authentication
      console.log('✅ Skipping authentication for public route\n');
      return next();
    }

    console.log('🔒 This is a PROTECTED route - checking authentication...\n');

    // Extract token from header (only for protected routes)
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAdminAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    // Get admin from database
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found. Please log in again.'
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Attach admin to request (both req.user and req.admin for compatibility)
    req.user = admin;
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

