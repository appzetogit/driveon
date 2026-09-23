import api from './api';

/**
 * Offer Service
 * Handles promotional offers API calls
 */
export const offerService = {
  /**
   * Get all offers (Admin)
   * @param {Object} params - Query parameters (status, type, search)
   * @returns {Promise}
   */
  getAllOffers: async (params = {}) => {
    try {
      const response = await api.get('/admin/offers', { params });
      return response.data;
    } catch (error) {
      console.error('Get all offers error:', error);
      throw error;
    }
  },

  /**
   * Get offer by ID (Admin)
   * @param {string} id - Offer ID
   * @returns {Promise}
   */
  getOfferById: async (id) => {
    try {
      const response = await api.get(`/admin/offers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get offer by ID error:', error);
      throw error;
    }
  },

  /**
   * Create offer (Admin)
   * @param {Object} data - Offer data
   * @returns {Promise}
   */
  createOffer: async (data) => {
    try {
      const response = await api.post('/admin/offers', data);
      return response.data;
    } catch (error) {
      console.error('Create offer error:', error);
      throw error;
    }
  },

  /**
   * Update offer (Admin)
   * @param {string} id - Offer ID
   * @param {Object} data - Updated offer data
   * @returns {Promise}
   */
  updateOffer: async (id, data) => {
    try {
      const response = await api.put(`/admin/offers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update offer error:', error);
      throw error;
    }
  },

  /**
   * Delete offer (Admin)
   * @param {string} id - Offer ID
   * @returns {Promise}
   */
  deleteOffer: async (id) => {
    try {
      const response = await api.delete(`/admin/offers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete offer error:', error);
      throw error;
    }
  },

  /**
   * Toggle offer status (Admin)
   * @param {string} id - Offer ID
   * @returns {Promise}
   */
  toggleOfferStatus: async (id) => {
    try {
      const response = await api.patch(`/admin/offers/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle offer status error:', error);
      throw error;
    }
  },

  /**
   * Get active offers for user booking flow (User)
   * @returns {Promise}
   */
  getActiveOffers: async () => {
    try {
      const response = await api.get('/offers/active');
      return response.data;
    } catch (error) {
      console.error('Get active offers error:', error);
      throw error;
    }
  },

  /**
   * Validate offer code (User)
   * @param {Object} data - Validation data (code, amount)
   * @returns {Promise}
   */
  validateOffer: async (data) => {
    try {
      const response = await api.post('/offers/validate', data);
      return response.data;
    } catch (error) {
      console.error('Validate offer error:', error);
      throw error;
    }
  },
};
export default offerService;
