import api from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Booking Service
 * Handles all booking-related API calls
 */

export const bookingService = {
  /**
   * Create new booking
   * @param {Object} data - Booking data
   * @returns {Promise}
   */
  createBooking: async (data) => {
    const response = await api.post(API_ENDPOINTS.BOOKING.CREATE, data);
    return response.data;
  },

  /**
   * Get booking details by ID
   * @param {string} id - Booking ID
   * @returns {Promise}
   */
  getBooking: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.BOOKING.DETAILS}/${id}`);
    return response.data;
  },

  /**
   * Get user bookings
   * @param {Object} params - Query parameters (filters, pagination)
   * @returns {Promise}
   */
  getBookings: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.BOOKING.LIST, { params });
    return response.data;
  },

  /**
   * Start trip (enable tracking)
   * @param {string} id - Booking ID
   * @returns {Promise}
   */
  startTrip: async (id) => {
    const response = await api.post(`${API_ENDPOINTS.BOOKING.START}/${id}/start`);
    return response.data;
  },

  /**
   * End trip (disable tracking)
   * @param {string} id - Booking ID
   * @returns {Promise}
   */
  endTrip: async (id) => {
    const response = await api.post(`${API_ENDPOINTS.BOOKING.END}/${id}/end`);
    return response.data;
  },

  /**
   * Update booking location (for tracking)
   * @param {string} id - Booking ID
   * @param {Object} location - Location data (latitude, longitude, address)
   * @returns {Promise}
   */
  updateLocation: async (id, location) => {
    const response = await api.post(`${API_ENDPOINTS.BOOKING.UPDATE_LOCATION}/${id}/location`, location);
    return response.data;
  },

  /**
   * Update booking status
   * @param {string} id - Booking ID
   * @param {Object} data - Status data ({ status, cancellationReason })
   * @returns {Promise}
   */
  updateBookingStatus: async (id, data) => {
    const response = await api.patch(`${API_ENDPOINTS.BOOKING.DETAILS}/${id}/status`, data);
    return response.data;
  },
};

export default bookingService;

