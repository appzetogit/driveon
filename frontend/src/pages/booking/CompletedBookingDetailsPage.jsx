import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import bookingService from '../../services/booking.service';
import { carService } from '../../services/car.service';
import { generateBookingPDF } from '../../utils/pdfGenerator';

/**
 * CompletedBookingDetailsPage Component
 * Shows detailed information about a completed booking
 * Based on ActiveBookingPage and CancelledBookingDetailsPage
 */
const CompletedBookingDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking from API
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await bookingService.getBooking(id);

        if (response.success && response.data?.booking) {
          const bookingData = response.data.booking;

          // Fetch car details if needed
          let carDetails = bookingData.car || {};
          const carId = carDetails._id || carDetails.id;

          if (carId && !carId.startsWith('car')) {
            try {
              const carResponse = await carService.getCarDetails(carId);
              if (carResponse.success && carResponse.data?.car) {
                carDetails = carResponse.data.car;
              }
            } catch (carError) {
              console.error('Error fetching car details:', carError);
            }
          }

          // Format booking data
          const formattedBooking = {
            id: bookingData._id || bookingData.id,
            bookingId: bookingData.bookingId,
            car: {
              id: carId,
              brand: carDetails.brand || 'Unknown',
              model: carDetails.model || 'Car',
              year: carDetails.year || new Date().getFullYear(),
              seats: carDetails.seatingCapacity || carDetails.seats || 5,
              transmission: carDetails.transmission || 'Manual',
              fuelType: carDetails.fuelType || 'Petrol',
              color: carDetails.color || 'N/A',
              features: carDetails.features || [],
              rating: carDetails.averageRating || carDetails.rating || 0,
              owner: carDetails.owner || {},
            },
            pickupDate: bookingData.tripStart?.date || bookingData.pickupDate,
            pickupTime: bookingData.tripStart?.time || bookingData.pickupTime || '10:00 AM',
            dropDate: bookingData.tripEnd?.date || bookingData.dropDate,
            dropTime: bookingData.tripEnd?.time || bookingData.dropTime || '10:00 AM',
            pickupLocation: bookingData.tripStart?.location || bookingData.pickupLocation || 'Location not specified',
            dropLocation: bookingData.tripEnd?.location || bookingData.dropLocation || bookingData.pickupLocation,
            duration: `${bookingData.totalDays || 1} ${(bookingData.totalDays || 1) === 1 ? 'day' : 'days'}`,
            days: bookingData.totalDays || 1,
            bookingDate: bookingData.createdAt || bookingData.bookingDate,
            completedDate: bookingData.completedAt || bookingData.completedDate,
            status: bookingData.status,
            paymentStatus: bookingData.paymentStatus,
            paymentType: bookingData.paymentOption || 'full',
            totalPrice: bookingData.pricing?.totalPrice || bookingData.totalPrice || 0,
            paidAmount: bookingData.paidAmount || 0,
            remainingAmount: bookingData.remainingAmount !== undefined ? bookingData.remainingAmount : (bookingData.pricing?.remainingPayment || 0),
            basePrice: bookingData.pricing?.basePrice || bookingData.basePrice || 0,
            weekendMultiplier: bookingData.pricing?.weekendMultiplier || 0,
            holidayMultiplier: bookingData.pricing?.holidayMultiplier || 0,
            timeOfDayMultiplier: bookingData.pricing?.timeOfDayMultiplier || 0,
            demandSurge: bookingData.pricing?.demandSurge || 0,
            durationPrice: bookingData.pricing?.durationPrice || 0,
            pricing: bookingData.pricing || null,
            totalDiscount: bookingData.pricing?.discount || bookingData.discount || 0,
            offerDiscount: bookingData.pricing?.offerDiscount || bookingData.offerDiscount || 0,
            pointsDiscount: bookingData.pricing?.pointsDiscount || 0,
            couponDiscount: Math.max(0, (bookingData.pricing?.discount || bookingData.discount || 0) - (bookingData.pricing?.offerDiscount || bookingData.offerDiscount || 0) - (bookingData.pricing?.pointsDiscount || 0)),
            couponCode: bookingData.pricing?.couponCode || bookingData.couponCode,
            offerCode: bookingData.pricing?.offerCode || bookingData.offerCode,
            couponDetails: bookingData.pricing?.couponDetails || null,
            offerDetails: bookingData.pricing?.offerDetails || null,
            user: bookingData.user || {},
            guarantor: bookingData.guarantor || {},
            paymentOption: bookingData.paymentOption || 'N/A',
            transactions: bookingData.transactions || [],
          };

          setBooking(formattedBooking);
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.response?.data?.message || 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  // Download Receipt as PDF
  const handleDownloadReceipt = () => {
    if (!booking) return;

    try {
      // Use shared PDF generator
      generateBookingPDF(booking);
      console.log('Receipt generated successfully');
    } catch (err) {
      console.error('Error generating receipt:', err);
      alert('Failed to generate receipt. Please try again.');
    }
  };


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

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The booking details you\'re looking for could not be found.'}</p>
          <button
            onClick={() => navigate('/bookings')}
            className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Section - Purple Background - Sticky */}
      <header className="sticky top-0 z-50 text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        <div className="relative px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate('/bookings')}
                className="p-1.5 md:p-2 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Trip Details</h1>
            </div>
            <div className="flex gap-2 md:gap-3">
              <span
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium ${booking.status === 'completed'
                  ? 'bg-gray-500/30 text-gray-100'
                  : 'bg-white/20 text-white'
                  }`}
              >
                {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Completed'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-4">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Completion Status Banner */}
          {booking.completedDate && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-1">Trip Completed</h3>
                  <p className="text-sm text-green-700">
                    This trip was completed on {new Date(booking.completedDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trip Information */}
          <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4" style={{ color: theme.colors.primary }}>
              Trip Information
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Pickup Date & Time</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                    {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">{booking.pickupTime}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Drop Date & Time</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                    {new Date(booking.dropDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">{booking.dropTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Duration</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.duration}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Booking Date</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                    {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Car Information */}
          <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4" style={{ color: theme.colors.primary }}>
              Car Information
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Car Name</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                  {booking.car.brand} {booking.car.model} {booking.car.year}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Seats</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.car.seats}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Transmission</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.car.transmission}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Fuel Type</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.car.fuelType}</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Color</label>
                  <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.car.color}</p>
                </div>
              </div>
              {booking.car.features && booking.car.features.length > 0 && (
                <div>
                  <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Features</label>
                  <div className="flex flex-wrap gap-2 md:gap-3 mt-2">
                    {booking.car.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-100 text-gray-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4" style={{ color: theme.colors.primary }}>
              Payment Details
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="pb-3 md:pb-4 border-b border-gray-200 space-y-2">
                {booking.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs md:text-sm text-gray-600">
                    <span>Subtotal (Before Discount)</span>
                    <span className="font-semibold">₹{booking.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {booking.couponDiscount > 0 && (() => {
                  const promoText = booking.couponDetails
                    ? `${booking.couponCode} - ${booking.couponDetails.discountValue}${booking.couponDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`
                    : (booking.couponCode || 'Applied');
                  return (
                    <div className="flex justify-between items-center text-xs md:text-sm text-green-600 font-medium">
                      <span>Coupon Discount ({promoText})</span>
                      <span>-₹{booking.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })()}
                {booking.offerDiscount > 0 && (() => {
                  const promoText = booking.offerDetails
                    ? `${booking.offerDetails.title} - ${booking.offerDetails.discountType === 'free' ? 'Free' : `${booking.offerDetails.discountValue}${booking.offerDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`}`
                    : (booking.offerCode || 'Applied');
                  return (
                    <div className="flex justify-between items-center text-xs md:text-sm text-green-600 font-medium">
                      <span>Offer Discount ({promoText})</span>
                      <span>-₹{booking.offerDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })()}
                {booking.pointsDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs md:text-sm font-medium" style={{ color: '#A16207' }}>
                    <span>🪙 Coins Discount</span>
                    <span>-₹{booking.pointsDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm md:text-base text-gray-800 font-semibold">Total Amount</span>
                  <span className="text-lg md:text-xl font-bold text-gray-950">₹{((booking.totalPrice - booking.totalDiscount) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-gray-600">Paid Amount</span>
                  <span className="text-sm md:text-base font-semibold text-green-600">₹{booking.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                {booking.remainingAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm md:text-base text-gray-600">Remaining Amount</span>
                    <span className="text-sm md:text-base font-semibold text-orange-600">₹{booking.remainingAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase mb-2 block">Payment Type</label>
                {(() => {
                  const advancePercentage = booking.totalPrice > 0 && booking.paidAmount > 0 && booking.paymentType === 'advance'
                    ? Math.round((booking.paidAmount / booking.totalPrice) * 100)
                    : 20;
                  return (
                    <span
                      className={`inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium ${booking.paymentType === 'full'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {booking.paymentType === 'full' ? 'Full Payment' : `${advancePercentage}% Advance Payment`}
                    </span>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase mb-2 block">Payment Status</label>
                <span className="inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium bg-green-100 text-green-800">
                  {booking.paymentStatus === 'partial' ? 'Advance Done' : (booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1))}
                </span>
              </div>

              {/* Dynamic Pricing Breakdown */}
              <div className="pt-3 md:pt-4 border-t border-gray-200">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Pricing Breakdown</h3>
                <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price</span>
                    <span className="text-gray-900">₹{booking.basePrice?.toLocaleString('en-IN') || 'N/A'}</span>
                  </div>
                  {booking.weekendMultiplier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekend Multiplier ({(booking.weekendMultiplier * 100).toFixed(0)}%)</span>
                      <span className="text-gray-900">+₹{((booking.basePrice || 0) * booking.weekendMultiplier).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {booking.demandSurge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Demand Surge ({(booking.demandSurge * 100).toFixed(0)}%)</span>
                      <span className="text-gray-900">+₹{((booking.basePrice || 0) * booking.demandSurge).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {booking.durationPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration Price</span>
                      <span className="text-gray-900">+₹{booking.durationPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {booking.couponDiscount > 0 && (() => {
                     const promoText = booking.couponDetails
                       ? `${booking.couponCode} - ${booking.couponDetails.discountValue}${booking.couponDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`
                       : (booking.couponCode || 'Applied');
                     return (
                       <div className="flex justify-between">
                         <span className="text-green-600">Coupon Discount ({promoText})</span>
                         <span className="text-green-600 font-semibold">-₹{booking.couponDiscount.toLocaleString('en-IN')}</span>
                       </div>
                     );
                   })()}
                   {booking.offerDiscount > 0 && (() => {
                     const promoText = booking.offerDetails
                       ? `${booking.offerDetails.title} - ${booking.offerDetails.discountType === 'free' ? 'Free' : `${booking.offerDetails.discountValue}${booking.offerDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`}`
                       : (booking.offerCode || 'Applied');
                     return (
                       <div className="flex justify-between">
                         <span className="text-green-600">Offer Discount ({promoText})</span>
                         <span className="text-green-600 font-semibold">-₹{booking.offerDiscount.toLocaleString('en-IN')}</span>
                       </div>
                     );
                   })()}
                   {booking.pointsDiscount > 0 && (
                     <div className="flex justify-between font-semibold" style={{ color: '#A16207' }}>
                       <span>🪙 Coins Discount</span>
                       <span>-₹{booking.pointsDiscount.toLocaleString('en-IN')}</span>
                     </div>
                   )}
                  <div className="flex justify-between pt-2 md:pt-3 border-t border-gray-200 font-semibold">
                    <span className="text-gray-900 font-bold">Total</span>
                    <span className="text-gray-900 font-bold">₹{(booking.totalPrice - booking.totalDiscount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        </div>
      </main>

      {/* Action Buttons - Fixed bottom on all devices with MAX Z-Index */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-[9999] pb-[env(safe-area-inset-bottom,20px)_!important]">
        <div className="flex flex-row gap-3 md:gap-4 max-w-7xl mx-auto">
          <button
            onClick={handleDownloadReceipt}
            className="flex-1 px-4 md:px-6 py-3 md:py-3.5 text-white rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex-1 px-4 md:px-6 py-3 md:py-3.5 bg-white border-2 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 p-0"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedBookingDetailsPage;

