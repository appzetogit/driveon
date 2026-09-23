import api from './api';

/**
 * Review Service
 * Handles all review-related API calls
 * 
 * Note: Review API endpoints may not be fully implemented in backend yet
 * This service provides a structure for when reviews are added
 */

const reviewService = {
  /**
   * Get reviews for a specific car
   * @param {string} carId - Car ID
   * @param {Object} params - Query parameters (page, limit, sort)
   * @returns {Promise}
   */
  getCarReviews: async (carId, params = {}) => {
    try {
      const { page = 1, limit = 10, sort = 'newest' } = params;
      
      // Try to fetch reviews from API
      // If endpoint doesn't exist, return empty reviews
      try {
        const response = await api.get(`/reviews/car/${carId}`, {
          params: {
            page,
            limit,
            sort,
          },
        });
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist (404), return empty reviews structure
        if (error.response?.status === 404 || error.code === 'ERR_BAD_REQUEST') {
          console.log('Review API endpoint not found, returning empty reviews');
          return {
            success: true,
            data: {
              reviews: [],
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                totalPages: 0,
              },
              ratings: {
                averageCarRating: 0,
                averageTripExperienceRating: 0,
                averageOwnerRating: 0,
                ratingDistribution: {
                  5: 0,
                  4: 0,
                  3: 0,
                  2: 0,
                  1: 0,
                },
              },
            },
          };
        }
        // Re-throw other errors
        throw error;
      }
    } catch (error) {
      console.error('Get car reviews error:', error);
      // Return empty structure on error to prevent app crash
      return {
        success: false,
        data: {
          reviews: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
          ratings: {
            averageCarRating: 0,
            averageTripExperienceRating: 0,
            averageOwnerRating: 0,
            ratingDistribution: {
              5: 0,
              4: 0,
              3: 0,
              2: 0,
              1: 0,
            },
          },
        },
        error: error.message,
      };
    }
  },

  /**
   * Submit a review for a car
   * @param {string} bookingId - Booking ID
   * @param {Object} reviewData - Review data (ratings, comment)
   * @returns {Promise}
   */
  submitReview: async (bookingId, reviewData) => {
    try {
      const response = await api.post(`/reviews`, {
        bookingId,
        ...reviewData,
      });
      return response.data;
    } catch (error) {
      console.error('Submit review error:', error);
      throw error;
    }
  },

  /**
   * Get user's reviews
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getMyReviews: async (params = {}) => {
    try {
      const response = await api.get('/reviews/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get my reviews error:', error);
      throw error;
    }
  },
};

export default reviewService;

