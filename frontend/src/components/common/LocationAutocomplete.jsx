import { useEffect, useRef, useState } from 'react';

/**
 * Location Autocomplete Component
 * Uses Google Maps Places Autocomplete API for location suggestions
 */
const LocationAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  className = '', 
  style = {},
  onFocus,
  onBlur,
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps JavaScript API script
  useEffect(() => {
    let active = true;
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found for Places Autocomplete');
      return () => {};
    }

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsScriptLoaded(true);
      return () => {};
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Wait for script to load
      const handleLoad = () => {
        if (active) setIsScriptLoaded(true);
      };
      existingScript.addEventListener('load', handleLoad);
      if (window.google && window.google.maps) {
        setIsScriptLoaded(true);
      }
      return () => {
        active = false;
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    // Load Google Maps JavaScript API with Places library
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=en&region=in`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (active) setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);

    return () => {
      active = false;
      script.onload = null;
      script.onerror = null;
    };
  }, [GOOGLE_MAPS_API_KEY]);

  // Initialize Autocomplete when script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Initialize Autocomplete with comprehensive suggestions
    // Similar to Rapido - shows all places, addresses, streets, landmarks, etc.
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      // Remove types restriction to show all places (addresses, establishments, streets, landmarks, etc.)
      // This gives comprehensive suggestions like Rapido
      componentRestrictions: { country: 'in' }, // Restrict to India
      fields: [
        'formatted_address', 
        'geometry', 
        'address_components', 
        'place_id',
        'name', // For place names
        'types', // To identify what type of place it is
      ],
    });

    autocompleteRef.current = autocomplete;

    // Handle place selection
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place) return;
      
      // Get place name and address
      const placeName = place.name || '';
      const formattedAddress = place.formatted_address || '';
      
      // Determine what to display based on place type
      const placeTypes = place.types || [];
      const isEstablishment = placeTypes.some(type => 
        type === 'establishment' || 
        type === 'point_of_interest' || 
        type === 'store' || 
        type === 'restaurant' || 
        type === 'hospital' || 
        type === 'school' ||
        type === 'bank' ||
        type === 'gas_station'
      );
      
      // For establishments/POIs, show: "Place Name, Area, City"
      // For addresses/streets, show: "Street, Area, City"
      // For cities, show: "City, State"
      
      let displayText = '';
      
      if (isEstablishment && placeName) {
        // For places like "McDonald's", "Taj Hotel", etc.
        // Extract area and city from address components
        const addressComponents = place.address_components || [];
        let area = '';
        let city = '';
        let state = '';
        
        for (const component of addressComponents) {
          if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
            area = component.long_name;
          }
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        }
        
        // Format: "Place Name, Area, City" or "Place Name, City"
        if (area && city) {
          displayText = `${placeName}, ${area}, ${city}`;
        } else if (city) {
          displayText = `${placeName}, ${city}`;
        } else if (state) {
          displayText = `${placeName}, ${state}`;
        } else {
          displayText = placeName;
        }
      } else if (formattedAddress) {
        // For addresses and streets
        // Extract meaningful parts
        const addressComponents = place.address_components || [];
        let street = '';
        let area = '';
        let city = '';
        let state = '';
        
        for (const component of addressComponents) {
          if (component.types.includes('street_number') || component.types.includes('route')) {
            if (!street) {
              street = component.long_name;
            } else {
              street = `${street} ${component.long_name}`;
            }
          }
          if (component.types.includes('sublocality') || component.types.includes('sublocality_level_1')) {
            area = component.long_name;
          }
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        }
        
        // Format based on what we have
        if (street && area && city) {
          displayText = `${street}, ${area}, ${city}`;
        } else if (street && city) {
          displayText = `${street}, ${city}`;
        } else if (area && city) {
          displayText = `${area}, ${city}`;
        } else if (city && state) {
          displayText = `${city}, ${state}`;
        } else {
          // Fallback: use formatted address but shorten if too long
          const parts = formattedAddress.split(',');
          if (parts.length > 3) {
            displayText = parts.slice(0, 3).join(', ').trim();
          } else {
            displayText = formattedAddress;
          }
        }
      }
      
      if (displayText) {
        onChange(displayText);
      }
    });

    // Cleanup
    return () => {
      if (listener && listener.remove) {
        listener.remove();
      } else if (listener && window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isScriptLoaded, onChange]);

  // Handle focus and blur for styling
  const handleFocus = (e) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={className}
        style={style}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;

