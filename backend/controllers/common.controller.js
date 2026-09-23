/**
 * Common Controller
 * Handles banners, FAQs, and other common content
 */

import axios from 'axios';
import dotenv from 'dotenv';
import Setting from '../models/Setting.js';

// Load environment variables (in case they're not loaded)
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Log API key status on module load (only in development)
if (process.env.NODE_ENV === 'development') {
  if (GOOGLE_MAPS_API_KEY) {
    console.log(`✅ Google Maps API key loaded: ${GOOGLE_MAPS_API_KEY.substring(0, 8)}...`);
  } else {
    console.warn('⚠️ Google Maps API key NOT found in environment variables');
    console.warn('   Please add GOOGLE_MAPS_API_KEY to your backend/.env file');
    console.warn('   Example: GOOGLE_MAPS_API_KEY=your_api_key_here');
  }
}

/**
 * @desc    Get Hero Banners
 * @route   GET /api/common/banners/hero
 * @access  Public
 */
export const getHeroBanners = async (req, res) => {
  try {
    // Return default banners (can be extended to fetch from database)
    const banners = [
      {
        gradient: "linear-gradient(135deg, #f8f8f8, #d0d4d7)",
        title: "Easy Rentals,",
        subtitle: "Anywhere You Go.",
        cta: "Find Perfect Car To DriveOn",
      },
      {
        gradient: "linear-gradient(135deg, #f8f8f8, #e4e7ea)",
        title: "Premium Electric,",
        subtitle: "Experience The Future.",
        cta: "Drive Sustainable Luxury",
      },
      {
        gradient: "linear-gradient(135deg, #f8f8f8, #cfd4da)",
        title: "Luxury Redefined,",
        subtitle: "Style Meets Performance.",
        cta: "Discover Premium Comfort",
      },
    ];

    res.json({
      success: true,
      data: {
        banners,
      },
    });
  } catch (error) {
    console.error('Get hero banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hero banners',
      error: error.message,
    });
  }
};

/**
 * @desc    Get FAQs
 * @route   GET /api/common/faqs
 * @access  Public
 */
export const getFAQs = async (req, res) => {
  try {
    // Return default FAQs (can be extended to fetch from database)
    const faqs = [
      {
        question: "How do I complete my profile?",
        answer: "To book a car, you need to complete 100% of your profile. This includes: Name, Email, Phone Number, Age, Gender, Address, Profile Photo, and KYC verification through DigiLocker. You must verify your Aadhaar, PAN, and Driving License documents via DigiLocker OAuth2 integration. Booking is not allowed until your profile is 100% complete.",
      },
      {
        question: "What is KYC verification and how does it work?",
        answer: "KYC (Know Your Customer) verification is done through DigiLocker integration. When you click 'Verify Documents', you'll be redirected to DigiLocker where you approve access. Our backend then fetches your verified Aadhaar, PAN, and Driving License documents. These verified document references are stored securely, and your KYC status is marked as verified. This ensures maximum security and trust for both renters and car owners.",
      },
      {
        question: "Do I need a guarantor? How does the guarantor system work?",
        answer: "Yes, you need to add a guarantor who must also complete registration and KYC verification. Here's how it works: You enter your guarantor's phone number or email. The guarantor receives an invite link, installs the app, completes registration and KYC verification. Once verified, the guarantor is linked to your account in the database. Booking is not allowed until your guarantor is verified. This adds an extra layer of security and trust.",
      },
      {
        question: "What payment options are available?",
        answer: "We offer flexible payment options to suit your needs. You can choose between Full Payment or 20% Advance Payment. Payments are processed securely through Razorpay and Stripe. If you choose the 20% advance option, the remaining amount is automatically debited. We also handle security deposit management seamlessly.",
      },
      {
        question: "Is live GPS tracking mandatory?",
        answer: "Yes, live GPS tracking is mandatory during active trips for safety and security. When your trip starts, GPS tracking is automatically enabled. The mobile app runs a background service that sends location data to the backend every 10 seconds. This provides real-time location updates for both renters and car owners. Location data is stored for 6 months for dispute resolution purposes.",
      },
      {
        question: "How does the referral program work?",
        answer: "Every user gets a unique referral code. When a new user signs up using your referral code, you earn points. When that new user completes their first trip, you get an extra reward. Your referral points are visible in your profile and can be used as discounts on your bookings. It's a great way to earn rewards while helping others discover DriveOn.",
      },
      {
        question: "How does dynamic pricing work?",
        answer: "Our pricing engine calculates prices dynamically based on several factors: date of booking (weekday/weekend), time of booking (peak hours), duration, seasonal surge, car demand, last available units, and festive days. The system includes weekend multipliers, holiday multipliers, time of day multipliers, peak demand surcharges, and duration-based pricing. This ensures fair and transparent pricing that adjusts to market conditions.",
      },
      {
        question: "How do I book a car?",
        answer: "First, ensure your profile is 100% complete and your guarantor is verified. Then browse and filter our car collection based on your preferences (brand, model, price, location, etc.). Select your preferred car and view detailed information. Choose your pickup and drop-off dates and times. The system will calculate the dynamic price. Select your payment option (Full or 20% advance) and complete the secure payment. Once payment is confirmed, your booking is complete. GPS tracking will automatically start when your trip begins.",
      },
    ];

    res.json({
      success: true,
      data: {
        faqs,
      },
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQs',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Promotional Banner
 * @route   GET /api/common/banners/promotional
 * @access  Public
 */
export const getPromotionalBanner = async (req, res) => {
  try {
    const banner = {
      title: "20% Off Your Ride!",
      subtitle: "Experience Seamless Car Rentals.",
    };

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error('Get promotional banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching promotional banner',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Banner Overlay
 * @route   GET /api/common/banners/overlay
 * @access  Public
 */
export const getBannerOverlay = async (req, res) => {
  try {
    const overlay = {
      title: "Premium Luxury Experience",
      subtitle: "Drive in Style with Our Premium Collection",
    };

    res.json({
      success: true,
      data: overlay,
    });
  } catch (error) {
    console.error('Get banner overlay error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banner overlay',
      error: error.message,
    });
  }
};

/**
 * @desc    Get returning cars (cars with active bookings ending soon)
 * @route   GET /api/common/returning-cars
 * @access  Public
 */
export const getReturningCars = async (req, res) => {
  try {
    // Import models dynamically to avoid circular dependencies
    const Booking = (await import('../models/Booking.js')).default;

    // Get current time
    const now = new Date();

    // Find active bookings returning today (until end of today 23:59:59)
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const activeBookings = await Booking.find({
      status: 'confirmed',
      tripStatus: { $nin: ['completed', 'cancelled'] },
      $or: [
        { 'tripEnd.date': { $lte: endOfToday, $gte: now } },
        { dropDate: { $lte: endOfToday, $gte: now } },
        { endDate: { $lte: endOfToday, $gte: now } },
      ],
    })
      .populate('car', 'brand model pricePerDay images location')
      .sort({ 'tripEnd.date': 1, dropDate: 1, endDate: 1 })
      .limit(10);

    // Transform bookings to car data with return time
    const returningCars = activeBookings
      .map((booking) => {
        const car = booking.car;
        if (!car) return null;

        // Calculate return time
        let returnDate = null;
        if (booking.tripEnd?.date) {
          returnDate = new Date(booking.tripEnd.date);
        } else if (booking.dropDate) {
          returnDate = new Date(booking.dropDate);
        } else if (booking.endDate) {
          returnDate = new Date(booking.endDate);
        }

        if (!returnDate || returnDate <= now) return null;

        // Calculate time until return
        const diffMs = returnDate - now;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let returningIn = '';
        if (hours > 0) {
          returningIn = `${hours} hour${hours > 1 ? 's' : ''}`;
          if (minutes > 0) {
            returningIn += ` ${minutes} min${minutes > 1 ? 's' : ''}`;
          }
        } else if (minutes > 0) {
          returningIn = `${minutes} min${minutes > 1 ? 's' : ''}`;
        } else {
          returningIn = 'Very soon';
        }

        return {
          _id: car._id || car.id,
          brand: car.brand,
          model: car.model,
          pricePerDay: car.pricePerDay || 0,
          images: car.images || [],
          location: car.location || {},
          returningIn,
          returningDate: returnDate.toISOString(),
        };
      })
      .filter((car) => car !== null);

    res.json({
      success: true,
      data: {
        cars: returningCars.length > 0 ? returningCars : [],
      },
    });
  } catch (error) {
    console.error('Get returning cars error:', error);
    // Return empty array on error - frontend will use dummy data fallback
    res.json({
      success: true,
      data: {
        cars: [],
      },
    });
  }
};

/**
 * @desc    Search places using Google Places API (Proxy to avoid CORS)
 * @route   GET /api/common/places/search
 * @access  Public
 */
export const searchPlaces = async (req, res) => {
  try {
    console.log('🔍 Search places request received:', { query: req.query.query, lat: req.query.lat, lng: req.query.lng });

    const { query, lat, lng } = req.query;

    if (!query || query.trim() === '') {
      console.log('❌ Empty query');
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API key not configured');
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured',
      });
    }

    // Build Google Places API URL
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&language=en`;

    // Add location bias if coordinates provided
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=50000`;
    }

    console.log('🌐 Calling Google Places API...');

    // Fetch from Google Places API using axios
    let data;
    try {
      const response = await axios.get(url);
      data = response.data;
      console.log('✅ Google Places API response status:', data.status);
    } catch (error) {
      console.error('❌ Google Places API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
      });

      if (error.response) {
        // API returned error response
        return res.status(error.response.status || 500).json({
          success: false,
          message: 'Error fetching places from Google API',
          error: error.response.data?.error_message || error.message,
          status: error.response.status,
        });
      } else if (error.request) {
        // Request made but no response
        return res.status(500).json({
          success: false,
          message: 'No response from Google Places API',
          error: 'Network error or timeout',
        });
      } else {
        // Error setting up request
        return res.status(500).json({
          success: false,
          message: 'Error setting up request to Google Places API',
          error: error.message,
        });
      }
    }

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Format results
      const places = data.results.slice(0, 10).map((place) => {
        // Handle geometry.location - it might be an object with lat/lng or methods
        let location = null;
        if (place.geometry && place.geometry.location) {
          const loc = place.geometry.location;
          // Google Places API returns location as object with lat() and lng() methods or direct properties
          if (typeof loc.lat === 'function') {
            location = { lat: loc.lat(), lng: loc.lng() };
          } else {
            location = { lat: loc.lat, lng: loc.lng };
          }
        }

        return {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          vicinity: place.vicinity,
          types: place.types || [],
          geometry: location ? { location } : null,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
        };
      });

      res.json({
        success: true,
        data: {
          places,
        },
      });
    } else if (data.status === 'ZERO_RESULTS') {
      res.json({
        success: true,
        data: {
          places: [],
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.error_message || 'Places search failed',
        status: data.status,
      });
    }
  } catch (error) {
    console.error('❌ Search places error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      success: false,
      message: 'Error searching places',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
/**
 * @desc    Get coupons applicable to specific cars
 * @route   GET /api/common/coupons/car-specific
 * @access  Public
 */
export const getCarSpecificCoupons = async (req, res) => {
  try {
    const Booking = (await import('../models/Booking.js')).default;
    const Coupon = (await import('../models/Coupon.js')).default;

    // Get active coupons that are applicable to specific cars or car types
    // We want coupons that are:
    // 1. Active
    // 2. Valid date range
    // 3. Not exhausted usage limit
    // 4. Specific to car_id or car_type

    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validityStart: { $lte: now },
      validityEnd: { $gte: now },
      $or: [
        { applicableTo: 'car_id' },
        { applicableTo: 'car_type' }
      ]
    })
      .populate({
        path: 'carId',
        select: 'brand model images pricePerDay'
      })
      .populate({
        path: 'carIds',
        select: 'brand model images pricePerDay'
      })
      .sort({ createdAt: -1 });

    // Filter out coupons that have reached usage limit or are not valid for the current day
    const validCoupons = coupons.filter(coupon => {
      if (coupon.usedCount >= coupon.usageLimit) return false;

      if (coupon.validDays && coupon.validDays.length > 0) {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = daysOfWeek[now.getDay()];
        return coupon.validDays.includes(currentDay);
      }
      return true;
    });


    // Format response
    const formattedCoupons = validCoupons.map(coupon => {
      let cars = [];

      if (coupon.applicableTo === 'car_id') {
        if (coupon.carIds && coupon.carIds.length > 0) {
          cars = coupon.carIds.filter(car => car); // Filter out nulls from population
        } else if (coupon.carId) {
          cars = [coupon.carId];
        }
      }

      // Filter out any cars that might still be null or missing essential data
      cars = cars.filter(c => c && c.brand);

      return {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicableTo: coupon.applicableTo,
        carType: coupon.carType,
        cars: cars, // Array of car objects
      };
    });

    res.json({
      success: true,
      data: {
        coupons: formattedCoupons
      }
    });
  } catch (error) {
    console.error('Get car specific coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching car specific coupons',
      error: error.message
    });
  }
};

/**
 * @desc    Get Public System Settings
 * @route   GET /api/common/settings
 * @access  Public
 */
export const getPublicSettings = async (req, res) => {
  try {
    const dbSettings = await Setting.find({});
    
    const settingsObj = {};
    dbSettings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    const settings = {
      appName: settingsObj.appName || process.env.APP_NAME || 'DriveOn',
      contactEmail: settingsObj.contactEmail || process.env.CONTACT_EMAIL || 'driveon721@gmail.com',
      contactPhone: settingsObj.contactPhone || process.env.CONTACT_PHONE || '+91 98765 43210',
      advancePaymentPercentage: settingsObj.advancePaymentPercentage !== undefined ? Number(settingsObj.advancePaymentPercentage) : 20,
      cashCollectors: settingsObj.cashCollectors || [],
    };

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: error.message,
    });
  }
};




