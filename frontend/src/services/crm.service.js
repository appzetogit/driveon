import api from './api';

/**
 * CRM Service
 * Handles CRM related API calls
 */
export const crmService = {
    /**
     * Get CRM Analytics
     * @returns {Promise}
     */
    getAnalytics: async () => {
        try {
            const response = await api.get('/crm/analytics');
            return response.data;
        } catch (error) {
            console.error('CRM analytics error:', error);
            throw error;
        }
    },

    /**
     * Get Recent Enquiries
     * @returns {Promise}
     */
    getRecentEnquiries: async () => {
        try {
            const response = await api.get('/crm/enquiries?limit=5');
            return response.data;
        } catch (error) {
            console.error('CRM recent enquiries error:', error);
            throw error;
        }
    },

    /**
     * Get All Vendors
     * @returns {Promise}
     */
    getVendors: async () => {
        try {
            const response = await api.get('/crm/vendors');
            return response.data;
        } catch (error) {
            console.error('CRM vendors error:', error);
            throw error;
        }
    }
};

export default crmService;
