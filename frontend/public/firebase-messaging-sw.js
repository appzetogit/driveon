importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Config matching .env
const firebaseConfig = {
    apiKey: "AIzaSyBOJ76_2NNTkBgf9dFhhO6fP_08gW5zZAg",
    authDomain: "newdriveon.firebaseapp.com",
    projectId: "newdriveon",
    storageBucket: "newdriveon.firebasestorage.app",
    messagingSenderId: "688901928156",
    appId: "1:688901928156:web:54d2dba90ddb72830f7019",
    measurementId: "G-3B3PE7H0P8"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // 🔥 BACKGROUND NOTIFICATION HANDLER
    messaging.onBackgroundMessage(function (payload) {
        console.log('[SW] Background message received: ', payload);

        const notificationTitle = payload.notification?.title || 'Notification';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/driveonlogo.png', // Using existing logo
            data: payload.data // Preserve data field if needed
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (err) {
    console.error('Error in Service Worker:', err);
}
