import api from './api';

/**
 * Coupon Service
 * Handles coupon management API calls
 */
export const couponService = {
  /**
   * Get all coupons (Admin)
   * @param {Object} params - Query parameters (status, couponType, dateRange, search, page, limit)
   * @returns {Promise}
   */
  getAllCoupons: async (params = {}) => {
    try {
      const response = await api.get('/admin/coupons', { params });
      return response.data;
    } catch (error) {
      console.error('Get all coupons error:', error);
      throw error;
    }
  },

  /**
   * Get coupon by ID (Admin)
   * @param {string} id - Coupon ID
   * @returns {Promise}
   */
  getCouponById: async (id) => {
    try {
      const response = await api.get(`/admin/coupons/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get coupon by ID error:', error);
      throw error;
    }
  },

  /**
   * Create coupon (Admin)
   * @param {Object} data - Coupon data
   * @returns {Promise}
   */
  createCoupon: async (data) => {
    try {
      const response = await api.post('/admin/coupons', data);
      return response.data;
    } catch (error) {
      console.error('Create coupon error:', error);
      throw error;
    }
  },

  /**
   * Update coupon (Admin)
   * @param {string} id - Coupon ID
   * @param {Object} data - Updated coupon data
   * @returns {Promise}
   */
  updateCoupon: async (id, data) => {
    try {
      const response = await api.put(`/admin/coupons/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update coupon error:', error);
      throw error;
    }
  },

  /**
   * Delete coupon (Admin)
   * @param {string} id - Coupon ID
   * @returns {Promise}
   */
  deleteCoupon: async (id) => {
    try {
      const response = await api.delete(`/admin/coupons/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete coupon error:', error);
      throw error;
    }
  },

  /**
   * Toggle coupon status (Admin)
   * @param {string} id - Coupon ID
   * @returns {Promise}
   */
  toggleCouponStatus: async (id) => {
    try {
      const response = await api.patch(`/admin/coupons/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle coupon status error:', error);
      throw error;
    }
  },

  /**
   * Get coupon usage statistics (Admin)
   * @param {string} id - Coupon ID
   * @returns {Promise}
   */
  getCouponUsage: async (id) => {
    try {
      const response = await api.get(`/admin/coupons/${id}/usage`);
      return response.data;
    } catch (error) {
      console.error('Get coupon usage error:', error);
      throw error;
    }
  },

  /**
   * Validate coupon (User)
   * @param {Object} data - Validation data (code, amount, carId)
   * @returns {Promise}
   */
  validateCoupon: async (data) => {
    try {
      const response = await api.post('/coupons/validate', data);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404 && error.response?.status !== 400) {
        console.error('Validate coupon error:', error);
      }
      throw error;
    }
  },

  /**
   * Get car specific coupons (User)
   * @returns {Promise}
   */
  getCarSpecificCoupons: async () => {
    try {
      const response = await api.get('/common/coupons/car-specific');
      return response.data;
    } catch (error) {
      console.error('Get car specific coupons error:', error);
      throw error;
    }
  },
};

