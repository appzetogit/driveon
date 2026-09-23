/**
 * API Configuration
 * Centralized base URL configuration for backend API calls & WebSockets
 * Dynamic origin resolution ensures production works automatically on any domain/subdomain
 */

// --------------------
// 1️⃣ Get Base URL for API
// --------------------
const getApiBaseUrl = () => {
  // Browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Localhost / Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const localEnv = (import.meta.env.VITE_API_BASE_URL || '').trim();
      return (localEnv && (localEnv.includes('localhost') || localEnv.includes('127.0.0.1')))
        ? localEnv
        : 'http://localhost:5000/api';
    }

    // Production environment variable (if explicitly set and not pointing to localhost)
    const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
    if (envUrl && envUrl.includes('://') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`;
    }

    // Default production: always route to /api on the current origin (reverse proxied via Nginx)
    return `${window.location.origin}/api`;
  }

  // SSR / fallback
  return 'https://driveoncar.co.in/api';
};

// --------------------
// 2️⃣ Get Socket.IO URL
// --------------------
export const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Localhost / Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // In production, connect directly to the current website origin
    return window.location.origin;
  }

  return 'https://driveoncar.co.in';
};

// --------------------
// 3️⃣ Exports
// --------------------
export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
export const BACKEND_ORIGIN = (API_BASE_URL || '').replace(/\/api\/?$/, '');

// Log for debugging in production
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  console.log('📡 DriveOn API Initialized at:', API_BASE_URL);
  console.log('🚀 DriveOn Socket Initialized at:', SOCKET_URL);
  console.log('📁 DriveOn Backend Origin:', BACKEND_ORIGIN);
}

export default API_BASE_URL;

