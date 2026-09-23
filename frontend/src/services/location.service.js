import api from './api';

/**
 * Location Service
 * Handles user location tracking and geocoding
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track API key errors to prevent spam
let apiKeyErrorShown = false;

/**
 * Get address from coordinates using Google Maps Geocoding API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Formatted address
 */
export const getAddressFromCoordinates = async (lat, lng) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
    return '';
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.error('Invalid coordinates:', { lat, lng });
    return '';
  }

  try {
    // Use Google Maps Geocoding API with proper parameters
    // language=hi for Hindi, en for English
    // region=in for India (helps with better results)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=en&region=in`;

    console.log('Fetching address from Google Maps API...', { lat, lng });

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Google Maps API HTTP error:', response.status, response.statusText);
      return '';
    }

    const data = await response.json();

    console.log('Google Maps API response:', data.status);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Get the most relevant result (first one)
      const address = data.results[0].formatted_address;
      console.log('Address received:', address);
      return address;
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('No results found for coordinates:', { lat, lng });
      return '';
    } else if (data.status === 'REQUEST_DENIED') {
      const errorMsg = data.error_message || 'Unknown error';

      // Show detailed error only once to prevent console spam
      if (!apiKeyErrorShown) {
        console.error('❌ Google Maps API Error:', errorMsg);
        console.error('📋 Setup Instructions:');
        console.error('1. Go to https://console.cloud.google.com/');
        console.error('2. Enable "Geocoding API" in your project');
        console.error('3. Create/Get API key from Credentials section');
        console.error('4. Add to .env file: VITE_GOOGLE_MAPS_API_KEY=your_key_here');
        console.error('5. Restart dev server');
        console.error('6. Make sure API key restrictions allow your domain/localhost');
        apiKeyErrorShown = true;
      }

      // Store error in sessionStorage to show UI message
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('google_maps_api_error', JSON.stringify({
          status: 'REQUEST_DENIED',
          message: errorMsg,
          timestamp: Date.now()
        }));
      }

      return '';
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded. Please check your billing.');
      return '';
    } else if (data.status === 'INVALID_REQUEST') {
      console.error('Invalid request to Google Maps API:', data.error_message);
      return '';
    } else {
      console.warn('Geocoding failed with status:', data.status, data.error_message);
      return '';
    }
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return '';
  }
};

/**
 * Search places using backend API proxy (avoids CORS issues)
 * @param {string} query - Search query
 * @param {Object} coordinates - Optional { lat, lng } for location bias
 * @returns {Promise<Array>} - Array of place results
 */
export const searchPlaces = async (query, coordinates = null) => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // Use backend API proxy to avoid CORS issues
    const params = new URLSearchParams({
      query: query.trim(),
    });

    // Add location bias if coordinates provided
    if (coordinates && coordinates.lat && coordinates.lng) {
      params.append('lat', coordinates.lat);
      params.append('lng', coordinates.lng);
    }

    const response = await api.get(`/common/places/search?${params.toString()}`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data.places || [];
    }

    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
};

/**
 * Update user location on backend (fire-and-forget for speed)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} address - Optional address
 * @returns {Promise<Object>} - API response
 */
export const updateUserLocation = async (lat, lng, address = '') => {
  try {
    // Use fire-and-forget approach for faster updates
    // Don't await to avoid blocking location updates
    api.post('/user/update-location', {
      lat,
      lng,
      address,
    }).catch((error) => {
      // Silently handle errors to not block location tracking
      console.error('Error updating user location (non-blocking):', error);
    });

    // Return immediately without waiting for response
    return { success: true };
  } catch (error) {
    // This should rarely happen, but handle gracefully
    console.error('Error initiating location update:', error);
    return { success: false };
  }
};

/**
 * Request location permission and get current position using browser Geolocation API
 * This uses the browser's native geolocation which is then converted to address using Google Maps
 * @param {Object} options - Geolocation options
 * @returns {Promise<GeolocationPosition>} - Current position
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser. Please use a modern browser.');
      error.code = 0;
      reject(error);
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]';

    if (!isSecure) {
      const error = new Error('Geolocation requires HTTPS or localhost. Current protocol: ' + window.location.protocol);
      error.code = 0;
      reject(error);
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true, // Use GPS if available for better accuracy
      timeout: 15000, // 15 seconds timeout
      maximumAge: 60000, // Allow cached location up to 1 minute old
      ...options,
    };

    console.log('Requesting location with options:', defaultOptions);

    // Try with high accuracy first (GPS)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('✅ Location obtained successfully:', {
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: accuracy ? `${Math.round(accuracy)}m` : 'unknown'
        });
        resolve(position);
      },
      (error) => {
        const errorInfo = {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        };

        // Only log non-timeout errors as errors, timeout is expected in some cases
        if (error.code === 3) {
          // Timeout - this is common, log as warning instead of error
          console.warn('⏱️ Geolocation timeout (retrying with fallback)...', errorInfo);
        } else {
          console.error('❌ Geolocation error:', errorInfo);
        }

        // If timeout or position unavailable, retry with lower accuracy (network-based)
        if (error.code === 3 || error.code === 2) {
          console.log('🔄 Retrying with network-based location (lower accuracy)...');
          // Retry with less strict options (uses network/IP-based location)
          const fallbackOptions = {
            enableHighAccuracy: false, // Use network-based location
            timeout: 20000, // Longer timeout for fallback
            maximumAge: 300000, // Allow cached location up to 5 minutes old
            ...options,
          };

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              console.log('✅ Location obtained with network-based method:', {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6),
                accuracy: accuracy ? `${Math.round(accuracy)}m` : 'unknown'
              });
              resolve(position);
            },
            (fallbackError) => {
              // Only log fallback failure if it's not a timeout (timeouts are expected)
              if (fallbackError.code !== 3) {
                console.error('❌ Fallback geolocation also failed:', fallbackError);
              } else {
                console.warn('⏱️ Fallback geolocation timeout (location tracking may be unavailable)');
              }
              // Ensure error has code property
              if (!fallbackError.code) {
                fallbackError.code = 2; // POSITION_UNAVAILABLE
              }
              reject(fallbackError);
            },
            fallbackOptions
          );
        } else {
          // Permission denied or other error
          // Ensure error has code property
          if (!error.code) {
            error.code = 1; // PERMISSION_DENIED by default
          }
          reject(error);
        }
      },
      defaultOptions
    );
  });
};

/**
 * Watch user position and call callback on update
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @param {Object} options - Geolocation options
 * @returns {number} - Watch ID
 */
export const watchPosition = (onSuccess, onError, options = {}) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true, // Use GPS for high accuracy live tracking
    timeout: 30000, // 30 seconds timeout - increased for better reliability
    maximumAge: 60000, // Allow cached location up to 1 minute old - helps avoid timeouts
    ...options,
  };

  console.log('🔴 Starting live location watch with options:', defaultOptions);
  return navigator.geolocation.watchPosition(onSuccess, onError, defaultOptions);
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID from watchPosition
 */
export const clearWatch = (watchId) => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export default {
  getAddressFromCoordinates,
  updateUserLocation,
  getCurrentPosition,
  watchPosition,
  clearWatch,
};

