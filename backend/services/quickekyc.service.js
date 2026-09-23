import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const QUICKEKYC_API_KEY = process.env.QUICKEKYC_API_KEY;
const BASE_URL = 'https://api.quickekyc.com/api/v1';

/**
 * QuickEKYC Service for Aadhaar, PAN, and DL verification
 */
class QuickEKYCService {
  /**
   * Aadhaar - Generate OTP
   * @param {string} aadhaarNo - 12 digit Aadhaar number
   */
  async generateAadhaarOTP(aadhaarNo) {
    if (!QUICKEKYC_API_KEY) {
      throw new Error('QuickEKYC API Key missing');
    }
    const response = await axios.post(`${BASE_URL}/aadhaar-v2/generate-otp`, {
      key: QUICKEKYC_API_KEY,
      id_number: aadhaarNo
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  /**
   * Aadhaar - Submit OTP
   * @param {string} requestId - Request ID from generateAadhaarOTP
   * @param {string} otp - 6 digit OTP
   */
  async submitAadhaarOTP(requestId, otp) {
    if (!QUICKEKYC_API_KEY) {
      throw new Error('QuickEKYC API Key missing');
    }
    const response = await axios.post(`${BASE_URL}/aadhaar-v2/submit-otp`, {
      key: QUICKEKYC_API_KEY,
      request_id: requestId,
      otp: otp
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  /**
   * PAN Verification
   * @param {string} panNo - PAN number
   */
  async verifyPAN(panNo) {
    if (!QUICKEKYC_API_KEY) {
      throw new Error('QuickEKYC API Key missing');
    }
    const response = await axios.post(`${BASE_URL}/pan/pan`, {
      key: QUICKEKYC_API_KEY,
      id_number: panNo
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  /**
   * Driving License Verification
   * @param {string} dlNo - DL number
   * @param {string} dob - Date of birth or Expiry Date
   */
  async verifyDL(dlNo, dob) {
    if (!QUICKEKYC_API_KEY) {
      throw new Error('QuickEKYC API Key missing');
    }
    const response = await axios.post(`${BASE_URL}/driving-license/driving-license`, {
      key: QUICKEKYC_API_KEY,
      id_number: dlNo,
      dob: dob
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }
}

export default new QuickEKYCService();
