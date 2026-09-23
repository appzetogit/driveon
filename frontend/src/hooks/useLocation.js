import { useState, useEffect, useRef } from 'react';
import { getAddressFromCoordinates, getCurrentPosition } from '../services/location.service';

/**
 * Hook to get user's current location with address
 * Used for displaying location on home page
 * 
 * @param {boolean} enabled - Whether to fetch location
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {string} userId - User ID (optional)
 * @returns {Object} - { currentLocation, coordinates, locationPermission, apiKeyError }
 */
export const useLocation = (enabled = true, isAuthenticated = false, userId = null) => {
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [coordinates, setCoordinates] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [apiKeyError, setApiKeyError] = useState(null);
  const watchIdRef = useRef(null);
  const isFetchingRef = useRef(false);
  const lastKnownLocationRef = useRef(null); // Store last known location
  const lastKnownAddressRef = useRef(null); // Store last known address
  const MAX_ALLOWED_ACCURACY_METERS = 200; // Ignore noisy GPS jumps to keep UI stable

  // Calculate distance between two coordinates using Haversine formula (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  useEffect(() => {
    if (!enabled) {
      setCurrentLocation('Location tracking disabled');
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setCurrentLocation('Location not supported');
      setLocationPermission('denied');
      return;
    }

    // Load cached location to avoid flicker and keep address stable on errors
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('driveon_last_location');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.address) {
            lastKnownAddressRef.current = parsed.address;
            setCurrentLocation(parsed.address);
          }
          if (parsed?.lat && parsed?.lng) {
            lastKnownLocationRef.current = { lat: parsed.lat, lng: parsed.lng };
            setCoordinates({ lat: parsed.lat, lng: parsed.lng });
          }
        }
      } catch (err) {
        // ignore cache errors
      }
    }

    // Function to fetch location and address
    const fetchLocation = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        if (!lastKnownAddressRef.current) {
          setCurrentLocation('Getting location...');
        }
        
        // Get current position
        const position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });

        const { latitude, longitude, accuracy } = position.coords;

        // Ignore very low-accuracy readings to avoid flickering address when user is stationary
        if (
          accuracy &&
          accuracy > MAX_ALLOWED_ACCURACY_METERS &&
          lastKnownAddressRef.current
        ) {
          console.warn(
            `Ignoring low-accuracy location (${Math.round(
              accuracy
            )}m). Keeping last shown address.`
          );
          return;
        }
        
        // Store initial location
        lastKnownLocationRef.current = { lat: latitude, lng: longitude };
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationPermission('granted');

        // Get address from coordinates
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        if (address) {
          lastKnownAddressRef.current = address;
          setCurrentLocation(address);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'driveon_last_location',
              JSON.stringify({ address, lat: latitude, lng: longitude, timestamp: Date.now() })
            );
          }
        } else {
          // If address fetch fails, show coordinates
          const coordString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          lastKnownAddressRef.current = coordString;
          setCurrentLocation(coordString);
        }

        // Update user location on backend if authenticated
        if (isAuthenticated && userId) {
          try {
            const { updateUserLocation } = await import('../services/location.service');
            updateUserLocation(latitude, longitude, address);
          } catch (err) {
            console.error('Error updating user location:', err);
          }
        }
      } catch (error) {
        let errorMessage = 'Getting location...';
        let permission = 'prompt';

        if (error.code === 1) {
          // PERMISSION_DENIED
          console.error('❌ Location error: Permission denied');
          errorMessage = 'Location permission denied';
          permission = 'denied';
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          console.warn('⚠️ Location error: Position unavailable');
          errorMessage = 'Location unavailable';
          permission = 'denied';
        } else if (error.code === 3) {
          // TIMEOUT - This is common and expected, log as warning
          console.warn('⏱️ Location timeout (this is normal, will retry)');
          // Don't change the location message for timeout - keep "Getting location..."
          // The watchPosition will continue trying
          return; // Exit early, don't update state
        } else {
          console.error('❌ Location error:', error);
          errorMessage = 'Location unavailable';
          permission = 'denied';
        }

        setCurrentLocation(lastKnownAddressRef.current || errorMessage);
        setLocationPermission(permission);
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Initial fetch
    fetchLocation();

    // Watch for location updates - only update when user moves significantly
    // Update location only when user moves more than 50 meters
    const geoOptions = {
      enableHighAccuracy: true, // Use GPS for better accuracy
      timeout: 15000, // 15 seconds timeout
      maximumAge: 60000, // Accept cached location up to 60 seconds old
    };

    // Throttle location updates to avoid frequent changes
    let lastUpdateTime = 0;
    const THROTTLE_INTERVAL = 300000; // 5 minutes minimum between updates
    const MIN_DISTANCE_METERS = 500; // Only update if user moved at least 500 meters

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        const { latitude, longitude, accuracy } = position.coords;

        // Ignore noisy readings to prevent random address changes when the user isn't moving
        if (
          accuracy &&
          accuracy > MAX_ALLOWED_ACCURACY_METERS &&
          lastKnownAddressRef.current
        ) {
          return;
        }
        
        // Check if we have a last known location
        if (lastKnownLocationRef.current) {
          // Calculate distance from last known location
          const distance = calculateDistance(
            lastKnownLocationRef.current.lat,
            lastKnownLocationRef.current.lng,
            latitude,
            longitude
          );
          
          // Only update if user moved significantly (more than MIN_DISTANCE_METERS)
          if (distance < MIN_DISTANCE_METERS) {
            // User hasn't moved enough, don't update location
            return; // Skip this update
          }
        }
        
        // Throttle updates - only update if enough time has passed
        if (now - lastUpdateTime < THROTTLE_INTERVAL && lastUpdateTime !== 0) {
          return; // Skip this update
        }
        
        lastUpdateTime = now;
        
        // Update coordinates
        lastKnownLocationRef.current = { lat: latitude, lng: longitude };
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationPermission('granted');

        // Get address from coordinates
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        if (address) {
          // Only update if address is different from last known address
          if (address !== lastKnownAddressRef.current) {
            lastKnownAddressRef.current = address;
            setCurrentLocation(address);
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'driveon_last_location',
                JSON.stringify({ address, lat: latitude, lng: longitude, timestamp: Date.now() })
              );
            }
          }
        } else if (lastKnownAddressRef.current) {
          // Keep previous address if geocoding fails
          // Don't update to coordinates to avoid flickering
        }

        // Update user location on backend if authenticated
        if (isAuthenticated && userId) {
          try {
            const { updateUserLocation } = await import('../services/location.service');
            updateUserLocation(latitude, longitude, address);
          } catch (err) {
            console.error('Error updating user location:', err);
          }
        }
      },
      (error) => {
        // Handle different error types appropriately
        if (error.code === 1) {
          // PERMISSION_DENIED
          console.error('❌ Location watch error: Permission denied');
          setLocationPermission('denied');
          setCurrentLocation('Location permission denied');
        } else if (error.code === 3) {
          // TIMEOUT - This is common, log as warning and don't update state
          console.warn('⏱️ Location watch timeout (will continue retrying)');
          // Don't update state - keep trying
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          console.warn('⚠️ Location watch error: Position unavailable');
          // Don't update state - might recover
        } else {
          console.error('❌ Location watch error:', error);
        }
      },
      geoOptions
    );

    // Check for Google Maps API key error
    const checkApiKeyError = () => {
      try {
        const errorData = sessionStorage.getItem('google_maps_api_error');
        if (errorData) {
          const error = JSON.parse(errorData);
          // Only show error if it's recent (within last hour)
          if (Date.now() - error.timestamp < 3600000) {
            setApiKeyError(error.message);
          }
        }
      } catch (err) {
        // Ignore parsing errors
      }
    };

    checkApiKeyError();

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, userId]);

  return {
    currentLocation,
    coordinates,
    locationPermission,
    apiKeyError,
  };
};

export default useLocation;

