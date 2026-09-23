import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { sendStaffPushNotification, sendPushNotification } from '../services/firebase.service.js';

/**
 * @desc    Get Notifications for Logged in User/Staff
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role?.toLowerCase();

        let recipientModel = 'Staff';
        if (userRole === 'user') {
            recipientModel = 'User';
        } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'subadmin') {
            recipientModel = 'Admin';
        }

        // Or we can rely on how authenticate middleware sets req.user
        // If it's the User App, likely 'User'. If Employee App, likely 'Staff'.
        // We'll check req.staff if available? 
        // Let's assume req.user is the logged in entity.

        // Check if the user is from Staff model or User model based on middleware
        // Typically authentication middleware attaches the user object.
        // If the Employee app uses a specific middleware that sets req.user = staffDoc, 
        // we need to know the Model name.
        // Assuming 'Staff' for now as this is for Employee App. 
        // If shared with User app, we might need logic to distinguish.
        // For now, let's assume if it has specific fields it's Staff?
        // Or better: the 'recipientModel' is stored in DB.

        let query = { recipient: userId };

        // Optional: Filter by model if needed, but recipient ID should be unique enough usually, 
        // though technically ObjectIds can collide across collections (unlikely but possible).
        // Safest is to allow passing recipientModel or inferring it.

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.status(200).json({
            success: true,
            total: notifications.length,
            unreadCount,
            data: { notifications }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching notifications',
            error: error.message
        });
    }
};

/**
 * @desc    Mark Notification as Read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Mark ALL Notifications as Read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Create User/Staff Notification (Internal Helper)
 * @param   {Object} params
 */
export const createNotification = async ({
    recipient,
    recipientModel = 'Staff',
    title,
    message,
    type = 'info',
    relatedId = null,
    relatedModel = null,
    sendPush = true
}) => {
    try {
        // 1. Save to DB
        const notification = await Notification.create({
            recipient,
            recipientModel,
            title,
            message,
            type,
            relatedId,
            relatedModel,
            isSent: sendPush // Assume sent if we are about to try
        });

        // 2. Send Push Notification
        if (sendPush) {
            const payload = {
                notification: {
                    title,
                    body: message
                },
                data: {
                    type,
                    id: relatedId ? relatedId.toString() : '',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for Flutter
                }
            };

            if (recipientModel === 'Staff') {
                // Try sending to Mobile (primary for field staff) AND Web?
                // For now, let's try sending to both if possible or default to Mobile
                // The `sendStaffPushNotification` checks tokens.
                // Let's call it twice or upgrade it to handle both?
                // The existing logic takes `isMobile` param.

                // Send to Mobile (Priority for Employee App)
                await sendStaffPushNotification(recipient, payload, true);

                // Send to Web (Optional, if they use dashboard)
                await sendStaffPushNotification(recipient, payload, false);
            } else if (recipientModel === 'User') {
                await sendPushNotification(recipient, payload, true); // Mobile
                // await sendPushNotification(recipient, payload, false); // Web
            }
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        // We typically don't throw here to prevent blocking main flow (e.g. Enquiry creation)
        return null;
    }
};

/**
 * @desc    Create Notification for all active Admins/Subadmins (Internal Helper)
 * @param   {Object} params
 */
export const createAdminNotification = async ({
    title,
    message,
    type = 'info',
    relatedId = null,
    relatedModel = null,
    sendPush = true
}) => {
    try {
        const Admin = mongoose.model('Admin');
        const admins = await Admin.find({ isActive: true });
        
        const notifications = [];
        for (const admin of admins) {
            // 1. Save to DB
            const notification = await Notification.create({
                recipient: admin._id,
                recipientModel: 'Admin',
                title,
                message,
                type,
                relatedId,
                relatedModel,
                isSent: sendPush
            });
            notifications.push(notification);

            // 2. Send Push Notification if FCM token is registered
            if (sendPush) {
                const token = admin.fcmToken || admin.fcmTokenMobile;
                if (token) {
                    const payload = {
                        notification: {
                            title,
                            body: message
                        },
                        data: {
                            type,
                            id: relatedId ? relatedId.toString() : '',
                            click_action: 'FLUTTER_NOTIFICATION_CLICK'
                        }
                    };
                    await sendPushNotification(token, payload, !!admin.fcmTokenMobile);
                }
            }
        }
        return notifications;
    } catch (error) {
        console.error('Create admin notification error:', error);
        return [];
    }
};
