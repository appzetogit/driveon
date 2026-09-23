import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules';
import { motion } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import CarDetailsHeader from '../components/layout/CarDetailsHeader';
import BookingConfirmationModal from '../components/common/BookingConfirmationModal';
import CustomSelect from '../components/common/CustomSelect';
import { colors } from '../theme/colors';
import useInViewAnimation from '../hooks/useInViewAnimation';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import reviewService from '../../services/review.service';
import carService from '../../services/car.service';
import commonService from '../../services/common.service';
import { userService } from '../../services/user.service';
import { setUser, updateUser } from '../../store/slices/userSlice';
import razorpayService from '../../services/razorpay.service';
import bookingService from '../../services/booking.service';
import toastUtils from '../../config/toast';

// Import car images
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg8 from '../../assets/car_img8.png';
import carBanImg1 from '../../assets/car_banImg1.jpg';
import carBanImg3 from '../../assets/car_banImg3-removebg-preview.png';

/**
 * Helper function to detect car facing direction
 * Returns 'left' or 'right' based on image filename or URL
 */
const getCarFacingDirection = (imageUrl) => {
  if (!imageUrl) return 'right'; // Default to right

  // Convert to string if it's an imported module
  const imagePath = typeof imageUrl === 'string' ? imageUrl : imageUrl.src || '';
  const lowerPath = imagePath.toLowerCase();

  // Check filename for direction indicators
  if (lowerPath.includes('front-left') || lowerPath.includes('left-front') ||
    lowerPath.includes('facing-left') || lowerPath.includes('_left')) {
    return 'left';
  }

  if (lowerPath.includes('front-right') || lowerPath.includes('right-front') ||
    lowerPath.includes('facing-right') || lowerPath.includes('_right')) {
    return 'right';
  }

  // Check for side profile indicators
  if (lowerPath.includes('side-left') || lowerPath.includes('left-side')) {
    return 'left';
  }

  if (lowerPath.includes('side-right') || lowerPath.includes('right-side')) {
    return 'right';
  }

  // Try to detect from specific car image names
  // Based on common car image naming patterns
  if (lowerPath.includes('car_img1') || lowerPath.includes('ferrari')) {
    // Ferrari FF - typically front-facing left
    return 'left';
  }

  if (lowerPath.includes('car_img4') || lowerPath.includes('lamborghini')) {
    // Lamborghini - typically front-facing left
    return 'left';
  }

  if (lowerPath.includes('car_img5') || lowerPath.includes('bmw') && lowerPath.includes('gts')) {
    // BMW GTS - typically side profile facing right
    return 'right';
  }

  if (lowerPath.includes('car_img6') || lowerPath.includes('tesla')) {
    // Tesla - typically front-facing left
    return 'left';
  }

  if (lowerPath.includes('car_img8') || lowerPath.includes('bmw') && !lowerPath.includes('gts')) {
    // BMW side profile - typically facing right
    return 'right';
  }

  // Default: assume right-facing (most common)
  return 'right';
};

/**
 * CarDetailsPage Component
 * Car details page matching the design images
 */
const CarDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [mobileSwiper, setMobileSwiper] = useState(null);
  const [offers, setOffers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [cancellationPolicy, setCancellationPolicy] = useState(null);
  const [inclusionsExclusions, setInclusionsExclusions] = useState([]);

  // Get authentication state
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Refs for section scrolling (Mobile)
  const offersRef = useRef(null);
  const reviewsRef = useRef(null);
  const locationRef = useRef(null);
  const featuresRef = useRef(null);
  const cancellationRef = useRef(null);
  const inclusionExclusionRef = useRef(null);
  const faqsRef = useRef(null);

  // Refs for section scrolling (Web)
  const offersRefWeb = useRef(null);
  const reviewsRefWeb = useRef(null);
  const locationRefWeb = useRef(null);
  const featuresRefWeb = useRef(null);
  const cancellationRefWeb = useRef(null);
  const inclusionExclusionRefWeb = useRef(null);
  const faqsRefWeb = useRef(null);
  // Mock car data removed - fetches dynamically from API

  // Helper function to clean and normalize car images
  // Returns all unique images from API (same as admin side)
  const normalizeCarImages = (carData) => {
    if (!carData) return null;

    let allImages = [];
    let primaryImage = null;

    // Extract all images from images array (same as admin side)
    if (carData.images && Array.isArray(carData.images) && carData.images.length > 0) {
      // First, extract all image URLs with their primary status
      const imageUrls = carData.images
        .map(img => {
          if (typeof img === 'string') return { url: img.trim(), isPrimary: false };
          return {
            url: (img?.url || img?.path || null)?.trim(),
            isPrimary: img?.isPrimary || false
          };
        })
        .filter(img => img.url); // Remove null/empty values

      // Remove duplicates based on URL
      const uniqueImages = [];
      const seenUrls = new Set();
      for (const img of imageUrls) {
        if (!seenUrls.has(img.url)) {
          seenUrls.add(img.url);
          uniqueImages.push(img);
        }
      }

      // Find primary image and put it first
      const primaryImgObj = uniqueImages.find(img => img.isPrimary);
      if (primaryImgObj) {
        primaryImage = primaryImgObj.url;
        // Put primary image first, then others
        allImages = [
          primaryImage,
          ...uniqueImages.filter(img => !img.isPrimary).map(img => img.url)
        ];
      } else {
        // No primary image, use all images in original order
        allImages = uniqueImages.map(img => img.url);
        primaryImage = allImages[0];
      }
    }

    // If no images from array, try carData.image
    if (allImages.length === 0 && carData.image) {
      const img = typeof carData.image === 'string'
        ? carData.image.trim()
        : (carData.image?.url || carData.image?.path || null)?.trim();
      if (img) {
        allImages = [img];
        primaryImage = img;
      }
    }

    // Ensure we have at least one image
    if (allImages.length === 0) {
      allImages = [carImg1];
      primaryImage = carImg1;
    } else if (!primaryImage) {
      primaryImage = allImages[0];
    }

    return {
      ...carData,
      image: primaryImage,
      images: allImages // All images array (same as admin side)
    };
  };

  // Helper function to extract numeric price from price string or number
  const extractPrice = (price) => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      // Extract number from strings like "Rs. 200" or "200" or "Rs.200"
      const match = price.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
  };

  // Normalize car data from location state to ensure pricePerDay is set
  const normalizeCarFromState = (carData) => {
    if (!carData) return null;
    const normalized = normalizeCarImages(carData);
    // Ensure pricePerDay is set from price if it's missing
    if (!normalized.pricePerDay && normalized.price) {
      normalized.pricePerDay = extractPrice(normalized.price);
    }
    // Also ensure price is numeric
    if (typeof normalized.price === 'string') {
      normalized.price = extractPrice(normalized.price);
    }
    // Ensure reviews is initialized as array
    if (!normalized.reviews || !Array.isArray(normalized.reviews)) {
      normalized.reviews = [];
    }
    return normalized;
  };

  const initialCar = location.state?.car || null;
  const normalizedInitialCar = initialCar ? normalizeCarFromState(initialCar) : null;
  const getStoredCar = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('driveon:selectedCar');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed) return null;
      // Use stored car only when it matches the current route id
      if (id && (parsed.id === id || parsed._id === id)) {
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn('Failed to read stored car', error);
      return null;
    }
  };
  const [storedCar] = useState(() => getStoredCar());
  const normalizedStoredCar = storedCar ? normalizeCarFromState(storedCar) : null;
  const effectiveInitialCar = normalizedInitialCar || normalizedStoredCar;
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id || '');

  // Ensure normalizedInitialCar has reviews initialized
  const initialCarWithReviews = effectiveInitialCar
    ? (effectiveInitialCar.reviews && Array.isArray(effectiveInitialCar.reviews)
      ? effectiveInitialCar
      : { ...effectiveInitialCar, reviews: [] })
    : null;
  const shouldFetchFromApi = !!id && isValidObjectId && !effectiveInitialCar;
  const [car, setCar] = useState(initialCarWithReviews);
  // Only show loader when we have to fetch real data from backend
  const [isLoading, setIsLoading] = useState(shouldFetchFromApi);
  const [advancePercentage, setAdvancePercentage] = useState(20);

  // Fetch car details from backend when a real car ID (Mongo ObjectId) is used
  useEffect(() => {
    if (!shouldFetchFromApi) {
      return;
    }

    const fetchCarDetails = async () => {
      setIsLoading(true);
      try {
        const response = await carService.getCarDetails(id);
        if (response.success && response.data?.car) {
          const apiCar = response.data.car;

          // Extract all images from API (same as admin side)
          let allImages = [];
          let primaryImage = null;

          // Extract all images from images array (same as admin side)
          if (apiCar.images && Array.isArray(apiCar.images) && apiCar.images.length > 0) {
            // First, extract all image URLs
            const imageUrls = apiCar.images
              .map(img => {
                if (typeof img === 'string') return { url: img.trim(), isPrimary: false };
                return {
                  url: (img?.url || img?.path || null)?.trim(),
                  isPrimary: img?.isPrimary || false
                };
              })
              .filter(img => img.url); // Remove null/empty values

            // Remove duplicates based on URL
            const uniqueImages = [];
            const seenUrls = new Set();
            for (const img of imageUrls) {
              if (!seenUrls.has(img.url)) {
                seenUrls.add(img.url);
                uniqueImages.push(img);
              }
            }

            // Find primary image
            const primaryImgObj = uniqueImages.find(img => img.isPrimary);
            if (primaryImgObj) {
              primaryImage = primaryImgObj.url;
              // Put primary image first, then others
              allImages = [
                primaryImage,
                ...uniqueImages.filter(img => !img.isPrimary).map(img => img.url)
              ];
            } else {
              // No primary image, use all images in original order
              allImages = uniqueImages.map(img => img.url);
              primaryImage = allImages[0];
            }
          }

          // If no images from array, try primaryImage field
          if (allImages.length === 0 && apiCar.primaryImage) {
            allImages = [apiCar.primaryImage];
            primaryImage = apiCar.primaryImage;
          }

          // Ensure we have at least one image
          if (allImages.length === 0) {
            allImages = [carImg1];
            primaryImage = carImg1;
          } else if (!primaryImage) {
            primaryImage = allImages[0];
          }

          // Build car object purely from backend data (no mock merge)
          // Use all images (same as admin side)
          const normalizedCar = normalizeCarImages({
            id: apiCar._id || apiCar.id,
            _id: apiCar._id || apiCar.id,
            brand: apiCar.brand || '',
            model: apiCar.model || '',
            name: `${apiCar.brand || ''} ${apiCar.model || ''}`.trim() || 'Car',
            image: primaryImage,
            images: allImages, // All images array (same as admin side)
            rating: apiCar.averageRating || 0,
            reviewsCount: apiCar.reviewsCount || 0,
            reviews: [], // Initialize reviews as empty array
            location:
              typeof apiCar.location === 'string'
                ? apiCar.location
                : apiCar.location?.city ||
                apiCar.location?.address ||
                '',
            locationObject: apiCar.location || {},
            seats: apiCar.seatingCapacity || 4,
            seatingCapacity: apiCar.seatingCapacity || 4,
            transmission:
              apiCar.transmission === 'automatic'
                ? 'Automatic'
                : apiCar.transmission === 'manual'
                  ? 'Manual'
                  : apiCar.transmission === 'cvt'
                    ? 'CVT'
                    : 'Automatic',
            fuelType:
              apiCar.fuelType === 'petrol'
                ? 'Petrol'
                : apiCar.fuelType === 'diesel'
                  ? 'Diesel'
                  : apiCar.fuelType === 'electric'
                    ? 'Electric'
                    : apiCar.fuelType === 'hybrid'
                      ? 'Hybrid'
                      : 'Petrol',
            year: apiCar.year || new Date().getFullYear(),
            color: apiCar.color || '',
            carType: apiCar.carType || '',
            mileage: apiCar.mileage || null,
            engineCapacity: apiCar.engineCapacity || '',
            horsepower: apiCar.horsepower || apiCar.enginePower || null,
            pricePerDay: apiCar.pricePerDay || 0,
            price: apiCar.pricePerDay || 0,
            description: apiCar.description || '',
            features: apiCar.features || [], // Features array from API
            owner: apiCar.owner ? {
              name: apiCar.owner.name || 'DriveOn Premium',
              email: apiCar.owner.email || '',
              phone: apiCar.owner.phone || '',
              profilePhoto: apiCar.owner.profilePhoto || null,
              verified: apiCar.owner.verified || false,
              rating: apiCar.owner.rating || 4.5,
            } : null,
            host: apiCar.owner ? {
              name: apiCar.owner.name || 'DriveOn Premium',
              profilePic: apiCar.owner.profilePhoto || null,
              verified: apiCar.owner.verified || false,
            } : null,
          });

          // Preserve images from location.state to prevent shuffle
          // If we have images from initial state, keep them and only update other fields
          if (initialCar && initialCar.images && initialCar.images.length > 0) {
            setCar(prevCar => ({
              ...normalizedCar,
              images: prevCar.images, // Keep original images order
              image: prevCar.image || normalizedCar.image, // Keep original primary image
            }));
          } else {
            setCar(normalizedCar);
          }
          try {
            sessionStorage.setItem('driveon:selectedCar', JSON.stringify(normalizedCar));
          } catch (error) {
            console.warn('Failed to cache car details', error);
          }
        } else {
          // API returned success but no car data - show error state
          setCar(null);
        }
      } catch (error) {
        console.error('Error fetching car details:', error);
        // On error, prefer showing error state
        setCar(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shouldFetchFromApi]);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Use car ID from params or car object
        const carId = id || car?._id || car?.id;
        if (!carId) {
          return;
        }

        // Check if carId is a valid MongoDB ObjectId (24 hex characters)
        // If not, skip API call and keep existing data
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(carId);
        if (!isValidObjectId) {
          return;
        }

        const response = await reviewService.getCarReviews(carId, {
          page: 1,
          limit: 5, // Show only 5 reviews on car details page
          sort: 'newest',
        });

        if (response.success && response.data) {
          // Format reviews for display
          const formattedReviews = response.data.reviews.map(review => ({
            name: review.user?.name || 'Anonymous',
            profilePic: review.user?.photo || 'https://via.placeholder.com/40',
            rating: review.overallRating?.toFixed(1) || '0',
            comment: review.comment,
          }));

          // Merge reviews into existing car state (don't reset to mock data)
          setCar(prev => {
            if (!prev) return prev; // Don't update if car is null
            return {
              ...prev,
              reviews: formattedReviews,
              reviewsCount: response.data.ratings?.totalReviews || prev.reviewsCount || 0,
              averageRating: response.data.ratings?.averageOverallRating || prev.rating || 0,
            };
          });
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        // Keep existing car data on error
      }
    };

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch common data (offers, FAQs, cancellation policy, inclusions/exclusions)
  useEffect(() => {
    const fetchCommonData = async () => {
      try {
        // Fetch public settings from common API
        try {
          const settingsResponse = await commonService.getSystemSettings();
          if (settingsResponse.success && settingsResponse.data?.settings?.advancePaymentPercentage !== undefined) {
            setAdvancePercentage(Number(settingsResponse.data.settings.advancePaymentPercentage));
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }

        // Fetch FAQs from common API
        try {
          const faqsResponse = await commonService.getFAQs();
          if (faqsResponse.success && faqsResponse.data?.faqs) {
            setFaqs(faqsResponse.data.faqs);
          } else {
            // Default FAQs if API fails
            setFaqs([
              {
                question: 'Who pays for the Fuel and FASTag?',
                answer: 'The guest is responsible for fuel costs. You will receive the car with a full tank and should return it with the same fuel level. FASTag charges are also the responsibility of the guest. Please check with the host for Fastag recharge if needed.'
              },
              {
                question: 'Can I modify or extend my trip after booking creation?',
                answer: 'Yes, you can modify or extend your trip. Please contact our support team or the car owner at least 24 hours before your scheduled pickup time. Modifications are subject to availability and may result in price adjustments.'
              },
              {
                question: 'How do I cancel my booking?',
                answer: 'You can cancel your booking through the app or by contacting support. Free cancellation is available up to 24 hours before pickup for a full refund. Cancellations made 12-24 hours before pickup receive a 50% refund. Cancellations made less than 12 hours before pickup are not eligible for refund.'
              },
              {
                question: 'What is refundable security deposit and why do I pay it?',
                answer: 'The security deposit is a refundable amount held to cover any potential damages, traffic violations, or additional charges during your rental period. It is fully refundable after the trip completion, provided there are no damages or violations. The deposit amount varies based on the car type and is typically returned within 5-7 business days after trip completion.'
              },
            ]);
          }
        } catch (error) {
          console.error('Error fetching FAQs:', error);
          // Use default FAQs on error
          setFaqs([
            {
              question: 'Who pays for the Fuel and FASTag?',
              answer: 'The guest is responsible for fuel costs. You will receive the car with a full tank and should return it with the same fuel level. FASTag charges are also the responsibility of the guest. Please check with the host for Fastag recharge if needed.'
            },
            {
              question: 'Can I modify or extend my trip after booking creation?',
              answer: 'Yes, you can modify or extend your trip. Please contact our support team or the car owner at least 24 hours before your scheduled pickup time. Modifications are subject to availability and may result in price adjustments.'
            },
            {
              question: 'How do I cancel my booking?',
              answer: 'You can cancel your booking through the app or by contacting support. Free cancellation is available up to 24 hours before pickup for a full refund. Cancellations made 12-24 hours before pickup receive a 50% refund. Cancellations made less than 12 hours before pickup are not eligible for refund.'
            },
            {
              question: 'What is refundable security deposit and why do I pay it?',
              answer: 'The security deposit is a refundable amount held to cover any potential damages, traffic violations, or additional charges during your rental period. It is fully refundable after the trip completion, provided there are no damages or violations. The deposit amount varies based on the car type and is typically returned within 5-7 business days after trip completion.'
            },
          ]);
        }

        // Set default offers (can be fetched from API in future)
        setOffers([
          {
            id: '50-off',
            title: 'Get 50% OFF!',
            description: 'Check Availability Here >',
            code: 'SAVE50',
            discount: 50,
            type: 'percentage'
          },
          {
            id: 'first-time',
            title: 'First Time User Discount',
            description: 'Get 20% off on your first booking. Use code: FIRST20',
            code: 'FIRST20',
            discount: 20,
            type: 'percentage'
          },
          {
            id: 'weekend',
            title: 'Weekend Special',
            description: 'Book for 3+ days and get 15% discount on weekends',
            code: 'WEEKEND15',
            discount: 15,
            type: 'percentage',
            minDays: 3
          }
        ]);

        // Set default cancellation policy (can be fetched from API in future)
        setCancellationPolicy({
          freeCancellation: {
            title: 'Free Cancellation',
            description: 'Cancel up to 24 hours before pickup time for a full refund.',
            hours: 24
          },
          partialRefund: {
            title: 'Partial Refund',
            description: 'Cancel between 12-24 hours before pickup: 50% refund',
            hours: { min: 12, max: 24 },
            refundPercentage: 50
          },
          noRefund: {
            title: 'No Refund',
            description: 'Cancellations made less than 12 hours before pickup are not eligible for refund.',
            hours: 12
          }
        });

        // Set default inclusions/exclusions (can be fetched from API in future)
        setInclusionsExclusions([
          {
            type: 'exclusion',
            title: 'Fuel',
            description: 'Fuel not included. Guest should return the car with the same fuel level as at start.',
            icon: 'fuel'
          },
          {
            type: 'exclusion',
            title: 'Toll/Fastag',
            description: 'Toll/Fastag charges not included. Check with host for Fastag recharge.',
            icon: 'toll'
          },
          {
            type: 'exclusion',
            title: 'Trip Protection',
            description: 'Trip Protection excludes: Off-road use, driving under influence, over-speeding, illegal use, restricted zones.',
            icon: 'protection'
          }
        ]);
      } catch (error) {
        console.error('Error fetching common data:', error);
      }
    };

    fetchCommonData();
  }, []);

  // Fetch user profile from database when authenticated - always fetch fresh data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await userService.getProfile();

        // userService.getProfile() returns: { success: true, data: { user: {...} } }
        // So we access: response.data.user
        const userData = response?.data?.user || response?.user || response?.data;

        if (userData) {
          // Normalize user data (handle fullName vs name)
          const normalizedUserData = {
            ...userData,
            name: userData.name || userData.fullName || '',
            phone: userData.phone || '',
            email: userData.email || '',
            age: userData.age || null,
            gender: userData.gender || '',
          };

          // Update Redux store with fetched data from database
          dispatch(setUser(normalizedUserData));
        }
      } catch (error) {
        console.error('❌ CarDetailsPage - Error fetching user profile:', error);
        // Don't show error - just use existing Redux data if available
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isAuthenticated]);

  // Extract numeric price from car.price (format: "Rs. 200" or just number)
  const getCarPrice = useCallback(() => {
    if (typeof car?.price === 'number') return car.price;
    if (typeof car?.pricePerDay === 'number') return car.pricePerDay;
    if (typeof car?.price === 'string') {
      const match = car.price.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }
    return 0;
  }, [car]);

  // Get car display name (Brand + Model or name)
  const getCarDisplayName = () => {
    if (car.brand && car.model) {
      return `${car.brand} ${car.model}`;
    }
    return car.name || 'Car';
  };

  // Get car specifications string (as per document.txt: Seats, Transmission, Fuel Type)
  const getCarSpecs = () => {
    const specs = [];
    if (car.seats) specs.push(`${car.seats} Seats`);
    if (car.transmission) specs.push(car.transmission);
    if (car.fuelType) specs.push(car.fuelType);
    return specs.join(' · ');
  };

  // Generate car images for gallery.
  // Shows all images from API (same as admin side)
  const generateCarImages = () => {
    if (!car) return [carImg1];

    // Return all images from car.images array (same as admin side)
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      return car.images
        .map(img => {
          if (typeof img === 'string') return img.trim();
          return (img?.url || img?.path || null)?.trim();
        })
        .filter(Boolean); // Remove null/empty values
    }

    // Fallback to car.image if images array is empty
    if (car.image) {
      const img = typeof car.image === 'string' ? car.image : (car.image?.url || car.image?.path || null);
      if (img) return [img];
    }

    return [carImg1];
  };

  const carImages = generateCarImages();

  // Reset image index only when car ID changes (not when images array changes)
  useEffect(() => {
    if (carImages.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [car?.id || car?._id || id]); // Only reset when car ID changes, not when images array changes

  // Detect car facing direction
  const [facingDirection, setFacingDirection] = useState('right');
  const [imageRef, isImageInView] = useInViewAnimation({ threshold: 0.1 });

  useEffect(() => {
    if (!car) return;
    const direction = getCarFacingDirection(car.image || carImages[0]);
    setFacingDirection(direction);
  }, [car?.image, carImages]);

  // Booking form state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');

  // Auto-fill dates from localStorage (when coming from home page or filter)
  useEffect(() => {
    try {
      const storedDates = localStorage.getItem('selectedBookingDates');
      if (storedDates) {
        const dates = JSON.parse(storedDates);
        if (dates.pickupDate && !pickupDate) {
          setPickupDate(dates.pickupDate);
        }
        if (dates.pickupTime && !pickupTime) {
          setPickupTime(dates.pickupTime);
        }
        if (dates.dropDate && !dropDate) {
          setDropDate(dates.dropDate);
        }
        if (dates.dropTime && !dropTime) {
          setDropTime(dates.dropTime);
        }
      }
    } catch (error) {
      console.error('Error reading dates from localStorage:', error);
    }
  }, []); // Run once on mount
  const [paymentOption, setPaymentOption] = useState('advance');
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [bookingPurpose, setBookingPurpose] = useState(''); // 'job', 'business', 'student'
  // Coins / Points discount
  const [availableCoins, setAvailableCoins] = useState(0);
  const [coinsApplied, setCoinsApplied] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);

  const [personalDetails, setPersonalDetails] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
  });
  const [currentAddress, setCurrentAddress] = useState('');
  const [jobDetails, setJobDetails] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [studentId, setStudentId] = useState('');
  const [documentPhoto, setDocumentPhoto] = useState(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);

  // Fetch user profile and auto-fill personal details
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await userService.getProfile();
        const userProfile = response?.data?.user || response?.user || user;

        if (userProfile) {
          // Auto-fill personal details from user profile (prioritize database values)
          setPersonalDetails((prev) => ({
            name: userProfile.name || userProfile.fullName || prev.name || "",
            phone: userProfile.phone || userProfile.mobile || userProfile.phoneNumber || prev.phone || "",
            email: userProfile.email || prev.email || "",
            age: userProfile.age ? String(userProfile.age) : prev.age || "",
            gender: userProfile.gender || prev.gender || "",
          }));

          // Auto-fill current address if available
          if (userProfile.address) {
            setCurrentAddress((prev) => prev || userProfile.address);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to Redux user data if API fails
        if (user) {
          setPersonalDetails((prev) => ({
            name: user.name || user.fullName || prev.name || "",
            phone: user.phone || user.mobile || user.phoneNumber || prev.phone || "",
            email: user.email || prev.email || "",
            age: user.age ? String(user.age) : prev.age || "",
            gender: user.gender || prev.gender || "",
          }));
          if (user.address) {
            setCurrentAddress((prev) => prev || user.address);
          }
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user]);

  // Dynamic add-on services from database
  const [allAddOnServices, setAllAddOnServices] = useState([]);
  const [addOnServices, setAddOnServices] = useState({});
  const [addOnServicesPrices, setAddOnServicesPrices] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load add-on services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await commonService.getAddOnServices();
        if (response.success && response.data) {
          const services = response.data;
          setAllAddOnServices(services);
          // Build initial quantities & prices maps
          const initQty = {};
          const initPrices = {};
          services.forEach(s => {
            initQty[s.key] = 0;
            initPrices[s.key] = s.price;
          });
          setAddOnServices(initQty);
          setAddOnServicesPrices(initPrices);
        }
      } catch (error) {
        console.error('Error fetching add-on services:', error);
        // Fallback defaults
        const fallback = [
          { _id: 'driver', key: 'driver', name: 'Driver', description: 'Professional driver service', price: 500 },
          { _id: 'bodyguard', key: 'bodyguard', name: 'Bodyguard', description: 'Security personnel', price: 1000 },
          { _id: 'gunmen', key: 'gunmen', name: 'Gun men', description: 'Armed security personnel', price: 1500 },
          { _id: 'bouncer', key: 'bouncer', name: 'Bouncer', description: 'Event security personnel', price: 800 },
        ];
        setAllAddOnServices(fallback);
        const initQty = {};
        const initPrices = {};
        fallback.forEach(s => { initQty[s.key] = 0; initPrices[s.key] = s.price; });
        setAddOnServices(initQty);
        setAddOnServicesPrices(initPrices);
      }
    };

    fetchServices();
  }, []);

  // Fetch user coins/points balance
  useEffect(() => {
    const fetchCoins = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingCoins(true);
        const response = await userService.getGuarantorPoints();
        const pointsData = response?.data || response || {};
        setAvailableCoins(Math.floor(pointsData.points || 0));
      } catch (err) {
        console.error('Error fetching coins:', err);
        setAvailableCoins(0);
      } finally {
        setLoadingCoins(false);
      }
    };
    fetchCoins();
  }, [isAuthenticated]);

  // Booking confirmation modal state
  const [showBookingConfirmationModal, setShowBookingConfirmationModal] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);

  // Combined date-time picker modal state
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [dateTimePickerTarget, setDateTimePickerTarget] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('am');

  // Time picker modal state
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('hour');

  // Use ref to track if we've auto-filled to prevent infinite loops
  const autoFilledRef = useRef(false);
  const lastUserDataRef = useRef(null);

  // Auto-fill personal details from database when checkbox is checked and user data is available
  useEffect(() => {
    // Only auto-fill if user data is available
    if (!user) {
      return;
    }



    // Create a stable key from user data to detect changes
    const userDataKey = `${user.name || ''}_${user.phone || ''}_${user.email || ''}_${user.age || ''}_${user.gender || ''}`;

    // Only auto-fill if user data has changed or hasn't been filled yet
    if (lastUserDataRef.current !== userDataKey) {
      console.log('📱 CarDetailsPage - Auto-filling personal details from user data:', {
        name: user.name,
        phone: user.phone,
        email: user.email,
        age: user.age,
        gender: user.gender,
      });

      const newPersonalDetails = {
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        age: user.age ? String(user.age) : '',
        gender: user.gender || '',
      };

      setPersonalDetails(newPersonalDetails);
      autoFilledRef.current = true;
      lastUserDataRef.current = userDataKey;
    }
  }, [user?.name, user?.phone, user?.email, user?.age, user?.gender]);

  // Helper: Convert date string (YYYY-MM-DD) to Date object in local timezone
  // Use noon (12:00) to avoid timezone shift issues
  const parseLocalDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      // Create date at noon to avoid timezone shift issues
      return new Date(year, month, day, 12, 0, 0);
    }
    return null;
  }, []);

  // Helper: Convert Date object to date string (YYYY-MM-DD) in local timezone
  const formatLocalDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format decimal values (remove trailing zeros)
  const formatDecimal = (value) => {
    if (value == null || isNaN(value)) return '0';
    // Always show 2 decimal places for payment amounts
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '0';
    // Show exact decimal value, remove trailing zeros
    return numValue.toFixed(2).replace(/\.?0+$/, '');
  };

  // Memoize price calculation to update when dependencies change
  const priceDetails = useMemo(() => {
    // Calculate add-on services total FIRST (even if dates not set)
    const addOnServicesTotal = Object.entries(addOnServices).reduce((total, [key, qty]) => {
      return total + (qty * (addOnServicesPrices[key] || 0));
    }, 0);

    if (!pickupDate || !dropDate || !car) {
      return {
        basePrice: 0,
        totalDays: 0,
        totalPrice: addOnServicesTotal,
        addOnServicesTotal: Math.round(addOnServicesTotal),
        advancePayment: 0,
        remainingPayment: 0,
        discount: 0,
        finalPrice: Math.round(addOnServicesTotal),
      };
    }

    // Parse dates in local timezone to avoid timezone shift
    const pickup = parseLocalDate(pickupDate) || new Date();
    const drop = parseLocalDate(dropDate) || new Date();
    const diffTime = Math.abs(drop - pickup);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const basePrice = getCarPrice();
    let totalPrice = basePrice * totalDays;

    // No dynamic pricing multiplier needed
    totalPrice = totalPrice;

    // Add add-on services to total price
    totalPrice = totalPrice + addOnServicesTotal;

    // Apply coupon discount
    const discount = couponDiscount || 0;
    const priceAfterCoupon = Math.max(0, totalPrice - discount);

    // Apply coins discount (1 coin = ₹1, applied after coupon)
    const calculatedCoinsDiscount = coinsApplied ? Math.min(availableCoins, priceAfterCoupon) : 0;
    const finalPrice = Math.max(0, priceAfterCoupon - calculatedCoinsDiscount);

    // Payment options
    const advancePayment = finalPrice * (advancePercentage / 100);
    const remainingPayment = finalPrice - advancePayment;

    return {
      basePrice,
      totalDays,
      totalPrice: totalPrice,
      addOnServicesTotal: addOnServicesTotal,
      discount: discount,
      coinsDiscount: calculatedCoinsDiscount,
      finalPrice: finalPrice,
      advancePayment: advancePayment,
      remainingPayment: remainingPayment,
    };
  }, [
    pickupDate,
    dropDate,
    car,
    addOnServices,
    addOnServicesPrices,
    couponDiscount,
    coinsApplied,
    availableCoins,
    paymentOption,
    advancePercentage,
    getCarPrice,
    parseLocalDate,
  ]);

  // Ensure addOnServicesTotal is always included (default to 0 if not calculated)
  const finalPriceDetails = useMemo(() => ({
    ...priceDetails,
    addOnServicesTotal: priceDetails.addOnServicesTotal || 0,
  }), [priceDetails]);

  // Get minimum date (today) - using local timezone
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Combined date-time picker helpers
  const openDateTimePicker = (target) => {
    setDateTimePickerTarget(target);

    const existingDate = target === 'pickup' ? pickupDate : dropDate;
    let baseDate;
    if (existingDate) {
      baseDate = parseLocalDate(existingDate);
      if (!baseDate) baseDate = new Date();
    } else if (target === 'drop' && pickupDate) {
      baseDate = parseLocalDate(pickupDate);
      if (!baseDate) baseDate = new Date();
    } else {
      baseDate = new Date();
    }
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setCalendarSelectedDate(baseDate);

    const existingTime = target === 'pickup' ? pickupTime : dropTime;
    if (existingTime) {
      const [hour, minute] = existingTime.split(':').map(Number);
      if (hour >= 12) {
        setSelectedPeriod('pm');
        setSelectedHour(hour === 12 ? 12 : hour - 12);
      } else {
        setSelectedPeriod('am');
        setSelectedHour(hour === 0 ? 12 : hour);
      }
      setSelectedMinute(minute || 0);
    } else {
      setSelectedHour(10);
      setSelectedMinute(30);
      setSelectedPeriod('am');
    }

    setIsDateTimePickerOpen(true);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Select Date';
    // Parse date string directly to avoid timezone issues
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(day).padStart(2, '0')} ${monthNames[month]} ${year}`;
    }
    // Fallback for other formats
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i += 1) {
      days.push(null);
    }
    // Create dates at noon (12:00) to avoid timezone shift issues
    // This ensures the date stays the same regardless of timezone
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push(new Date(year, month, d, 12, 0, 0));
    }
    return days;
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return 'Select Time';
    const [hour, minute] = timeStr.split(':').map(Number);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleDateTimePickerDone = () => {
    if (!dateTimePickerTarget) {
      setIsDateTimePickerOpen(false);
      return;
    }

    let dateStr = null;
    if (calendarSelectedDate) {
      // Use local date components instead of toISOString to avoid timezone shift
      dateStr = formatLocalDate(calendarSelectedDate);
      if (dateTimePickerTarget === 'pickup') {
        setPickupDate(dateStr);
        // Compare dates properly
        if (dropDate) {
          const dropDateObj = parseLocalDate(dropDate);
          if (dropDateObj && dropDateObj < calendarSelectedDate) {
            setDropDate('');
          }
        }
      } else if (dateTimePickerTarget === 'drop') {
        setDropDate(dateStr);
      }
    }

    let hour24 = selectedHour;
    if (selectedPeriod === 'pm' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'am' && selectedHour === 12) {
      hour24 = 0;
    }

    const timeStr = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

    if (dateTimePickerTarget === 'pickup') {
      setPickupTime(timeStr);
    } else if (dateTimePickerTarget === 'drop') {
      setDropTime(timeStr);
    }

    // Save dates to localStorage for auto-fill in book-now page
    try {
      const dates = {
        pickupDate: dateTimePickerTarget === 'pickup' ? (dateStr || pickupDate) : pickupDate,
        pickupTime: dateTimePickerTarget === 'pickup' ? timeStr : pickupTime,
        dropDate: dateTimePickerTarget === 'drop' ? (dateStr || dropDate) : dropDate,
        dropTime: dateTimePickerTarget === 'drop' ? timeStr : dropTime,
      };
      localStorage.setItem('selectedBookingDates', JSON.stringify(dates));
    } catch (error) {
      console.error('Error saving dates to localStorage:', error);
    }

    setIsDateTimePickerOpen(false);
  };

  // Handle coupon application
  const handleApplyCoupon = async (code = null) => {
    const codeToApply = (code || couponCode).trim().toUpperCase();
    if (!codeToApply) {
      alert('Please enter a coupon code');
      return;
    }

    try {
      const { couponService } = await import('../../services/coupon.service');
      const response = await couponService.validateCoupon({
        code: codeToApply,
        amount: finalPriceDetails.totalPrice || 0,
        carId: car?.id || car?._id,
      });

      if (response.success && response.data) {
        setCouponCode(codeToApply);
        setAppliedCoupon({
          code: response.data.coupon.code,
          discountType: response.data.coupon.discountType,
          discountValue: response.data.coupon.discountValue,
        });
        setCouponDiscount(response.data.discount);
        alert(`Coupon "${response.data.coupon.code}" applied! You save ₹${response.data.discount}`);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      alert(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      alert('Please select pickup and drop date & time');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }

    // Validate personal details
    const { name, phone, email, age, gender } = personalDetails;
    if (!name.trim() || !phone.trim() || !email.trim() || !age || !gender) {
        alert('Please fill all Personal Details (Name, Phone, Email, Age, Gender)');
        return;
      }
      // Validate phone number is exactly 10 digits and starts with 6-9
      if (!/^[6-9]\d{9}$/.test(phone)) {
        alert('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
        return;
      }

    // Both mobile and web views: Use Razorpay payment flow
    if (!car || (!car.id && !car._id)) return;

    // Parse car name to extract brand and model
    let brand = car.name;
    let model = "";
    if (car.name && car.name.includes("-")) {
      // Format: "Ferrari-FF"
      const parts = car.name.split("-");
      brand = parts[0];
      model = parts.slice(1).join(" ");
    } else if (car.name && car.name.includes(" ")) {
      // Format: "Tesla Model S" or "BMW GTS3 M2"
      const parts = car.name.split(" ");
      brand = parts[0];
      model = parts.slice(1).join(" ");
    }

    // Build booking payload for API
    const effectiveCarId = (car.id || car._id).toString();
    const bookingPayload = {
      carId: effectiveCarId,
      tripStart: {
        location: car.location || "Pickup location",
        coordinates: {},
        date: pickupDate,
        time: pickupTime || "10:00",
      },
      tripEnd: {
        location: car.location || "Drop location",
        coordinates: {},
        date: dropDate,
        time: dropTime || "18:00",
      },
      paymentOption: paymentOption || "advance",
      specialRequests: specialRequests || "",
      couponCode: appliedCoupon?.code || null,
      couponDiscount: couponDiscount,
      pointsUsed: coinsApplied ? (finalPriceDetails.coinsDiscount || 0) : 0,
      // Additional details for verification and reporting
      bookingPurpose: "personal",
      personalDetails: personalDetails,
      currentAddress: currentAddress || null,
      jobDetails: null,
      businessDetails: null,
      studentId: null,
      documentPhoto: null,
      addOnServices,
    };

    const amountToPay =
      paymentOption === "advance"
        ? finalPriceDetails.advancePayment
        : finalPriceDetails.finalPrice;

    setIsProcessing(true);

    try {
      const bookingResponse = await bookingService.createBooking(
        bookingPayload
      );
      const booking = bookingResponse?.data?.booking || bookingResponse?.data;
      const bookingId =
        booking?._id ||
        booking?.id ||
        booking?.bookingId ||
        bookingResponse?.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID missing from server response");
      }

      await razorpayService.processBookingPayment({
        bookingId: bookingId.toString(),
        amount: amountToPay,
        description: `Car booking payment - ${brand} ${model}`.trim(),
        name: user?.name || user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || user?.mobile || user?.phoneNumber || "",
        onSuccess: () => {
          // Build a rich booking payload for the confirmation modal / PDF
          const bookingIdFormatted = booking?.bookingId || booking?.bookingNumber || `BK${bookingId.toString().slice(-6).toUpperCase()}`;
          const bookingDataForPdf = {
            // Booking core
            bookingId: bookingIdFormatted,
            _id: bookingId.toString(),
            id: bookingId.toString(),
            createdAt: booking?.createdAt || new Date().toISOString(),

            // Car information
            car: {
              id: car.id || car._id,
              _id: car.id || car._id,
              brand: brand || car.brand,
              model: model || car.model,
              name: car.name || `${brand || car.brand} ${model || car.model}`,
              image: car.image || car.images?.[0] || (carImages && carImages.length > 0 ? carImages[0] : carImg1),
              images: car.images || (car.image ? [car.image] : (carImages && carImages.length > 0 ? carImages : [carImg1])),
              seats: car.seats || car.seatingCapacity || 4,
              seatingCapacity: car.seats || car.seatingCapacity || 4,
              transmission: car.transmission || 'Automatic',
              fuelType: car.fuelType || 'Petrol',
              registrationNumber: car.registrationNumber,
            },

            // Trip details
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            dropDate: dropDate,
            dropTime: dropTime,

            // Additional details
            bookingPurpose: bookingPayload.bookingPurpose,
            personalDetails: bookingPayload.personalDetails,
            currentAddress: bookingPayload.currentAddress,
            jobDetails: bookingPayload.jobDetails,
            businessDetails: bookingPayload.businessDetails,
            studentId: bookingPayload.studentId,
            addOnServices: bookingPayload.addOnServices,
            specialRequests: bookingPayload.specialRequests,

            // Pricing details
            totalPrice: finalPriceDetails.totalPrice,
            paidAmount: amountToPay,
            remainingAmount:
              (finalPriceDetails.finalPrice || 0) - (amountToPay || 0),
            couponCode: bookingPayload.couponCode,
            couponDiscount: bookingPayload.couponDiscount,
            paymentOption: bookingPayload.paymentOption,
            discount: (finalPriceDetails.discount || 0) + (finalPriceDetails.coinsDiscount || 0),
            offerDiscount: finalPriceDetails.offerDiscount || 0,
            pointsDiscount: finalPriceDetails.coinsDiscount || 0,
            pointsUsed: coinsApplied ? (finalPriceDetails.coinsDiscount || 0) : 0,

            // Add nested pricing object for the PDF generator & active/completed pages compatibility
            pricing: {
              basePrice: finalPriceDetails.basePrice || 0,
              totalPrice: finalPriceDetails.totalPrice || 0,
              advancePayment: finalPriceDetails.advancePayment || 0,
              remainingPayment: finalPriceDetails.remainingPayment || 0,
              weekendMultiplier: finalPriceDetails.weekendMultiplier || 0,
              holidayMultiplier: finalPriceDetails.holidayMultiplier || 0,
              timeOfDayMultiplier: finalPriceDetails.timeOfDayMultiplier || 0,
              demandSurge: finalPriceDetails.demandSurge || 0,
              discount: (finalPriceDetails.discount || 0) + (finalPriceDetails.coinsDiscount || 0),
              couponCode: bookingPayload.couponCode,
              couponDiscount: bookingPayload.couponDiscount,
              offerCode: bookingPayload.offerCode,
              offerDiscount: finalPriceDetails.offerDiscount || 0,
              finalPrice: finalPriceDetails.finalPrice || 0,
              addOnServicesTotal: finalPriceDetails.addOnServicesTotal || 0,
              pointsUsed: coinsApplied ? (finalPriceDetails.coinsDiscount || 0) : 0,
              pointsDiscount: finalPriceDetails.coinsDiscount || 0,
            },

            // Status information
            status: booking?.status || "pending",
            paymentStatus:
              booking?.paymentStatus ||
              (paymentOption === "advance" ? "partial" : "full"),
            tripStatus: booking?.tripStatus || "pending",
          };

          setIsProcessing(false);

          // Save booking to localStorage so it shows up immediately on bookings page
          try {
            const existingBookings = JSON.parse(localStorage.getItem('localBookings') || '[]');
            const newBooking = {
              ...bookingDataForPdf,
              // Ensure all required fields for bookings page
              id: bookingId.toString(),
              _id: bookingId.toString(),
            };
            existingBookings.unshift(newBooking); // Add to beginning
            localStorage.setItem('localBookings', JSON.stringify(existingBookings));
            console.log('✅ Booking saved to localStorage');
          } catch (error) {
            console.error('Error saving booking to localStorage:', error);
          }

          console.log("outside set timeout")

          // Wait a moment for Razorpay modal to fully close, then show our confirmation modal
          setTimeout(() => {
            console.log("inside set timeout")
            console.log('🎉 Showing booking confirmation modal now!');
            setConfirmedBookingId(bookingId.toString());
            setConfirmedBookingData(bookingDataForPdf);
            setShowBookingConfirmationModal(true);
          }, 500); // 500ms delay to ensure Razorpay modal is closed
        },
        onError: async (error) => {
          console.error("Payment error:", error);
          setIsProcessing(false);

          if (bookingId) {
            console.log('🔄 Payment cancelled or failed. Cancelling backend booking:', bookingId);
            try {
              await bookingService.updateBookingStatus(bookingId.toString(), {
                status: 'cancelled',
                cancellationReason: error?.message === 'PAYMENT_CANCELLED'
                  ? 'Payment cancelled by user'
                  : `Payment failed: ${error?.message || 'Unknown error'}`
              });
              console.log('✅ Unpaid booking cancelled successfully');
            } catch (cancelError) {
              console.error('❌ Failed to cancel unpaid booking:', cancelError);
            }
          }

          if (error?.message === "PAYMENT_CANCELLED") return;
          alert(error?.message || "Payment failed. Please try again.");
        },
      });
    } catch (error) {
      console.error("Error during booking/payment:", error);
      setIsProcessing(false);
      alert(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create booking. Please try again."
      );
    }
  };

  // Lightweight navigation helper for CTA buttons that don't submit the form
  const handleQuickBook = () => {
    try {
      sessionStorage.setItem('driveon:selectedCar', JSON.stringify(car));
    } catch (err) {
      console.warn('Failed to cache car before booking', err);
    }

    const bookingPayload = {
      car,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
      paymentOption,
      specialRequests,
      couponCode: appliedCoupon?.code,
      couponDiscount,
      priceDetails,
    };

    if (!isAuthenticated) {
      toastUtils.info("Please login to proceed with booking.");
      navigate('/login', {
        state: {
          from: {
            pathname: `/book-now/${car?.id || car?._id || id}`,
            state: bookingPayload,
          }
        }
      });
      return;
    }

    navigate(`/book-now/${car?.id || car?._id || id}`, {
      state: bookingPayload,
    });
  };

  // Navigation for image gallery
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? carImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === carImages.length - 1 ? 0 : prev + 1));
  };

  // Handle tab click and scroll to section
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    
    // Choose correct refs based on screen size
    const isDesktop = window.innerWidth >= 1024;
    
    const refs = isDesktop ? {
      offers: offersRefWeb,
      reviews: reviewsRefWeb,
      location: locationRefWeb,
      features: featuresRefWeb,
      cancellation: cancellationRefWeb,
      'inclusion-exclusion': inclusionExclusionRefWeb,
      faqs: faqsRefWeb,
    } : {
      offers: offersRef,
      reviews: reviewsRef,
      location: locationRef,
      features: featuresRef,
      cancellation: cancellationRef,
      'inclusion-exclusion': inclusionExclusionRef,
      faqs: faqsRef,
    };

    const ref = refs[tabName];
    if (ref && ref.current) {
      const offset = 150; // Offset for sticky header
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const isDesktop = window.innerWidth >= 1024;
      
      const refs = isDesktop ? [
        { id: 'offers', ref: offersRefWeb },
        { id: 'reviews', ref: reviewsRefWeb },
        { id: 'location', ref: locationRefWeb },
        { id: 'features', ref: featuresRefWeb },
        { id: 'cancellation', ref: cancellationRefWeb },
        { id: 'inclusion-exclusion', ref: inclusionExclusionRefWeb },
        { id: 'faqs', ref: faqsRefWeb },
      ] : [
        { id: 'offers', ref: offersRef },
        { id: 'reviews', ref: reviewsRef },
        { id: 'location', ref: locationRef },
        { id: 'features', ref: featuresRef },
        { id: 'cancellation', ref: cancellationRef },
        { id: 'inclusion-exclusion', ref: inclusionExclusionRef },
        { id: 'faqs', ref: faqsRef },
      ];

      const scrollPosition = window.scrollY + 200; // Offset for header

      for (let i = refs.length - 1; i >= 0; i--) {
        const { id, ref } = refs[i];
        if (ref && ref.current) {
          // Use getBoundingClientRect for more reliable position detection across different layouts
          const rect = ref.current.getBoundingClientRect();
          const elementTop = rect.top + window.pageYOffset;
          
          if (scrollPosition >= elementTop) {
            setActiveTab(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Feature Icons
  const getFeatureIcon = (iconType) => {
    switch (iconType) {
      case 'seat':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        );
      case 'engine':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'speed':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'autopilot':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'charge':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'parking':
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Show loading state only if we're actively loading and have no car data
  // Don't show loader if we have initial car from navigation state or stored car
  if (isLoading && !car && !effectiveInitialCar) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p className="text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  // If no car data at all (shouldn't happen with fallback, but just in case)
  // But only show error if we don't have initial car
  if (!car && !effectiveInitialCar) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load car details.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Web Header - Only visible on web */}
      <header
        className="hidden md:block w-full sticky top-0 z-50"
        style={{ backgroundColor: colors.brandBlack }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center h-16 md:h-20 lg:h-24 justify-between">
            {/* Left - Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/driveonlogo.png"
                alt="DriveOn Logo"
                className="h-8 md:h-10 lg:h-12 xl:h-14 w-auto object-contain"
              />
            </Link>

            {/* Center - Navigation Tabs */}
            <nav className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 h-full">
              <Link
                to="/"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                FAQs
              </Link>
            </nav>

            {/* Right - Login/Signup and Profile Icon */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                >
                  {/* Circular profile icon with white border */}
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img
                        src={carImg1}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 md:py-2 lg:py-2.5 rounded-lg border text-xs md:text-sm lg:text-base font-medium transition-all hover:opacity-90"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Header - Mobile view only */}
      <div className="md:hidden">
        <CarDetailsHeader />
      </div>

      {/* Back Button - Below Header (desktop only) */}
      <div className="hidden md:block w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: colors.backgroundTertiary }}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-base md:text-lg font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Web container - max-width and centered on larger screens */}
      <div className="max-w-7xl mx-auto">
        {/* Desktop: Two-column layout (Image Gallery Left + Booking Form Right) - Hidden on Mobile/Tablet */}
        <div className="hidden lg:grid lg:grid-cols-[65%_35%] gap-4 lg:gap-6 px-4 lg:px-6 xl:px-8 mt-4 lg:mt-4">
          {/* Left Column: Car Image Gallery */}
          <div className="relative w-full">
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: colors.backgroundPrimary }}>
              {/* Main Large Image with Navigation Arrows */}
              <div className="relative w-full h-[500px] xl:h-[600px] flex items-center justify-center overflow-hidden bg-gray-50">
                {carImages && carImages.length > 0 && carImages[currentImageIndex] ? (
                  <img
                    key={`main-image-${currentImageIndex}-${carImages[currentImageIndex]}`}
                    src={carImages[currentImageIndex]}
                    alt={`${car.name || getCarDisplayName()} - Main Image`}
                    className="w-full h-full object-contain p-6 xl:p-10 transition-all duration-500 ease-in-out"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                    draggable={false}
                    onError={(e) => {
                      console.error('Image failed to load:', carImages[currentImageIndex]);
                      e.target.src = carImg1;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={carImg1}
                      alt="Default Car"
                      className="w-full h-full object-contain p-6 xl:p-10"
                      draggable={false}
                      style={{
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  </div>
                )}

                {/* Navigation Arrow - Left */}
                {carImages.length > 1 && (
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: colors.overlayWhite }}
                    aria-label="Previous image"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Navigation Arrow - Right */}
                {carImages.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: colors.overlayWhite }}
                    aria-label="Next image"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Image Counter */}
                {carImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: colors.overlayBlack, color: colors.textWhite }}
                  >
                    {currentImageIndex + 1}/{carImages.length}
                  </div>
                )}

                {/* Heart Icon - Top Left */}
                <button
                  onClick={() => {
                    const wasFav = !isFavorite;
                    setIsFavorite(wasFav);
                    if (wasFav) {
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 800);
                    }
                  }}
                  className="absolute top-2 left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform touch-target"
                  style={{ backgroundColor: colors.overlayWhite }}
                >
                  <div className="like-button-container" style={{ width: '28px', height: '28px' }}>
                    {/* Sparkles Burst */}
                    <div className="sparkles-container">
                      {[...Array(8)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`sparkle-burst ${isAnimating ? 'active' : ''}`} 
                          style={{ '--angle': `${i * 45}deg` }} 
                        />
                      ))}
                    </div>
                    
                    <svg
                      className={`w-7 h-7 transition-colors duration-200 ${
                        isFavorite ? 'text-red-500 heart-icon liked' : 'text-gray-600 heart-icon'
                      }`}
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      style={{ overflow: 'visible' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Thumbnail Row - Below Main Image */}
              {carImages.length > 1 && (
                <div className="p-4 xl:p-6">
                  <div className="flex gap-2 xl:gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {carImages.map((image, index) => {
                      const imageKey = typeof image === 'string' ? image : (image?.url || image?.path || `img-${index}`);
                      return (
                        <div
                          key={`thumbnail-${imageKey}-${index}`}
                          className={`flex-shrink-0 relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${currentImageIndex === index
                            ? ''
                            : 'hover:opacity-80 opacity-70'
                            }`}
                          style={{
                            backgroundColor: colors.backgroundPrimary,
                            border: currentImageIndex === index ? `2px solid ${colors.backgroundTertiary}` : '2px solid transparent',
                            width: '120px',
                            height: '120px'
                          }}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <div className="w-full h-full flex items-center justify-center p-2 bg-white">
                            <img
                              src={image}
                              alt={`${car.name || getCarDisplayName()} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-contain"
                              draggable={false}
                              onError={(e) => {
                                console.error('Thumbnail failed to load:', image);
                                e.target.src = carImg1;
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Booking Form Card (Sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto order-2 lg:order-none">
            <form onSubmit={handleSubmit} className="rounded-2xl p-4 xl:p-6 shadow-lg space-y-4"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              {/* Price Summary at Top */}
              <div className="mb-4">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    Rs. {getCarPrice()}
                  </span>
                  <span className="text-sm" style={{ color: colors.textSecondary }}>/day</span>
                </div>
                {finalPriceDetails.totalDays > 0 && (
                  <div className="text-sm" style={{ color: colors.textSecondary }}>
                    {finalPriceDetails.totalDays} {finalPriceDetails.totalDays === 1 ? 'day' : 'days'} • Total: Rs. {finalPriceDetails.finalPrice}
                  </div>
                )}
              </div>

              {/* Pickup Date & Time */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>Pickup Date & Time</label>
                <button
                  type="button"
                  onClick={() => openDateTimePicker('pickup')}
                  className="w-full px-3 py-2.5 rounded-lg border-2 text-left"
                  style={{
                    borderColor: (pickupDate && pickupTime) ? colors.backgroundTertiary : colors.borderMedium,
                    backgroundColor: (pickupDate && pickupTime) ? colors.backgroundPrimary : colors.backgroundSecondary
                  }}
                >
                  <div className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                    {pickupDate && pickupTime ? `${formatDisplayDate(pickupDate)} • ${formatDisplayTime(pickupTime)}` : 'Select Date & Time'}
                  </div>
                </button>
              </div>

              {/* Drop Date & Time */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>Drop Date & Time</label>
                <button
                  type="button"
                  onClick={() => openDateTimePicker('drop')}
                  className="w-full px-3 py-2.5 rounded-lg border-2 text-left"
                  style={{
                    borderColor: (dropDate && dropTime) ? colors.backgroundTertiary : colors.borderMedium,
                    backgroundColor: (dropDate && dropTime) ? colors.backgroundPrimary : colors.backgroundSecondary
                  }}
                >
                  <div className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                    {dropDate && dropTime ? `${formatDisplayDate(dropDate)} • ${formatDisplayTime(dropTime)}` : 'Select Date & Time'}
                  </div>
                </button>
              </div>

              {/* Payment Option */}
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>Payment Option</h3>
                <button
                  type="button"
                  onClick={() => setPaymentOption('advance')}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${paymentOption === 'advance' ? 'shadow-md' : ''
                    }`}
                  style={{
                    borderColor: paymentOption === 'advance' ? colors.backgroundTertiary : colors.borderMedium,
                    backgroundColor: paymentOption === 'advance' ? colors.backgroundPrimary : colors.backgroundSecondary
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm mb-0.5" style={{ color: colors.textPrimary }}>{advancePercentage}% Advance Payment</div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>Pay {advancePercentage}% now, rest later</div>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{
                      borderColor: paymentOption === 'advance' ? colors.backgroundTertiary : colors.borderCheckbox
                    }}>
                      {paymentOption === 'advance' && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.backgroundTertiary }}></div>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              {/* Coins Wallet */}
              {availableCoins > 0 && (
                <div
                  className="rounded-xl p-4 mb-0"
                  style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%)', border: '1.5px solid #F6C90E' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#F6C90E' }}>
                        🪙
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#7C5C00' }}>
                          {loadingCoins ? 'Loading...' : `${Math.floor(availableCoins)} Coins Available`}
                        </p>
                        <p className="text-xs" style={{ color: '#A07800' }}>1 Coin = ₹1 Discount</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoinsApplied(prev => !prev)}
                      className="px-5 py-2 rounded-xl font-bold text-sm transition-all"
                      style={{
                        backgroundColor: coinsApplied ? '#EF4444' : '#F6C90E',
                        color: coinsApplied ? '#fff' : '#7C5C00',
                        boxShadow: coinsApplied ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(246,201,14,0.4)'
                      }}
                    >
                      {coinsApplied ? 'Remove' : 'Use'}
                    </button>
                  </div>
                  {coinsApplied && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#F6C90E' }}>
                      <span className="text-xs font-semibold" style={{ color: '#7C5C00' }}>Coins Discount Applied</span>
                      <span className="text-sm font-bold" style={{ color: '#16A34A' }}>-₹{(finalPriceDetails.coinsDiscount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>Coupon Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                    style={{
                      borderColor: colors.borderMedium,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-6 py-2 rounded-lg text-white font-semibold text-sm"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: `${colors.success}20` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: colors.success }}>
                        {appliedCoupon.code} Applied
                      </span>
                      <span className="text-xs font-bold" style={{ color: colors.success }}>
                        -Rs. {couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {(finalPriceDetails.totalDays > 0 || finalPriceDetails.addOnServicesTotal > 0) && (
                <div className="rounded-xl p-4" style={{ backgroundColor: colors.backgroundPrimary }}>
                  <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>Price Summary</h3>
                  <div className="space-y-1.5 mb-3">
                    {finalPriceDetails.totalDays > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
                        <span>Base Price ({finalPriceDetails.totalDays} days)</span>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>Rs. {formatDecimal(finalPriceDetails.totalPrice - (finalPriceDetails.addOnServicesTotal || 0))}</span>
                      </div>
                    )}
                    {finalPriceDetails.addOnServicesTotal > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
                        <span>Add-on Services</span>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>Rs. {formatDecimal(finalPriceDetails.addOnServicesTotal)}</span>
                      </div>
                    )}
                    {finalPriceDetails.discount > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
                        <span>Coupon Discount</span>
                        <span className="font-semibold" style={{ color: colors.success }}>-Rs. {formatDecimal(finalPriceDetails.discount)}</span>
                      </div>
                    )}
                    {finalPriceDetails.coinsDiscount > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
                        <span>🪙 Coins Discount</span>
                        <span className="font-semibold" style={{ color: '#CA8A04' }}>-Rs. {formatDecimal(finalPriceDetails.coinsDiscount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-1.5 mt-1.5" style={{ borderColor: colors.borderMedium }}>
                      <div className="flex justify-between font-bold" style={{ color: colors.textPrimary }}>
                        <span className="text-base">Total Amount</span>
                        <span className="text-base">Rs. {formatDecimal(finalPriceDetails.finalPrice)}</span>
                      </div>
                    </div>
                    {paymentOption === 'advance' && finalPriceDetails.totalDays > 0 && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: colors.borderMedium }}>
                        <div className="flex justify-between mb-0.5 text-xs" style={{ color: colors.textSecondary }}>
                          <span>Advance Payment ({advancePercentage}%)</span>
                          <span className="font-semibold">Rs. {formatDecimal(finalPriceDetails.advancePayment)}</span>
                        </div>
                        <div className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
                          <span>Remaining Amount</span>
                          <span className="font-semibold">Rs. {formatDecimal(finalPriceDetails.remainingPayment)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold" style={{ color: colors.textPrimary }}>Additional Details</h3>

                {/* Personal Details Fields - Always visible and auto-filled */}
                <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: `${colors.backgroundTertiary}10` }}>
                  <h4 className="text-xs font-bold mb-2" style={{ color: colors.textPrimary }}>Personal Details</h4>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={personalDetails.name}
                      autoComplete="off"
                      onChange={(e) => setPersonalDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                      style={{
                        borderColor: colors.borderMedium,
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={personalDetails.phone}
                      autoComplete="off"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPersonalDetails(prev => ({ ...prev, phone: value }));
                      }}
                      placeholder="Enter your phone number"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                      style={{
                        borderColor: colors.borderMedium,
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={personalDetails.email}
                      autoComplete="off"
                      onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                      style={{
                        borderColor: colors.borderMedium,
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                      Age
                    </label>
                    <input
                      type="number"
                      value={personalDetails.age}
                      autoComplete="off"
                      onChange={(e) => setPersonalDetails(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Enter your age"
                      min="18"
                      className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                      style={{
                        borderColor: colors.borderMedium,
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary
                      }}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                      Gender
                    </label>
                    <CustomSelect
                      value={personalDetails.gender}
                      onChange={(value) => setPersonalDetails(prev => ({ ...prev, gender: value }))}
                      options={[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' },
                      ]}
                      placeholder="Select gender"
                    />
                  </div>
                </div>
              </div>
              {/* Add-on Services Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold" style={{ color: colors.textPrimary }}>Add-on Services (Optional)</h3>

                <div className="space-y-3">
                  {allAddOnServices.map((service) => {
                    const qty = addOnServices[service.key] || 0;
                    const price = addOnServicesPrices[service.key] || service.price || 0;
                    const isSingleUnit = service.singleUnitOnly;

                    return (
                      <div key={service._id || service.key} className="flex items-center justify-between p-3 rounded-lg border-2" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.backgroundTertiary}15` }}>
                            <svg className="w-5 h-5" style={{ color: colors.backgroundTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{service.name}</p>
                            <p className="text-xs" style={{ color: colors.textSecondary }}>{service.description || `Professional ${service.name} service`}</p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: colors.backgroundTertiary }}>
                              ₹{price} per unit
                            </p>
                          </div>
                        </div>
                        
                        {isSingleUnit ? (
                          /* Render checkbox if singleUnitOnly is true */
                          <div className="flex items-center gap-3">
                            {qty > 0 && (
                              <span className="text-xs font-semibold mr-2" style={{ color: colors.backgroundTertiary }}>
                                ₹{price}
                              </span>
                            )}
                            <input
                              type="checkbox"
                              checked={qty > 0}
                              onChange={(e) => {
                                const newQty = e.target.checked ? 1 : 0;
                                setAddOnServices(prev => ({ ...prev, [service.key]: newQty }));
                              }}
                              className="w-5 h-5 rounded border-2 cursor-pointer transition-all"
                              style={{ borderColor: qty > 0 ? colors.backgroundTertiary : colors.borderCheckbox }}
                            />
                          </div>
                        ) : (
                          /* Render increment/decrement counter if singleUnitOnly is false */
                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <span className="text-xs font-semibold mr-2" style={{ color: colors.backgroundTertiary }}>
                                ₹{qty * price}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setAddOnServices(prev => ({ ...prev, [service.key]: Math.max(0, qty - 1) }))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-2"
                              style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center text-sm font-semibold" style={{ color: colors.textPrimary }}>{qty}</span>
                            <button
                              type="button"
                              onClick={() => setAddOnServices(prev => ({ ...prev, [service.key]: qty + 1 }))}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border-2"
                              style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Physical Document Verification Notice */}
              <div
                className="rounded-xl p-4 mb-4"
                style={{
                  backgroundColor: '#FFF3E0',
                  border: '1px solid #FFE0B2'
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Warning Icon */}
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: '#FF9800' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold mb-2" style={{ color: '#333' }}>
                      Important: Physical Document Verification Required
                    </h3>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: '#333' }}>
                      Your booking will only be confirmed and finalized when you physically visit our office to complete document verification. This step is mandatory before you can start your trip.
                    </p>
                    <div className="flex items-start gap-2">
                      {/* Warning Icon */}
                      <svg
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: '#FF9800' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <p className="text-xs leading-relaxed font-semibold" style={{ color: '#FF9800' }}>
                        If you fail to complete physical document verification, 30% of the paid amount will be refunded and the booking will be cancelled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-2"
                  style={{ borderColor: agreeToTerms ? colors.backgroundTertiary : colors.borderCheckbox }}
                />
                <div className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  I agree to the <Link to="/terms" className="font-semibold hover:underline cursor-pointer" style={{ color: colors.textPrimary }}>Terms & Conditions</Link> and <Link to="/privacy-policy" className="font-semibold hover:underline cursor-pointer" style={{ color: colors.textPrimary }}>Privacy Policy</Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl text-white font-bold text-base shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Mobile/Tablet: Original Layout (image directly on page, no white card) */}
        <div className="lg:hidden">
          {/* Car Images Section */}
          <div className="relative w-full mt-2 md:mt-4">
            {/* Mobile: Swipeable Carousel */}
            <div className="md:hidden relative w-full">
              <Swiper
                modules={[Pagination, Keyboard, Mousewheel]}
                spaceBetween={0}
                slidesPerView={1}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet-custom',
                  bulletActiveClass: 'swiper-pagination-bullet-active-custom',
                  el: '.car-pagination-dots',
                }}
                onSlideChange={(swiper) => setCurrentImageIndex(swiper.activeIndex)}
                onSwiper={setMobileSwiper}
                keyboard={{ enabled: true }}
                mousewheel={{ enabled: true, forceToAxis: true, sensitivity: 1 }}
                speed={300}
                className="w-full"
                watchSlidesProgress={true}
                allowTouchMove={true}
              >
                {carImages && carImages.length > 0 ? (
                  carImages.map((image, index) => (
                    <SwiperSlide key={index} className="!w-full">
                      <div
                        className="relative w-full h-[350px] flex items-center justify-center overflow-hidden bg-gray-50"
                        style={{ backgroundColor: colors.backgroundPrimary }}
                      >
                        {index === 0 ? (
                          <motion.img
                            ref={imageRef}
                            src={image || carImg1}
                            onError={(e) => {
                              console.error('Mobile image failed to load:', image);
                              e.target.src = carImg1;
                            }}
                            alt={`${car.name || getCarDisplayName()} - Image ${index + 1}`}
                            className="w-full h-full object-contain p-4"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                            draggable={false}
                            initial={{
                              x: facingDirection === 'left' ? 200 : -200,
                              opacity: 0
                            }}
                            animate={{
                              x: 0,
                              opacity: 1
                            }}
                            transition={{
                              duration: 0.7,
                              ease: 'easeOut'
                            }}
                            key={`${car?.id || car?._id || 'car'}-${index}-animated`}
                          />
                        ) : (
                          <img
                            src={image || carImg1}
                            onError={(e) => {
                              console.error('Mobile image failed to load:', image);
                              e.target.src = carImg1;
                            }}
                            alt={`${car.name || getCarDisplayName()} - Image ${index + 1}`}
                            className="w-full h-full object-contain p-4"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                            draggable={false}
                          />
                        )}

                        {/* Heart Icon - Top Left */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 300);
                          }}
                          className="absolute top-2 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colors.overlayWhite }}
                          animate={isAnimating ? {
                            scale: [1, 1.3, 1],
                          } : {}}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut"
                          }}
                        >
                          <svg
                            className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </motion.button>
                      </div>
                    </SwiperSlide>
                  ))
                ) : (
                  <SwiperSlide className="!w-full">
                    <div
                      className="relative w-full h-[350px] flex items-center justify-center overflow-hidden bg-gray-50"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <img
                        src={carImg1}
                        alt="Default Car"
                        className="w-full h-full object-contain p-4"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                        draggable={false}
                      />
                      {/* Heart Icon - Top Left */}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFavorite(!isFavorite);
                          setIsAnimating(true);
                          setTimeout(() => setIsAnimating(false), 300);
                        }}
                        className="absolute top-2 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.overlayWhite }}
                        animate={isAnimating ? {
                          scale: [1, 1.3, 1],
                        } : {}}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                      >
                        <svg
                          className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                          fill={isFavorite ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </motion.button>
                    </div>
                  </SwiperSlide>
                )}
              </Swiper>

              {/* Pagination Dots - Below Car Image */}
              {carImages && carImages.length > 1 && (
                <div className="car-pagination-dots absolute bottom-8 left-0 right-0 flex justify-center items-center gap-2 z-10"></div>
              )}

              {/* Custom Pagination Styles */}
              <style>{`
              .swiper-pagination-bullet-custom {
                width: 8px;
                height: 8px;
                background: ${colors.overlayBlack};
                opacity: 1;
                margin: 0 4px;
                transition: all 0.3s ease;
                border-radius: 50%;
                cursor: pointer;
              }
              .swiper-pagination-bullet-active-custom {
                background: ${colors.backgroundTertiary};
                width: 8px;
                height: 8px;
              }
              .car-pagination-dots {
                position: absolute;
                bottom: 32px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                z-index: 10;
              }
              /* Ensure slides are visible when active */
              .swiper-slide {
                opacity: 1;
                transition: opacity 0.3s;
              }
              .swiper-slide-active {
                opacity: 1 !important;
              }
            `}</style>
            </div>

            {/* Mobile/Tablet Thumbnail Row - Added based on User Request */}
            {carImages && carImages.length > 1 && (
              <div className="md:hidden w-full px-4 mb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
                  {carImages.map((image, index) => {
                    const imageKey = typeof image === 'string' ? image : (image?.url || image?.path || `img-${index}`);
                    return (
                      <div
                        key={`mobile-thumbnail-${imageKey}-${index}`}
                        className={`flex-shrink-0 relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                          currentImageIndex === index ? '' : 'opacity-60'
                        }`}
                        style={{
                          backgroundColor: colors.backgroundPrimary,
                          border: currentImageIndex === index ? `2px solid ${colors.backgroundTertiary}` : '1px solid #e5e7eb',
                          width: '64px',
                          height: '64px'
                        }}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          if (mobileSwiper) mobileSwiper.slideTo(index);
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center p-1 bg-white">
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-contain"
                            draggable={false}
                            onError={(e) => {
                              e.target.src = carImg1;
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tablet: Main Image with Thumbnails (hidden on lg+) */}
            <div className="hidden md:block lg:hidden w-full px-6">
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ backgroundColor: colors.backgroundPrimary }}>
                {/* Main Large Image */}
                <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-gray-50">
                  {carImages && carImages.length > 0 && carImages[currentImageIndex] ? (
                    <img
                      key={currentImageIndex}
                      src={carImages[currentImageIndex]}
                      alt={`${car.name || getCarDisplayName()} - Main Image`}
                      className="w-full h-full object-contain p-6 transition-all duration-500 ease-in-out"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                      draggable={false}
                      onError={(e) => {
                        console.error('Tablet image failed to load:', carImages[currentImageIndex]);
                        e.target.src = carImg1;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={carImg1}
                        alt="Default Car"
                        className="w-full h-full object-contain p-6"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Heart Icon - Top Left */}
                  <motion.button
                    onClick={() => {
                      setIsFavorite(!isFavorite);
                      setIsAnimating(true);
                      setTimeout(() => setIsAnimating(false), 300);
                    }}
                    className="absolute top-2 left-4 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: colors.overlayWhite }}
                    animate={isAnimating ? {
                      scale: [1, 1.3, 1],
                    } : {}}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    <svg
                      className={`w-7 h-7 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* Thumbnail Grid - Below Main Image */}
                {carImages.length > 1 && (
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {carImages.map((image, index) => {
                        const imageKey = typeof image === 'string' ? image : (image?.url || image?.path || `img-${index}`);
                        return (
                          <div
                            key={`tablet-thumbnail-${imageKey}-${index}`}
                            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${currentImageIndex === index
                              ? 'scale-105 shadow-lg border-2'
                              : 'hover:opacity-80 hover:scale-102 opacity-70 border-2 border-transparent'
                              }`}
                            style={{
                              backgroundColor: colors.backgroundPrimary,
                              borderColor: currentImageIndex === index ? colors.backgroundTertiary : 'transparent'
                            }}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <div className="aspect-square w-full flex items-center justify-center p-2">
                              <img
                                src={image}
                                alt={`${car.name || getCarDisplayName()} - Thumbnail ${index + 1}`}
                                className="w-full h-full object-contain"
                                draggable={false}
                                onError={(e) => {
                                  console.error('Tablet thumbnail failed to load:', image);
                                  e.target.src = carImg1;
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Main Content Below Two-Column Layout */}
        <div className="hidden lg:block px-6 xl:px-8 pb-8 pt-6">
          <div
            className="rounded-3xl p-6 xl:p-8 shadow-lg"
            style={{
              backgroundColor: colors.backgroundSecondary,
              boxShadow: `0 2px 8px ${colors.shadowLight}`,
            }}
          >
            {/* Car Name and Description - As per document.txt: Model, Brand */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-black mb-2">{getCarDisplayName()}</h1>

              {/* Car Specifications - As per document.txt: Seats, Transmission, Fuel Type */}
              {getCarSpecs() && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">{getCarSpecs()}</span>
                  {car.color && (
                    <span className="text-sm text-gray-600"> · {car.color}</span>
                  )}
                  {car.year && (
                    <span className="text-sm text-gray-600"> · {car.year}</span>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-3">{car.description}</p>

              {/* Rating and Reviews - As per document.txt */}
              <div className="flex items-center gap-2 mb  -3">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-black">
                    {typeof car?.rating === 'number' ? car.rating.toFixed(1) : (car?.rating || '0.0')}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill={colors.accentOrange}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500">({car?.reviewsCount || 0}+ Reviews)</span>
              </div>

            </div>

            {/* Tab Navigation Bar */}
            <div className="mb-6 border-b" style={{ borderColor: colors.borderMedium }}>
              <div className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide -mx-0">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'inclusion-exclusion', label: 'Inclusion/Exclusion' },
                  { id: 'faqs', label: 'FAQs' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className="flex-shrink-0 pb-3 px-1 text-sm md:text-base font-medium transition-all relative"
                    style={{
                      color: activeTab === tab.id ? colors.backgroundTertiary : colors.textSecondary,
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>


            {/* Car Features - As per document.txt: Features Array */}
            <div ref={featuresRefWeb} className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-bold text-black mb-3">Car features</h2>

              {/* Feature Icons Grid (if featureIcons exist) */}
              {car.featureIcons && car.featureIcons.length > 0 && (
                <div className="grid grid-cols-6 gap-4 mb-4">
                  {car.featureIcons.map((feature, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg flex flex-col items-center text-center"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <div className="mb-2">
                        {getFeatureIcon(feature.icon)}
                      </div>
                      <span className="text-xs text-gray-600 mb-1">{feature.label}</span>
                      <span className="text-xs font-bold text-black">{feature.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Features List (as per document.txt: Features Array) */}
              {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {car.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div ref={reviewsRef} className="mb-6 scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-black">Review ({car?.reviewsCount || 0})</h2>
                <button
                  onClick={() => navigate(`/car-details/${car?.id || car?._id || id}/reviews`, { state: { car } })}
                  className="text-sm text-gray-500 font-medium hover:text-black transition-colors"
                >
                  VIEW MORE &gt;
                </button>
              </div>

              {/* Reviews - Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0">
                {car?.reviews && car.reviews.length > 0 ? (
                  car.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="min-w-[220px] max-w-[220px] flex-shrink-0 p-3 py-3 rounded-lg border border-black"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-black">{review.name}</span>
                            <span className="text-xs font-semibold text-black">{review.rating}</span>
                            <svg
                              className="w-3 h-3"
                              fill={colors.accentOrange}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed break-words">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No reviews yet</div>
                )}
              </div>
            </div>

            {/* Cancellation Section */}
            <div ref={cancellationRefWeb} className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-bold text-black mb-4">Cancellation Policy</h2>
              <div
                className="p-4 rounded-xl border-2"
                style={{
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.borderMedium
                }}
              >
                {cancellationPolicy ? (
                  <div className="space-y-4">
                    {cancellationPolicy.freeCancellation && (
                      <div>
                        <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                          {cancellationPolicy.freeCancellation.title}
                        </div>
                        <div className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                          {cancellationPolicy.freeCancellation.description}
                        </div>
                      </div>
                    )}
                    {cancellationPolicy.partialRefund && (
                      <div className="border-t pt-4" style={{ borderColor: colors.borderMedium }}>
                        <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                          {cancellationPolicy.partialRefund.title}
                        </div>
                        <div className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                          {cancellationPolicy.partialRefund.description}
                        </div>
                      </div>
                    )}
                    {cancellationPolicy.noRefund && (
                      <div className="border-t pt-4" style={{ borderColor: colors.borderMedium }}>
                        <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                          {cancellationPolicy.noRefund.title}
                        </div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {cancellationPolicy.noRefund.description}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Cancellation policy information not available.</div>
                )}
              </div>
            </div>

            {/* Inclusion/Exclusion Section */}
            <div ref={inclusionExclusionRefWeb} className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>Inclusion/Exclusions</h2>
              <div className="space-y-4">
                {inclusionsExclusions && inclusionsExclusions.length > 0 ? (
                  inclusionsExclusions.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {item.icon === 'fuel' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : item.icon === 'toll' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>{item.title}</div>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Inclusion/exclusion information not available.</div>
                )}
              </div>
            </div>

            {/* FAQs Section */}
            <div ref={faqsRefWeb} className="mb-8 scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>FAQs</h2>
                <button
                  onClick={() => navigate('/faq')}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: colors.textSecondary }}
                >
                  VIEW MORE &gt;
                </button>
              </div>
              <div className="space-y-0">
                {faqs && faqs.length > 0 ? (
                  faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border-b"
                      style={{ borderColor: colors.borderMedium }}
                    >
                      <div
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="py-4 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="text-sm font-medium flex-1" style={{ color: colors.textPrimary }}>
                          {faq.question}
                        </div>
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform duration-300 ${openFaqIndex === index ? 'transform rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: colors.textSecondary }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 text-sm" style={{ color: colors.textSecondary }}>
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 py-4">No FAQs available at the moment.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Main Content - White Rounded Card */}
        <div className="lg:hidden px-4 md:px-6 pb-24 md:pb-8 pt-4 md:pt-6">
          <div
            className="rounded-3xl p-4 md:p-6 lg:p-8 -mx-4 md:mx-0 md:shadow-lg"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: `0 2px 8px ${colors.shadowLight}`,
            }}
          >
            {/* Car Name and Description - As per document.txt: Model, Brand */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-black mb-2">{getCarDisplayName()}</h1>

              {/* Car Specifications - As per document.txt: Seats, Transmission, Fuel Type */}
              {getCarSpecs() && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">{getCarSpecs()}</span>
                  {car.color && (
                    <span className="text-sm text-gray-600"> · {car.color}</span>
                  )}
                  {car.year && (
                    <span className="text-sm text-gray-600"> · {car.year}</span>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-3">{car.description}</p>

              {/* Rating and Reviews - As per document.txt */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex items-center gap-1">
                  <span className="text-sm font-semibold text-black">
                    {typeof car?.rating === 'number' ? car.rating.toFixed(1) : (car?.rating || '0.0')}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill={colors.accentOrange}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500">({car?.reviewsCount || 0}+ Reviews)</span>
              </div>

            </div>

            {/* Tab Navigation Bar - Mobile */}
            <div className="mb-6 border-b" style={{ borderColor: colors.borderMedium }}>
              <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide -mx-0">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'inclusion-exclusion', label: 'Inclusion/Exclusion' },
                  { id: 'faqs', label: 'FAQs' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className="flex-shrink-0 pb-3 px-1 text-xs md:text-sm font-medium transition-all relative"
                    style={{
                      color: activeTab === tab.id ? colors.backgroundTertiary : colors.textSecondary,
                    }}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>


            {/* Car Features - As per document.txt: Features Array */}
            <div ref={featuresRef} className="mb-8 scroll-mt-24">
              <h2 className="text-lg md:text-xl font-bold text-black mb-3">Car features</h2>

              {/* Feature Icons Grid (if featureIcons exist) */}
              {car.featureIcons && car.featureIcons.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-4">
                  {car.featureIcons.map((feature, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg flex flex-col items-center text-center"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <div className="mb-2">
                        {getFeatureIcon(feature.icon)}
                      </div>
                      <span className="text-xs text-gray-600 mb-1">{feature.label}</span>
                      <span className="text-xs font-bold text-black">{feature.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Features List (as per document.txt: Features Array) */}
              {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {car.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section - Mobile - As per document.txt: Reviews */}
            <div ref={reviewsRef} className="mb-6 scroll-mt-24">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-black">Review ({car?.reviewsCount || 0})</h2>
                <button
                  onClick={() => navigate(`/car-details/${car?.id || car?._id || id}/reviews`)}
                  className="text-sm text-gray-500 font-medium hover:text-black transition-colors"
                >
                  VIEW MORE &gt;
                </button>
              </div>

              {/* Reviews - Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0">
                {car?.reviews && car.reviews.length > 0 ? (
                  car.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="min-w-[220px] max-w-[220px] flex-shrink-0 p-3 py-3 rounded-lg border border-black"
                      style={{ backgroundColor: colors.backgroundPrimary }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-black">{review.name}</span>
                            <span className="text-xs font-semibold text-black">{review.rating}</span>
                            <svg
                              className="w-3 h-3"
                              fill={colors.accentOrange}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed break-words">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No reviews yet</div>
                )}
              </div>
            </div>

            {/* Cancellation Section - Mobile */}
            <div ref={cancellationRef} className="mb-8 scroll-mt-24">
              <h2 className="text-lg md:text-xl font-bold text-black mb-4">Cancellation Policy</h2>
              <div
                className="p-4 rounded-xl border-2"
                style={{
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.borderMedium
                }}
              >
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                      Free Cancellation
                    </div>
                    <div className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                      Cancel up to 24 hours before pickup time for a full refund.
                    </div>
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: colors.borderMedium }}>
                    <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                      Partial Refund
                    </div>
                    <div className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                      Cancel between 12-24 hours before pickup: 50% refund
                    </div>
                  </div>
                  <div className="border-t pt-4" style={{ borderColor: colors.borderMedium }}>
                    <div className="font-semibold text-base mb-2" style={{ color: colors.textPrimary }}>
                      No Refund
                    </div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Cancellations made less than 12 hours before pickup are not eligible for refund.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusion/Exclusion Section - Mobile */}
            <div ref={inclusionExclusionRef} className="mb-8 scroll-mt-24">
              <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>Inclusion/Exclusions</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>Fuel</div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Fuel not included. Guest should return the car with the same fuel level as at start.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>Toll/Fastag</div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Toll/Fastag charges not included. Check with host for Fastag recharge.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>Trip Protection</div>
                    <div className="text-sm" style={{ color: colors.textSecondary }}>
                      Trip Protection excludes: Off-road use, driving under influence, over-speeding, illegal use, restricted zones.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs Section - Mobile */}
            <div ref={faqsRef} className="mb-8 scroll-mt-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold" style={{ color: colors.textPrimary }}>FAQs</h2>
                <button
                  onClick={() => navigate('/faq')}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: colors.textSecondary }}
                >
                  VIEW MORE &gt;
                </button>
              </div>
              <div className="space-y-0">
                {faqs && faqs.length > 0 ? (
                  faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border-b"
                      style={{ borderColor: colors.borderMedium }}
                    >
                      <div
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="py-4 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="text-sm font-medium flex-1" style={{ color: colors.textPrimary }}>
                          {faq.question}
                        </div>
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform duration-300 ${openFaqIndex === index ? 'transform rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: colors.textSecondary }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 text-sm" style={{ color: colors.textSecondary }}>
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 py-4">No FAQs available at the moment.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Book Now Button - Fixed at Bottom on mobile, static on web (only for mobile/tablet) */}
        <div className="lg:hidden fixed md:static bottom-4 left-0 right-0 z-50 md:z-auto">
          <div className="px-4 md:px-6 py-3 md:py-0 md:mt-6">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleQuickBook}
                className="w-full md:w-auto md:min-w-[300px] md:mx-auto md:block py-4 flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: colors.backgroundTertiary, borderRadius: '16px' }}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Date-Time Picker Modal */}
      {isDateTimePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsDateTimePickerOpen(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <div className="p-4">
              {/* Time Selection Button */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Time</label>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimePickerMode('hour');
                      setIsTimePickerOpen(true);
                    }}
                    className="w-auto px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      borderColor: colors.backgroundTertiary,
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.backgroundSecondary
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm">
                      {selectedHour.toString().padStart(2, '0')} : {selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                    </span>
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={() => {
                      const newMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold py-1" style={{ color: colors.textSecondary }}>
                      {day}
                    </div>
                  ))}
                  {getCalendarDays().map((date, idx) => {
                    if (!date) return <div key={idx}></div>;
                    // Use local date components for comparison to avoid timezone issues
                    const dateStr = formatLocalDate(date);
                    const dateYear = date.getFullYear();
                    const dateMonth = date.getMonth();
                    const dateDay = date.getDate();

                    // Check if selected using local date components
                    let isSelected = false;
                    if (calendarSelectedDate) {
                      const selectedYear = calendarSelectedDate.getFullYear();
                      const selectedMonth = calendarSelectedDate.getMonth();
                      const selectedDay = calendarSelectedDate.getDate();
                      isSelected = dateYear === selectedYear &&
                        dateMonth === selectedMonth &&
                        dateDay === selectedDay;
                    }

                    // Check if past date using local date components
                    const today = new Date();
                    const todayYear = today.getFullYear();
                    const todayMonth = today.getMonth();
                    const todayDay = today.getDate();
                    const isPast = dateYear < todayYear ||
                      (dateYear === todayYear && dateMonth < todayMonth) ||
                      (dateYear === todayYear && dateMonth === todayMonth && dateDay < todayDay);

                    const isMinDate = dateStr === getMinDate();
                    const isCurrentMonth = dateMonth === calendarMonth.getMonth();

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isPast && isCurrentMonth) {
                            // Ensure date is at noon to avoid timezone issues
                            const selectedDate = new Date(dateYear, dateMonth, dateDay, 12, 0, 0);
                            setCalendarSelectedDate(selectedDate);
                          }
                        }}
                        disabled={isPast && !isMinDate}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${isSelected
                          ? 'text-white'
                          : isPast && !isMinDate
                            ? 'cursor-not-allowed'
                            : !isCurrentMonth
                              ? 'opacity-40'
                              : 'hover:bg-gray-100'
                          }`}
                        style={{
                          backgroundColor: isSelected ? colors.backgroundTertiary : 'transparent',
                          color: isSelected ? colors.backgroundSecondary : (isPast && !isMinDate ? colors.borderCheckbox : colors.textPrimary),
                        }}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDateTimePickerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm"
                  style={{
                    borderColor: colors.backgroundTertiary,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateTimePickerDone}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Time Picker Modal */}
      {isTimePickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={() => setIsTimePickerOpen(false)}
          />

          {/* Time Picker Modal */}
          <div
            className="fixed z-[110] shadow-2xl bg-white rounded-2xl"
            style={{
              width: "320px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pt-4 px-6 mb-2 mt-2">
              <h3
                className="text-[10px] font-bold text-gray-500 tracking-wider mb-4 uppercase"
              >
                Select Time
              </h3>
              
              <div className="flex items-center justify-center gap-1">
                {/* Hour */}
                <div 
                  onClick={() => setTimePickerMode('hour')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'hour' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {selectedHour}
                </div>
                
                <span className="text-5xl font-light text-[#1c1b1f] mx-1 pb-2">:</span>
                
                {/* Minute */}
                <div 
                  onClick={() => setTimePickerMode('minute')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'minute' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {String(selectedMinute).padStart(2, '0')}
                </div>
                
                {/* AM/PM */}
                <div className="flex flex-col ml-2 border border-[#79747E] rounded-md overflow-hidden">
                  <button 
                    onClick={() => setSelectedPeriod('am')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'am' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'} border-b border-[#79747E]`}
                  >
                    AM
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('pm')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'pm' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'}`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Clock Face */}
            <div className="px-6 py-6 flex justify-center mt-2">
              <div className="relative w-64 h-64 bg-[#e5e7eb] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#4F378B] rounded-full absolute z-10"></div>
                {/* Draw clock numbers and hand */}
                {(() => {
                  const items = timePickerMode === 'hour' 
                    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                  const radius = 104; // Radius of numbers circle
                  const cx = 128;
                  const cy = 128;
                  
                  const selectedVal = timePickerMode === 'hour' ? selectedHour : selectedMinute;
                  
                  // For minutes not exactly on a 5-minute mark, find closest angle
                  let angleDegrees = 0;
                  if (timePickerMode === 'hour') {
                    angleDegrees = (selectedVal % 12) * 30;
                  } else {
                    angleDegrees = selectedVal * 6;
                  }
                  
                  const angleRad = (angleDegrees - 90) * (Math.PI / 180);
                  const handX = cx + radius * Math.cos(angleRad);
                  const handY = cy + radius * Math.sin(angleRad);

                  return (
                    <>
                      {/* Clock Hand Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <line x1="128" y1="128" x2={handX} y2={handY} stroke="#4F378B" strokeWidth="2" />
                      </svg>
                      {/* Clock Selected Circle Background */}
                      <div 
                        className="absolute w-10 h-10 bg-[#4F378B] rounded-full z-0 pointer-events-none"
                        style={{
                          left: `${handX - 20}px`,
                          top: `${handY - 20}px`,
                        }}
                      ></div>

                      {/* Clock Numbers */}
                      {items.map((val, i) => {
                        const valAngle = (i * 30 - 90) * (Math.PI / 180);
                        const x = cx + radius * Math.cos(valAngle);
                        const y = cy + radius * Math.sin(valAngle);
                        const isSelected = selectedVal === val;
                        
                        return (
                          <div
                            key={val}
                            onClick={() => {
                              if (timePickerMode === 'hour') {
                                setSelectedHour(val === 0 ? 12 : val);
                                setTimePickerMode('minute'); // Auto switch to minute
                              } else {
                                setSelectedMinute(val);
                              }
                            }}
                            className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center rounded-full cursor-pointer text-base z-10 transition-colors ${isSelected ? 'text-white' : 'text-[#1c1b1f] hover:bg-gray-300'}`}
                            style={{ left: `${x}px`, top: `${y}px` }}
                          >
                            {timePickerMode === 'minute' ? String(val).padStart(2, '0') : val}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center px-6 pb-4 pt-2">
              {/* Keyboard Icon */}
              <svg className="w-5 h-5 text-[#49454f] cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,5H4C2.895,5,2,5.895,2,7v10c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V7C22,5.895,21.105,5,20,5z M11,8h2v2h-2V8z M11,11h2v2h-2V11z M8,8h2v2H8V8z M8,11h2v2H8V11z M5,8h2v2H5V8z M5,11h2v2H5V11z M16,16H8v-2h8V16z M14,11h2v2h-2V11z M14,8h2v2h-2V8z M17,11h2v2h-2V11z M17,8h2v2h-2V8z"/>
              </svg>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingConfirmationModal && (
        <BookingConfirmationModal
          bookingId={confirmedBookingId}
          bookingData={confirmedBookingData}
          onClose={() => {
            console.log("close booking confirmation modal")
            setShowBookingConfirmationModal(false);
            setConfirmedBookingId(null);
            setConfirmedBookingData(null);
          }}
        />
      )}

      {/* Scrollbar Hide Styles */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CarDetailsPage;

