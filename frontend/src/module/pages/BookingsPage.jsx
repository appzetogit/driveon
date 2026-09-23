import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { colors } from '../theme/colors';
import SearchHeader from '../components/layout/SearchHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import BookingDetailsModal from '../components/common/BookingDetailsModal';
import useInViewAnimation from '../hooks/useInViewAnimation';
import { bookingService } from '../../services/booking.service';
import { carService } from '../../services/car.service';

// Import car images for mock data
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg8 from '../../assets/car_img8.png';

const carImages = [carImg1, carImg2, carImg4, carImg5, carImg6, carImg8];

// Booking card shimmer skeleton loading component
const BookingCardSkeleton = () => (
  <div className="w-full bg-white rounded-2xl p-3 flex gap-3 border border-gray-100 shadow-sm animate-pulse">
    {/* Left: Image placeholder */}
    <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0"></div>
    {/* Right: Content placeholders */}
    <div className="flex-1 min-w-0 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-12 flex-shrink-0"></div>
      </div>
      <div className="flex gap-1.5 my-2">
        <div className="h-4 bg-gray-200 rounded w-10"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
        <div className="h-4 bg-gray-200 rounded w-10"></div>
      </div>
      <div className="flex justify-end pt-1">
        <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
      </div>
    </div>
  </div>
);

/**
 * BookingCard Component - Individual booking card with scroll-based animation
 */
const BookingCard = ({ booking, index, navigate, setSelectedBooking, setShowDetailsModal, setCancellationBooking, setShowCancellationModal, getStatusColor, getStatusLabel, calculateDays, calculateDelay, colors }) => {
  const [cardRef, isCardInView] = useInViewAnimation({ threshold: 0.1 });
  const [imageRef, isImageInView] = useInViewAnimation({ threshold: 0.1 });
  
  return (
    <div
      ref={cardRef}
      className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
      style={{ 
        backgroundColor: colors.backgroundSecondary,
        border: `1px solid ${colors.backgroundTertiary}15`,
      }}
      onClick={() => {
        setSelectedBooking(booking);
        setShowDetailsModal(true);
      }}
    >
      <div className="flex items-stretch p-3 gap-3">
        {/* Left: Thumbnail */}
        <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
          <img
            ref={imageRef}
            src={booking.car.image}
            alt={`${booking.car.brand} ${booking.car.model}`}
            className="w-full h-full object-cover"
            style={{
              opacity: isImageInView ? 1 : 0,
              transform: isImageInView ? 'scale(1)' : 'scale(1.05)',
              transition: `opacity 0.3s ease-out ${index * 0.04}s, transform 0.3s ease-out ${index * 0.04}s`,
            }}
          />
          {/* Status Badge over thumbnail */}
          <div
            className="absolute bottom-0 left-0 right-0 py-0.5 text-center text-[8px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: getStatusColor(booking.status) + 'ee' }}
          >
            {getStatusLabel(booking.status)}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top row: name + price */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight truncate" style={{ color: colors.textPrimary }}>
                {booking.car.brand} {booking.car.model}
              </h3>
              <p className="text-[9px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: colors.textSecondary }}>
                {booking.bookingId}
              </p>
            </div>
            {(() => {
              const p = booking.pricing;
              const advPaid = (booking.paymentOption === 'advance' || (p?.advancePayment > 0))
                ? (p?.advancePayment || 0)
                : Math.max(0, (p?.totalPrice || booking.totalPrice || 0) - (p?.discount || 0));
              const isRemPaid = (booking.remainingAmount || 0) === 0 || booking.paymentStatus === 'paid';
              const remPaid = isRemPaid ? (p?.remainingPayment || 0) : 0;
              const totalPaid = advPaid + remPaid;
              return (
                <span className="text-sm font-black flex-shrink-0" style={{ color: colors.backgroundTertiary }}>
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
              );
            })()}
          </div>

          {/* Middle: chips */}
          <div className="flex flex-wrap gap-1 my-1.5">
            {[booking.car.seats + ' Seats', booking.car.transmission, booking.car.fuelType].map((feat, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{ backgroundColor: colors.backgroundPrimary, color: colors.textSecondary }}
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Overdue warning (compact) */}
          {(() => {
            const delayInfo = calculateDelay(booking.dropDate, booking.dropTime);
            if (!delayInfo || booking.status === 'completed' || booking.status === 'cancelled') return null;
            return (
              <div className="flex items-center gap-1 mb-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: colors.warning + '15', border: `1px solid ${colors.warning}30` }}>
                <svg className="w-3 h-3 flex-shrink-0" style={{ color: colors.warning }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[9px] font-bold" style={{ color: colors.warning }}>Overdue +₹{delayInfo.additionalCharges.toLocaleString('en-IN')}</span>
              </div>
            );
          })()}

          {/* Bottom: action button */}
          <div className="flex items-center gap-1.5">
            {booking.paymentStatus === 'partial' && booking.status !== 'confirmed' && (
              <span className="text-[9px] font-bold mr-auto" style={{ color: colors.textSecondary }}>
                Bal: ₹{booking.remainingAmount.toLocaleString('en-IN')}
              </span>
            )}
            <div className="ml-auto">
              {(booking.status === 'confirmed' || booking.status === 'pending') ? (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setShowDetailsModal(true); }}
                    className="px-5 py-1 rounded-lg font-bold text-[9px] text-white"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    Details
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCancellationBooking(booking); setShowCancellationModal(true); }}
                    className="px-5 py-1 rounded-lg font-bold text-[9px] text-white"
                    style={{ backgroundColor: colors.error }}
                  >
                    Cancel
                  </button>
                </div>
              ) : booking.status === 'completed' && !booking.userRating ? (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/write-review/${booking.id}`, { state: { booking } }); }}
                  className="px-4 py-1 rounded-lg font-bold text-[9px] text-white"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Write Review
                </button>
              ) : booking.status === 'completed' && booking.userRating > 0 ? (
                <div className="px-5 py-1 rounded-lg text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                  ✓ Reviewed ({booking.userRating}★)
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setShowDetailsModal(true); }}
                  className="px-5 py-1 rounded-lg font-bold text-[9px] text-white"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

/**
 * BookingsPage Component
 * My Bookings page for module frontend
 * Based on document.txt booking schema requirements
 * Shows bookings with status, trip status, payment details
 */
const BookingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cancellationBooking, setCancellationBooking] = useState(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  
  // Pagination & Lazy Loading States
  const [visibleCount, setVisibleCount] = useState(6);
  const observerRef = useRef(null);
  
  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 6);
        }
      }, { rootMargin: '100px' });
      observerRef.current.observe(node);
    }
  }, []);

  // Reset pagination when active tab changes
  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab]);

  // Cancellation reasons
  const cancellationReasons = [
    'Change of plans',
    'Found a better option',
    'Financial constraints',
    'Car not available anymore',
    'Emergency situation',
    'Travel dates changed',
    'Other'
  ];

  // Function to fetch bookings from API
  const fetchBookings = async () => {
    setLoading(true);
    
    // Check authentication
    const authToken = token || localStorage.getItem('authToken');
    console.log('🔐 Authentication check:', {
      isAuthenticated,
      hasToken: !!authToken,
      tokenLength: authToken?.length,
    });
    
    if (!authToken) {
      console.warn('⚠️ No authentication token found, redirecting to login');
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      setLoading(false);
      return;
    }
    
    try {
      // Fetch bookings and active cars list in parallel to avoid N sequential requests
      const [response, carsResponse] = await Promise.all([
        bookingService.getBookings(),
        carService.getCars({ limit: 200 }).catch(err => {
          console.error("Error pre-fetching cars list:", err);
          return { success: false };
        })
      ]);

      // Build a lookup map for instant client-side resolution of car specifications
      const carMap = new Map();
      if (carsResponse?.success && carsResponse?.data?.cars) {
        carsResponse.data.cars.forEach(c => {
          carMap.set(c._id || c.id, c);
        });
      }
      
      console.log('📥 Bookings API Response:', response);
      console.log('📥 Response structure:', {
        hasSuccess: 'success' in response,
        success: response?.success,
        hasData: 'data' in response,
        hasBookings: 'bookings' in response,
        dataBookings: response?.data?.bookings?.length,
        directBookings: response?.bookings?.length,
        pagination: response?.data?.pagination,
      });
      
      // Check if response has bookings array - handle multiple response structures
      let bookingsArray = [];
      
      if (response?.data?.bookings && Array.isArray(response.data.bookings)) {
        bookingsArray = response.data.bookings;
        console.log('✅ Found bookings in response.data.bookings:', bookingsArray.length);
      } else if (response?.bookings && Array.isArray(response.bookings)) {
        bookingsArray = response.bookings;
        console.log('✅ Found bookings in response.bookings:', bookingsArray.length);
      } else if (Array.isArray(response)) {
        bookingsArray = response;
        console.log('✅ Response is directly an array:', bookingsArray.length);
      } else {
        console.warn('⚠️ No bookings array found in response');
        console.warn('Response keys:', Object.keys(response || {}));
      }
      
      if (bookingsArray.length > 0) {
        console.log(`Found ${bookingsArray.length} bookings from API`);
        
        // Transform API bookings to match component format
        const transformedBookings = await Promise.all(
          bookingsArray.map(async (booking) => {
            // Handle car data - backend populates car with limited fields
            let carData = booking.car;
            const carId = booking.car?._id || booking.car?.id || booking.carId;
            
            // Try to resolve from pre-fetched map first
            const cachedCar = carId ? carMap.get(carId) : null;
            if (cachedCar) {
              let carImage = carImg1;
              if (cachedCar.images && cachedCar.images.length > 0) {
                const primary = cachedCar.images.find((img) => img.isPrimary);
                carImage = primary ? primary.url : (cachedCar.images[0]?.url || carImage);
              } else if (cachedCar.image) {
                carImage = typeof cachedCar.image === 'string' ? cachedCar.image : (cachedCar.image?.url || carImg1);
              }

              // Normalize image path if relative
              if (carImage && typeof carImage === 'string' && !carImage.startsWith('http') && !carImage.startsWith('data:') && !carImage.startsWith('/src') && !carImage.startsWith('blob:')) {
                const base = import.meta.env.VITE_API_BASE_URL || '';
                carImage = `${base}${carImage.startsWith('/') ? '' : '/'}${carImage}`;
              }

              carData = {
                id: cachedCar._id || cachedCar.id,
                brand: cachedCar.brand || carData?.brand || '',
                model: cachedCar.model || carData?.model || '',
                image: carImage,
                seats: cachedCar.seatingCapacity || carData?.seatingCapacity || 4,
                transmission: cachedCar.transmission || carData?.transmission || 'Automatic',
                fuelType: cachedCar.fuelType || carData?.fuelType || 'Petrol',
              };
            } else if (carId && (!carData || !carData.seatingCapacity || !carData.transmission)) {
              // Check if it's a mock car ID first
              if (typeof carId === 'string' && carId.startsWith('car')) {
                const carNumber = parseInt(carId.replace(/\D/g, '')) || 1;
                carData = {
                  id: carId,
                  brand: ['Toyota', 'Honda', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Ford'][(carNumber - 1) % 7] || 'Car',
                  model: ['Camry', 'City', 'Swift', 'i20', 'Nexon', 'XUV700', 'EcoSport'][(carNumber - 1) % 7] || 'Model',
                  image: carImages[(carNumber - 1) % carImages.length] || carImg1,
                  seats: 5,
                  transmission: 'Manual',
                  fuelType: 'Petrol',
                };
              } else {
                // Fallback to fetch individually only if not found in map
                try {
                  const carResponse = await carService.getCarDetails(carId);
                  if (carResponse.success && carResponse.data?.car) {
                    const apiCar = carResponse.data.car;
                    // Resolve primary image
                    let carImage = carImg1;
                    if (apiCar.images && apiCar.images.length > 0) {
                      const primary = apiCar.images.find((img) => img.isPrimary);
                      carImage = primary ? primary.url : (apiCar.images[0]?.url || carImage);
                    } else if (apiCar.image) {
                      carImage = typeof apiCar.image === 'string' ? apiCar.image : (apiCar.image?.url || carImg1);
                    }
                    
                    carData = {
                      id: apiCar._id || apiCar.id,
                      brand: apiCar.brand || carData?.brand || '',
                      model: apiCar.model || carData?.model || '',
                      image: carImage,
                      seats: apiCar.seatingCapacity || carData?.seatingCapacity || 4,
                      transmission: apiCar.transmission || carData?.transmission || 'Automatic',
                      fuelType: apiCar.fuelType || carData?.fuelType || 'Petrol',
                    };
                  } else if (carData) {
                    // Use populated car data from booking, but ensure all fields exist
                    let carImage = carImg1;
                    if (carData.images && carData.images.length > 0) {
                      const primary = carData.images.find((img) => img.isPrimary);
                      carImage = primary ? primary.url : (carData.images[0]?.url || carImage);
                    } else if (carData.image) {
                      carImage = typeof carData.image === 'string' ? carData.image : (carData.image?.url || carImg1);
                    }
                    
                    carData = {
                      id: carData._id || carData.id || carId,
                      brand: carData.brand || '',
                      model: carData.model || '',
                      image: carImage,
                      seats: carData.seatingCapacity || 4,
                      transmission: carData.transmission || 'Automatic',
                      fuelType: carData.fuelType || 'Petrol',
                    };
                  }
                } catch (error) {
                  // Suppress expected 404 errors from polluting console.error
                  if (error.response?.status === 404) {
                    console.warn(`Car details not found (404) for ID: ${carId}`);
                  } else {
                    console.error('Error fetching car details:', error);
                  }
                  
                  // Use populated car data if available
                  if (carData) {
                    let carImage = carImg1;
                    if (carData.images && carData.images.length > 0) {
                      carImage = carData.images[0]?.url || carImg1;
                    }
                    carData = {
                      id: carData._id || carData.id || carId,
                      brand: carData.brand || '',
                      model: carData.model || '',
                      image: carImage,
                      seats: 4,
                      transmission: 'Automatic',
                      fuelType: 'Petrol',
                    };
                  }
                }
              }
            } else if (carData) {
              // Car is populated, ensure all required fields exist
              let carImage = carImg1;
              if (carData.images && carData.images.length > 0) {
                const primary = carData.images.find((img) => img.isPrimary);
                carImage = primary ? primary.url : (carData.images[0]?.url || carImage);
              } else if (carData.image) {
                carImage = typeof carData.image === 'string' ? carData.image : (carData.image?.url || carImg1);
              }
              
              carData = {
                id: carData._id || carData.id || carId,
                brand: carData.brand || '',
                model: carData.model || '',
                image: carImage,
                seats: carData.seatingCapacity || 4,
                transmission: carData.transmission || 'Automatic',
                fuelType: carData.fuelType || 'Petrol',
              };
            }
            
            // Handle pricing - check both pricing object and direct fields
            const totalPrice = booking.pricing 
              ? booking.pricing.totalPrice 
              : (booking.totalPrice || booking.amount || 0);
            const paidAmount = booking.paidAmount !== undefined ? booking.paidAmount : (booking.pricing?.advancePayment || 0);
            const remainingAmount = booking.remainingAmount !== undefined 
              ? booking.remainingAmount 
              : (booking.pricing?.remainingPayment !== undefined 
                  ? booking.pricing.remainingPayment 
                  : Math.max(0, totalPrice - (booking.pricing?.discount || 0) - paidAmount));
            
            // Handle dates - tripStart.date and tripEnd.date are Date objects, need to convert to ISO string
            let pickupDate = booking.tripStart?.date;
            if (pickupDate) {
              // If it's a Date object, convert to ISO string; if already string, use as is
              pickupDate = pickupDate instanceof Date ? pickupDate.toISOString() : pickupDate;
            } else {
              pickupDate = booking.pickupDate || booking.startDate || booking.pickupDateTime;
            }
            
            let dropDate = booking.tripEnd?.date;
            if (dropDate) {
              // If it's a Date object, convert to ISO string; if already string, use as is
              dropDate = dropDate instanceof Date ? dropDate.toISOString() : dropDate;
            } else {
              dropDate = booking.dropDate || booking.endDate || booking.dropDateTime;
            }
            
            // Handle times - tripStart.time and tripEnd.time are strings
            const pickupTime = booking.tripStart?.time || booking.pickupTime || booking.startTime || '10:00';
            const dropTime = booking.tripEnd?.time || booking.dropTime || booking.endTime || '18:00';
            
            return {
              id: booking._id || booking.id,
              bookingId: booking.bookingId || booking.bookingNumber || `BK${(booking._id || booking.id).toString().slice(-6)}`,
              car: carData || {
                id: carId || 'unknown',
                brand: 'Unknown',
                model: 'Car',
                image: carImg1,
                seats: 4,
                transmission: 'Automatic',
                fuelType: 'Petrol',
              },
              status: booking.status || 'pending',
              tripStatus: booking.tripStatus || 'not_started',
              paymentStatus: booking.paymentStatus || 'pending',
              pickupDate: pickupDate,
              pickupTime: pickupTime,
              dropDate: dropDate,
              dropTime: dropTime,
              totalPrice: totalPrice,
              paidAmount: paidAmount,
              remainingAmount: remainingAmount,
              isTrackingActive: booking.isTrackingActive || false,
              createdAt: booking.createdAt || booking.bookingDate,
              userRating: booking.userRating || 0,
              pricing: booking.pricing || null,
              addOnServices: booking.addOnServices || null,
              cancelledBy: booking.cancelledBy || null,
              cancelledAt: booking.cancelledAt || null,
              cancellationReason: booking.cancellationReason || null,
              user: booking.user || {},
              paymentOption: booking.paymentOption || 'N/A',
              transactions: booking.transactions || [],
            };
          })
        );
        
        // Remove duplicates from transformed bookings (in case API returns duplicates)
        const uniqueTransformedBookings = [];
        const seenIds = new Set();
        for (const booking of transformedBookings) {
          const bookingId = booking.id || booking._id;
          if (bookingId && !seenIds.has(bookingId)) {
            seenIds.add(bookingId);
            uniqueTransformedBookings.push(booking);
          }
        }
        
        console.log('✅ Transformed bookings:', uniqueTransformedBookings);
        console.log('✅ Transformed bookings count:', uniqueTransformedBookings.length);
        console.log('✅ Duplicates removed:', transformedBookings.length - uniqueTransformedBookings.length);
        
        setBookings(uniqueTransformedBookings);
      } else {
        console.log('⚠️ No bookings found in API response or empty array');
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    // Clear legacy mock bookings from localStorage
    localStorage.removeItem('localBookings');
    fetchBookings();
  }, []);

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedReason) {
      alert('Please select a cancellation reason');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      if (cancellationBooking && cancellationBooking.id && typeof cancellationBooking.id === 'string') {
        try {
          const response = await bookingService.updateBookingStatus(cancellationBooking.id, {
            status: 'cancelled',
            cancellationReason: selectedReason,
          });
          if (response && response.success) {
            // Update state
            setBookings((prevBookings) => {
              return prevBookings.map((booking) => {
                if (booking.id === cancellationBooking.id) {
                  return {
                    ...booking,
                    status: 'cancelled',
                    tripStatus: 'cancelled',
                    cancellationReason: selectedReason,
                    cancelledAt: new Date().toISOString(),
                    cancelledBy: 'user',
                  };
                }
                return booking;
              });
            });
            
            // Close modal and reset
            setShowCancellationModal(false);
            setCancellationBooking(null);
            setSelectedReason('');
            
            // Show success message
            alert('Booking cancelled successfully!');
            
            // Switch to cancelled tab
            setActiveTab('cancelled');

            // Refresh list to make sure we have synced database state
            fetchBookings();
          }
        } catch (apiError) {
          console.error('API booking cancellation failed:', apiError);
          alert(apiError.response?.data?.message || 'Failed to cancel booking on the server. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking. Please try again.');
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    // Exclude bookings that the user never actually paid/booked and were cancelled
    if (booking.status === 'unpaid') return false;
    if (booking.status === 'cancelled') {
      const paid = booking.paidAmount || booking.advancePayment || 0;
      if (paid === 0 && booking.cancelledBy !== 'user') return false;
    }

    if (activeTab === 'all') return true;
    if (activeTab === 'active') return booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'active';
    if (activeTab === 'completed') return booking.status === 'completed';
    if (activeTab === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  // Debug: Log filtered bookings when they change
  useEffect(() => {
    console.log('🔍 Filtering bookings:', {
      activeTab,
      totalBookings: bookings.length,
      filteredCount: filteredBookings.length,
      bookingsStatuses: bookings.map(b => ({ id: b.id, status: b.status })),
    });
  }, [bookings, activeTab, filteredBookings.length]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return colors.info;
      case 'active':
        return colors.success;
      case 'completed':
        return colors.textSecondary;
      case 'cancelled':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.textTertiary;
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  // Calculate days
  const calculateDays = (pickupDate, dropDate) => {
    if (!pickupDate || !dropDate) return 0;
    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);
    const diffTime = Math.abs(drop - pickup);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  // Calculate delay and additional charges
  const calculateDelay = (dropDate, dropTime) => {
    if (!dropDate) return null;
    
    // Combine date and time to get exact end datetime
    const dropDateTime = new Date(dropDate);
    if (dropTime) {
      const [hours, minutes] = dropTime.split(':');
      dropDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
    }
    
    const now = new Date();
    const delayMs = now - dropDateTime;
    
    // Only show delay if trip end date has passed
    if (delayMs <= 0) return null;
    
    const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
    const delayDays = Math.floor(delayHours / 24);
    const remainingHours = delayHours % 24;
    
    // Calculate additional charges (dummy data)
    // Base rate: ₹500 per hour for first 24 hours, then ₹1000 per day
    let additionalCharges = 0;
    if (delayDays === 0) {
      // Less than 24 hours: ₹500 per hour
      additionalCharges = delayHours * 500;
    } else {
      // First 24 hours: ₹500 per hour
      additionalCharges = 24 * 500;
      // After 24 hours: ₹1000 per day
      additionalCharges += delayDays * 1000;
      // Remaining hours: ₹500 per hour
      if (remainingHours > 0) {
        additionalCharges += remainingHours * 500;
      }
    }
    
    return {
      delayHours,
      delayDays,
      remainingHours,
      additionalCharges,
      delayText: delayDays > 0 
        ? `${delayDays} day${delayDays > 1 ? 's' : ''} ${remainingHours > 0 ? `and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''}`
        : `${delayHours} hour${delayHours > 1 ? 's' : ''}`
    };
  };

  return (
    <div 
      className="min-h-screen w-full pb-20 md:pb-8"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Header */}
      <SearchHeader title="Bookings" backRoute="/" />

      {/* Web container - max-width and centered on larger screens */}
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-3 md:pb-4">
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          My Bookings
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Manage and track your car rentals
        </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 md:mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8 flex-nowrap pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  backgroundColor: activeTab === tab.id ? colors.backgroundTertiary : colors.backgroundSecondary,
                  color: activeTab === tab.id ? colors.backgroundSecondary : colors.textPrimary,
                  boxShadow: activeTab === tab.id ? `0 2px 8px ${colors.backgroundTertiary}30` : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="px-4 md:px-6 lg:px-8 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8 pb-4 md:pb-8">
            {[...Array(6)].map((_, idx) => (
              <BookingCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <svg 
              className="w-20 h-20 mb-4"
              style={{ color: colors.textTertiary }}
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
            <p className="text-base font-semibold mb-1" style={{ color: colors.textPrimary }}>
              No bookings found
            </p>
            <p className="text-sm text-center" style={{ color: colors.textSecondary }}>
              {activeTab === 'all' 
                ? "You don't have any bookings yet"
                : `No ${activeTab} bookings found`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 md:px-6 lg:px-8 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8 pb-4 md:pb-8">
              {filteredBookings.slice(0, visibleCount).map((booking, index) => (
                <BookingCard
                  key={`${booking.id}-${booking.bookingId}-${index}`}
                  booking={booking}
                  index={index}
                  navigate={navigate}
                  setSelectedBooking={setSelectedBooking}
                  setShowDetailsModal={setShowDetailsModal}
                  setCancellationBooking={setCancellationBooking}
                  setShowCancellationModal={setShowCancellationModal}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  calculateDays={calculateDays}
                  calculateDelay={calculateDelay}
                  colors={colors}
                />
              ))}
            </div>

            {/* Sentinel for Infinite Scroll */}
            {visibleCount < filteredBookings.length && (
              <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.backgroundTertiary }}></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          onCancel={() => {
            setShowDetailsModal(false);
            setCancellationBooking(selectedBooking);
            setSelectedBooking(null);
            setShowCancellationModal(true);
          }}
        />
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && cancellationBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCancellationModal(false);
            setCancellationBooking(null);
            setSelectedReason('');
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Cancel Booking
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Please select a reason for cancellation:
            </p>
            
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {cancellationReasons.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedReason === reason ? colors.backgroundTertiary + '20' : colors.backgroundPrimary,
                    border: `1px solid ${selectedReason === reason ? colors.backgroundTertiary : 'transparent'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3"
                    style={{ accentColor: colors.backgroundTertiary }}
                  />
                  <span style={{ color: colors.textPrimary }}>{reason}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancellationModal(false);
                  setCancellationBooking(null);
                  setSelectedReason('');
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
                style={{
                  backgroundColor: colors.backgroundPrimary,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.backgroundTertiary}40`
                }}
              >
                Close
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={!selectedReason}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.error }}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(1.1);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

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

export default BookingsPage;

