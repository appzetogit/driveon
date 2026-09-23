import crypto from 'crypto';
import axios from 'axios';

/**
 * PhonePe Payment Service
 * Handles PhonePe payment gateway integration
 */
class PhonePeService {
  constructor() {
    this.merchantId = process.env.PHONEPE_MERCHANT_ID;
    this.saltKey = process.env.PHONEPE_SALT_KEY;
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    this.baseUrl = process.env.PHONEPE_BASE_URL || 'https://api.phonepe.com/apis/hermes';
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/phonepe/callback`;
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/payment/status`;
  }

  /**
   * Generate X-VERIFY header for PhonePe API
   * @param {string} payload - Base64 encoded payload
   * @returns {string} SHA256 hash
   */
  generateXVerify(payload) {
    const string = payload + `/pg/v1/pay` + this.saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    return `${sha256}###${this.saltIndex}`;
  }

  /**
   * Generate checksum for callback verification
   * @param {string} payload - Base64 encoded payload
   * @param {string} endpoint - API endpoint
   * @returns {string} SHA256 hash
   */
  generateChecksum(payload, endpoint) {
    const string = payload + endpoint + this.saltKey;
    return crypto.createHash('sha256').update(string).digest('hex');
  }

  /**
   * Create payment request
   * @param {Object} paymentData - Payment details
   * @param {string} paymentData.transactionId - Unique transaction ID
   * @param {number} paymentData.amount - Amount in paise (e.g., 10000 = ₹100)
   * @param {string} paymentData.userId - User ID
   * @param {string} paymentData.userPhone - User phone number
   * @param {string} paymentData.userEmail - User email
   * @param {string} paymentData.bookingId - Booking ID
   * @returns {Promise<Object>} Payment response with redirect URL
   */
  async createPayment(paymentData) {
    try {
      const {
        transactionId,
        amount,
        userId,
        userPhone,
        userEmail,
        bookingId,
      } = paymentData;

      // Validate required fields
      if (!transactionId || !amount || !userId) {
        throw new Error('Missing required payment data');
      }

      // PhonePe expects amount in paise (multiply by 100 if in rupees)
      const amountInPaise = amount * 100;

      // Create payload
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId: transactionId,
        merchantUserId: userId,
        amount: amountInPaise,
        redirectUrl: this.redirectUrl,
        redirectMode: 'REDIRECT',
        callbackUrl: this.callbackUrl,
        mobileNumber: userPhone || '',
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };

      // Base64 encode payload
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

      // Generate X-VERIFY header
      const xVerify = this.generateXVerify(base64Payload);

      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/pg/v1/pay`,
        {
          request: base64Payload,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'Accept': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
          transactionId: transactionId,
          phonePeTransactionId: response.data.data.transactionId,
        };
      } else {
        throw new Error(response.data?.message || 'Payment creation failed');
      }
    } catch (error) {
      console.error('PhonePe Payment Error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to create payment'
      );
    }
  }

  /**
   * Verify payment status
   * @param {string} transactionId - Merchant transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(transactionId) {
    try {
      const endpoint = `/pg/v1/status/${this.merchantId}/${transactionId}`;
      const xVerify = this.generateXVerify(endpoint);

      const response = await axios.get(
        `${this.baseUrl}${endpoint}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': this.merchantId,
            'Accept': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        const paymentData = response.data.data;
        return {
          success: true,
          transactionId: paymentData.merchantTransactionId,
          phonePeTransactionId: paymentData.transactionId,
          amount: paymentData.amount / 100, // Convert from paise to rupees
          status: paymentData.state === 'COMPLETED' ? 'success' :
            paymentData.state === 'FAILED' ? 'failed' : 'pending',
          paymentMethod: paymentData.paymentInstrument?.type || 'PAY_PAGE',
          responseCode: paymentData.responseCode,
          responseMessage: paymentData.responseMessage,
        };
      } else {
        throw new Error(response.data?.message || 'Payment status check failed');
      }
    } catch (error) {
      console.error('PhonePe Status Check Error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to check payment status'
      );
    }
  }

  /**
   * Verify callback signature
   * @param {string} base64Payload - Base64 encoded callback payload
   * @param {string} xVerify - X-VERIFY header from callback
   * @returns {boolean} True if signature is valid
   */
  verifyCallback(base64Payload, xVerify) {
    try {
      const endpoint = '/pg/v1/pay';
      const checksum = this.generateChecksum(base64Payload, endpoint);
      const expectedXVerify = `${checksum}###${this.saltIndex}`;

      return xVerify === expectedXVerify;
    } catch (error) {
      console.error('Callback verification error:', error);
      return false;
    }
  }

  /**
   * Generate unique transaction ID
   * @param {string} prefix - Prefix for transaction ID (e.g., 'TXN')
   * @returns {string} Unique transaction ID
   */
  generateTransactionId(prefix = 'TXN') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}

export default new PhonePeService();

