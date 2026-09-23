import { useState } from 'react';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { theme } from '../../theme/theme.constants';

/**
 * Location Tracker Component
 * Simple component for users/guarantors to enable/disable location tracking
 * Can also run in hidden/automatic mode (no UI, just tracking)
 * 
 * @param {Object} props
 * @param {string} props.userId - User ID
 * @param {string} props.userType - 'user' or 'guarantor'
 * @param {boolean} props.autoStart - Auto-start tracking on mount
 * @param {boolean} props.hidden - If true, don't render UI (background tracking)
 */
const LocationTracker = ({ userId, userType = 'user', autoStart = false, hidden = false }) => {
  const [enabled, setEnabled] = useState(autoStart);
  const { isTracking, error, startTracking, stopTracking } = useLocationTracking({
    userId,
    userType,
    enabled,
    updateInterval: 5000,
  });

  const handleToggle = () => {
    if (isTracking) {
      stopTracking();
      setEnabled(false);
    } else {
      startTracking();
      setEnabled(true);
    }
  };

  if (!userId) {
    // In hidden mode, fail silently if userId is missing
    if (hidden) return null;

    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">User ID is required for location tracking</p>
      </div>
    );
  }

  // If hidden, don't render any UI (background tracking only)
  if (hidden) {
    return null;
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Location Tracking
          </h3>
          <p className="text-xs text-gray-600">
            {isTracking
              ? 'Your location is being shared with admin'
              : 'Enable to share your location with admin'}
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={!!error}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isTracking
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'text-white hover:opacity-90'
          } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={!isTracking && !error ? { backgroundColor: theme.colors.primary } : {}}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
      </div>
      
      {isTracking && (
        <div className="mt-3 flex items-center text-xs text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
          Location tracking active
        </div>
      )}
    </div>
  );
};

export default LocationTracker;

