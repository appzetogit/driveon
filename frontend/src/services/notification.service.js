import api from './api';
import { API_ENDPOINTS } from '../constants';

export const notificationService = {
    /**
     * Get user/staff notifications
     */
    getNotifications: async () => {
        try {
            const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.GET_ALL);
            if (response.data && response.data.success) {
                return response.data; // { success, total, unreadCount, data: { notifications } }
            }
            return { success: false, data: { notifications: [] } };
        } catch (error) {
            console.error('Fetch notifications error:', error);
            throw error;
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (id) => {
        try {
            const response = await api.put(`${API_ENDPOINTS.NOTIFICATIONS.MARK_READ}/${id}/read`);
            return response.data;
        } catch (error) {
            console.error('Mark read error:', error);
            throw error;
        }
    },

    /**
     * Mark ALL notifications as read
     */
    markAllAsRead: async () => {
        try {
            const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            return response.data;
        } catch (error) {
            console.error('Mark all read error:', error);
            throw error;
        }
    }
};
