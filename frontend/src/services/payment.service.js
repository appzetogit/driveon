import api from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Payment Service
 * Handles all payment-related API calls (PhonePe integration)
 */

export const paymentService = {
  /**
   * Create payment request (PhonePe)
   * @param {Object} data - Payment data (bookingId, amount)
   * @returns {Promise}
   */
  createPayment: async (data) => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CREATE, data);
    return response.data;
  },

  /**
   * Check payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise}
   */
  checkPaymentStatus: async (transactionId) => {
    const response = await api.get(`${API_ENDPOINTS.PAYMENT.STATUS}/${transactionId}`);
    return response.data;
  },
};

export default paymentService;

