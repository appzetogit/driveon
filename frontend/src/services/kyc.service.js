import api from './api';

/**
 * KYC Service
 * Handles all KYC-related API calls (QuickEKYC integration)
 */

export const kycService = {
  /**
   * Aadhaar - Generate OTP
   * @param {string} aadhaarNo - 12 digit Aadhaar number
   */
  generateAadhaarOTP: async (aadhaarNo) => {
    const response = await api.post('/kyc/aadhaar/generate-otp', { aadhaarNo });
    return response.data;
  },

  /**
   * Aadhaar - Verify OTP
   * @param {string} requestId - Request ID from generateAadhaarOTP
   * @param {string} otp - 6 digit OTP
   */
  verifyAadhaarOTP: async (requestId, otp) => {
    const response = await api.post('/kyc/aadhaar/verify-otp', { requestId, otp });
    return response.data;
  },

  /**
   * PAN Verification
   * @param {string} panNo - PAN number
   */
  verifyPAN: async (panNo) => {
    const response = await api.post('/kyc/pan/verify', { panNo });
    return response.data;
  },

  /**
   * Driving License Verification
   * @param {string} dlNo - DL number
   * @param {string} dob - Date of birth (YYYY-MM-DD)
   */
  verifyDL: async (dlNo, dob) => {
    const response = await api.post('/kyc/dl/verify', { dlNo, dob });
    return response.data;
  },

  /**
   * Get KYC status
   * @returns {Promise}
   */
  getKYCStatus: async () => {
    // This calls the endpoint in user.controller.js which should be updated or we use a new one
    const response = await api.get('/user/kyc-status');
    return response.data;
  },
};

export default kycService;
