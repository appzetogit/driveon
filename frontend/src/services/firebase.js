import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// VAPID Key from user
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const isMobileApp = () => {
    if (typeof window === 'undefined') return false;
    
    const hasCordova = window.cordova !== undefined;
    const hasCapacitor = window.Capacitor !== undefined;
    const hasFlutterWebView = window.flutter_inappwebview !== undefined;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isFlutterUserAgent = userAgent.includes('Flutter') || userAgent.includes('MobileApp');
    const isInIframe = window.self !== window.top;
    
    const storedPlatform = localStorage.getItem('mobilePlatform');
    const isExplicitMobile = storedPlatform === 'mobile' || storedPlatform === 'android' || storedPlatform === 'ios';

    return hasCordova || hasCapacitor || hasFlutterWebView || isWebView || isFlutterUserAgent || isInIframe || isExplicitMobile;
};

// Intercept URL parameters on load to capture mobile FCM token
if (typeof window !== 'undefined') {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const fcmTokenParam = urlParams.get('fcmToken') || urlParams.get('fcm_token') || urlParams.get('deviceToken') || urlParams.get('device_token');
        const platformParam = urlParams.get('platform');

        if (fcmTokenParam) {
            console.log('📱 Captured FCM Token from URL search parameters:', fcmTokenParam.substring(0, 10) + '...');
            localStorage.setItem('mobileFcmToken', fcmTokenParam);
        }
        if (platformParam) {
            localStorage.setItem('mobilePlatform', platformParam);
        }
    } catch (e) {
        console.error('⚠️ Error parsing URL search params for FCM:', e);
    }
}

// Global setter callback for Flutter app to dynamically inject token post-load
if (typeof window !== 'undefined') {
    window.setMobileFcmToken = async (token) => {
        if (!token) return;
        console.log('📱 Received FCM Token from native shell:', token.substring(0, 10) + '...');
        localStorage.setItem('mobileFcmToken', token);
        localStorage.setItem('mobilePlatform', 'mobile');

        // Dynamically save token if already authenticated
        try {
            const hasAuthToken = localStorage.getItem('authToken');
            const hasStaffToken = localStorage.getItem('staffToken');
            const { default: api } = await import('./api');

            if (hasStaffToken) {
                await api.post('/auth/staff-fcm-token', {
                    fcmToken: token,
                    platform: 'mobile'
                });
                console.log('✅ Registered native staff FCM token to backend');
            }

            if (hasAuthToken) {
                await api.post('/auth/user-fcm-token', {
                    fcmToken: token,
                    platform: 'mobile'
                }).catch(err => console.error('Error saving user FCM token via /auth/user-fcm-token:', err));

                await api.post('/user/fcm-token', {
                    fcmToken: token,
                    platform: 'mobile'
                }).catch(err => console.error('Error saving user FCM token via /user/fcm-token:', err));

                console.log('✅ Registered native user FCM token to backend');
            }
        } catch (apiError) {
            console.error('❌ Failed to dynamically register injected mobile FCM token:', apiError);
        }
    };
}

export const requestForToken = async () => {
    // If running in a mobile app, retrieve the native device token
    if (isMobileApp()) {
        const cachedToken = localStorage.getItem('mobileFcmToken') || 
                            (typeof window !== 'undefined' ? (window.mobileFcmToken || window.fcmToken) : null);
        if (cachedToken) {
            console.log('📱 Returning cached/injected mobile FCM Token:', cachedToken.substring(0, 10) + '...');
            return cachedToken;
        }
        console.log('📱 Running in mobile WebView but no native FCM token is cached yet.');
        return null;
    }

    try {
        if (!VAPID_KEY) {
            return null;
        }

        // Safely check if Notification API is supported
        if (typeof window === 'undefined' || !('Notification' in window)) {
            console.log('🔔 Notifications are not supported or defined in this environment.');
            return null;
        }

        // Check if notification permission is already denied — skip silently
        if (window.Notification.permission === 'denied') {
            return null;
        }

        // Register service worker
        let registration;
        try {
            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            } else {
                return null;
            }
        } catch (swError) {
            console.error('❌ Service Worker Registration Failed:', swError);
            return null;
        }

        const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        return currentToken || null;

    } catch (err) {
        // Silently ignore expected browser permission errors
        const ignoredCodes = [
            'messaging/permission-blocked',
            'messaging/permission-default',
            'messaging/notifications-blocked',
        ];
        if (err?.code && ignoredCodes.includes(err.code)) {
            return null;
        }
        // Log genuine unexpected errors only
        console.error("❌ FCM token error:", err?.message || err);
        return null;
    }
};

export const onMessageListener = (callback) => {
    if (typeof callback === 'function') {
        return onMessage(messaging, (payload) => {
            console.log("payload", payload);
            callback(payload);
        });
    }
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("payload", payload);
            resolve(payload);
        });
    });
};

export { messaging };
