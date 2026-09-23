// Mock mode - No backend API calls, works offline for frontend design
const MOCK_MODE = false; // Backend is ready - using actual API calls

/**
 * Auth Service
 * Mock mode: Simulates API calls without backend
 * Production mode: Makes actual API calls
 */

// Mock delay to simulate API call
const mockDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Register new user
   * @param {Object} data - Registration data (email, phone, referralCode)
   * @returns {Promise}
   */
  register: async (data) => {
    if (MOCK_MODE) {
      await mockDelay(800);
      // Store OTP in localStorage for mock verification
      const mockOTP = '123456'; // Fixed OTP for testing
      localStorage.setItem('mockOTP', mockOTP);
      localStorage.setItem('mockOTPEmail', data.email || '');
      localStorage.setItem('mockOTPPhone', data.phone || '');
      localStorage.setItem('mockOTPType', 'register');

      return {
        success: true,
        message: 'OTP sent successfully',
        otp: mockOTP, // Only in mock mode for testing
      };
    }

    // Production mode - actual API call
    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');

    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      referralCode: data.referralCode,
      fcmToken: data.fcmToken,
      platform: data.platform
    });
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials (email/phone, password)
   * @returns {Promise}
   */
  login: async (credentials) => {
    if (MOCK_MODE) {
      await mockDelay(800);
      return {
        token: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_token',
        user: { role: 'user' },
      };
    }

    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  /**
   * Send OTP for login
   * @param {Object} data - Login data (emailOrPhone)
   * @returns {Promise}
   */
  sendLoginOTP: async (data) => {
    if (MOCK_MODE) {
      await mockDelay(800);
      // Store OTP in localStorage for mock verification
      const mockOTP = '123456'; // Fixed OTP for testing
      localStorage.setItem('mockOTP', mockOTP);
      localStorage.setItem('mockOTPEmailOrPhone', data.emailOrPhone);
      localStorage.setItem('mockOTPType', 'login');

      return {
        success: true,
        message: 'OTP sent successfully',
        otp: mockOTP, // Only in mock mode for testing
      };
    }

    // Production mode - actual API call
    try {
      const api = (await import('./api')).default;
      const { API_ENDPOINTS } = await import('../constants');
      const response = await api.post(API_ENDPOINTS.AUTH.SEND_LOGIN_OTP, {
        emailOrPhone: data.emailOrPhone,
      });
      return response.data;
    } catch (error) {
      // Don't log expected errors (user not found) to console
      const isUserNotFound = error.response?.status === 400 && (
        error.response?.data?.message?.toLowerCase().includes('user not found') ||
        error.response?.data?.message?.toLowerCase().includes('signup first')
      );

      if (!isUserNotFound) {
        console.error('sendLoginOTP error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        // Log detailed error in development
        if (process.env.NODE_ENV === 'development' && error.response?.data?.error) {
          console.error('Server error details:', error.response.data.error);
          if (error.response.data.errorType) {
            console.error('Error type:', error.response.data.errorType);
          }
        }
      }
      throw error;
    }
  },

  /**
   * Verify OTP
   * @param {Object} data - OTP data (email/phone, otp)
   * @returns {Promise}
   */
  verifyOTP: async (data) => {
    if (MOCK_MODE) {
      await mockDelay(1000);
      const storedOTP = localStorage.getItem('mockOTP');
      const enteredOTP = data.otp;

      // Accept any 6-digit OTP or the stored mock OTP
      if (enteredOTP === storedOTP || enteredOTP === '123456' || enteredOTP.length === 6) {
        const mockToken = 'mock_token_' + Date.now();
        const mockRefreshToken = 'mock_refresh_token_' + Date.now();

        // Store mock auth in localStorage
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('refreshToken', mockRefreshToken);

        // Clear mock OTP
        localStorage.removeItem('mockOTP');

        return {
          token: mockToken,
          refreshToken: mockRefreshToken,
          user: {
            id: 'mock_user_' + Date.now(),
            email: data.email || localStorage.getItem('mockOTPEmail') || '',
            phone: data.phone || localStorage.getItem('mockOTPPhone') || '',
            role: 'user',
          },
        };
      } else {
        throw new Error('Invalid OTP. Please try again.');
      }
    }

    // Production mode - actual API call
    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');
    const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);

    // Return data in expected format
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise}
   */
  refreshToken: async (refreshToken) => {
    if (MOCK_MODE) {
      await mockDelay(500);
      return {
        token: 'mock_token_' + Date.now(),
      };
    }

    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');
    // Pass _retry: true to prevent interceptor recursion
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    }, { _retry: true });
    return response.data;
  },

  /**
   * Resend OTP
   * @param {Object} data - Resend OTP data (email, phone, purpose)
   * @returns {Promise}
   */
  resendOTP: async (data) => {
    if (MOCK_MODE) {
      await mockDelay(800);
      const mockOTP = '123456';
      localStorage.setItem('mockOTP', mockOTP);
      return {
        success: true,
        message: 'OTP sent successfully',
        otp: mockOTP,
      };
    }

    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');
    const response = await api.post(API_ENDPOINTS.AUTH.RESEND_OTP, data);
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    if (MOCK_MODE) {
      await mockDelay(300);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('mockOTP');
      return { success: true };
    }

    const api = (await import('./api')).default;
    const { API_ENDPOINTS } = await import('../constants');
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },
};

export default authService;

