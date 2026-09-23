import jwt from 'jsonwebtoken';

/**
 * Generate JWT Access Token
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d', // Default to 7 days if env var invalid
    }
  );
};

/**
 * Generate Admin JWT Access Token (30 days expiry)
 */
export const generateAdminToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_ADMIN_EXPIRE || '30d', // 30 days for admin
    }
  );
};

/**
 * Generate Admin JWT Refresh Token (90 days expiry)
 */
export const generateAdminRefreshToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_ADMIN_REFRESH_EXPIRE || '90d', // 90 days for admin refresh token
    }
  );
};

/**
 * Generate JWT Refresh Token (for regular users)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d', // Increased to 30 days
    }
  );
};


