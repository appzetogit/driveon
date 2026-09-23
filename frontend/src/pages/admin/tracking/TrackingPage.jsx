import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import GoogleMap from '../../../components/common/GoogleMap';
import { adminService } from '../../../services/admin.service';
import { SOCKET_URL } from '../../../config/api';

/**
 * Tracking Page
 * Admin can view live locations of users and guarantors on Google Maps
 */
const TrackingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);

  // Get initial view from URL
  const getInitialView = () => {
    if (location.pathname.includes('/active')) return 'active';
    if (location.pathname.includes('/history')) return 'history';
    return 'active';
  };

  // State management
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(getInitialView()); // active, history
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, user, guarantor
  const [userId, setUserId] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [addressCache, setAddressCache] = useState({});

  // Google Maps API Key (should be in environment variable)
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Connect to Socket.IO for real-time updates
  // eslint-disable-next-line react-doctor/effect-needs-cleanup
  useEffect(() => {
    // Get admin token from localStorage
    const adminToken = localStorage.getItem('adminToken');

    if (!adminToken) {
      setError('Admin authentication required');
      setLoading(false);
      return;
    }

    // SUPER FALLBACK: If SOCKET_URL is broken (like "https://https"), 
    // force it to the correct production backend.
    let finalSocketUrl = SOCKET_URL;

    // Extra aggressive check: if hostname is literally 'https' or url contains it incorrectly
    try {
      const checkUrl = new URL(finalSocketUrl);
      if (checkUrl.hostname === 'https' || checkUrl.hostname === 'undefined' || !checkUrl.hostname.includes('.')) {
        throw new Error('Invalid hostname');
      }
    } catch (e) {
      console.warn('⚠️ Malformed SOCKET_URL detected, using production fallback:', finalSocketUrl);
      finalSocketUrl = 'https://driveon-19hg.onrender.com';
    }

    console.log('🔌 Attempting socket connection to:', finalSocketUrl);

    socketRef.current = io(finalSocketUrl, {
      transports: ['websocket', 'polling'], // Prioritize websocket
      withCredentials: true, // Required for CORS when backend has credentials:true
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
      auth: {
        token: adminToken,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Admin socket connected:', socketRef.current.id);
      setIsConnected(true);

      // Register as admin
      socketRef.current.emit('register', {
        role: 'admin',
        userId: 'admin', // Admin doesn't need a specific userId
      });
    });

    socketRef.current.on('registered', (data) => {
      console.log('✅ Admin registered:', data);

      // Request latest locations
      socketRef.current.emit('location:request');
    });

    // Receive location updates
    socketRef.current.on('location:update', (locationData) => {
      console.log('📍 Location update received:', locationData);

      setLocations((prev) => {
        // Update or add location
        const existingIndex = prev.findIndex(
          (loc) => loc.userId === locationData.userId && loc.userType === locationData.userType
        );

        if (existingIndex >= 0) {
          // Update existing location - create completely new object to ensure React detects change
          const updated = prev.map((loc, index) => {
            if (index === existingIndex) {
              // Create new object with all updated data
              return {
                ...locationData,
                // Ensure all fields are updated, especially timestamp
                timestamp: locationData.timestamp || new Date().toISOString(),
                lat: parseFloat(locationData.lat),
                lng: parseFloat(locationData.lng),
                accuracy: locationData.accuracy ? parseFloat(locationData.accuracy) : null,
                speed: locationData.speed ? parseFloat(locationData.speed) : null,
                heading: locationData.heading ? parseFloat(locationData.heading) : null,
                address: locationData.address || '',
              };
            }
            return loc;
          });
          console.log('📍 Updated location for user:', locationData.userId, updated[existingIndex]);
          return updated;
        } else {
          // Add new location
          console.log('📍 Added new location for user:', locationData.userId);
          return [...prev, {
            ...locationData,
            timestamp: locationData.timestamp || new Date().toISOString(),
            lat: parseFloat(locationData.lat),
            lng: parseFloat(locationData.lng),
            accuracy: locationData.accuracy ? parseFloat(locationData.accuracy) : null,
            speed: locationData.speed ? parseFloat(locationData.speed) : null,
            heading: locationData.heading ? parseFloat(locationData.heading) : null,
            address: locationData.address || '',
          }];
        }
      });

      // Clear address cache for this location to force refresh
      const locationKey = `${locationData.userId}-${locationData.userType}`;
      setAddressCache((prev) => {
        const newCache = { ...prev };
        // Remove cached address so it gets refreshed with new location
        delete newCache[locationKey];
        return newCache;
      });
    });

    // Receive latest locations batch
    socketRef.current.on('location:latest', (data) => {
      console.log('📍 Latest locations received:', data.locations.length);
      setLocations(data.locations || []);
      setLoading(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Admin socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      const errorMessage = err.message || 'Failed to connect to server';
      // Provide more helpful error messages
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network')) {
        setError('Cannot connect to server. Please ensure the backend server is running on port 5000.');
      } else {
        setError(`Connection error: ${errorMessage}`);
      }
      setIsConnected(false);
      setLoading(false);
    });

    socketRef.current.on('error', (data) => {
      console.error('❌ Socket error:', data);
      setError(data.message || 'Connection error');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Fetch initial locations via REST API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (filterType !== 'all') {
          params.userType = filterType;
        }

        const response = await adminService.getLatestLocations(params);
        setLocations(response.data?.locations || []);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(err.response?.data?.message || 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    };

    if (viewMode === 'active') {
      fetchLocations();
    }
  }, [viewMode, filterType]);




  // Function to fetch user details (reusable)
  const fetchUserDetails = async (idOfUser) => {
    if (!idOfUser || idOfUser.trim() === '') return;

    try {
      setUserLoading(true);
      setUserError(null);

      const trimmedId = idOfUser.trim();
      const response = await adminService.getUserById(trimmedId);

      if (response && response.success && response.data?.user) {
        setUserDetails(response.data.user);
        setUserError(null);
        // Persist successful search - REMOVED per user request
        // localStorage.setItem('admin_tracking_search_userId', trimmedId);
      } else {
        setUserError('User not found');
        setUserDetails(null);
        // Don't clear storage on transient errors, but maybe if definitely not found?
        // Let's keep it for now so they can correct it
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setUserError(err.response?.data?.message || 'User not found');
      setUserDetails(null);
    } finally {
      setUserLoading(false);
    }
  };

  // Function to search user by ID (triggered by button)
  const handleSearchUser = () => {
    fetchUserDetails(userId);
  };

  // Restore search from local storage on mount - REMOVED per user request
  /* 
  useEffect(() => {
    const savedUserId = localStorage.getItem('admin_tracking_search_userId');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchUserDetails(savedUserId);
    }
  }, []);
  */

  // Handle Enter key press in user input field
  const handleUserKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchUser();
    }
  };

  // Filter locations based on filterType or userId
  const filteredLocations = locations.filter((loc) => {
    // If User ID is provided, show only that user's location
    if (userId && userDetails) {
      const searchUserId = userDetails._id?.toString() || userDetails.id?.toString() || userDetails?.toString();
      if (loc.userId === searchUserId) {
        return true;
      }
      return false;
    }

    // Default: Return false to show NO users until a search is performed
    // satisfying "active me niche dikhna chiaye jo seach kiya wo user"
    return false;
  });

  // Convert locations to map markers - use useMemo to ensure updates trigger re-renders
  const mapMarkers = useMemo(() => {
    return filteredLocations
      .filter((loc) => loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng))
      .map((loc) => ({
        userId: loc.userId,
        name: loc.name || 'Unknown',
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lng),
        userType: loc.userType,
        accuracy: loc.accuracy,
        speed: loc.speed,
        timestamp: loc.timestamp,
        email: loc.email,
        phone: loc.phone,
      }));
  }, [filteredLocations]);

  // Resolve human-readable addresses on admin side for locations that don't have address
  useEffect(() => {
    let isMounted = true;
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();

    filteredLocations.forEach((loc) => {
      const key = `${loc.userId}-${loc.userType}`;

      // Skip if we already have an address or it's cached
      if ((loc.address && loc.address.trim() !== '') || addressCache[key]) return;
      if (!loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return;

      geocoder.geocode(
        {
          location: {
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lng),
          },
        },
        (results, status) => {
          if (isMounted && status === 'OK' && results && results[0]) {
            const addr = results[0].formatted_address;
            if (addr) {
              setAddressCache((prev) => ({
                ...prev,
                [key]: addr,
              }));
            }
          }
        }
      );
    });

    return () => {
      isMounted = false;
    };
  }, [filteredLocations, addressCache]);

  const handleMarkerClick = (markerData) => {
    setSelectedLocation(markerData);
    setShowLocationDetail(true);
  };

  // Stats calculation
  const stats = {
    total: locations.length,
    users: locations.filter((loc) => loc.userType === 'user').length,
    guarantors: locations.filter((loc) => loc.userType === 'guarantor').length,
    active: filteredLocations.length,
  };

  if (loading && locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading location data...</p>
        </div>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
                Location & Tracking
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Track live locations of users
                {isConnected && (
                  <span className="ml-2 inline-flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    Live
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* User ID Search */}
        <Card className="p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by User ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleUserKeyPress}
                  placeholder="Enter User ID (e.g. user-255f6), Phone, Email, or Name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  onClick={handleSearchUser}
                  disabled={userLoading || !userId.trim()}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  {userLoading ? 'Searching...' : 'Search'}
                </button>
                {userId && (
                  <button
                    onClick={() => {
                      setUserId('');
                      setUserDetails(null);
                      setUserError(null);
                      // localStorage.removeItem('admin_tracking_search_userId');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {userLoading && (
                <p className="text-xs text-gray-500 mt-2">Searching user...</p>
              )}
              {userError && (
                <p className="text-xs text-red-600 mt-2">❌ {userError}</p>
              )}
              {userDetails && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-800 mb-1">
                    ✅ User Found: {userDetails.name || userDetails.email || 'N/A'}
                  </p>
                  <div className="text-xs text-green-700 space-y-1">
                    <p>
                      <strong>User ID:</strong> <span className="font-mono bg-green-100 px-1 rounded">user-{(userDetails._id?.toString() || userDetails.id?.toString() || '').slice(-5)}</span>
                    </p>
                    <p>
                      <strong>Name:</strong> {userDetails.name || 'N/A'}
                    </p>
                    <p>
                      <strong>Email:</strong> {userDetails.email || 'N/A'}
                    </p>
                    <p>
                      <strong>Phone:</strong> {userDetails.phone || 'N/A'}
                    </p>
                    <p>
                      <strong>Role:</strong> <span className="capitalize">{userDetails.role || 'user'}</span>
                    </p>
                    {filteredLocations.some(loc => {
                      const searchUserId = userDetails._id?.toString() || userDetails.id?.toString();
                      return loc.userId === searchUserId;
                    }) ? (
                      <p className="mt-2">
                        <span className="text-green-600 font-semibold">📍 Live Location Available</span>
                      </p>
                    ) : (
                      <p className="mt-2">
                        <span className="text-gray-500">⏸️ Location tracking not active</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Google Map View */}
        {
          viewMode === 'active' && (
            <>
              <Card className="p-4 md:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Live Map View</h2>
                    {userDetails && (
                      <p className="text-xs text-gray-600 mt-1">
                        Showing location for User: <span className="font-semibold">{userDetails.name || userDetails.email || 'N/A'}</span>
                      </p>
                    )}
                  </div>
                  {!GOOGLE_MAPS_API_KEY && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      ⚠️ Google Maps API key not configured
                    </span>
                  )}
                </div>
                {userDetails && filteredLocations.length === 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No live location found for this user. The user needs to enable location tracking in their app.
                    </p>
                    <div className="mt-2 text-xs text-yellow-700">
                      <p><strong>User:</strong> {userDetails.name || 'N/A'} ({userDetails.email || 'N/A'}) - Location tracking may not be active</p>
                    </div>
                  </div>
                )}
                {GOOGLE_MAPS_API_KEY ? (
                  <div style={{ height: '600px', width: '100%' }}>
                    <GoogleMap
                      apiKey={GOOGLE_MAPS_API_KEY}
                      markers={mapMarkers}
                      center={
                        mapMarkers.length === 1
                          ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng }
                          : mapMarkers.length > 0
                            ? { lat: 20.5937, lng: 78.9629 }
                            : { lat: 20.5937, lng: 78.9629 }
                      }
                      zoom={mapMarkers.length === 1 ? 15 : 5}
                      onMarkerClick={handleMarkerClick}
                      height="600px"
                    />
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">Google Maps API key required</p>
                      <p className="text-sm text-gray-400">
                        Set VITE_GOOGLE_MAPS_API_KEY in your .env file
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Locations List */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {userDetails
                    ? `User Location (${filteredLocations.length})`
                    : `Active Locations (${filteredLocations.length})`}
                </h2>
              </div>

              <div className="space-y-4">
                {filteredLocations.length === 0 && userDetails && (
                  <Card className="p-8 text-center">
                    <p className="text-gray-600 mb-2">No live location available for this user.</p>
                    <p className="text-sm text-gray-500">
                      The user needs to enable location tracking in their app.
                    </p>
                  </Card>
                )}
                {filteredLocations.map((loc) => {
                  const locationKey = `${loc.userId}-${loc.userType}`;
                  const displayAddress =
                    loc.address && loc.address.trim() !== ''
                      ? loc.address
                      : addressCache[locationKey] || '';

                  // Create unique key that includes timestamp to force re-render on updates
                  const uniqueKey = `${loc.userId}-${loc.userType}-${loc.timestamp || Date.now()}`;

                  return (
                    <Card key={uniqueKey} className="p-4 hover:shadow-lg transition-all">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Location Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {loc.name || 'Unknown'} <span className="text-xs font-mono text-gray-500 ml-1">(user-{loc.userId?.slice(-5)})</span>
                              </h3>
                              <p className="text-sm text-gray-500 mb-2">
                                {loc.userType === 'guarantor' ? '🛡️ Guarantor' : '👤 User'}
                                {loc.email && ` • ${loc.email}`}
                                {loc.phone && ` • ${loc.phone}`}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${loc.userType === 'guarantor'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {loc.userType === 'guarantor' ? 'Guarantor' : 'User'}
                            </span>
                          </div>

                          {/* Location Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-600">Coordinates</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {loc.lat?.toFixed(6)}, {loc.lng?.toFixed(6)}
                              </p>
                            </div>
                            {loc.accuracy && (
                              <div>
                                <p className="text-xs text-gray-600">Accuracy</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {Math.round(loc.accuracy)}m
                                </p>
                              </div>
                            )}
                            {loc.speed && (
                              <div>
                                <p className="text-xs text-gray-600">Speed</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {Math.round(loc.speed)} km/h
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600">Last Update</p>
                              <p className="text-sm font-semibold text-gray-900" key={`timestamp-${loc.timestamp}`}>
                                {loc.timestamp
                                  ? (() => {
                                    const updateDate = new Date(loc.timestamp);
                                    const now = new Date();
                                    const diffMs = now - updateDate;
                                    const diffMins = Math.floor(diffMs / 60000);

                                    // If updated within last 5 minutes, show "Live" indicator
                                    if (diffMins < 5) {
                                      return (
                                        <span className="flex items-center gap-1">
                                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                          {updateDate.toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: true
                                          })}
                                        </span>
                                      );
                                    }

                                    // Otherwise show full date and time
                                    return updateDate.toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    });
                                  })()
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-xs text-gray-600">Current Location</p>
                              <p className="text-sm font-semibold text-gray-900 whitespace-normal break-words">
                                {displayAddress || 'Fetching address...'}
                              </p>
                            </div>
                          </div>

                          {/* Address icon row removed to avoid duplication; full address shown above */}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 md:w-40">
                          <button
                            onClick={() => handleMarkerClick(loc)}
                            className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                            style={{ backgroundColor: colors.backgroundTertiary }}
                          >
                            View on Map
                          </button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {filteredLocations.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">Please search for a user to view their live location.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Enter User ID, Name, or Phone in the search bar above.
                  </p>
                </Card>
              )}
            </>
          )}
      </div >

      {/* Location Detail Modal */}
      {
        showLocationDetail && selectedLocation && (
          <LocationDetailModal
            location={selectedLocation}
            onClose={() => {
              setShowLocationDetail(false);
              setSelectedLocation(null);
            }}
          />
        )
      }
    </div >
  );
};

/**
 * Location Detail Modal Component
 */
const LocationDetailModal = ({ location, onClose }) => {
  if (!location) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{location.name || 'Unknown'}</h2>
            <p className="text-sm text-gray-600">
              {location.userType === 'guarantor' ? 'Guarantor' : 'User'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Latitude</label>
                  <p className="text-sm text-gray-900">{location.lat?.toFixed(6)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Longitude</label>
                  <p className="text-sm text-gray-900">{location.lng?.toFixed(6)}</p>
                </div>
                {location.accuracy && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Accuracy</label>
                    <p className="text-sm text-gray-900">{Math.round(location.accuracy)} meters</p>
                  </div>
                )}
                {location.speed && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Speed</label>
                    <p className="text-sm text-gray-900">{Math.round(location.speed)} km/h</p>
                  </div>
                )}
                {location.heading && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Heading</label>
                    <p className="text-sm text-gray-900">{Math.round(location.heading)}°</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-700">Last Update</label>
                  <p className="text-sm text-gray-900">
                    {location.timestamp
                      ? (() => {
                        const updateDate = new Date(location.timestamp);
                        const now = new Date();
                        const diffMs = now - updateDate;
                        const diffMins = Math.floor(diffMs / 60000);

                        // If updated within last 5 minutes, show "Live" indicator
                        if (diffMins < 5) {
                          return (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              {updateDate.toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </span>
                          );
                        }

                        // Otherwise show full date and time
                        return updateDate.toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        });
                      })()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {location.email && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{location.email}</p>
                  </div>
                )}
                {location.phone && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{location.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-700">User Type</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {location.userType === 'guarantor' ? 'Guarantor' : 'User'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900 font-mono">user-{location.userId?.slice(-5)}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {location.address && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <p className="text-sm text-gray-900">📍 {location.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
