import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, isGoogleMapsLoaded } from '../../utils/googleMapsLoader';

/**
 * Google Maps Component
 * Displays Google Maps with markers for location tracking
 * 
 * @param {Object} props
 * @param {string} props.apiKey - Google Maps API key
 * @param {Array} props.markers - Array of marker objects { userId, name, lat, lng, userType, ... }
 * @param {Object} props.center - Center coordinates { lat, lng }
 * @param {number} props.zoom - Initial zoom level
 * @param {Function} props.onMarkerClick - Callback when marker is clicked
 * @param {string} props.height - Map height (default: '100%')
 */
const GoogleMap = ({
  apiKey,
  markers = [],
  center = { lat: 20.5937, lng: 78.9629 }, // India center
  zoom = 5,
  onMarkerClick,
  height = '100%',
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({}); // { userId: google.maps.Marker }
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load Google Maps script using singleton loader
  useEffect(() => {
    let isMounted = true;
    if (!apiKey) {
      setError('Google Maps API key is required');
      return;
    }

    // Check if already loaded
    if (isGoogleMapsLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Load using singleton loader
    loadGoogleMaps(apiKey)
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load Google Maps:', err);
          setError(err.message || 'Failed to load Google Maps');
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstance.current) return;

    try {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [isLoaded, center, zoom]);

  // Update markers
  // eslint-disable-next-line react-doctor/effect-needs-cleanup
  useEffect(() => {
    if (!isLoaded || !mapInstance.current) return;

    // Create unique key for each marker (userId + userType to handle edge cases)
    const getMarkerKey = (markerData) => {
      return `${markerData.userId}-${markerData.userType || 'user'}`;
    };

    // Remove markers that are no longer in the list
    Object.keys(markersRef.current).forEach((key) => {
      if (!markers.find((m) => getMarkerKey(m) === key)) {
        markersRef.current[key].setMap(null);
        delete markersRef.current[key];
      }
    });

    // Update or create markers
    markers.forEach((markerData) => {
      const { userId, name, lat, lng, userType, accuracy, speed, timestamp } = markerData;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const markerKey = getMarkerKey(markerData);

      // Use custom location icon from public folder
      const markerIcon = {
        url: '/locationicon.png',
        scaledSize: new window.google.maps.Size(40, 40), // Adjust size as needed
        anchor: new window.google.maps.Point(20, 40), // Center bottom of icon
        origin: new window.google.maps.Point(0, 0),
      };

      if (markersRef.current[markerKey]) {
        // Update existing marker position
        const existingMarker = markersRef.current[markerKey];
        const currentPos = existingMarker.getPosition();
        const newPos = new window.google.maps.LatLng(position.lat, position.lng);
        
        // Always update position (even if same) to ensure marker is refreshed
        existingMarker.setPosition(newPos);
        
        // Only log if position actually changed
        if (currentPos.lat() !== position.lat || currentPos.lng() !== position.lng) {
          console.log(`📍 Updated marker position for ${name || userId}:`, position);
        }
        
        // Always update info window content with latest data (including timestamp)
        const updateTime = timestamp ? new Date(timestamp).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: true 
        }) : 'Unknown';
        
        const infoContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333;">
              ${name || 'Unknown'}
            </h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              <strong>Type:</strong> ${userType === 'guarantor' ? 'Guarantor' : 'User'}
            </p>
            ${accuracy ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Accuracy:</strong> ${Math.round(accuracy)}m</p>` : ''}
            ${speed ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Speed:</strong> ${Math.round(speed)} km/h</p>` : ''}
            <p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Updated:</strong> ${updateTime}</p>
          </div>
        `;
        existingMarker.infoWindow.setContent(infoContent);
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: position,
          map: mapInstance.current,
          title: name || userId,
          icon: markerIcon,
          animation: window.google.maps.Animation.DROP,
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #333;">
                ${name || 'Unknown'}
              </h3>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Type:</strong> ${userType === 'guarantor' ? 'Guarantor' : 'User'}
              </p>
              ${accuracy ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Accuracy:</strong> ${Math.round(accuracy)}m</p>` : ''}
              ${speed ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Speed:</strong> ${Math.round(speed)} km/h</p>` : ''}
              ${timestamp ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Updated:</strong> ${new Date(timestamp).toLocaleTimeString()}</p>` : ''}
            </div>
          `,
        });

        // Add click listener
        marker.addListener('click', () => {
          // Close all other info windows
          Object.values(markersRef.current).forEach((m) => {
            if (m.infoWindow) {
              m.infoWindow.close();
            }
          });
          
          infoWindow.open(mapInstance.current, marker);
          
          if (onMarkerClick) {
            onMarkerClick(markerData);
          }
        });

        marker.infoWindow = infoWindow;
        markersRef.current[markerKey] = marker;
        console.log(`📍 Created new marker for ${name || userId}:`, position);
      }
    });
  }, [isLoaded, markers, onMarkerClick]);

  // Update map center when markers change
  useEffect(() => {
    if (!isLoaded || !mapInstance.current || markers.length === 0) return;

    // If there's only one marker, center on it
    if (markers.length === 1 && markers[0].lat && markers[0].lng) {
      mapInstance.current.setCenter({
        lat: parseFloat(markers[0].lat),
        lng: parseFloat(markers[0].lng),
      });
      mapInstance.current.setZoom(15);
    } else if (markers.length > 1) {
      // Fit bounds to show all markers
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) => {
        if (marker.lat && marker.lng && !isNaN(marker.lat) && !isNaN(marker.lng)) {
          bounds.extend({
            lat: parseFloat(marker.lat),
            lng: parseFloat(marker.lng),
          });
        }
      });
      if (!bounds.isEmpty()) {
        mapInstance.current.fitBounds(bounds);
      }
    }
  }, [isLoaded, markers]);

  if (error) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#ef4444', marginBottom: '8px' }}>❌ {error}</p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Please check your Google Maps API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#6b7280' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleMap;

