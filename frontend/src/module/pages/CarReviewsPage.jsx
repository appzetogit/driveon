import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import CarDetailsHeader from '../components/layout/CarDetailsHeader';
import { colors } from '../theme/colors';
import { useAppSelector } from '../../hooks/redux';
import reviewService from '../../services/review.service';
import carService from '../../services/car.service';
import toastUtils from '../../config/toast';

// Import car images - matching CarDetailsPage
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg8 from '../../assets/car_img8.png';

/**
 * CarReviewsPage Component
 * Displays all reviews for a specific car
 * Based on document.txt - User rates car, trip experience, and car owner ratings
 */
const CarReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Get initial car from navigation state if available
  const initialCar = location.state?.car || null;
  
  // Initial car data - use from state if available, otherwise fallback
  const getInitialCarData = () => {
    if (initialCar) {
      return {
        id: initialCar.id || initialCar._id || id,
        brand: initialCar.brand || '',
        model: initialCar.model || '',
        name: initialCar.name || `${initialCar.brand || ''} ${initialCar.model || ''}`.trim() || '',
        image: initialCar.image || initialCar.images?.[0] || carImg1,
        rating: initialCar.rating || initialCar.averageRating || 0,
        reviewsCount: initialCar.reviewsCount || 0,
      };
    }
    return {
    id,
    brand: '',
    model: '',
    name: '',
    image: carImg1,
    rating: 0,
    reviewsCount: 0,
    };
  };

  const [car, setCar] = useState(getInitialCarData());
  // Only show loader if we don't have initial car from state
  const [carLoading, setCarLoading] = useState(!initialCar);

  // Fetch actual car data from API (only if we don't have initial car from state)
  useEffect(() => {
    const fetchCar = async () => {
      if (!id) {
        setCarLoading(false);
        return;
      }

      // If we have initial car from navigation state, don't fetch from API
      if (initialCar) {
        setCarLoading(false);
        return;
      }

      try {
        setCarLoading(true);
        const response = await carService.getCarDetails(id);
        if (response.success && response.data?.car) {
          const apiCar = response.data.car;

          // Resolve primary image from images array
          let image = carImg1;
          if (apiCar.images && Array.isArray(apiCar.images) && apiCar.images.length > 0) {
            const primary = apiCar.images.find((img) => img.isPrimary);
            image = primary ? primary.url : (apiCar.images[0]?.url || image);
          } else if (apiCar.primaryImage) {
            image = apiCar.primaryImage;
          }

          setCar({
            id: apiCar._id || apiCar.id || id,
            brand: apiCar.brand || '',
            model: apiCar.model || '',
            name: `${apiCar.brand || ''} ${apiCar.model || ''}`.trim() || '',
            image,
            rating: apiCar.averageRating || 0,
            reviewsCount: apiCar.reviewsCount || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching car:', error);
        // Keep fallback car data on error
      } finally {
        setCarLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({
    averageCarRating: 0,
    averageTripRating: 0,
    averageOwnerRating: 0,
    averageOverallRating: 0,
    totalReviews: 0,
  });

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // Use car ID from params or car object
        // Priority: car._id (from API) > id (from params) > car.id (fallback)
        let carId = car._id || id || car.id;
        
        // If id is MongoDB ObjectId format, use it directly
        if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
          carId = id;
        }

        if (!carId) {
          setReviews([]);
          setLoading(false);
          return;
        }

        const response = await reviewService.getCarReviews(carId, {
          page: 1,
          limit: 50,
          sort: 'newest',
        });

        if (response.success && response.data) {
          // Format reviews for display
          const formattedReviews = response.data.reviews.map(review => ({
            id: review._id || review.id,
            name: review.user?.name || 'Anonymous',
            profilePic: review.user?.photo || 'https://via.placeholder.com/40',
            rating: review.overallRating?.toFixed(1) || '0',
            carRating: review.carRating,
            tripExperienceRating: review.tripExperienceRating,
            ownerRating: review.ownerRating,
            comment: review.comment,
            date: review.createdAt ? new Date(review.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            verified: review.isVerified || false,
          }));

          setReviews(formattedReviews);
          setRatings(response.data.ratings || ratings);
        } else {
          // No reviews found - show empty state
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Don't show error toast if it's just "no reviews" - show empty state instead
        if (error.response?.status !== 404) {
          toastUtils.error(error.response?.data?.message || 'Failed to load reviews');
        }
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    // Wait for car to load before fetching reviews
    if (!carLoading) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, car._id, carLoading]);

  // Format date - "Today", "Yesterday", or date
  const formatDate = (dateString) => {
    const today = new Date();
    const reviewDate = new Date(dateString);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (reviewDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (reviewDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const diffTime = Math.abs(today - reviewDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        return `${diffDays} days ago`;
      } else {
        return reviewDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: reviewDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  // Render stars - always show 5 solid orange stars for 5.0 rating
  const renderStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-4 h-4"
          fill={colors.accentOrange}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    // Render empty stars for remaining
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className="w-4 h-4"
          fill="none"
          stroke={colors.borderCheckbox}
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div
      className="min-h-screen w-full relative pb-6"
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

      {/* Back Button - Below Header */}
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6">
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

      {/* Main Container - Responsive */}
      <div className="max-w-4xl mx-auto">
        {/* Car Info Section */}
        <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-4 md:pb-6">
          <div
            className="rounded-2xl md:rounded-3xl p-4 md:p-6"
            style={{
              backgroundColor: colors.backgroundSecondary,
              boxShadow: `0 2px 8px ${colors.shadowLight}`,
            }}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <img
                src={car.image}
                alt={car.name || `${car.brand} ${car.model}`}
                className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
              />
              <div className="flex-1">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-black mb-1 md:mb-2">
                  {car.name || `${car.brand} ${car.model}`}
                </h1>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <span className="text-sm md:text-base lg:text-lg font-semibold text-black">
                      {car.rating?.toString() || '5.0'}
                    </span>
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill={colors.accentOrange}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">
                    ({car.reviewsCount} Reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6">
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-black mb-4 md:mb-6">
            All Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div
              className="rounded-lg md:rounded-xl p-6 md:p-8 text-center"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <p className="text-sm md:text-base text-gray-600">
                No reviews yet. Be the first to review!
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 lg:gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg md:rounded-xl p-4 md:p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow md:flex md:flex-col"
                  style={{ backgroundColor: colors.backgroundSecondary }}
                >
                  {/* User Info and Date */}
                  <div className="flex items-start justify-between mb-2 md:mb-2.5">
                    <div className="flex-1">
                      <span className="text-base md:text-base lg:text-lg font-bold text-black block mb-1 md:mb-1.5">
                        {review.name}
                      </span>
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {/* Date in top right */}
                    <span className="text-sm md:text-xs lg:text-sm text-gray-500 whitespace-nowrap ml-2 md:ml-3">
                      {formatDate(review.date)}
                    </span>
                  </div>

                  {/* Review Comment */}
                  <p className="text-sm md:text-sm lg:text-base text-gray-600 leading-relaxed md:leading-normal flex-1">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarReviewsPage;

