import toast from 'react-hot-toast';

/**
 * Toast Notification Configuration
 * Centralized toast utilities with mobile-optimized settings
 */

// Toast configuration
export const toastConfig = {
  duration: 4000,
  position: 'top-center', // Mobile-friendly position
  style: {
    borderRadius: '8px',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-default)',
    padding: '12px 16px',
    fontSize: '14px',
    minWidth: '280px',
    maxWidth: '90vw',
  },
  // Mobile-optimized
  mobile: {
    position: 'top-center',
    duration: 3000,
  },
};

/**
 * Toast Utilities
 * Pre-configured toast functions
 */
export const toastUtils = {
  /**
   * Success toast
   */
  success: (message) => {
    return toast.success(message, {
      ...toastConfig,
      iconTheme: {
        primary: 'var(--color-success)',
        secondary: 'var(--color-white)',
      },
    });
  },

  /**
   * Error toast
   */
  error: (message) => {
    return toast.error(message, {
      ...toastConfig,
      duration: 5000, // Longer for errors
      iconTheme: {
        primary: 'var(--color-error)',
        secondary: 'var(--color-white)',
      },
    });
  },

  /**
   * Warning toast
   */
  warning: (message) => {
    return toast(message, {
      ...toastConfig,
      icon: '⚠️',
      iconTheme: {
        primary: 'var(--color-warning)',
        secondary: 'var(--color-white)',
      },
    });
  },

  /**
   * Info toast
   */
  info: (message) => {
    return toast(message, {
      ...toastConfig,
      icon: 'ℹ️',
      iconTheme: {
        primary: 'var(--color-info)',
        secondary: 'var(--color-white)',
      },
    });
  },

  /**
   * Loading toast
   */
  loading: (message) => {
    return toast.loading(message, toastConfig);
  },

  /**
   * Promise toast (for async operations)
   */
  promise: (promise, messages) => {
    return toast.promise(promise, messages, toastConfig);
  },

  /**
   * Dismiss toast
   */
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
};


export default toastUtils;

