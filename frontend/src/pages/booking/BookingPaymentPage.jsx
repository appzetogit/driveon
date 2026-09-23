import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import razorpayService from '../../services/razorpay.service';
import bookingService from '../../services/booking.service';
import { useSelector } from 'react-redux';
import toastUtils from '../../config/toast';

/**
 * BookingPaymentPage Component
 * Payment page - Mobile-optimized with payment options
 * Based on document.txt payment requirements (Razorpay/Stripe integration)
 */
const BookingPaymentPage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get booking data from navigation state
  const bookingData = location.state;

  const { user } = useSelector((state) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      navigate(`/booking/${carId}`);
    }
  }, [bookingData, carId, navigate]);

  if (!bookingData) {
    return null;
  }

  const { car, priceDetails, paymentOption } = bookingData;

  // Get car image URL - handle both car.image and car.images (array or string)
  const getCarImageUrl = () => {
    if (car.image) {
      return car.image;
    }
    if (car.images) {
      // If images is an array, get first image
      if (Array.isArray(car.images)) {
        const firstImage = car.images[0];
        return typeof firstImage === 'string' ? firstImage : (firstImage?.url || firstImage?.path || null);
      }
      // If images is a string, use it directly
      return car.images;
    }
    return null;
  };

  const carImageUrl = getCarImageUrl();

  // Calculate payment amount
  const paymentAmount = paymentOption === 'advance'
    ? priceDetails.advancePayment
    : priceDetails.totalPrice;

  // Create booking first, then proceed to payment
  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Step 1: Create booking if not already created
      let booking;
      if (!bookingId) {
        console.log('📝 Creating booking...');
        // Validate required data
        const pickupDate = bookingData.pickupDate || bookingData.tripStart?.date;
        const dropDate = bookingData.dropDate || bookingData.tripEnd?.date;

        if (!pickupDate) {
          throw new Error('Pickup date is required');
        }
        if (!dropDate) {
          throw new Error('Drop date is required');
        }

        // Validate dates on frontend before sending
        const pickupTime = bookingData.pickupTime || bookingData.tripStart?.time || '10:00';
        const dropTime = bookingData.dropTime || bookingData.tripEnd?.time || '18:00';

        // Create date objects with time
        const startDateObj = new Date(pickupDate);
        const endDateObj = new Date(dropDate);

        // Parse and set time for start date
        const startTimeParts = pickupTime.split(':');
        if (startTimeParts.length >= 2) {
          const hours = parseInt(startTimeParts[0], 10) || 0;
          const minutes = parseInt(startTimeParts[1], 10) || 0;
          startDateObj.setHours(hours, minutes, 0, 0);
        } else {
          startDateObj.setHours(0, 0, 0, 0);
        }

        // Parse and set time for end date
        const endTimeParts = dropTime.split(':');
        if (endTimeParts.length >= 2) {
          const hours = parseInt(endTimeParts[0], 10) || 0;
          const minutes = parseInt(endTimeParts[1], 10) || 0;
          endDateObj.setHours(hours, minutes, 0, 0);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }

        // Check if start date/time is in the past
        const now = new Date();
        now.setSeconds(0, 0); // Remove seconds for comparison

        if (startDateObj < now) {
          throw new Error('Trip start date and time cannot be in the past. Please select a future date and time.');
        }

        // Check if end date/time is after start date/time
        if (endDateObj <= startDateObj) {
          throw new Error('Trip end date and time must be after start date and time');
        }

        // Use default location if not provided
        const pickupLocation = bookingData.tripStart?.location || bookingData.location?.start || bookingData.pickupLocation || 'Location to be confirmed';
        const dropLocation = bookingData.tripEnd?.location || bookingData.location?.end || bookingData.dropLocation || 'Location to be confirmed';

        const bookingDataToSend = {
          carId: carId,
          tripStart: {
            location: pickupLocation,
            coordinates: bookingData.tripStart?.coordinates || bookingData.pickupCoordinates || {},
            date: pickupDate,
            time: bookingData.pickupTime || bookingData.tripStart?.time || '10:00',
          },
          tripEnd: {
            location: dropLocation,
            coordinates: bookingData.tripEnd?.coordinates || bookingData.dropCoordinates || {},
            date: dropDate,
            time: bookingData.dropTime || bookingData.tripEnd?.time || '18:00',
          },
          paymentOption: paymentOption || 'full',
          specialRequests: bookingData.specialRequests || '',
        };

        console.log('📝 Booking data to send:', bookingDataToSend);
        console.log('📅 Date validation:', {
          pickupDate,
          dropDate,
          pickupTime: bookingDataToSend.tripStart.time,
          dropTime: bookingDataToSend.tripEnd.time,
        });

        const bookingResponse = await bookingService.createBooking(bookingDataToSend);
        console.log('📦 Booking creation response:', bookingResponse);

        if (bookingResponse.success && bookingResponse.data?.booking) {
          booking = bookingResponse.data.booking;
          setBookingId(booking._id);
          console.log('✅ Booking created:', {
            bookingId: booking.bookingId,
            _id: booking._id,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
          });
        } else {
          const errorMsg = bookingResponse.message || bookingResponse.error || 'Failed to create booking';
          console.error('❌ Booking creation failed:', bookingResponse);
          throw new Error(errorMsg);
        }
      } else {
        // Get existing booking
        const bookingResponse = await bookingService.getBooking(bookingId);
        if (bookingResponse.success) {
          booking = bookingResponse.data.booking;
        }
      }

      // Step 2: Process payment through Razorpay
      if (!booking || !booking._id) {
        throw new Error('Booking ID is missing. Cannot proceed with payment.');
      }

      console.log('💳 Processing payment through Razorpay...');

      // CRITICAL FIX: Use the pricing from the backend booking object to ensure
      // the paid amount matches the database record exactly.
      // Frontend calculations can have slight discrepancies.
      let correctPaymentAmount = paymentAmount;

      if (booking.pricing) {
        if (booking.paymentOption === 'advance') {
          correctPaymentAmount = booking.pricing.advancePayment;
        } else {
          correctPaymentAmount = booking.pricing.finalPrice || booking.pricing.totalPrice;
        }
      }

      console.log('💰 Payment Amount Log:', {
        frontendCalculated: paymentAmount,
        backendPricingWithDecimals: booking.pricing,
        finalAmountToCharge: correctPaymentAmount
      });

      console.log('📦 Payment details:', {
        bookingId: booking._id,
        bookingIdString: booking._id.toString(),
        calculatedFrontendAmount: paymentAmount,
        backendCorrectAmount: correctPaymentAmount,
        car: `${car.brand} ${car.model}`,
      });

      await razorpayService.processBookingPayment({
        bookingId: booking._id.toString(),
        amount: correctPaymentAmount,
        description: `Car booking payment - ${car.brand} ${car.model}`,
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        onSuccess: (verificationResult) => {
          console.log('✅ Payment successful:', verificationResult);
          setIsProcessing(false);

          // Show success message briefly, then redirect to My Bookings
          toastUtils.success('Payment successful! Your booking has been confirmed.');

          // Navigate to My Bookings page
          navigate('/bookings', {
            replace: true, // Replace current history entry
          });
        },
        onError: async (error) => {
          setIsProcessing(false);

          // Cancel the booking in the backend if payment was cancelled or failed
          const targetBookingId = booking?._id || bookingId;
          if (targetBookingId) {
            console.log('🔄 Payment cancelled or failed. Cancelling backend booking:', targetBookingId);
            try {
              await bookingService.updateBookingStatus(targetBookingId.toString(), {
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

          // Handle payment cancellation silently (user intentionally closed the modal)
          if (error.message === 'PAYMENT_CANCELLED') {
            console.log('ℹ️ Payment cancelled by user');
            return; // Don't show any error for user cancellation
          }

          // Log other errors for debugging
          console.error('❌ Payment error:', error);

          // Show error message for actual payment failures
          toastUtils.error(error.message || 'Payment failed. Please try again.');
        },
      });
    } catch (error) {
      console.error('❌ Error in payment process:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Log full error response for debugging
      if (error.response?.data) {
        console.error('📋 Full error response:', JSON.stringify(error.response.data, null, 2));
      }

      setIsProcessing(false);

      // Show user-friendly error message
      let errorMessage = 'Failed to process payment. Please try again.';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors with details
        if (errorData.errors && Array.isArray(errorData.errors)) {
          console.error('🔍 Validation errors:', errorData.errors);
          const validationErrors = errorData.errors.map(err => {
            const field = err.field || 'Unknown field';
            const msg = err.message || 'Invalid value';
            const value = err.value !== undefined ? ` (value: ${JSON.stringify(err.value)})` : '';
            return `${field}: ${msg}${value}`;
          }).join('\n');
          errorMessage = `Validation Error:\n${validationErrors}`;
        }
        // Handle error with details object
        else if (errorData.details) {
          const detailsStr = typeof errorData.details === 'object'
            ? JSON.stringify(errorData.details, null, 2)
            : errorData.details;
          errorMessage = `${errorData.message || 'Validation Error'}\n\nDetails:\n${detailsStr}`;
        }
        // Handle simple error message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle error field
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show toast with error message
      toastUtils.error(errorMessage);
    }
  };


  const advancePercentage = priceDetails && priceDetails.totalPrice > 0
    ? Math.round((priceDetails.advancePayment / priceDetails.totalPrice) * 100)
    : 20;

  return (
    <div className="min-h-screen pb-24 bg-white">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 touch-target"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Payment</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Car Summary Card */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
          {carImageUrl ? (
            <img
              src={carImageUrl}
              alt={`${car.brand} ${car.model}`}
              className="w-16 h-16 object-contain rounded-lg bg-gray-50 p-1 flex-shrink-0"
              onError={(e) => {
                // Hide image on error and show placeholder
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Placeholder icon when image fails or doesn't exist */}
          <div
            className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0"
            style={{ display: carImageUrl ? 'none' : 'flex' }}
          >
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold" style={{ color: theme.colors.textPrimary }}>{car.brand} {car.model}</h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {bookingData.pickupDate} to {bookingData.dropDate}
            </p>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
          <h2 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
              <span>Base Price ({priceDetails.totalDays} {priceDetails.totalDays === 1 ? 'day' : 'days'})</span>
              <span>Rs. {priceDetails.basePrice * priceDetails.totalDays}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t" style={{ color: theme.colors.primary, borderColor: theme.colors.borderLight }}>
              <span>Total Amount</span>
              <span>Rs. {priceDetails.totalPrice}</span>
            </div>
            {paymentOption === 'advance' && (
              <>
                <div className="flex justify-between font-semibold pt-2 border-t" style={{ color: theme.colors.primary, borderColor: theme.colors.borderLight }}>
                  <span>Advance Payment ({advancePercentage}%)</span>
                  <span>Rs. {priceDetails.advancePayment}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: theme.colors.textSecondary }}>
                  <span>Remaining Amount</span>
                  <span>Rs. {priceDetails.remainingPayment}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold pt-3 border-t-2 text-lg" style={{ color: theme.colors.primary, borderColor: theme.colors.primary }}>
              <span>Amount to Pay</span>
              <span>Rs. {paymentAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <form onSubmit={handlePayment} className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
          <h2 className="font-semibold mb-3" style={{ color: theme.colors.primary }}>Payment Information</h2>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Click "Pay Now" to proceed with Razorpay payment. You can pay using Card, UPI, Net Banking, or Wallet.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-purple-50 rounded-lg p-3 border" style={{ borderColor: theme.colors.primary + '30' }}>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              Your payment is secured with 256-bit SSL encryption. We do not store your card details.
            </p>
          </div>
        </div>

        {/* Submit Button - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-white/20 px-4 py-4 z-50 shadow-2xl" style={{ backgroundColor: theme.colors.primary }}>
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">
                Rs. {paymentAmount}
              </span>
              <span className="text-xs text-white/80">
                {paymentOption === 'advance' ? 'Advance Payment' : 'Full Payment'}
              </span>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-8 py-3.5 rounded-lg font-bold shadow-xl touch-target active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#ffffff',
                color: theme.colors.primary,
                boxShadow: '0 4px 14px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingPaymentPage;
