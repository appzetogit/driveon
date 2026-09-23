import Spinner from './Spinner';

/**
 * LoadingSpinner Component
 * Full-screen or inline loading spinner
 * 
 * @param {boolean} fullScreen - Show full screen overlay
 * @param {string} message - Loading message
 */
const LoadingSpinner = ({
  fullScreen = false,
  message = 'Loading...',
  size = 'lg',
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary bg-opacity-90">
        <div className="text-center">
          <Spinner size={size} className="mx-auto mb-4" />
          {message && (
            <p className="text-text-secondary text-sm md:text-base">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        <Spinner size={size} className="mx-auto mb-2" />
        {message && (
          <p className="text-text-secondary text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;

