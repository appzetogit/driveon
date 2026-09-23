// App Constants

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    SEND_LOGIN_OTP: '/auth/send-login-otp',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    STAFF_PROFILE: '/auth/staff-profile',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    KYC_STATUS: '/user/kyc-status',
    UPLOAD_PHOTO: '/user/upload-photo',
    UPLOAD_RC_DOCUMENT: '/user/upload-rc-document',
    CHANGE_PASSWORD: '/user/change-password',
    GUARANTOR_REQUESTS: '/user/guarantor-requests',
    GUARANTOR_POINTS: '/user/guarantor-points',
  },
  ADMIN: {
    SIGNUP: '/admin/signup',
    LOGIN: '/admin/login',
    PROFILE: '/admin/profile',
    REFRESH_TOKEN: '/admin/refresh-token',
    LOGOUT: '/admin/logout',
  },
  CARS: {
    LIST: '/cars',
    DETAILS: '/cars',
    FILTERS: '/cars/filters',
  },
  BOOKING: {
    CREATE: '/bookings',
    DETAILS: '/bookings',
    LIST: '/bookings',
    START: '/bookings',
    END: '/bookings',
    UPDATE_LOCATION: '/bookings',
  },
  PAYMENT: {
    CREATE: '/payments/create',
    STATUS: '/payments/status',
    PHONEPE_CALLBACK: '/payments/phonepe/callback',
    RAZORPAY_CREATE_ORDER: '/payments/razorpay/create-order',
    RAZORPAY_VERIFY: '/payments/razorpay/verify',
    RAZORPAY_CALLBACK: '/payments/razorpay/callback',
  },
  ADMIN: {
    BOOKINGS: '/admin/bookings',
    BOOKING_DETAILS: '/admin/bookings',
    BOOKING_STATS: '/admin/bookings/stats',
    ACTIVE_TRACKING: '/admin/bookings/active/tracking',
  },
  KYC: {
    DIGILOCKER_AUTH: '/kyc/digilocker-auth',
    CALLBACK: '/kyc/callback',
    STATUS: '/kyc/status',
  },
  GUARANTOR: {
    ADD: '/guarantor/add',
    STATUS: '/guarantor/status',
  },
  PRICING: {
    CALCULATE: '/pricing/calculate',
  },
  SUPPORT: {
    CREATE_TICKET: '/tickets',
    GET_TICKETS: '/tickets',
    GET_TICKET: '/tickets',
    ADD_MESSAGE: '/tickets',
    // Admin endpoints
    ADMIN_GET_TICKETS: '/admin/tickets',
    ADMIN_GET_TICKET: '/admin/tickets',
    ADMIN_UPDATE_STATUS: '/admin/tickets',
    ADMIN_ADD_RESPONSE: '/admin/tickets',
  },
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    MARK_READ: '/notifications', // + /:id/read
    MARK_ALL_READ: '/notifications/read-all',
  },
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  OWNER: 'owner',
  GUARANTOR: 'guarantor',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment Types
export const PAYMENT_TYPES = {
  FULL: 'full',
  PARTIAL: 'partial', // 20% advance
};

// Mobile Breakpoints (for JavaScript use)
export const BREAKPOINTS = {
  MOBILE: 0,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1280,
};

// Touch Target Minimum Size (in pixels)
export const TOUCH_TARGET_MIN = 44;

// OTP Configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  RESEND_DELAY: 60, // seconds
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MOBILE_PAGE_SIZE: 5,
};

