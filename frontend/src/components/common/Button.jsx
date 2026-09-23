import { forwardRef } from 'react';
import { theme } from '../../theme/theme.constants';

/**
 * Button Component
 * Mobile-first, touch-friendly button with multiple variants
 * 
 * @param {string} variant - Button style: 'primary', 'secondary', 'outline', 'ghost'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} fullWidth - Full width on mobile
 * @param {boolean} isLoading - Show loading state
 * @param {boolean} disabled - Disabled state
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base classes - Mobile-first
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      min-h-[44px] min-w-[44px] touch-target
    `;

    // Variant classes
    const variantClasses = {
      primary: `
        text-white
        hover:opacity-90 active:opacity-80
        focus:ring-primary
      `,
      secondary: `
        bg-background-secondary text-text-primary
        hover:bg-background-tertiary
        focus:ring-primary
      `,
      outline: `
        bg-transparent border-2 border-primary text-primary
        hover:bg-primary hover:text-white
        focus:ring-primary
      `,
      ghost: `
        bg-transparent text-text-primary
        hover:bg-background-secondary
        focus:ring-primary
      `,
      danger: `
        bg-error text-white
        hover:opacity-90 active:opacity-80
        focus:ring-error
      `,
      success: `
        bg-success text-white
        hover:opacity-90 active:opacity-80
        focus:ring-success
      `,
    };

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Full width on mobile, auto on larger screens
    const widthClasses = fullWidth
      ? 'w-full md:w-auto'
      : 'w-auto';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant] || variantClasses.primary}
      ${sizeClasses[size] || sizeClasses.md}
      ${widthClasses}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    // Apply primary color style for primary variant
    const buttonStyle = variant === 'primary' 
      ? { backgroundColor: theme.colors.primary }
      : {};

    return (
      <button
        ref={ref}
        className={classes}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

