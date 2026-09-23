/**
 * Skeleton Component
 * Loading placeholder with shimmer effect
 * Mobile-optimized
 * 
 * @param {string} variant - Skeleton shape: 'text', 'circular', 'rectangular'
 * @param {number} lines - Number of lines (for text variant)
 */
const Skeleton = ({
  variant = 'rectangular',
  lines = 1,
  width,
  height,
  className = '',
}) => {
  // Base classes
  const baseClasses = `
    animate-pulse
    bg-background-secondary
    rounded
  `;

  // Variant classes
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.rectangular}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={classes}
            style={index === lines - 1 ? { width: '75%' } : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={style}
    />
  );
};

export default Skeleton;

