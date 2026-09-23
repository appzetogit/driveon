import { Toaster as HotToaster } from 'react-hot-toast';

/**
 * Toaster Component
 * Toast notification container
 * Mobile-optimized positioning
 */
const Toaster = () => {
  return (
    <HotToaster
      position="top-center"
      containerStyle={{
        top: '20px',
        // Mobile: full width with padding
        // Desktop: centered
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-background-primary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-default)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          minWidth: '280px',
          maxWidth: '90vw',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        success: {
          iconTheme: {
            primary: 'var(--color-success)',
            secondary: 'var(--color-white)',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--color-white)',
          },
        },
      }}
    />
  );
};

export default Toaster;

