import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { BOOKING_STATUS } from '../../constants';
import { theme } from '../../theme/theme.constants';
import bookingService from '../../services/booking.service';

// Import car images from assets
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2-removebg-preview.png';
import carImg3 from '../../assets/car_img3-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg7 from '../../assets/car_img7-removebg-preview.png';

// Array of car images for easy access
const carImages = [carImg1, carImg2, carImg3, carImg4, carImg5, carImg6, carImg7];

/**
 * BookingHistoryPage Component
 * Shows user's booking history with tabs: Active, Completed, Cancelled
 * Mobile-first design matching the provided UI structure
 */
const BookingHistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'cancelled'
  
  // Hydrate allBookings state from cache
  const [allBookings, setAllBookings] = useState(() => {
    try {
      const cached = localStorage.getItem('driveon_all_bookings');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [loading, setLoading] = useState(allBookings.length === 0);
  const [error, setError] = useState(null);

  // Get car image from assets based on car ID or index
  const getCarImage = (carId) => {
    // Use car ID to get a consistent image (modulo to cycle through available images)
    const index = parseInt(carId.replace(/\D/g, '')) || 0;
    return carImages[index % carImages.length];
  };

  // Fetch all bookings from API (background sync on mount)
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // Fetch ALL bookings at once to allow instant tab switching
        const response = await bookingService.getBookings({});

        if (response.success && response.data?.bookings) {
          const mappedBookings = response.data.bookings.map((booking) => {
            const car = booking.car || {};
            const carId = car._id || car.id || 'unknown';
            
            return {
              id: booking._id || booking.id,
              bookingId: booking.bookingId,
              car: {
                id: carId,
                brand: car.brand || 'Unknown',
                model: car.model || 'Car',
                image: car.images && car.images.length > 0 
                  ? (typeof car.images[0] === 'string' ? car.images[0] : car.images[0].url || car.images[0].path)
                  : getCarImage(carId),
                rating: car.averageRating || car.rating || 0,
              },
              pickupDate: booking.tripStart?.date || booking.pickupDate,
              dropDate: booking.tripEnd?.date || booking.dropDate,
              duration: `${booking.totalDays || 1} ${(booking.totalDays || 1) === 1 ? 'day' : 'days'}`,
              pickupLocation: booking.tripStart?.location || booking.pickupLocation || 'Location not specified',
              totalPrice: booking.pricing 
                ? (booking.pricing.totalPrice - (booking.pricing.discount || 0)) 
                : (booking.totalPrice || 0),
              status: booking.status,
              completedDate: booking.completedDate,
              cancelledDate: booking.cancelledDate,
            };
          });

          setAllBookings(mappedBookings);
          localStorage.setItem('driveon_all_bookings', JSON.stringify(mappedBookings));
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        // Only set error if we don't have any cached data to display
        if (allBookings.length === 0) {
          setError(err.response?.data?.message || 'Failed to fetch bookings');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated]);

  // Compute displayed bookings based on activeTab using useMemo (instant filter!)
  const currentBookings = useMemo(() => {
    if (activeTab === 'active') {
      return allBookings.filter(booking => 
        ['pending', 'confirmed', 'active'].includes(booking.status)
      );
    } else if (activeTab === 'completed') {
      return allBookings.filter(booking => booking.status === 'completed');
    } else if (activeTab === 'cancelled') {
      return allBookings.filter(booking => booking.status === 'cancelled');
    }
    return allBookings;
  }, [allBookings, activeTab]);

  const handleReBook = (carId) => {
    navigate(`/rent-now/${carId}`);
  };

  const handleWriteReview = (bookingId) => {
    // Navigate to review page or open review modal
    navigate(`/booking/${bookingId}/review`);
  };

  const handleViewDetails = (bookingId) => {
    if (activeTab === 'active') {
      navigate(`/booking/${bookingId}/active`);
    } else if (activeTab === 'cancelled') {
      navigate(`/booking/${bookingId}/cancelled`);
    } else if (activeTab === 'completed') {
      navigate(`/booking/${bookingId}/completed`);
    } else {
      navigate(`/booking/${bookingId}`);
    }
  };

  const getActionButtons = (booking) => {
    if (activeTab === 'active') {
      return (
        <div className="flex gap-2 md:gap-3 mt-2 md:mt-3">
          <button
            onClick={() => handleViewDetails(booking.id)}
            className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white border-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary + '10'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            View Details
          </button>
        </div>
      );
    } else if (activeTab === 'completed') {
      return (
        <div className="flex gap-2 md:gap-3 mt-2 md:mt-3">
          <button
            onClick={() => handleViewDetails(booking.id)}
            className="w-full px-3 py-2 md:px-4 md:py-2.5 bg-white border-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary + '10'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            View Details
          </button>
        </div>
      );
    } else if (activeTab === 'cancelled') {
      return (
        <div className="flex gap-2 md:gap-3 mt-2 md:mt-3">
          <button
            onClick={() => handleReBook(booking.car.id)}
            className="flex-1 px-3 py-2 md:px-4 md:py-2.5 bg-white border-2 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary + '10'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Book Again
          </button>
          <button
            onClick={() => handleViewDetails(booking.id)}
            className="flex-1 px-3 py-2 md:px-4 md:py-2.5 bg-gray-100 text-gray-700 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm hover:bg-gray-200 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
          >
            View Details
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Section - Purple Background - Sticky */}
      <header className="sticky top-0 z-50 text-white relative overflow-hidden shadow-md rounded-b-3xl" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        <div className="relative px-4 py-3 md:px-6 md:py-5">
          <div className="max-w-7xl mx-auto">
            {/* Back Button and Title in same row */}
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 touch-target md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-lg md:text-3xl font-bold text-white">My Bookings</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 md:gap-8 border-b border-white/20">
              {[
                { key: 'active', label: 'Active' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-2 md:pb-3 px-1 md:px-2 text-sm md:text-lg font-semibold transition-all duration-200 relative ${
                    activeTab === tab.key
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-white rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-red-100 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-center text-base md:text-lg font-medium mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Retry
              </button>
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                <svg
                  className="w-12 h-12 md:w-16 md:h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-center text-base md:text-lg font-medium">
                No {activeTab} bookings found
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {currentBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
                >
                  {/* Rating - Top Right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 md:px-2.5 py-1 md:py-1.5 shadow-lg z-10 border border-yellow-200">
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="text-xs md:text-sm font-bold text-gray-900">
                      {booking.car.rating}
                    </span>
                  </div>

                  <div className="flex gap-3 md:gap-4 p-3 md:p-5">
                    {/* Car Image and Price */}
                    <div className="flex-shrink-0 flex flex-col">
                      {booking.car.image ? (
                        <img
                          src={booking.car.image}
                          alt={`${booking.car.brand} ${booking.car.model}`}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg mb-2 md:mb-3"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2 md:mb-3">
                          <svg
                            className="w-12 h-12 md:w-14 md:h-14 text-gray-400"
                            viewBox="0 0 100 60"
                            fill="currentColor"
                          >
                            <rect x="15" y="25" width="70" height="20" rx="2" />
                            <rect x="20" y="15" width="25" height="15" rx="2" />
                            <rect x="55" y="15" width="25" height="15" rx="2" />
                            <circle cx="30" cy="45" r="5" />
                            <circle cx="70" cy="45" r="5" />
                          </svg>
                        </div>
                      )}
                      {/* Price below image */}
                      <div className="text-center">
                        <span className="text-sm md:text-base font-bold text-gray-900">
                          ₹{booking.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Car Name */}
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2 line-clamp-1 pr-14 md:pr-16">
                        {booking.car.brand} {booking.car.model}
                      </h3>

                      {/* Duration and Date */}
                      <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs md:text-sm font-medium text-gray-700">{booking.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 md:gap-2.5 mb-3 md:mb-4 flex-1">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5 text-gray-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 flex-1 leading-relaxed">
                          {booking.pickupLocation}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto">
                        {getActionButtons(booking)}
                      </div>
                    </div>
                  </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingHistoryPage;
