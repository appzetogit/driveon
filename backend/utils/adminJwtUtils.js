import jwt from 'jsonwebtoken';

/**
 * JWT Token Configuration for Admin
 * Access Token: 24 hours
 * Refresh Token: 7 days
 */
const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '24h', // 24 hours
  REFRESH_TOKEN_EXPIRES_IN: '7d', // 7 days
  ALGORITHM: 'HS256'
};

/**
 * Generate Admin Access Token (24h expiry)
 * @param {String} adminId - Admin ID
 * @returns {String} JWT access token
 */
export const generateAdminAccessToken = (adminId) => {
  const payload = {
    id: adminId,
    type: 'access'
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: JWT_CONFIG.ALGORITHM
    }
  );
};

/**
 * Generate Admin Refresh Token (7 days expiry)
 * @param {String} adminId - Admin ID
 * @returns {String} JWT refresh token
 */
export const generateAdminRefreshToken = (adminId) => {
  const payload = {
    id: adminId,
    type: 'refresh'
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      algorithm: JWT_CONFIG.ALGORITHM
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {String} adminId - Admin ID
 * @returns {Object} Object containing both tokens and expiry info
 */
export const generateAdminTokenPair = (adminId) => {
  const accessToken = generateAdminAccessToken(adminId);
  const refreshToken = generateAdminRefreshToken(adminId);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN
  };
};

/**
 * Verify Admin Access Token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAdminAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        algorithms: [JWT_CONFIG.ALGORITHM]
      }
    );
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Access token verification failed: ${error.message}`);
  }
};

/**
 * Verify Admin Refresh Token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
export const verifyAdminRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      {
        algorithms: [JWT_CONFIG.ALGORITHM]
      }
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

export { JWT_CONFIG };

