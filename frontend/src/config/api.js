// /**
//  * API Configuration
//  * Centralized base URL configuration for backend API calls
//  */

// // Base URL for backend API
// // Priority: 1. Localhost (for development), 2. Valid Environment variable, 3. Production Fallback
// const getApiBaseUrl = () => {
//   // 1. Check for localhost (Development)
//   if (typeof window !== 'undefined') {
//     if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//       return 'http://localhost:5001/api';
//     }
//   }

//   // 2. Check environment variable
//   const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
//   if (envUrl && envUrl.includes('://')) {
//     try {
//       const url = new URL(envUrl);
//       const host = url.hostname.toLowerCase();
//       // Ignore broken/malformed env vars like "https"
//       if (host !== 'https' && host !== 'http' && host !== 'undefined' && host.length > 3) {
//         return envUrl;
//       }
//     } catch (e) {
//       // Logic handled by fallback below
//     }
//   }

//   // 3. PRODUCTION FALLBACK
//   // Point to Render directly since your domain's /api proxy is not working (405 error)
//   return 'https://driveon-19hg.onrender.com/api';
// };

// /**
//  * Get Socket.IO server URL from API base URL
//  */
// export const getSocketUrl = () => {
//   const apiUrl = getApiBaseUrl();

//   if (!apiUrl || !apiUrl.includes('://')) {
//     return typeof window !== 'undefined' ? window.location.origin : 'https://driveoncar.co.in';
//   }

//   // Remove /api and trailing slashes
//   let socketUrl = apiUrl.replace('/api', '').replace(/\/$/, '');

//   // Final Safety: If the result is still just "https://https", use window origin
//   try {
//     const url = new URL(socketUrl);
//     if (url.hostname.toLowerCase() === 'https' || url.hostname.toLowerCase() === 'http') {
//       throw new Error('Malformed URL');
//     }
//     return socketUrl;
//   } catch (e) {
//     return typeof window !== 'undefined' ? window.location.origin : 'https://driveoncar.co.in';
//   }
// };

// export const API_BASE_URL = getApiBaseUrl();
// export const SOCKET_URL = getSocketUrl();

// // Log for debugging in production (visible in console)
// if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
//   console.log('📡 DriveOn API Initialized at:', API_BASE_URL);
//   console.log('🚀 DriveOn Socket Initialized at:', SOCKET_URL);
// }

// export default API_BASE_URL;

/**
 * API Configuration
 * Centralized base URL configuration for backend API calls
 * ✅ Updated for safe Socket.IO URL
 */

// --------------------
// 1️⃣ Get Base URL for API
// Priority: 
// 1. Localhost (Dev)
// 2. Environment Variable
// 3. Production Fallback
// --------------------
const getApiBaseUrl = () => {
  // 1️⃣ Development localhost check (Absolute priority)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }

  // 2️⃣ Environment Variable
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envUrl && envUrl.includes('://')) {
    try {
      const url = new URL(envUrl);
      const host = url.hostname.toLowerCase();

      // Ignore broken/malformed env vars
      if (host !== 'https' && host !== 'http' && host !== 'undefined' && host.length > 3) {
        return envUrl;
      }
    } catch (e) {
      // malformed
    }
  }

  // 3️⃣ Production fallback
  return 'https://driveon-19hg.onrender.com/api';
};

// --------------------
// 2️⃣ Get Socket.IO URL
// Safe sanitization to prevent wss://https errors
// --------------------
export const getSocketUrl = () => {
  const apiUrl = getApiBaseUrl();

  // If localhost, return localhost socket
  if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    return 'http://localhost:5000';
  }

  // SPECIAL FIX: If apiUrl points to the frontend proxy (www.driveoncar.co.in),
  // force the socket to connect directly to the backend subdomain (api.driveoncar.co.in).
  // Vercel does not proxy WebSockets efficiently, so we must connect directly.
  if (apiUrl.includes('driveoncar.co.in')) {
    return 'https://api.driveoncar.co.in';
  }

  // If apiUrl invalid, fallback to backend subdomain
  if (!apiUrl || !apiUrl.includes('://')) {
    return 'https://api.driveoncar.co.in';
  }

  // Remove /api at the end and trailing slashes
  let socketUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // Remove duplicate protocols like https://https://
  socketUrl = socketUrl.replace(/^(https?:\/\/)+/, '$1');

  // Validate final URL
  try {
    const url = new URL(socketUrl);

    // Prevent malformed hostnames like 'https' or 'http'
    if (!url.hostname || ['https', 'http', 'undefined'].includes(url.hostname.toLowerCase())) {
      throw new Error('Malformed hostname');
    }

    return url.origin;
  } catch (e) {
    // Fallback safe
    return 'https://api.driveoncar.co.in';
  }
};

// --------------------
// 3️⃣ Exports
// --------------------
export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();

// Log for debugging in production (optional)
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  console.log('📡 DriveOn API Initialized at:', API_BASE_URL);
  console.log('🚀 DriveOn Socket Initialized at:', SOCKET_URL);
}

export default API_BASE_URL;

