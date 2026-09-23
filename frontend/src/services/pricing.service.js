import api from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Pricing Service
 * Handles dynamic pricing calculations
 */

export const pricingService = {
  /**
   * Calculate dynamic price
   * @param {Object} data - Pricing data (carId, pickupDate, dropDate, etc.)
   * @returns {Promise}
   */
  calculatePrice: async (data) => {
    const response = await api.post(API_ENDPOINTS.PRICING.CALCULATE, data);
    return response.data;
  },
};

export default pricingService;

