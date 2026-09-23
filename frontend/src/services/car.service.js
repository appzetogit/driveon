import api from './api';

/**
 * Car Service
 * Handles all car-related API calls
 */

export const carService = {
  /**
   * Get cars list with filters
   * @param {Object} params - Query parameters (filters, pagination, sort)
   * @returns {Promise}
   */
  getCars: async (params = {}) => {
    try {
      const response = await api.get('/cars', { params });
      return response.data;
    } catch (error) {
      console.error('Get cars error:', error);
      throw error;
    }
  },

  /**
   * Get car details by ID
   * @param {string} id - Car ID
   * @returns {Promise}
   */
  getCarDetails: async (id) => {
    try {
      const response = await api.get(`/cars/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Get car details error:', error);
      }
      throw error;
    }
  },

  /**
   * Get top brands
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise}
   */
  getTopBrands: async (params = { limit: 10 }) => {
    try {
      const response = await api.get('/cars/brands/top', { params });
      return response.data;
    } catch (error) {
      console.error('Get top brands error:', error);
      throw error;
    }
  },

  /**
   * Get top car types
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise}
   */
  getTopCarTypes: async (params = { limit: 10 }) => {
    try {
      const response = await api.get('/cars/types/top', { params });
      return response.data;
    } catch (error) {
      console.error('Get top car types error:', error);
      throw error;
    }
  },

  /**
   * Get nearby cars
   * @param {Object} params - Query parameters (city, limit, latitude, longitude)
   * @returns {Promise}
   */
  getNearbyCars: async (params = {}) => {
    try {
      const response = await api.get('/cars/nearby', { params });
      return response.data;
    } catch (error) {
      console.error('Get nearby cars error:', error);
      throw error;
    }
  },
};

export default carService;

