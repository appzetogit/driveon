/**
 * Google Maps Loader Utility
 * Ensures Google Maps script is loaded only once across the entire app
 */

let loadingPromise = null;
let isLoaded = false;
let loadError = null;

/**
 * Load Google Maps JavaScript API
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<void>}
 */
export const loadGoogleMaps = (apiKey) => {
  // If already loaded, return resolved promise
  if (isLoaded && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Check if script already exists in DOM
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    // Script exists, wait for it to load
    loadingPromise = new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          isLoaded = true;
          loadingPromise = null;
          clearInterval(checkLoaded);
          resolve();
        } else if (loadError) {
          clearInterval(checkLoaded);
          reject(loadError);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!isLoaded) {
          const error = new Error('Google Maps failed to load');
          loadError = error;
          loadingPromise = null;
          reject(error);
        }
      }, 10000);
    });

    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = new Promise((resolve, reject) => {
    if (!apiKey) {
      const error = new Error('Google Maps API key is required');
      loadError = error;
      loadingPromise = null;
      reject(error);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';

    script.onload = () => {
      if (window.google && window.google.maps) {
        isLoaded = true;
        loadError = null;
        loadingPromise = null;
        resolve();
      } else {
        const error = new Error('Google Maps loaded but not available');
        loadError = error;
        loadingPromise = null;
        reject(error);
      }
    };

    script.onerror = () => {
      const error = new Error('Failed to load Google Maps script');
      loadError = error;
      loadingPromise = null;
      document.head.removeChild(script);
      reject(error);
    };

    // Append to head
    document.head.appendChild(script);
  });

  return loadingPromise;
};

/**
 * Check if Google Maps is loaded
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};

/**
 * Reset loader state (for testing or error recovery)
 */
export const resetGoogleMapsLoader = () => {
  isLoaded = false;
  loadingPromise = null;
  loadError = null;
};

