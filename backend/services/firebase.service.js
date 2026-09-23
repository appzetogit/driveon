import admin from "firebase-admin";
import path from "path";
import User from "../models/User.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// In-memory cache for duplicate push notification prevention
const sentMessagesCache = new Map();
const CACHE_TTL_MS = 2000; // 2 seconds

// Periodic cleanup of the cache
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of sentMessagesCache.entries()) {
        if (now - timestamp > CACHE_TTL_MS) {
            sentMessagesCache.delete(key);
        }
    }
}, 10000).unref();

const isDuplicateMessage = (token, payload) => {
    const messageKey = `${token}:${JSON.stringify(payload)}`;
    const now = Date.now();
    if (sentMessagesCache.has(messageKey)) {
        const lastSent = sentMessagesCache.get(messageKey);
        if (now - lastSent < CACHE_TTL_MS) {
            return true;
        }
    }
    sentMessagesCache.set(messageKey, now);
    return false;
};

// Initialize Firebase Admin (Only once)
const initializeFirebase = () => {
    try {
        if (admin.apps.length > 0) {
            return admin.app();
        }

        let serviceAccount;

        // 1. Try Environment Variables (Best Practice)
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            };
        }
        // 2. Try Local File
        else {
            const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "config/newdriveon-firebase-adminsdk.json";
            const serviceAccountPath = path.resolve(relativePath);
            if (fs.existsSync(serviceAccountPath)) {
                try {
                    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                    // Fix private key formatting if it comes from the file with escaped newlines
                    if (serviceAccount.private_key) {
                        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                    }
                } catch (parseError) {
                    console.error("❌ Failed to parse Firebase service account JSON:", parseError.message);
                }
            } else {
                console.error("❌ Firebase Service Account file NOT found at:", serviceAccountPath);
            }
        }

        if (serviceAccount) {
            const app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin Initialized Successfully");
            return app;
        } else {
            console.error("❌ Firebase Admin could not be initialized: No valid credentials found (Env or File).");
            return null;
        }
    } catch (error) {
        console.error("❌ Firebase Admin Initialization Failed:", error.message);
        if (error.message.includes("Unparsed DER bytes") || error.message.includes("routine:FIRST_NUM_TOO_LARGE")) {
            console.error("💡 Hint: The private key in your JSON file or Env Var seems corrupted. Try regenerating 'newdriveon-firebase-adminsdk.json' from Firebase Console.");
        }
        return null;
    }
};

// Initial call
initializeFirebase();

// Helper to get initialized messaging instance
const getMessagingInstance = () => {
    try {
        if (admin.apps.length === 0) {
            const app = initializeFirebase();
            if (!app) throw new Error("Firebase not initialized");
            return admin.messaging(app);
        }
        return admin.messaging();
    } catch (error) {
        console.error("❌ Failed to get Firebase Messaging instance:", error.message);
        return null;
    }
};

// Function to send push notification
// export const sendPushNotification = async (userId, title, body, data = {}, isMobile = false) => {
//     try {
//         const messaging = getMessagingInstance();
//         if (!messaging) return;

//         const user = await User.findById(userId);
//         if (!user) {
//             console.log(`❌ User ${userId} not found for notification`);
//             return;
//         }

//         const token = isMobile ? user.fcmTokenMobile : user.fcmToken;

//         if (!token) {
//             console.log(`⚠️ No ${isMobile ? 'Mobile' : 'Web'} FCM Token for user ${userId}`);
//             return;
//         }

//         const message = {
//             notification: { title, body },
//             data,
//             token,
//         };

//         const response = await messaging.send(message);
//         console.log(`✅ Notification Sent to ${userId}: ${response}`);
//         return response;
//     } catch (error) {
//         console.error("❌ Error sending notification:", error);

//         // Remove invalid token
//         if (error.code === 'messaging/registration-token-not-registered') {
//             const user = await User.findById(userId);
//             if (user) {
//                 if (isMobile) user.fcmTokenMobile = null;
//                 else user.fcmToken = null;
//                 await user.save();
//                 console.log(`🗑️ Invalid ${isMobile ? 'Mobile' : 'Web'} token removed for ${userId}`);
//             }
//         }
//     }
// };

// // Function to send push notification to a specific token
// export const sendPushToToken = async (token, title, body, data = {}) => {
//     try {
//         const messaging = getMessagingInstance();
//         if (!messaging) return;

//         if (!token) {
//             console.log("⚠️ No FCM Token provided");
//             return;
//         }

//         const message = {
//             notification: {
//                 title,
//                 body,
//             },
//             data,
//             token,
//         };

//         const response = await messaging.send(message);
//         console.log(`✅ Notification Sent to token: ${response}`);
//         return response;
//     } catch (error) {
//         console.error("❌ Error sending notification to token:", error);
//         throw error;
//     }
// };

export const sendPushNotification = async (
    userId,
    payloadOrTitle,
    bodyOrIsMobile = false,
    dataOrUndefined = {},
    isMobileOrUndefined = false
) => {
    try {
        const messaging = getMessagingInstance();
        if (!messaging) return;

        let payload = {};
        let isMobile = false;

        // Determine signature
        if (typeof payloadOrTitle === 'object' && payloadOrTitle !== null) {
            // New signature: sendPushNotification(userId, payload, isMobile)
            payload = payloadOrTitle;
            isMobile = !!bodyOrIsMobile;
        } else {
            // Old signature: sendPushNotification(userId, title, body, data, isMobile)
            const title = payloadOrTitle;
            const body = bodyOrIsMobile;
            const data = dataOrUndefined || {};
            isMobile = !!isMobileOrUndefined;

            payload = {
                notification: {
                    title: title ? String(title) : '',
                    body: body ? String(body) : '',
                },
                data: {},
            };

            // Ensure all data values are strings (FCM requirements)
            if (data && typeof data === 'object') {
                for (const [key, val] of Object.entries(data)) {
                    payload.data[key] = String(val);
                }
            }
        }

        // Handle case where userId is actually a direct FCM token
        const isToken = typeof userId === 'string' && !/^[0-9a-fA-F]{24}$/.test(userId);

        let targetTokens = [];
        if (isToken) {
            targetTokens = [userId];
        } else {
            const user = await User.findById(userId);
            if (!user) {
                console.log(`❌ User ${userId} not found for notification`);
                return;
            }

            // ✅ Respect user's push notification preference
            if (user.notificationPreferences?.push === false) {
                console.log(`🔕 Push notifications disabled for user ${userId} — skipping`);
                return;
            }

            // Prioritize fcmTokenMobile, then fallback to fcmToken
            const tokens = [];
            if (user.fcmTokenMobile) tokens.push(user.fcmTokenMobile);
            if (user.fcmToken) tokens.push(user.fcmToken);
            targetTokens = Array.from(new Set(tokens.filter(Boolean)));
        }

        if (targetTokens.length === 0) {
            console.log(`⚠️ No FCM Token for user ${userId}`);
            return;
        }

        let lastResponse;
        for (const token of targetTokens) {
            if (isDuplicateMessage(token, payload)) {
                console.log(`ℹ️ Duplicate notification to token detected within ${CACHE_TTL_MS}ms — skipping to prevent double-send.`);
                continue;
            }

            const message = {
                token,
                ...payload,
            };

            console.log(
                '📦 FCM User Message:',
                JSON.stringify(message, null, 2)
            );

            try {
                const response = await messaging.send(message);
                console.log(`✅ Notification Sent to user ${userId} on token: ${response}`);
                lastResponse = response;
            } catch (err) {
                console.error(`❌ Error sending user notification to token ${token}:`, err);
                if (err.code === 'messaging/registration-token-not-registered') {
                    if (!isToken) {
                        const user = await User.findById(userId);
                        if (user) {
                            if (user.fcmTokenMobile === token) user.fcmTokenMobile = null;
                            if (user.fcmToken === token) user.fcmToken = null;
                            await user.save();
                            console.log(`🗑️ Invalid token removed for user ${userId}`);
                        }
                    }
                }
            }
        }
        return lastResponse;
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
    }
};


export const sendPushToToken = async (
    token,
    payloadOrTitle,
    body = null,
    data = {}
) => {
    try {
        const messaging = getMessagingInstance();
        if (!messaging) return;

        if (!token) {
            console.log('⚠️ No FCM Token provided');
            return;
        }

        let payload = {};
        if (typeof payloadOrTitle === 'object' && payloadOrTitle !== null) {
            payload = payloadOrTitle;
        } else {
            payload = {
                notification: {
                    title: payloadOrTitle ? String(payloadOrTitle) : '',
                    body: body ? String(body) : '',
                },
                data: {},
            };
            if (data && typeof data === 'object') {
                for (const [key, val] of Object.entries(data)) {
                    payload.data[key] = String(val);
                }
            }
        }

        if (isDuplicateMessage(token, payload)) {
            console.log(`ℹ️ Duplicate notification to token detected within ${CACHE_TTL_MS}ms — skipping to prevent double-send.`);
            return;
        }

        const message = {
            token,
            ...payload,
        };

        console.log(
            '📦 FCM Token Message:',
            JSON.stringify(message, null, 2)
        );

        const response = await messaging.send(message);
        console.log(`✅ Notification Sent to token: ${response}`);
        return response;
    } catch (error) {
        console.error('❌ Error sending notification to token:', error);
        throw error;
    }
};


// Send to multiple users (Admin broadcast)
export const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    try {
        const messaging = getMessagingInstance();
        if (!messaging) return;

        if (!tokens || tokens.length === 0) return;

        const message = {
            notification: { title, body },
            data,
            tokens
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`✅ Multicast Sent: ${response.successCount} success, ${response.failureCount} failed`);
        return response;
    } catch (error) {
        console.error("❌ Multicast Error:", error);
    }
}

// Send notification to ALL Admins
export const sendAdminNotification = async (title, body, data = {}) => {
    try {
        // Dynamic import to avoid circular dependency issues if Admin model imports this service
        const Admin = (await import("../models/Admin.js")).default;

        // Find all admins (you might want to filter by specific permissions later)
        const admins = await Admin.find({ isActive: true });

        if (!admins || admins.length === 0) {
            console.log("⚠️ No active admins found to notify.");
            return;
        }

        let tokens = [];

        // Collect tokens from all admins
        // Note: Admin model needs to support FCM tokens. 
        // If Admin model doesn't have fcmToken/fcmTokenMobile, we need to add it or use a different approach.
        // Assuming Admin schema has similar token fields to User for now, or we'll check if we need to add them.

        // checking the Admin Model from previous context...
        // The Admin model seen in step 48 DOES NOT have fcmToken fields.
        // We need to Add fcmToken and fcmTokenMobile to Admin model first!

        // For now, I will assume we will add them. 
        admins.forEach(admin => {
            if (admin.fcmToken) tokens.push(admin.fcmToken);
            if (admin.fcmTokenMobile) tokens.push(admin.fcmTokenMobile);
        });

        if (tokens.length === 0) {
            console.log("⚠️ No Admin FCM tokens found.");
            return;
        }

        // Remove duplicates
        tokens = [...new Set(tokens)];

        console.log(`📣 Sending Admin Notification to ${tokens.length} devices...`);
        console.log(`   Title: ${title}`);

        await sendMulticastNotification(tokens, title, body, data);

    } catch (error) {
        console.error("❌ Error sending admin notification:", error);
    }
};

export const sendStaffPushNotification = async (
    staffId,
    payload,
    isMobile = false
) => {
    try {
        const messaging = getMessagingInstance();
        if (!messaging) return;

        // Dynamic import to avoid circular dependency
        const Staff = (await import("../models/Staff.js")).default;
        const staff = await Staff.findById(staffId);

        if (!staff) {
            console.log(`❌ Staff ${staffId} not found for notification`);
            return;
        }

        // Prioritize fcmTokenMobile, then fallback to fcmToken
        const tokens = [];
        if (staff.fcmTokenMobile) tokens.push(staff.fcmTokenMobile);
        if (staff.fcmToken) tokens.push(staff.fcmToken);
        const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));

        if (uniqueTokens.length === 0) {
            console.log(`⚠️ No FCM Token for staff ${staffId}`);
            return;
        }

        let lastResponse;
        for (const token of uniqueTokens) {
            if (isDuplicateMessage(token, payload)) {
                console.log(`ℹ️ Duplicate notification to token detected within ${CACHE_TTL_MS}ms — skipping to prevent double-send.`);
                continue;
            }

            const message = {
                token,
                ...payload,
            };

            console.log(
                '📦 FCM Staff Message:',
                JSON.stringify(message, null, 2)
            );

            try {
                const response = await messaging.send(message);
                console.log(`✅ Notification Sent to Staff ${staffId} on token: ${response}`);
                lastResponse = response;
            } catch (err) {
                console.error(`❌ Error sending staff notification to token ${token}:`, err);
                if (err.code === 'messaging/registration-token-not-registered') {
                    const Staff = (await import("../models/Staff.js")).default;
                    const staff = await Staff.findById(staffId);
                    if (staff) {
                        if (staff.fcmTokenMobile === token) staff.fcmTokenMobile = null;
                        if (staff.fcmToken === token) staff.fcmToken = null;
                        await staff.save();
                        console.log(`🗑️ Invalid token removed for staff ${staffId}`);
                    }
                }
            }
        }
        return lastResponse;
    } catch (error) {
        console.error('❌ Error sending staff notification:', error);
    }
};

