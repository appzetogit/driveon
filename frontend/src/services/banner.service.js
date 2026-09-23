import api from './api';

/**
 * Banner Service
 * Handles all banner-related API calls for both public and admin interfaces.
 */
export const bannerService = {
  // ============================================
  // PUBLIC OPERATIONS
  // ============================================

  /**
   * Get all active banners for user display
   * @returns {Promise}
   */
  getActiveBanners: async () => {
    try {
      const response = await api.get('/common/banners/active');
      return response.data;
    } catch (error) {
      console.error('Get active banners error:', error);
      throw error;
    }
  },

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  /**
   * Get all banners (Admin only)
   * @returns {Promise}
   */
  getAllBanners: async () => {
    try {
      const response = await api.get('/admin/banners');
      return response.data;
    } catch (error) {
      console.error('Get all banners admin error:', error);
      throw error;
    }
  },

  /**
   * Create a new banner (Admin only)
   * @param {FormData} formData - Form data containing title, linkedCar, and image file
   * @returns {Promise}
   */
  createBanner: async (formData) => {
    try {
      const response = await api.post('/admin/banners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  },

  /**
   * Update an existing banner (Admin only)
   * @param {string} id - Banner ID
   * @param {FormData} formData - Form data containing updated fields and optional new image file
   * @returns {Promise}
   */
  updateBanner: async (id, formData) => {
    try {
      const response = await api.put(`/admin/banners/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Update banner error:', error);
      throw error;
    }
  },

  /**
   * Delete a banner (Admin only)
   * @param {string} id - Banner ID
   * @returns {Promise}
   */
  deleteBanner: async (id) => {
    try {
      const response = await api.delete(`/admin/banners/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete banner error:', error);
      throw error;
    }
  },

  /**
   * Toggle banner active status (Admin only)
   * @param {string} id - Banner ID
   * @returns {Promise}
   */
  toggleBannerStatus: async (id) => {
    try {
      const response = await api.patch(`/admin/banners/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle banner status error:', error);
      throw error;
    }
  },
};

export default bannerService;
