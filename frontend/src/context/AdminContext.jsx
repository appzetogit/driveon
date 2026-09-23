import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adminService } from '../services/admin.service';
import api from '../services/api';
import { isMobileApp } from '../services/firebase';

/**
 * Admin Context
 * Manages admin authentication state with backend integration
 * Stores token in localStorage for persistence
 */

const AdminContext = createContext(null);

/**
 * Admin Context Provider
 * Provides admin authentication state and methods to child components
 */
export const AdminProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading to check existing token
  const [error, setError] = useState(null);

  // Check for existing admin token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const refreshToken = localStorage.getItem('adminRefreshToken');

        if (token) {
          try {
            // Verify token by fetching admin profile
            const response = await adminService.getProfile();
            if (response.success && response.data?.admin) {
              setAdminUser(response.data.admin);
              setIsAuthenticated(true);
              return; // Success, exit early
            }
          } catch (profileError) {
            // If profile fetch fails, try to refresh token
            console.log('Profile fetch failed, attempting token refresh...');

            if (refreshToken) {
              try {
                // Try to refresh admin token
                const refreshResponse = await adminService.refreshToken(refreshToken);
                if (refreshResponse.success && refreshResponse.data) {
                  const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;

                  // Store new tokens
                  localStorage.setItem('adminToken', newToken);
                  if (newRefreshToken) {
                    localStorage.setItem('adminRefreshToken', newRefreshToken);
                  }

                  // Retry profile fetch with new token
                  const retryResponse = await adminService.getProfile();
                  if (retryResponse.success && retryResponse.data?.admin) {
                    setAdminUser(retryResponse.data.admin);
                    setIsAuthenticated(true);
                    console.log('Admin session restored after token refresh');
                    return; // Success after refresh
                  }
                }
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Only clear tokens if refresh token is expired
                if (refreshError.response?.status === 401) {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminRefreshToken');
                }
              }
            }
          }

          // If we reach here, token verification failed
          // Don't clear tokens immediately - might be a network issue
          console.warn('Admin token verification failed, but keeping token for retry');
          setAdminUser(null);
          setIsAuthenticated(false);
        } else {
          // No token found
          setAdminUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        // Don't clear tokens on unexpected errors - might be network issue
        setAdminUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Admin login function - connects to backend
   */
  const login = useCallback(async (email, password, fcmToken = null) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Call backend API
      const response = await adminService.login({ email, password, fcmToken, platform: isMobileApp() ? 'mobile' : 'web' });

      if (response.success && response.data) {
        const { token, refreshToken, admin } = response.data;

        // Clear any user tokens to avoid conflicts
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');

        // Store admin tokens
        localStorage.setItem('adminToken', token);
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }

        console.log('Admin login successful. Token stored. Admin ID:', admin.id);

        // Update state
        setAdminUser(admin);
        setIsAuthenticated(true);
        setError(null);

        return { success: true, user: admin };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      // Extract error message from response
      let errorMessage = 'Login failed. Please check your credentials.';

      console.log('Admin login catch block:', {
        hasResponse: !!err.response,
        responseData: err.response?.data,
        responseMessage: err.response?.data?.message,
        errorMessage: err.message,
      });

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        // Filter out misleading "No token provided" error for login
        if (errorMessage.includes('No token provided') && err.config?.url?.includes('/admin/login')) {
          // This is a login route - "No token provided" error is misleading
          // It likely means invalid credentials or backend route issue
          errorMessage = 'Invalid email or password. Please check your credentials.';
        }
      } else if (err.message) {
        // Filter out confusing messages
        if (!err.message.includes('No token provided') &&
          !err.message.includes('authorization denied') &&
          !err.message.includes('Request failed with status code')) {
          errorMessage = err.message;
        } else if (err.message.includes('No token provided') && err.config?.url?.includes('/admin/login')) {
          // For login, show a better error message
          errorMessage = 'Invalid email or password. Please check your credentials.';
        }
      }

      console.log('Final error message to show:', errorMessage);

      setError(errorMessage);
      setIsAuthenticated(false);
      setAdminUser(null);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Admin signup function - connects to backend
   */
  const signup = useCallback(async (name, email, password, confirmPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      // Frontend validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Call backend API
      const response = await adminService.signup({ name, email, password });

      if (response.success && response.data) {
        const { token, refreshToken, admin } = response.data;

        // Store tokens
        localStorage.setItem('adminToken', token);
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }

        // Update state
        setAdminUser(admin);
        setIsAuthenticated(true);
        setError(null);

        return { success: true, user: admin };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (err) {
      // Extract error message from various possible formats
      let errorMessage = 'Signup failed. Please try again.';

      // Check for backend error response
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        // Filter out confusing error messages from interceptors
        if (err.message.includes('No token provided') && err.config?.url?.includes('/admin/signup')) {
          // This is a signup route - the "No token provided" error is misleading
          // Check if there's a real backend error
          if (err.response?.status === 401) {
            errorMessage = 'Signup failed. Please check your information and try again.';
          } else {
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }

      console.error('Admin signup error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });

      setError(errorMessage);
      setIsAuthenticated(false);
      setAdminUser(null);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh admin profile - fetches latest admin data
   */
  const refreshProfile = useCallback(async () => {
    try {
      const response = await adminService.getProfile();
      if (response.success && response.data?.admin) {
        setAdminUser(response.data.admin);
        setIsAuthenticated(true);
        return response.data.admin;
      }
    } catch (error) {
      console.error('Error refreshing admin profile:', error);
      throw error;
    }
  }, []);

  /**
   * Logout function - clears admin state and calls backend
   */
  const logout = useCallback(async () => {
    try {
      // Call backend logout (optional, for token blacklisting)
      try {
        await adminService.logout();
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
      }

      // Clear tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');

      // Clear state
      setAdminUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      // Even if logout fails, clear local state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      setAdminUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, []);

  const value = {
    adminUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshProfile,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

/**
 * Custom hook to use Admin Context
 * Throws error if used outside AdminProvider
 */
export const useAdminAuth = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminProvider');
  }
  return context;
};

export default AdminContext;

