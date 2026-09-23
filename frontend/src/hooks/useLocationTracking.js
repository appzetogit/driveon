import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/api.js';
import { getAddressFromCoordinates } from '../services/location.service.js';

/**
 * Custom hook for real-time location tracking
 * Used by users and guarantors to send their location to the server
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.userId - User ID
 * @param {string} options.userType - 'user' or 'guarantor'
 * @param {boolean} options.enabled - Whether tracking is enabled
 * @param {number} options.updateInterval - Update interval in milliseconds (default: 5000)
 * @returns {Object} - { isTracking, error, startTracking, stopTracking }
 */
export const useLocationTracking = ({
  userId,
  userType = 'user',
  enabled = false,
  updateInterval = 5000, // 5 seconds
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastGeocodeTimeRef = useRef(0);
  const addressRef = useRef('');

  const startTracking = () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      // Connect to Socket.IO server
      // Use polling first, then upgrade to websocket (better Firefox compatibility)
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Prioritize websocket
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 3,
        timeout: 10000,
        forceNew: false,
        autoConnect: true,
        withCredentials: true, // Set to true for consistent CORS with backend
      });

      socketRef.current.on('connect', () => {
        console.log('📍 Location tracking socket connected');

        // Register with server
        socketRef.current.emit('register', {
          role: userType,
          userId: userId.toString(),
        });

        socketRef.current.on('registered', (data) => {
          console.log('✅ Registered for location tracking:', data);
          setIsTracking(true);
          setError(null);
        });

        socketRef.current.on('location:ack', (data) => {
          console.log('✅ Location acknowledged:', data);
        });

        socketRef.current.on('location:error', (data) => {
          console.error('❌ Location error:', data);
          setError(data.message || 'Location update failed');
        });

        socketRef.current.on('error', (data) => {
          console.error('❌ Socket error:', data);
          setError(data.message || 'Connection error');
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('📍 Location tracking socket disconnected');
        setIsTracking(false);
      });

      socketRef.current.on('connect_error', (err) => {
        // Only log error in development mode to reduce console noise
        if (import.meta.env.DEV) {
          console.error('❌ Socket connection error:', err);
        }

        const errorMessage = err.message || 'Failed to connect to server';

        // Suppress connection errors if server is not available
        // Don't show error to user unless they explicitly enabled tracking
        if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network') || errorMessage.includes('xhr poll error')) {
          // Silently fail - location tracking is optional feature
          // Only set error if tracking was explicitly enabled
          if (enabled) {
            // Don't set error for automatic reconnection attempts
            // Only set error after multiple failed attempts
            const reconnectAttempts = socketRef.current?.io?.reconnecting || 0;
            if (reconnectAttempts >= 3) {
              setError('Location tracking unavailable. Server connection failed.');
            }
          }
        } else {
          setError(`Connection error: ${errorMessage}`);
        }
        setIsTracking(false);
      });

      // Start watching position
      const geoOptions = {
        enableHighAccuracy: true,
        maximumAge: 1000, // Accept cached position up to 1 second old
        timeout: 10000, // 10 second timeout
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
          const timestamp = position.timestamp;

          console.log('📍 Location update:', {
            lat: latitude,
            lng: longitude,
            accuracy,
            speed,
            timestamp: new Date(timestamp).toISOString(),
          });

          // Throttled reverse geocoding to get human-readable address
          const now = Date.now();
          const shouldGeocode =
            !addressRef.current || now - lastGeocodeTimeRef.current > 60_000; // once per minute

          if (shouldGeocode) {
            lastGeocodeTimeRef.current = now;
            getAddressFromCoordinates(latitude, longitude)
              .then((addr) => {
                if (addr) {
                  addressRef.current = addr;
                }
              })
              .catch((geoErr) => {
                console.error('❌ Error getting address from coordinates:', geoErr);
              });
          }

          // Emit location to server via Socket.IO
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('location:update', {
              userId: userId.toString(),
              userType: userType,
              lat: latitude,
              lng: longitude,
              accuracy: accuracy || null,
              speed: speed ? speed * 3.6 : null, // Convert m/s to km/h
              heading: heading || null,
              altitude: altitude || null,
              address: addressRef.current || '',
              timestamp: timestamp,
            });
          }
        },
        (err) => {
          let errorMessage = 'Location access denied';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              console.error('❌ Geolocation error: Permission denied');
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case err.POSITION_UNAVAILABLE:
              console.warn('⚠️ Geolocation: Position unavailable (may retry)');
              errorMessage = 'Location information unavailable.';
              break;
            case err.TIMEOUT:
              // Timeout is common and expected, log as warning
              console.warn('⏱️ Geolocation timeout (this is normal, will retry)');
              // Don't set error for timeout - it will retry automatically
              // Only set error if it keeps timing out
              return; // Continue tracking, don't stop
            default:
              console.error('❌ Geolocation error:', err);
              errorMessage = 'An unknown error occurred while getting location.';
              break;
          }

          // Only set error and stop tracking for non-timeout errors
          if (err.code !== err.TIMEOUT) {
            setError(errorMessage);
            setIsTracking(false);
          }
        },
        geoOptions
      );
    } catch (err) {
      console.error('❌ Error starting location tracking:', err);
      setError(err.message || 'Failed to start location tracking');
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    // Stop geolocation watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsTracking(false);
    setError(null);
  };

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    // Only attempt connection if explicitly enabled
    if (enabled && userId) {
      startTracking();
    } else {
      // Ensure socket is disconnected when disabled
      if (socketRef.current) {
        stopTracking();
      }
    }

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, [enabled, userId, userType]);

  return {
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
};

export default useLocationTracking;
