import api from './api';

/**
 * Support Service
 * Handles support ticket API calls for users and admins
 */
export const supportService = {
  /**
   * Create a new support ticket (User)
   * @param {Object} data - Ticket data (subject, category, description, priority)
   * @returns {Promise}
   */
  createTicket: async (data) => {
    try {
      const response = await api.post('/tickets', {
        subject: data.subject,
        category: data.category || 'general',
        description: data.description,
        priority: data.priority || 'medium',
      });
      return response.data;
    } catch (error) {
      console.error('Create ticket error:', error);
      throw error;
    }
  },

  /**
   * Get all tickets for logged-in user
   * @returns {Promise}
   */
  getUserTickets: async () => {
    try {
      console.log('supportService.getUserTickets: Making API call to /tickets');
      const response = await api.get('/tickets');
      console.log('supportService.getUserTickets: Response received:', response);
      console.log('supportService.getUserTickets: Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get user tickets error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },

  /**
   * Get ticket by ID (User)
   * @param {String} ticketId - Ticket ID
   * @returns {Promise}
   */
  getTicketById: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Get ticket by ID error:', error);
      throw error;
    }
  },

  /**
   * Add message to ticket (User)
   * @param {String} ticketId - Ticket ID
   * @param {String} message - Message text
   * @returns {Promise}
   */
  addMessage: async (ticketId, message) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/messages`, {
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Add message error:', error);
      throw error;
    }
  },

  /**
   * Get all tickets (Admin)
   * @param {Object} params - Query parameters (status, category, search, page, limit, dateFilter)
   * @returns {Promise}
   */
  getAllTickets: async (params = {}) => {
    try {
      const response = await api.get('/admin/tickets', { params });
      return response.data;
    } catch (error) {
      console.error('Get all tickets (admin) error:', error);
      throw error;
    }
  },

  /**
   * Get ticket by ID (Admin)
   * @param {String} ticketId - Ticket ID
   * @returns {Promise}
   */
  getTicketByIdAdmin: async (ticketId) => {
    try {
      const response = await api.get(`/admin/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Get ticket by ID (admin) error:', error);
      throw error;
    }
  },

  /**
   * Update ticket status (Admin)
   * @param {String} ticketId - Ticket ID
   * @param {String} status - New status
   * @returns {Promise}
   */
  updateTicketStatus: async (ticketId, status) => {
    try {
      const response = await api.put(`/admin/tickets/${ticketId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error('Update ticket status error:', error);
      throw error;
    }
  },

  /**
   * Add admin response to ticket
   * @param {String} ticketId - Ticket ID
   * @param {String} message - Response message
   * @param {String} status - Optional status update
   * @returns {Promise}
   */
  addAdminResponse: async (ticketId, message, status = null) => {
    try {
      const response = await api.post(`/admin/tickets/${ticketId}/response`, {
        message,
        status,
      });
      return response.data;
    } catch (error) {
      console.error('Add admin response error:', error);
      throw error;
    }
  },
};

export default supportService;

