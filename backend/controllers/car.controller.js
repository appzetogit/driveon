import mongoose from 'mongoose';
import Car from '../models/Car.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import OutwardBooking from '../models/OutwardBooking.js';

let lastOutwardSyncTime = 0;

/**
 * @desc    Get All Cars (Public)
 * @route   GET /api/cars
 * @access  Public
 */
export const getAllCars = async (req, res) => {
  try {
    // Perform dynamic sync for outward cars in the background (run once every 60s max)
    const now = Date.now();
    if (now - lastOutwardSyncTime > 60000) {
      lastOutwardSyncTime = now;
      const syncOutwardCars = async () => {
        try {
          const OutwardCar = mongoose.model('OutwardCar');
          if (OutwardCar) {
            const outwardCars = await OutwardCar.find({});
            const adminUser = await mongoose.model('User').findOne({ role: 'admin' }) || await mongoose.model('User').findOne({});
            const ownerId = adminUser ? adminUser._id : new mongoose.Types.ObjectId('60d5ec0f1f1d2c001f8e29a5');

            for (const outCar of outwardCars) {
              const shadowCar = await Car.findOne({ outwardCarId: outCar.originalOutputId });
              
              let isCarInRepair = false;
              if (shadowCar) {
                const RepairJob = mongoose.model('RepairJob');
                const activeRepair = await RepairJob.findOne({ car: shadowCar._id, status: { $nin: ['Completed', 'Cancelled'] } });
                if (activeRepair) {
                  isCarInRepair = true;
                }
              }

              const carData = {
                owner: ownerId,
                brand: outCar.brand || 'External',
                model: outCar.model || 'Vehicle',
                year: 2024,
                color: 'N/A',
                registrationNumber: outCar.carNumber || outCar.registrationNumber || `OUT-${outCar.originalOutputId.slice(-6).toUpperCase()}`,
                carType: 'suv',
                fuelType: 'petrol',
                transmission: 'automatic',
                seatingCapacity: 5,
                pricePerDay: outCar.pricePerDay || 1000,
                pricePerWeek: (outCar.pricePerDay || 1000) * 7,
                pricePerMonth: (outCar.pricePerDay || 1000) * 30,
                securityDeposit: 0,
                description: `This verified premium outward car is owned by ${outCar.ownerName} and managed by DriveOn partners.`,
                isAvailable: isCarInRepair ? false : true,
                status: 'active',
                images: outCar.image ? [{ url: outCar.image, isPrimary: true }] : [],
                location: {
                  city: outCar.location || 'Indore',
                  state: 'Madhya Pradesh',
                  address: outCar.location || 'Indore'
                },
                ownerInfo: {
                  name: outCar.ownerName,
                  email: 'partner@driveon.com',
                  phone: outCar.ownerPhone
                },
                ownerName: outCar.ownerName,
                source: 'outward',
                outwardCarId: outCar.originalOutputId,
                features: outCar.features || []
              };

              if (shadowCar) {
                // Only write to DB if the data actually changed to save IO operations
                let hasChanged = false;
                for (const key of Object.keys(carData)) {
                  if (key === 'location') {
                    if (shadowCar.location?.city !== carData.location.city) hasChanged = true;
                  } else if (key === 'features') {
                    if (shadowCar.features?.length !== carData.features.length) hasChanged = true;
                  } else if (shadowCar[key] !== carData[key]) {
                    hasChanged = true;
                  }
                }
                if (hasChanged) {
                  Object.assign(shadowCar, carData);
                  await shadowCar.save();
                }
              } else {
                await Car.create(carData);
              }
            }
          }
        } catch (syncErr) {
          console.error('Dynamic shadow car sync error:', syncErr);
        }
      };
      
      // Call async in background, do not await!
      syncOutwardCars();
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      brand,
      carType,
      fuelType,
      location,
      minPrice,
      maxPrice,
      status = 'active', // Only show active cars to public
      isAvailable = true,
      isFeatured,
      isPopular,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      availabilityStart,
      availabilityEnd,
    } = req.query;

    // Build query
    const query = {
      status: 'active', // Public can only see active cars
      isAvailable: isAvailable === 'true' || isAvailable === true,
    };

    // Exclude cars currently booked right now by default if no explicit date range is specified
    if (!availabilityStart || !availabilityEnd) {
      const currentDate = new Date();
      const currentDateISO = currentDate.toISOString();

      // 1. Conflicting normal bookings
      const currentConflictingBookings = await Booking.find({
        status: { $in: ['pending', 'confirmed', 'active'] },
        tripStatus: { $nin: ['completed', 'cancelled'] },
        $or: [
          {
            'tripStart.date': { $lte: currentDate },
            'tripEnd.date': { $gte: currentDate },
          }
        ],
      }).select('car');
      const currentExcludedIds = currentConflictingBookings.map(b => b.car).filter(Boolean);

      // 2. Conflicting inward/outward bookings
      const currentConflictingOutward = await OutwardBooking.find({
        status: 'active',
        fromDate: { $lte: currentDateISO },
        toDate: { $gte: currentDateISO }
      }).select('carId');
      const currentOutwardCarIds = currentConflictingOutward.map(b => b.carId).filter(Boolean);

      let currentOutwardExcludedIds = [];
      if (currentOutwardCarIds.length > 0) {
        const matchedCars = await Car.find({
          $or: [
            { outwardCarId: { $in: currentOutwardCarIds } },
            { _id: { $in: currentOutwardCarIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id)) } }
          ]
        }).select('_id');
        currentOutwardExcludedIds = matchedCars.map(c => c._id);
      }

      const totalExcludedIds = [...new Set([
        ...currentExcludedIds.map(id => id.toString()),
        ...currentOutwardExcludedIds.map(id => id.toString())
      ])].map(id => new mongoose.Types.ObjectId(id));

      if (totalExcludedIds.length > 0) {
        query._id = { $nin: totalExcludedIds };
      }
    }

    // Availability Filter (Date Range)
    if (availabilityStart && availabilityEnd) {
      const searchStart = new Date(availabilityStart);
      const searchEnd = new Date(availabilityEnd);

      console.log('--- Availability Debug ---');
      console.log('Search Start:', searchStart);
      console.log('Search End:', searchEnd);

      if (!isNaN(searchStart.getTime()) && !isNaN(searchEnd.getTime())) {
        const searchStartISO = searchStart.toISOString();
        const searchEndISO = searchEnd.toISOString();

        // 1. Find normal bookings that overlap with requested dates
        const conflictingBookings = await Booking.find({
          status: { $in: ['pending', 'confirmed', 'active'] },
          $or: [
            {
              'tripStart.date': { $lte: searchEnd },
              'tripEnd.date': { $gte: searchStart },
            }
          ],
        }).select('car');
        const excludedCarIds = conflictingBookings.map(b => b.car).filter(Boolean);

        // 2. Find inward/outward bookings that overlap with requested dates
        const conflictingOutwardBookings = await OutwardBooking.find({
          status: 'active',
          fromDate: { $lte: searchEndISO },
          toDate: { $gte: searchStartISO }
        }).select('carId');
        const outwardCarIds = conflictingOutwardBookings.map(b => b.carId).filter(Boolean);

        let outwardExcludedCarIds = [];
        if (outwardCarIds.length > 0) {
          const matchedCars = await Car.find({
            $or: [
              { outwardCarId: { $in: outwardCarIds } },
              { _id: { $in: outwardCarIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id)) } }
            ]
          }).select('_id');
          outwardExcludedCarIds = matchedCars.map(c => c._id);
        }

        const totalExcludedIds = [...new Set([
          ...excludedCarIds.map(id => id.toString()),
          ...outwardExcludedCarIds.map(id => id.toString())
        ])].map(id => new mongoose.Types.ObjectId(id));

        console.log('Conflicting Normal Bookings Found:', conflictingBookings.length);
        console.log('Conflicting Outward Bookings Found:', conflictingOutwardBookings.length);
        console.log('Total Excluded Car IDs:', totalExcludedIds);
        
        if (totalExcludedIds.length > 0) {
          query._id = { $nin: totalExcludedIds };
        }
      } else {
        console.log('Invalid dates provided');
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Car type filter - case-insensitive matching to show all models of the same type
    if (carType && carType !== 'all') {
      query.carType = { $regex: new RegExp(`^${carType}$`, 'i') };
    }

    // Fuel type filter
    if (fuelType && fuelType !== 'all') {
      query.fuelType = fuelType;
    }

    // Location filter
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Featured filter
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }

    // Popular filter
    if (isPopular === 'true' || isPopular === true) {
      query.isPopular = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get cars with pagination
    const cars = await Car.find(query)
      .populate('owner', 'name email phone profilePhoto')
      .select('-rejectionReason -approvedBy')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Car.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        cars,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching cars',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Car by ID (Public)
 * @route   GET /api/cars/:carId
 * @access  Public
 */
export const getCarById = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId)
      .populate('owner', 'name email phone profilePhoto')
      .select('-rejectionReason -approvedBy');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Perform real-time sync for features and other details on the details page itself!
    if (car.source === 'outward' && car.outwardCarId) {
      try {
        const OutwardCar = mongoose.model('OutwardCar');
        const outCar = await OutwardCar.findOne({ originalOutputId: car.outwardCarId });
        if (outCar) {
          const adminUser = await mongoose.model('User').findOne({ role: 'admin' }) || await mongoose.model('User').findOne({});
          const ownerId = adminUser ? adminUser._id : new mongoose.Types.ObjectId('60d5ec0f1f1d2c001f8e29a5');

          const RepairJob = mongoose.model('RepairJob');
          const activeRepair = await RepairJob.findOne({ car: car._id, status: { $nin: ['Completed', 'Cancelled'] } });
          const isCarInRepair = !!activeRepair;

          const carData = {
            owner: ownerId,
            brand: outCar.brand || car.brand,
            model: outCar.model || car.model,
            year: 2024,
            color: 'N/A',
            registrationNumber: outCar.carNumber || outCar.registrationNumber || car.registrationNumber,
            carType: 'suv',
            fuelType: 'petrol',
            transmission: 'automatic',
            seatingCapacity: 5,
            pricePerDay: outCar.pricePerDay || car.pricePerDay,
            pricePerWeek: (outCar.pricePerDay || 1000) * 7,
            pricePerMonth: (outCar.pricePerDay || 1000) * 30,
            securityDeposit: 0,
            description: `This verified premium outward car is owned by ${outCar.ownerName} and managed by DriveOn partners.`,
            isAvailable: isCarInRepair ? false : true,
            status: 'active',
            images: outCar.image ? [{ url: outCar.image, isPrimary: true }] : car.images,
            location: {
              city: outCar.location || 'Indore',
              state: 'Madhya Pradesh',
              address: outCar.location || 'Indore'
            },
            ownerInfo: {
              name: outCar.ownerName,
              email: 'partner@driveon.com',
              phone: outCar.ownerPhone
            },
            ownerName: outCar.ownerName,
            source: 'outward',
            outwardCarId: outCar.originalOutputId,
            features: outCar.features || []
          };

          let hasChanged = false;
          for (const key of Object.keys(carData)) {
            if (key === 'location') {
              if (car.location?.city !== carData.location.city) hasChanged = true;
            } else if (key === 'features') {
              if (car.features?.length !== carData.features.length) hasChanged = true;
            } else if (car[key] !== carData[key]) {
              hasChanged = true;
            }
          }
          if (hasChanged) {
            await Car.updateOne({ _id: carId }, { $set: carData });
            Object.assign(car, carData);
          }
        }
      } catch (syncErr) {
        console.error('Detail sync error in getCarById:', syncErr);
      }
    }

    // Only show active cars to public
    if (car.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Increment views atomically
    try {
      await Car.updateOne({ _id: carId }, { $inc: { views: 1 } });
      car.views += 1;
    } catch (viewErr) {
      console.error('Error incrementing car views:', viewErr);
    }

    res.status(200).json({
      success: true,
      data: { car },
    });
  } catch (error) {
    console.error('Get car by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching car',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Top Brands (Public)
 * @route   GET /api/cars/brands/top
 * @access  Public
 */
export const getTopBrands = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get brands with most active cars
    const brands = await Car.aggregate([
      {
        $match: {
          status: 'active',
          isAvailable: true,
        },
      },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          totalBookings: { $sum: '$totalBookings' },
        },
      },
      {
        $sort: { count: -1, totalBookings: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          brand: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 1] },
          totalBookings: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: { brands },
    });
  } catch (error) {
    console.error('Get top brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top brands',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Top Car Types (Public)
 * @route   GET /api/cars/types/top
 * @access  Public
 */
export const getTopCarTypes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get car types with most active cars and include a sample car for each type
    const carTypes = await Car.aggregate([
      {
        $match: {
          status: 'active',
          isAvailable: true,
        },
      },
      {
        $group: {
          _id: '$carType',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          totalBookings: { $sum: '$totalBookings' },
          // Get the first car (most recent or featured) for each type
          sampleCar: { $first: '$$ROOT' },
        },
      },
      {
        $sort: { count: -1, totalBookings: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          carType: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 1] },
          totalBookings: 1,
          sampleCar: {
            _id: '$sampleCar._id',
            brand: '$sampleCar.brand',
            model: '$sampleCar.model',
            year: '$sampleCar.year',
            pricePerDay: '$sampleCar.pricePerDay',
            images: '$sampleCar.images',
            primaryImage: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$sampleCar.images',
                    as: 'img',
                    cond: { $eq: ['$$img.isPrimary', true] },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: { carTypes },
    });
  } catch (error) {
    console.error('Get top car types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching top car types',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Available Cars Near Location (Public)
 * @route   GET /api/cars/nearby
 * @access  Public
 */
export const getNearbyCars = async (req, res) => {
  try {
    const {
      city,
      limit = 10,
      maxDistance = 50, // km
      latitude,
      longitude,
    } = req.query;

    let query = {
      status: 'active',
      isAvailable: true,
    };

    // Location filter
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Get cars
    let cars = await Car.find(query)
      .populate('owner', 'name email phone profilePhoto')
      .select('-rejectionReason -approvedBy')
      .sort({ isFeatured: -1, averageRating: -1, createdAt: -1 })
      .limit(parseInt(limit));

    // If coordinates provided, sort by distance (simplified - can use geospatial queries for better accuracy)
    if (latitude && longitude) {
      cars = cars.map(car => {
        if (car.location.coordinates?.latitude && car.location.coordinates?.longitude) {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            car.location.coordinates.latitude,
            car.location.coordinates.longitude
          );
          return { ...car.toObject(), distance };
        }
        return car.toObject();
      }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    res.status(200).json({
      success: true,
      data: { cars },
    });
  } catch (error) {
    console.error('Get nearby cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching nearby cars',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

