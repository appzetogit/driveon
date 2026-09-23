import axios from 'axios';
import { store } from '../store/store';
import { logout, refreshTokenSuccess } from '../store/slices/authSlice';
import { API_BASE_URL } from '../config/api';

/**
 * Axios Instance Configuration
 * Base API configuration with interceptors
 */

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    // Check if this is an admin or crm route
    const isAdminRoute = config.url?.includes('/admin/') || config.url?.includes('/crm/');

    // Get appropriate token (admin or user)

    let token;

    // Check for specific route types
    const isStrictAdminRoute = config.url?.includes('/admin/');
    const isCrmRoute = config.url?.includes('/crm/');

    if (isStrictAdminRoute) {
      token = localStorage.getItem('adminToken');
    } else if (isCrmRoute) {
      // For CRM, try admin token first, then staff token, then general auth tokens
      // This allows both Admins and Staff to access CRM endpoints
      token = localStorage.getItem('adminToken') ||
        localStorage.getItem('staffToken') ||
        store.getState().auth.token ||
        localStorage.getItem('authToken');
    } else {
      const isEmployeeApp = window.location.pathname.startsWith('/employee');
      const isAdminContext = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/crm');

      if (isAdminContext) {
        token = localStorage.getItem('adminToken');
      } else if (isEmployeeApp) {
        token = store.getState().auth.token || localStorage.getItem('staffToken');
      } else {
        token = store.getState().auth.token || localStorage.getItem('authToken');
      }
    }

    // List of public routes that don't require authentication
    const publicRoutes = [
      '/auth/register',
      '/auth/send-login-otp',
      '/auth/verify-otp',
      '/auth/resend-otp',
      '/auth/login',
      '/auth/staff-login',
      '/auth/staff-forgot-password',
      '/auth/staff-reset-password',
      '/auth/refresh-token',
      '/admin/signup',
      '/admin/login',
      '/admin/refresh-token',
    ];

    // Check if this is a public route
    // Use exact URL matching to avoid false positives
    const requestUrl = config.url || '';
    const isPublicRoute = publicRoutes.some(route => {
      // Check if URL exactly matches or ends with the route
      return requestUrl === route ||
        requestUrl.endsWith(route) ||
        requestUrl.includes(route);
    });

    // CRITICAL: Never add Authorization header for public routes
    // This prevents middleware from being triggered incorrectly
    if (isPublicRoute) {
      // Explicitly remove Authorization header for public routes
      // Also remove it from common header locations
      delete config.headers.Authorization;
      delete config.headers.authorization;
      if (config.headers.common) {
        delete config.headers.common.Authorization;
      }

      if (isAdminRoute) {
        console.log('✅ Public admin route - NO token sent:', {
          url: config.url,
          hasAuthHeader: !!config.headers.Authorization,
          method: config.method,
        });
      }
    } else if (token) {
      // Only add token for protected routes
      config.headers.Authorization = `Bearer ${token}`;
      // Debug log for admin routes
      if (isAdminRoute && process.env.NODE_ENV === 'development') {
        console.log('Admin request with token:', {
          url: config.url,
          hasToken: !!token,
          tokenLength: token.length,
          tokenPreview: token.substring(0, 30) + '...',
        });
      }
    } else {
      // Only log warning for protected routes that don't have a token
      if (isAdminRoute) {
        console.error('❌ No admin token found for protected admin route:', config.url);
        console.error('Available tokens:', {
          adminToken: !!localStorage.getItem('adminToken'),
          staffToken: !!localStorage.getItem('staffToken'),
          authToken: !!localStorage.getItem('authToken'),
          reduxToken: !!store.getState().auth.token,
        });
      } else {
        console.warn('No authentication token found for request:', config.url);
      }
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    // But ensure Authorization header is still set
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      // Only add Authorization header for FormData if it's NOT a public route
      if (token && !isPublicRoute && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (!config.headers['Content-Type']) {
      // Only set Content-Type if not FormData and not already set
      config.headers['Content-Type'] = 'application/json';
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh, errors, and logging
 */
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    if (response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`API Request: ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If error occurs on logout, don't try to refresh, just let it fail so we can clear local state
      if (originalRequest.url?.includes('/logout')) {
        return Promise.reject(error);
      }

      // Check if this is an admin or crm route
      const isAdminRoute = originalRequest.url?.includes('/admin/') || originalRequest.url?.includes('/crm/');

      const publicRoutes = [
        '/auth/register',
        '/auth/send-login-otp',
        '/auth/verify-otp',
        '/auth/resend-otp',
        '/auth/login',
        '/auth/staff-login',
        '/auth/staff-forgot-password',
        '/auth/staff-reset-password',
        '/auth/refresh-token',
        '/admin/signup',
        '/admin/login',
        '/admin/refresh-token',
      ];

      const isPublicRoute = publicRoutes.some(route => originalRequest.url?.includes(route));

      // For public routes (login, signup), don't try to refresh - just reject the error
      // These routes can return 401 for invalid credentials, not token issues
      if (isPublicRoute) {
        // For public routes, preserve the original error but don't try to refresh token
        // The error might be a legitimate backend error (like validation failure)
        // Create a clean error object without token-related messages

        // Extract the actual backend error message
        let errorMessage = 'Request failed';

        // For login route, check if it's a credential error or route issue
        if (originalRequest.url?.includes('/admin/login')) {
          // For login, the backend should return proper error messages
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 401) {
            // 401 from login usually means invalid credentials
            // But if message is "No token provided", it means middleware was called (route issue)
            if (error.response?.data?.message?.includes('No token provided')) {
              errorMessage = 'Login route error. Please contact support.';
              console.error('⚠️ Login route reached middleware - this should not happen!');
            } else {
              errorMessage = 'Invalid email or password. Please check your credentials.';
            }
          } else {
            errorMessage = error.response?.data?.message || error.message || 'Login failed';
          }
        } else {
          // For other public routes
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message && !error.message.includes('No token provided')) {
            errorMessage = error.message;
          }
        }

        // Create a clean error object
        const cleanError = new Error(errorMessage);
        cleanError.response = error.response;
        cleanError.config = error.config;
        cleanError.status = error.response?.status;

        // Only log if it's not a normal login failure
        if (!originalRequest.url?.includes('/admin/login') ||
          (error.response?.data?.message && !error.response.data.message.includes('Invalid'))) {
          console.log('Public route error:', {
            url: originalRequest.url,
            message: errorMessage,
            status: error.response?.status,
            backendMessage: error.response?.data?.message,
          });
        }

        return Promise.reject(cleanError);
      }

      // Only try to refresh token for protected admin routes
      if (isAdminRoute) {
        // Try to refresh admin token
        const adminRefreshToken = localStorage.getItem('adminRefreshToken');

        if (adminRefreshToken) {
          try {
            const refreshResponse = await axios.post(`${API_BASE_URL}/admin/refresh-token`, {
              refreshToken: adminRefreshToken,
            });

            if (refreshResponse.data?.success && refreshResponse.data?.data) {
              const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

              // Store new tokens
              localStorage.setItem('adminToken', newToken);
              if (newRefreshToken) {
                localStorage.setItem('adminRefreshToken', newRefreshToken);
              }

              // Update authorization header and retry original request
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Admin token refresh failed:', refreshError);
            // Refresh failed, clear tokens
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');

            // Redirect to admin login
            if (!window.location.pathname.includes('/admin/login')) {
              window.location.href = '/admin/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // No refresh token or refresh failed
        // Only log for protected routes, not public routes
        if (!isPublicAdminRoute) {
          console.error('Admin authentication failed - No refresh token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');

          if (!window.location.pathname.includes('/admin/login')) {
            window.location.href = '/admin/login';
          }
        }

        return Promise.reject(error);
      }

      // For public admin routes (login, signup), just pass through the error
      // Don't log confusing messages - these routes can legitimately return 401 for invalid credentials

      // Log token status for debugging (user routes)
      const currentToken = store.getState().auth.token || localStorage.getItem('authToken');
      console.warn('401 Unauthorized - Token status:', {
        hasToken: !!currentToken,
        tokenLength: currentToken?.length || 0,
        errorMessage: error.response?.data?.message || 'Unknown error',
      });

      try {
        // Try to refresh token (only for user routes)
        const currentPath = window.location.pathname;
        const isEmployeeApp = currentPath.startsWith('/employee');

        // Select correct refresh token based on context
        const refreshToken = store.getState().auth.refreshToken ||
          (isEmployeeApp ? localStorage.getItem('staffRefreshToken') : localStorage.getItem('refreshToken'));

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          }, { _retry: true });

          // Handle different response formats - Standardize on nested data.data.token usually
          const token = response.data?.data?.token || response.data?.token;
          const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;

          if (token) {
            // Update Redux store with both tokens
            store.dispatch(refreshTokenSuccess({
              token,
              refreshToken: newRefreshToken
            }));

            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${token}`;

            // Retry original request
            return api(originalRequest);
          } else {
            console.error('Token refresh failed: No token in response', response.data);
            throw new Error('Token refresh failed');
          }
        } else {
          throw new Error('No valid refresh token found');
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        console.warn('Token refresh failed/expired, logging out user:', refreshError.message);
        store.dispatch(logout());

        // Don't redirect if auth is still initializing
        const authState = store.getState().auth;
        if (authState.isInitializing) {
          return Promise.reject(refreshError);
        }

        const currentPath = window.location.pathname;
        const userRole = localStorage.getItem('userRole'); // Check configured role

        // Check if we are in admin or crm section - should have been handled above, but double check
        if (currentPath.startsWith('/admin') || currentPath.startsWith('/crm')) {
          if (!currentPath.includes('/login')) {
            window.location.href = '/admin/login';
          }
          return Promise.reject(refreshError);
        }

        // Employee App Redirect
        if (currentPath.startsWith('/employee') || userRole === 'employee') {
          if (!currentPath.includes('/login') && !originalRequest.url?.includes('/logout')) {
            // Avoid infinite loop
            if (!window.location.pathname.endsWith('/employee/login')) {
              window.location.href = '/employee/login';
            }
          }
          return Promise.reject(refreshError);
        }

        // User App Redirect - Only redirect if NOT on a public page
        const publicRoutes = ['/', '/login', '/register', '/search', '/faq', '/about', '/contact', '/privacy-policy', '/terms'];
        const isPublicRoute = publicRoutes.some(r => currentPath === r) || currentPath.startsWith('/car-details/');

        if (!isPublicRoute && !currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          // Extra safety: only redirect if we are very sure the session is dead
          if (refreshError.response?.status === 401 || refreshError.message?.includes('No valid refresh token')) {
            console.log('🚪 Redirecting to login due to definitive session expiry');
            if (!window.location.pathname.startsWith('/login')) {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      // Handle specific error codes
      // Don't log expected errors (like user not found for login or coupon/offer validations)
      const isExpectedError = status === 400 && (
        data?.message?.toLowerCase().includes('user not found') ||
        data?.message?.toLowerCase().includes('signup first') ||
        originalRequest.url?.includes('/validate')
      );

      if (!isExpectedError) {
        switch (status) {
          case 403:
            console.error('Forbidden: You do not have permission to access this resource');
            break;
          case 404:
            if (!originalRequest.url?.includes('/validate') && !originalRequest.url?.includes('/cars/')) {
              console.error('Not Found: The requested resource was not found');
            }
            break;
          case 500:
            console.error('Server Error:', data?.message || 'Something went wrong on the server');
            if (data?.error) console.error('Error Details:', data.error);
            break;
          default:
            console.error(`API Error: ${status} - ${data?.message || 'Unknown error'}`);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED';

      if (isNetworkError) {
        // Provide helpful error message for network issues
        const errorMessage = error.code === 'ERR_CONNECTION_REFUSED'
          ? 'Cannot connect to server. Please check if the backend server is running.'
          : 'Network error. Please check your internet connection and try again.';

        // Create a more informative error object
        const networkError = new Error(errorMessage);
        networkError.code = error.code;
        networkError.isNetworkError = true;
        networkError.originalError = error;
        console.error('Network Error:', errorMessage);
        return Promise.reject(networkError);
      }

      console.error('Network Error: No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

