import Location from '../models/Location.js';
import User from '../models/User.js';

/**
 * @desc    Get latest locations for all users and guarantors
 * @route   GET /api/admin/locations/latest
 * @access  Private (Admin)
 */
export const getLatestLocations = async (req, res) => {
  try {
    const { userType } = req.query; // Optional filter: 'user' or 'guarantor'

    const query = { isLatest: true };
    if (userType && ['user', 'guarantor'].includes(userType)) {
      query.userType = userType;
    }

    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);

    // Get user details for each location
    const locationsWithDetails = await Promise.all(
      locations.map(async (loc) => {
        try {
          const user = await User.findById(loc.userId).select('name email phone role');
          return {
            locationId: loc._id,
            userId: loc.userId,
            userType: loc.userType,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            phone: user?.phone || '',
            role: user?.role || loc.userType,
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            address: loc.address,
            timestamp: loc.timestamp,
            lastUpdate: loc.timestamp,
          };
        } catch (err) {
          // If user not found, still return location data
          return {
            locationId: loc._id,
            userId: loc.userId,
            userType: loc.userType,
            name: 'Unknown',
            email: '',
            phone: '',
            role: loc.userType,
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            address: loc.address,
            timestamp: loc.timestamp,
            lastUpdate: loc.timestamp,
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: {
        locations: locationsWithDetails,
        count: locationsWithDetails.length,
      },
    });
  } catch (error) {
    console.error('Get latest locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get location history for a specific user
 * @route   GET /api/admin/locations/user/:userId
 * @access  Private (Admin)
 */
export const getUserLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType, limit = 100 } = req.query;

    const query = { userId };
    if (userType && ['user', 'guarantor'].includes(userType)) {
      query.userType = userType;
    }

    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        locations,
        count: locations.length,
      },
    });
  } catch (error) {
    console.error('Get user location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching location history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update user location (called by user/guarantor client)
 * @route   POST /api/location/update
 * @access  Private (User/Guarantor)
 */
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, speed, heading, altitude, address } = req.body;
    const userId = req.user?._id?.toString() || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    // Determine user type
    const user = await User.findById(userId).select('role');
    const userType = user?.role === 'guarantor' ? 'guarantor' : 'user';

    // Create new location entry
    const location = await Location.create({
      userId,
      userType,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null,
      altitude: altitude ? parseFloat(altitude) : null,
      address: address || '',
      timestamp: new Date(),
      isLatest: true,
    });

    // Update user's location in User model
    await User.findByIdAndUpdate(userId, {
      'location.latitude': lat,
      'location.longitude': lng,
      'location.address': address || '',
      'location.lastLocationUpdate': new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: {
          id: location._id,
          lat: location.lat,
          lng: location.lng,
          timestamp: location.timestamp,
        },
      },
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

