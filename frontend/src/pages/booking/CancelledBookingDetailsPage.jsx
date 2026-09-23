import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import { bookingService } from '../../services/booking.service';
import { carService } from '../../services/car.service';

/**
 * CancelledBookingDetailsPage Component
 * Shows detailed information about a cancelled booking
 * Based on document.txt specifications
 */
const CancelledBookingDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [carDetails, setCarDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch booking from API
        const response = await bookingService.getBooking(id);
        
        if (response.success && response.data?.booking) {
          const bookingData = response.data.booking;
          
          // Fetch car details
          let fetchedCarDetails = null;
          const carId = bookingData.car?._id || bookingData.car?.id || bookingData.carId;
          if (carId && !carId.startsWith('car')) {
            try {
              const carResponse = await carService.getCarDetails(carId);
              if (carResponse.success && carResponse.data?.car) {
                const carData = carResponse.data.car;
                let images = [];
                if (carData.images && Array.isArray(carData.images)) {
                  images = carData.images.map(img => {
                    if (typeof img === 'string') return img;
                    return img.url || img.path || null;
                  }).filter(img => img);
                } else if (carData.primaryImage) {
                  images = [carData.primaryImage];
                }
                
                fetchedCarDetails = {
                  id: carData._id || carData.id,
                  brand: carData.brand || '',
                  model: carData.model || '',
                  image: images.length > 0 ? images[0] : null,
                  year: carData.year || new Date().getFullYear(),
                  seats: carData.seatingCapacity || 5,
                  transmission: carData.transmission || 'Manual',
                  fuelType: carData.fuelType || 'Petrol',
                  color: carData.color || 'N/A',
                  features: carData.features || [],
                  rating: carData.averageRating || 0,
                };
                setCarDetails(fetchedCarDetails);
              }
            } catch (error) {
              console.error('Error fetching car details:', error);
            }
          }

          // Format booking data
          const formattedBooking = {
            id: bookingData._id || bookingData.id,
            bookingId: bookingData.bookingId || bookingData._id || bookingData.id,
            car: {
              id: carId,
              brand: fetchedCarDetails?.brand || bookingData.car?.brand || 'Unknown',
              model: fetchedCarDetails?.model || bookingData.car?.model || 'Car',
              image: fetchedCarDetails?.image || bookingData.car?.image || null,
            },
            pickupDate: bookingData.tripStart?.date || bookingData.pickupDate,
            pickupTime: bookingData.tripStart?.time || bookingData.pickupTime || '10:00 AM',
            dropDate: bookingData.tripEnd?.date || bookingData.dropDate,
            dropTime: bookingData.tripEnd?.time || bookingData.dropTime || '10:00 AM',
            pickupLocation: bookingData.tripStart?.location || bookingData.pickupLocation || 'Location not specified',
            dropLocation: bookingData.tripEnd?.location || bookingData.dropLocation || bookingData.pickupLocation,
            duration: `${bookingData.totalDays || 1} ${(bookingData.totalDays || 1) === 1 ? 'day' : 'days'}`,
            days: bookingData.totalDays || bookingData.days || 1,
            bookingDate: bookingData.createdAt || bookingData.bookingDate,
            cancelledDate: bookingData.cancelledAt || bookingData.cancelledDate || bookingData.cancellationDate,
            cancellationReason: bookingData.cancellationReason || bookingData.reason || 'Not specified',
            cancelledBy: bookingData.cancelledBy || 'user',
            status: bookingData.status || 'cancelled',
            paymentStatus: bookingData.paymentStatus || 'pending',
            paymentType: bookingData.paymentOption || bookingData.paymentType || 'full',
            totalPrice: bookingData.pricing 
              ? (bookingData.pricing.totalPrice - (bookingData.pricing.discount || 0)) 
              : (bookingData.totalPrice || 0),
            paidAmount: bookingData.paidAmount || 0,
            refundAmount: bookingData.refundAmount || 0,
            refundStatus: bookingData.refundStatus || 'pending',
            refundDate: bookingData.refundDate || null,
            basePrice: bookingData.pricing?.basePrice || bookingData.basePrice || 0,
            user: bookingData.user || {},
            guarantor: bookingData.guarantor || {},
          };
          setBooking(formattedBooking);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/bookings')}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>
        <div className="relative px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <button
              onClick={() => navigate('/bookings')}
              className="p-1.5 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-white">Cancelled Booking Details</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Cancellation Status Banner */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 md:p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Booking Cancelled</h3>
              <p className="text-sm text-red-700 mb-2">
                This booking was cancelled on {formatDate(booking.cancelledDate)}
              </p>
              {booking.cancellationReason && (
                <p className="text-sm text-red-600">
                  <span className="font-medium">Reason:</span> {booking.cancellationReason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
            Booking Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Booking ID</p>
              <p className="text-base font-semibold text-gray-900">{booking.bookingId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Booking Date</p>
              <p className="text-base font-semibold text-gray-900">{formatDate(booking.bookingDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cancelled Date</p>
              <p className="text-base font-semibold text-gray-900">{formatDateTime(booking.cancelledDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cancelled By</p>
              <p className="text-base font-semibold text-gray-900 capitalize">{booking.cancelledBy || 'User'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
              <p className="text-base font-semibold text-gray-900">{booking.duration}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                Cancelled
              </span>
            </div>
          </div>
        </div>

        {/* Car Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
            Car Details
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            {booking.car?.image && (
              <div className="flex-shrink-0">
                <img
                  src={booking.car.image}
                  alt={`${booking.car.brand} ${booking.car.model}`}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {booking.car?.brand} {booking.car?.model}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {carDetails?.year && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Year</p>
                    <p className="text-base text-gray-900">{carDetails.year}</p>
                  </div>
                )}
                {carDetails?.seats && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Seats</p>
                    <p className="text-base text-gray-900">{carDetails.seats}</p>
                  </div>
                )}
                {carDetails?.transmission && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Transmission</p>
                    <p className="text-base text-gray-900">{carDetails.transmission}</p>
                  </div>
                )}
                {carDetails?.fuelType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Fuel Type</p>
                    <p className="text-base text-gray-900">{carDetails.fuelType}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
            Trip Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <svg className="w-5 h-5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Pickup Date & Time</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(booking.pickupDate)} at {booking.pickupTime}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <svg className="w-5 h-5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Drop Date & Time</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(booking.dropDate)} at {booking.dropTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Refund Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-6" style={{ color: theme.colors.primary }}>
            Payment & Refund Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-base text-gray-600">Total Booking Amount</span>
              <span className="text-lg font-bold text-gray-900">₹{booking.totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-base text-gray-600">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                booking.paymentStatus === 'partial' ? 'bg-green-100 text-green-800' :
                booking.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {booking.paymentStatus === 'paid' ? 'Paid' :
                 booking.paymentStatus === 'partial' ? 'Advance Done' :
                 booking.paymentStatus === 'refunded' ? 'Refunded' :
                 'Pending'}
              </span>
            </div>
            {booking.paidAmount > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-base text-gray-600">Amount Paid</span>
                <span className="text-lg font-semibold text-gray-900">₹{booking.paidAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {booking.refundAmount > 0 && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-base text-gray-600">Refund Amount</span>
                  <span className="text-lg font-bold text-green-600">₹{booking.refundAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-base text-gray-600">Refund Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    booking.refundStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.refundStatus === 'processed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.refundStatus === 'completed' ? 'Completed' :
                     booking.refundStatus === 'processed' ? 'Processed' :
                     'Pending'}
                  </span>
                </div>
                {booking.refundDate && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-base text-gray-600">Refund Date</span>
                    <span className="text-base font-semibold text-gray-900">{formatDate(booking.refundDate)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(`/rent-now/${booking.car?.id}`)}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 shadow-md hover:shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Book Again
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex-1 px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:scale-105"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
          >
            Back to Bookings
          </button>
        </div>
      </main>
    </div>
  );
};

export default CancelledBookingDetailsPage;

