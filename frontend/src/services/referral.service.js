import api from './api';

/**
 * Referral Service
 * Handles all referral-related API calls
 */

export const referralService = {
  /**
   * Get referral dashboard data (includes code, points, referrals, and statistics)
   * @returns {Promise}
   */
  getReferralDashboard: async () => {
    try {
      const response = await api.get('/referrals/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get referral dashboard error:', error);
      throw error;
    }
  },

  /**
   * Get user's referrals list
   * @returns {Promise}
   */
  getMyReferrals: async () => {
    try {
      const response = await api.get('/referrals');
      return response.data;
    } catch (error) {
      console.error('Get my referrals error:', error);
      throw error;
    }
  },
};

export default referralService;

