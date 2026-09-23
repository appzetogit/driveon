import Car from '../models/Car.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import RepairJob from '../models/RepairJob.js';
import { uploadImage, deleteImage } from '../services/cloudinary.service.js';
import mongoose from 'mongoose';
import OutwardBooking from '../models/OutwardBooking.js';

/**
 * @desc    Get All Cars (Admin)
 * @route   GET /api/admin/cars
 * @access  Private (Admin)
 */
export const getAllCars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      carType,
      brand,
      location,
      owner,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Brand filter
    if (brand && brand !== 'all') {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Car type filter
    if (carType && carType !== 'all') {
      query.carType = carType;
    }

    // Location filter
    if (location && location !== 'all') {
      query['location.city'] = { $regex: location, $options: 'i' };
    }

    // Owner filter
    if (owner && owner !== 'all') {
      query.owner = owner;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get cars with pagination
    const cars = await Car.find(query)
      .populate('owner', 'name email phone profilePhoto')
      .populate('approvedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Car.countDocuments(query);

    // Get booking stats and revenue dynamically
    const carIds = cars.map(c => c._id);
    const bookingAggregation = await Booking.aggregate([
      { 
        $match: { 
          car: { $in: carIds },
          paymentStatus: { $in: ['paid', 'partial'] }
        } 
      },
      {
        $group: {
          _id: '$car',
          count: { $sum: 1 },
          revenue: {
            $sum: { $ifNull: ['$paidAmount', 0] }
          }
        }
      }
    ]);

    // Also fetch bookings from OutwardBooking collection
    const carIdStrings = carIds.map(id => id.toString());
    const outwardBookingAggregation = await OutwardBooking.aggregate([
      { 
        $match: { 
          carId: { $in: carIdStrings },
          paymentStatus: { $in: ['paid', 'partial'] }
        } 
      },
      {
        $group: {
          _id: '$carId',
          count: { $sum: 1 },
          revenue: {
            $sum: { $ifNull: ['$paidAmount', 0] }
          }
        }
      }
    ]);

    const activeBookingAggregation = await Booking.aggregate([
      { 
        $match: { 
          car: { $in: carIds },
          status: { $in: ['pending', 'confirmed', 'active'] },
          'tripEnd.date': { $gte: new Date() }
        } 
      },
      {
        $group: {
          _id: '$car'
        }
      }
    ]);

    const bookingStatsMap = {};
    bookingAggregation.forEach(stat => {
      if (stat._id) {
        bookingStatsMap[stat._id.toString()] = {
          count: stat.count,
          revenue: stat.revenue
        };
      }
    });

    outwardBookingAggregation.forEach(stat => {
      if (stat._id) {
        const idStr = stat._id.toString();
        if (!bookingStatsMap[idStr]) {
          bookingStatsMap[idStr] = { count: 0, revenue: 0 };
        }
        bookingStatsMap[idStr].count += stat.count;
        bookingStatsMap[idStr].revenue += stat.revenue;
      }
    });

    const activeBookingMap = {};
    activeBookingAggregation.forEach(stat => {
      if (stat._id) {
        activeBookingMap[stat._id.toString()] = true;
      }
    });

    // Query active repair jobs for these cars
    const activeRepairs = await RepairJob.find({
      car: { $in: carIds },
      status: { $nin: ['Completed', 'Cancelled'] }
    });

    const activeRepairsMap = {};
    activeRepairs.forEach(job => {
      if (job.car) {
        activeRepairsMap[job.car.toString()] = true;
      }
    });

    const carsWithStats = cars.map(car => {
      const stats = bookingStatsMap[car._id.toString()] || { count: 0, revenue: 0 };
      const carObj = car.toObject();
      carObj.totalBookings = stats.count;
      carObj.totalRevenue = stats.revenue;
      carObj.isCurrentlyBooked = !!activeBookingMap[car._id.toString()];
      carObj.isInActiveRepair = !!activeRepairsMap[car._id.toString()];
      return carObj;
    });

    // Get stats
    const stats = {
      total: await Car.countDocuments({}),
      active: await Car.countDocuments({ status: 'active' }),
      pending: await Car.countDocuments({ status: 'pending' }),
      inactive: await Car.countDocuments({ status: 'inactive' }),
      suspended: await Car.countDocuments({ status: 'suspended' }),
      available: await Car.countDocuments({ isAvailable: true, status: 'active' }),
    };

    res.status(200).json({
      success: true,
      data: {
        cars: carsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get all cars (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching cars',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Create New Car (Admin)
 * @route   POST /api/admin/cars
 * @access  Private (Admin)
 */
export const createCar = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Log received data for debugging
    console.log('\n📝 CREATE CAR - Received data:');
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body:', JSON.stringify(req.body, null, 2));

    // Extract car data from request body (FormData)
    const {
      brand,
      model,
      year,
      color,
      registrationNumber,
      carType,
      fuelType,
      transmission,
      seatingCapacity,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      securityDeposit,
      description,
      mileage,
      engineCapacity,
      ownerName,
      ownerEmail,
      ownerId,
      isAvailable,
    } = req.body;

    // Owner is not provided in form, so use admin ID as owner
    const owner = adminId;

    // Parse location from FormData (multer parses nested fields differently)
    const location = {
      city: req.body['location[city]'] || req.body.city || req.body['location.city'],
      state: req.body['location[state]'] || req.body.state || req.body['location.state'],
      address: req.body['location[address]'] || req.body.address || req.body['location.address'],
      coordinates: {},
    };

    console.log('Parsed location:', location);

    // Parse coordinates if provided
    if (req.body['location[coordinates][latitude]'] || req.body.latitude) {
      location.coordinates.latitude = parseFloat(
        req.body['location[coordinates][latitude]'] || req.body.latitude
      );
    }
    if (req.body['location[coordinates][longitude]'] || req.body.longitude) {
      location.coordinates.longitude = parseFloat(
        req.body['location[coordinates][longitude]'] || req.body.longitude
      );
    }

    // Parse features from FormData (could be JSON string or array)
    let features = [];
    if (req.body.features) {
      try {
        features = typeof req.body.features === 'string'
          ? JSON.parse(req.body.features)
          : req.body.features;
      } catch (e) {
        // If not JSON, treat as comma-separated string
        features = req.body.features.split(',').map(f => f.trim()).filter(f => f);
      }
    }

    // Validate required fields with detailed error messages (check for empty strings too)
    const missingFields = [];
    if (!brand || brand.trim() === '') missingFields.push('brand');
    if (!model || model.trim() === '') missingFields.push('model');
    if (!year || year === '' || isNaN(year)) missingFields.push('year');
    if (!registrationNumber || registrationNumber.trim() === '') missingFields.push('registrationNumber');
    if (!carType || carType.trim() === '') missingFields.push('carType');
    if (!fuelType || fuelType.trim() === '') missingFields.push('fuelType');
    if (!transmission || transmission.trim() === '') missingFields.push('transmission');
    if (!seatingCapacity || seatingCapacity === '' || isNaN(seatingCapacity)) missingFields.push('seatingCapacity');
    if (!pricePerDay || pricePerDay === '' || isNaN(pricePerDay)) missingFields.push('pricePerDay');
    if (!securityDeposit || securityDeposit === '' || isNaN(securityDeposit)) missingFields.push('securityDeposit');
    if (!location?.city || location.city.trim() === '') missingFields.push('location.city');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      console.error('Received data:', {
        brand, model, year, registrationNumber, carType, fuelType, transmission,
        seatingCapacity, pricePerDay, securityDeposit, location,
        'req.body keys': Object.keys(req.body),
      });
      return res.status(400).json({
        success: false,
        message: `Please provide all required fields. Missing: ${missingFields.join(', ')}`,
        missingFields,
      });
    }

    // Check if registration number already exists
    const existingCar = await Car.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existingCar) {
      return res.status(400).json({
        success: false,
        message: 'Car with this registration number already exists',
      });
    }

    // Owner is set to admin ID (admin is adding the car)
    // Verify admin exists (should always exist since they're authenticated)
    const adminUser = await User.findById(adminId);
    if (!adminUser) {
      // If admin is not a User, that's okay - we'll use adminId directly
      // The Car model will handle the owner reference
    }

    // Handle image uploads
    const images = [];
    if (req.files) {
      // Handle multiple images
      if (req.files.images) {
        const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

        // Validate minimum 2 images
        if (imageFiles.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Minimum 2 images are required',
          });
        }

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const uploadResult = await uploadImage(file, {
              folder: 'driveon/cars',
              width: 1200,
              height: 800,
            });

            images.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              isPrimary: i === 0, // First image is primary
            });
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      } else {
        // No images provided
        return res.status(400).json({
          success: false,
          message: 'Minimum 2 images are required',
        });
      }
    } else {
      // No files at all
      return res.status(400).json({
        success: false,
        message: 'Minimum 2 images are required',
      });
    }

    // Handle RC document upload
    let rcDocument = null;
    if (req.files && req.files.rcDocument) {
      const rcFile = Array.isArray(req.files.rcDocument) ? req.files.rcDocument[0] : req.files.rcDocument;
      try {
        const uploadResult = await uploadImage(rcFile, {
          folder: 'driveon/cars/documents',
        });

        rcDocument = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (error) {
        console.error('Error uploading RC document:', error);
      }
    }

    // Create car
    const carData = {
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year),
      color: color?.trim(),
      registrationNumber: registrationNumber.toUpperCase().trim(),
      carType,
      fuelType,
      transmission,
      seatingCapacity: parseInt(seatingCapacity),
      pricePerDay: parseFloat(pricePerDay),
      pricePerWeek: pricePerWeek ? parseFloat(pricePerWeek) : undefined,
      pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : undefined,
      securityDeposit: parseFloat(securityDeposit),
      location: {
        city: location.city.trim(),
        state: location.state?.trim(),
        address: location.address?.trim(),
        coordinates: location.coordinates || {},
      },
      owner,
      images,
      features: Array.isArray(features) ? features : (features ? features.split(',').map(f => f.trim()) : []),
      description: description?.trim(),
      mileage: mileage ? parseFloat(mileage) : undefined,
      engineCapacity: engineCapacity?.trim(),
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
      status: 'pending', // New cars start as pending
      rcDocument,
      ownerInfo: {
        name: ownerName?.trim(),
        email: ownerEmail?.trim(),
        ownerId: ownerId?.trim(),
      },
    };

    const car = await Car.create(carData);

    // Populate owner data
    await car.populate('owner', 'name email phone profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Car created successfully. It will be reviewed by admin.',
      data: { car },
    });
  } catch (error) {
    console.error('Create car error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Car with this registration number already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating car',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Car by ID (Admin)
 * @route   GET /api/admin/cars/:carId
 * @access  Private (Admin)
 */
export const getCarById = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId)
      .populate('owner', 'name email phone profilePhoto')
      .populate('approvedBy', 'name email');

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { car },
    });
  } catch (error) {
    console.error('Get car by ID (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching car',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update Car (Admin)
 * @route   PUT /api/admin/cars/:carId
 * @access  Private (Admin)
 */
export const updateCar = async (req, res) => {
  try {
    const { carId } = req.params;
    const adminId = req.user._id;

    // Log received data for debugging
    console.log('\n📝 UPDATE CAR - Received data:');
    console.log('req.body keys:', Object.keys(req.body));

    // Extract car data from request body (FormData)
    const {
      brand,
      model,
      year,
      color,
      registrationNumber,
      carType,
      fuelType,
      transmission,
      seatingCapacity,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      securityDeposit,
      description,
      mileage,
      engineCapacity,
      ownerName,
      ownerEmail,
      ownerId,
      isAvailable,
    } = req.body;

    // Parse location from FormData
    const location = {
      city: req.body['location[city]'] || req.body.city || req.body['location.city'],
      state: req.body['location[state]'] || req.body.state || req.body['location.state'],
      address: req.body['location[address]'] || req.body.address || req.body['location.address'],
      coordinates: {},
    };

    // Parse features from FormData
    let features = [];
    if (req.body.features) {
      try {
        features = typeof req.body.features === 'string'
          ? JSON.parse(req.body.features)
          : req.body.features;
      } catch (e) {
        features = req.body.features.split(',').map(f => f.trim()).filter(f => f);
      }
    }

    // Find car
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Check if registration number is being changed and if it already exists
    if (registrationNumber && registrationNumber.toUpperCase() !== car.registrationNumber) {
      const existingCar = await Car.findOne({
        registrationNumber: registrationNumber.toUpperCase(),
        _id: { $ne: carId }
      });
      if (existingCar) {
        return res.status(400).json({
          success: false,
          message: 'Car with this registration number already exists',
        });
      }
    }

    // Handle image deletion: remove images not in existingImagePublicIds
    const existingImagePublicIds = req.body.existingImagePublicIds
      ? (typeof req.body.existingImagePublicIds === 'string'
        ? JSON.parse(req.body.existingImagePublicIds)
        : req.body.existingImagePublicIds)
      : [];

    const imagesToKeep = [];
    for (const img of car.images || []) {
      if (existingImagePublicIds.includes(img.publicId)) {
        imagesToKeep.push(img);
      } else {
        // Delete from Cloudinary
        if (img.publicId) {
          try {
            await deleteImage(img.publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }
      }
    }
    car.images = imagesToKeep;

    // Handle new image uploads
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          const uploadResult = await uploadImage(file, {
            folder: 'driveon/cars',
            width: 1200,
            height: 800,
          });

          car.images.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            isPrimary: car.images.length === 0 && i === 0, // First image is primary if no images exist
          });
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }

    // Validate minimum 2 images after all operations
    if (car.images.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Car must have at least 2 images. Currently has ' + car.images.length + ' image(s).',
      });
    }

    // Handle RC document update
    if (req.files && req.files.rcDocument) {
      // Delete old RC document if exists
      if (car.rcDocument?.publicId) {
        try {
          await deleteImage(car.rcDocument.publicId);
        } catch (error) {
          console.error('Error deleting old RC document:', error);
        }
      }

      // Upload new RC document
      const rcFile = Array.isArray(req.files.rcDocument) ? req.files.rcDocument[0] : req.files.rcDocument;
      try {
        const uploadResult = await uploadImage(rcFile, {
          folder: 'driveon/cars/documents',
        });

        car.rcDocument = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      } catch (error) {
        console.error('Error uploading RC document:', error);
      }
    }

    // Update car fields
    if (brand) car.brand = brand.trim();
    if (model) car.model = model.trim();
    if (year) car.year = parseInt(year);
    if (color !== undefined) car.color = color?.trim();
    if (registrationNumber) car.registrationNumber = registrationNumber.toUpperCase().trim();
    if (carType) car.carType = carType;
    if (fuelType) car.fuelType = fuelType;
    if (transmission) car.transmission = transmission;
    if (seatingCapacity) car.seatingCapacity = parseInt(seatingCapacity);
    if (pricePerDay) car.pricePerDay = parseFloat(pricePerDay);
    if (pricePerWeek !== undefined) car.pricePerWeek = pricePerWeek ? parseFloat(pricePerWeek) : undefined;
    if (pricePerMonth !== undefined) car.pricePerMonth = pricePerMonth ? parseFloat(pricePerMonth) : undefined;
    if (securityDeposit) car.securityDeposit = parseFloat(securityDeposit);
    if (location.city) {
      car.location = {
        city: location.city.trim(),
        state: location.state?.trim(),
        address: location.address?.trim(),
        coordinates: location.coordinates || car.location?.coordinates || {},
      };
    }
    if (features.length > 0) car.features = features;
    if (description !== undefined) car.description = description?.trim();
    if (mileage !== undefined) car.mileage = mileage ? parseFloat(mileage) : undefined;
    if (engineCapacity !== undefined) car.engineCapacity = engineCapacity?.trim();
    if (isAvailable !== undefined) car.isAvailable = isAvailable === 'true' || isAvailable === true;

    // Update owner info
    if (ownerName !== undefined || ownerEmail !== undefined || ownerId !== undefined) {
      car.ownerInfo = {
        name: ownerName !== undefined ? ownerName?.trim() : car.ownerInfo?.name,
        email: ownerEmail !== undefined ? ownerEmail?.trim() : car.ownerInfo?.email,
        ownerId: ownerId !== undefined ? ownerId?.trim() : car.ownerInfo?.ownerId,
      };
    }

    await car.save();

    // Populate owner data
    await car.populate('owner', 'name email phone profilePhoto');

    res.status(200).json({
      success: true,
      message: 'Car updated successfully',
      data: { car },
    });
  } catch (error) {
    console.error('Update car error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Car with this registration number already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating car',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update Car Status (Admin)
 * @route   PUT /api/admin/cars/:carId/status
 * @access  Private (Admin)
 */
export const updateCarStatus = async (req, res) => {
  try {
    const { carId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user._id;

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Validate status
    const validStatuses = ['pending', 'active', 'inactive', 'suspended', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    // Update car status
    car.status = status;

    if (status === 'active') {
      car.approvedBy = adminId;
      car.approvedAt = new Date();
      car.rejectionReason = undefined;
    } else if (status === 'rejected') {
      car.rejectionReason = rejectionReason || 'Rejected by admin';
    } else {
      car.rejectionReason = undefined;
    }

    await car.save();

    res.status(200).json({
      success: true,
      message: `Car ${status} successfully`,
      data: { car },
    });
  } catch (error) {
    console.error('Update car status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating car status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete Car (Admin)
 * @route   DELETE /api/admin/cars/:carId
 * @access  Private (Admin)
 */
export const deleteCar = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // Delete images from Cloudinary
    if (car.images && car.images.length > 0) {
      for (const image of car.images) {
        if (image.publicId) {
          try {
            await deleteImage(image.publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }
      }
    }

    // Delete RC document if exists
    if (car.rcDocument?.publicId) {
      try {
        await deleteImage(car.rcDocument.publicId);
      } catch (error) {
        console.error('Error deleting RC document from Cloudinary:', error);
      }
    }

    // Delete car
    await Car.findByIdAndDelete(carId);

    res.status(200).json({
      success: true,
      message: 'Car deleted successfully',
    });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting car',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Toggle Car Featured Status (Admin)
 * @route   PUT /api/admin/cars/:carId/featured
 * @access  Private (Admin)
 */
export const toggleFeatured = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    if (car.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active cars can be featured',
      });
    }

    car.isFeatured = !car.isFeatured;
    await car.save();

    res.status(200).json({
      success: true,
      message: `Car ${car.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: { car },
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling featured status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Toggle Car Popular Status (Admin)
 * @route   PUT /api/admin/cars/:carId/popular
 * @access  Private (Admin)
 */
export const togglePopular = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    if (car.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active cars can be marked as popular',
      });
    }

    car.isPopular = !car.isPopular;
    await car.save();

    res.status(200).json({
      success: true,
      message: `Car ${car.isPopular ? 'marked as popular' : 'removed from popular'} successfully`,
      data: { car },
    });
  } catch (error) {
    console.error('Toggle popular error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling popular status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get Car Bookings Record (Admin)
 * @route   GET /api/admin/cars/:carId/record
 * @access  Private (Admin)
 */
export const getCarRecord = async (req, res) => {
  try {
    const { carId } = req.params;

    // Try to find the car in standard Car collection first (checking both _id and outwardCarId)
    const car = await Car.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(carId) ? carId : null },
        { outwardCarId: carId }
      ].filter(Boolean)
    }).populate('owner', 'name email phone');
    
    let bookings = [];
    let carInfo = null;
    let standardCarId = null;
    let outwardCarId = null;

    if (car) {
      carInfo = {
        id: car.outwardCarId || car._id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        registrationNumber: car.registrationNumber,
        pricePerDay: car.pricePerDay,
        source: car.source || 'inward',
        ownerName: car.ownerInfo?.name || car.owner?.name || 'Unknown',
        imageUrl: car.images?.find(img => img.isPrimary)?.url || car.images?.[0]?.url || null,
      };

      standardCarId = car._id;
      outwardCarId = car.outwardCarId;
    } else {
      // If not found in standard Car, it might be an outward car. Look in outwardcars collection
      const outwardCar = await mongoose.connection.db.collection('outwardcars').findOne({ 
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(carId) ? new mongoose.Types.ObjectId(carId) : null },
          { originalOutputId: carId }
        ].filter(Boolean)
      });

      if (outwardCar) {
        carInfo = {
          id: outwardCar.originalOutputId || outwardCar._id,
          brand: outwardCar.brand || '',
          model: outwardCar.model || '',
          year: outwardCar.year || '',
          registrationNumber: outwardCar.carNumber || outwardCar.registrationNumber || '',
          pricePerDay: outwardCar.pricePerDay || 0,
          source: 'outward',
          ownerName: outwardCar.ownerName || 'Unknown',
          imageUrl: outwardCar.image || null,
        };

        outwardCarId = carInfo.id;
        
        // Find shadow car in standard Car collection
        const shadowCar = await Car.findOne({ outwardCarId: carInfo.id });
        if (shadowCar) {
          standardCarId = shadowCar._id;
        }
      }
    }

    if (!carInfo) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    // 1. Fetch standard bookings (normal bookings)
    let standardBookings = [];
    if (standardCarId) {
      const rawBookings = await Booking.find({ 
        car: standardCarId,
        status: { $nin: ['cancelled', 'rejected'] }
      })
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 });

      standardBookings = rawBookings.map(b => ({
        id: b._id,
        bookingId: b.bookingId,
        customerName: b.user?.name || 'Anonymous',
        customerPhone: b.user?.phone || 'N/A',
        customerEmail: b.user?.email || 'N/A',
        fromDate: b.tripStart?.date ? new Date(b.tripStart.date).toISOString() : b.bookingDate,
        toDate: b.tripEnd?.date ? new Date(b.tripEnd.date).toISOString() : b.bookingDate,
        totalPrice: b.pricing?.totalPrice || 0,
        paidAmount: b.paidAmount || 0,
        paymentStatus: b.paymentStatus || 'pending',
        status: b.status,
        source: carInfo.source === 'outward' ? 'outward' : 'normal',
        createdAt: b.createdAt
      }));
    }

    // 2. Fetch fleet bookings (inward and/or outward) from OutwardBooking collection
    let outwardBookings = [];
    const outwardQuery = [];

    if (outwardCarId) {
      outwardQuery.push({ carId: outwardCarId });
    }
    if (standardCarId) {
      outwardQuery.push({ carId: standardCarId.toString() });
    }

    if (outwardQuery.length > 0) {
      const rawOutwardBookings = await OutwardBooking.find({
        $or: outwardQuery,
        status: { $ne: 'cancelled' }
      }).sort({ createdAt: -1 });

      outwardBookings = rawOutwardBookings.map(b => ({
        id: b._id,
        bookingId: b.originalBookingId || b._id,
        customerName: b.customerName,
        customerPhone: b.customerPhone || 'N/A',
        customerEmail: b.customerEmail || 'N/A',
        fromDate: b.fromDate,
        toDate: b.toDate,
        totalPrice: b.totalPrice,
        paidAmount: b.paidAmount || 0,
        paymentStatus: b.paymentStatus,
        status: b.status,
        source: b.carType || (carInfo.source === 'outward' ? 'outward' : 'inward'),
        createdAt: b.createdAt
      }));
    }

    // Combine all bookings and sort by createdAt desc
    bookings = [...standardBookings, ...outwardBookings];
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate Analytics/Stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'Completed').length;
    const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'Active').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;
    
    // Total Revenue is sum of paidAmount for all bookings
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const pendingAmount = bookings.reduce((sum, b) => {
      if (b.status === 'cancelled' || b.status === 'Cancelled') return sum;
      const rem = Math.max(0, (b.totalPrice || 0) - (b.paidAmount || 0));
      return sum + rem;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        car: carInfo,
        bookings,
        analytics: {
          totalBookings,
          completedBookings,
          activeBookings,
          cancelledBookings,
          totalRevenue,
          pendingAmount
        }
      }
    });
  } catch (error) {
    console.error('Get car record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving car record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
