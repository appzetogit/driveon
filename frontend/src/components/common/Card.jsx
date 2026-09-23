/**
 * Card Component
 * Mobile-first card component with variants
 * 
 * @param {string} variant - Card style: 'default', 'hover', 'clickable'
 * @param {boolean} padding - Add padding
 * @param {string} className - Additional classes
 */
const Card = ({
  children,
  variant = 'default',
  padding = true,
  className = '',
  onClick,
  ...props
}) => {
  // Base classes - Mobile-first
  const baseClasses = `
    bg-background-primary
    border border-border-default
    rounded-lg
    transition-all duration-200
  `;

  // Variant classes
  const variantClasses = {
    default: '',
    hover: 'hover:shadow-md hover:border-primary cursor-pointer',
    clickable: `
      hover:shadow-md hover:border-primary
      active:scale-[0.98]
      cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
    `,
  };

  // Padding classes
  const paddingClasses = padding
    ? 'p-4 md:p-6'
    : '';

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.default}
    ${paddingClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Always use div to avoid nested button issues
  // Add accessibility attributes if clickable
  const accessibilityProps = onClick
    ? {
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        },
      }
    : {};

  return (
    <div
      className={classes}
      onClick={onClick}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

