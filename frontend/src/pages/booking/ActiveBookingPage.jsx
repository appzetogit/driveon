import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import bookingService from '../../services/booking.service';
import { carService } from '../../services/car.service';
import jsPDF from 'jspdf';
import LocationTracker from '../../components/common/LocationTracker';
import { useAppSelector } from '../../hooks/redux';

/**
 * Active Booking Page - Trip Details
 * Shows detailed information about user's active booking/trip
 * Based on document.txt specifications
 * Uses website theme (#1e6262 teal)
 */
const ActiveBookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.user);
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
            trackingEnabled: bookingData.trackingEnabled || false,
            currentLocation: bookingData.currentLocation || bookingData.pickupLocation,
            currentSpeed: bookingData.currentSpeed || 0,
            distanceTraveled: bookingData.distanceTraveled || 0,
            totalDistance: bookingData.totalDistance || 0,
            tripStartTime: bookingData.tripStartTime || bookingData.tripStart?.date,
            tripDuration: bookingData.tripDuration || '0h 0m',
            user: bookingData.user || {},
            guarantor: bookingData.guarantor || {},
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

  // Refresh booking data when page comes into focus (to get updated status)
  useEffect(() => {
    const handleFocus = () => {
      if (id) {
        // Refetch booking data when window regains focus
        const fetchBooking = async () => {
          try {
            const response = await bookingService.getBooking(id);
            if (response.success && response.data?.booking) {
              const bookingData = response.data.booking;
              setBooking(prev => ({
                ...prev,
                status: bookingData.status,
                paymentStatus: bookingData.paymentStatus,
              }));
            }
          } catch (err) {
            console.error('Error refreshing booking:', err);
          }
        };
        fetchBooking();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  // Download Receipt as PDF
  const handleDownloadReceipt = () => {
    if (!booking) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add text with wrapping
    const addText = (text, x, y, fontSize = 10, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const maxWidth = pageWidth - (x * 2);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.4);
    };

    // Header
    doc.setFillColor(30, 98, 98); // Theme color
    doc.rect(0, 0, pageWidth, 40, 'F');
    addText('DRIVEON', margin, 25, 20, true, [255, 255, 255]);
    addText('Booking Receipt', margin, 35, 12, true, [255, 255, 255]);
    
    yPos = 50;

    // Booking ID
    addText(`Booking ID: ${booking.bookingId || booking.id}`, margin, yPos, 12, true);
    yPos += lineHeight + 2;
    addText(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`, margin, yPos, 10);
    yPos += sectionSpacing + lineHeight;

    // Trip Information
    addText('TRIP INFORMATION', margin, yPos, 12, true);
    yPos += lineHeight + 2;
    addText(`Pickup Date & Time: ${new Date(booking.pickupDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })} ${booking.pickupTime}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Drop Date & Time: ${new Date(booking.dropDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })} ${booking.dropTime}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Duration: ${booking.duration}`, margin, yPos, 10);
    yPos += sectionSpacing + lineHeight;

    // Car Information
    addText('CAR INFORMATION', margin, yPos, 12, true);
    yPos += lineHeight + 2;
    addText(`Car: ${booking.car.brand} ${booking.car.model} ${booking.car.year}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Seats: ${booking.car.seats} | Transmission: ${booking.car.transmission} | Fuel: ${booking.car.fuelType}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Color: ${booking.car.color}`, margin, yPos, 10);
    yPos += sectionSpacing + lineHeight;

    // Payment Information
    addText('PAYMENT INFORMATION', margin, yPos, 12, true);
    yPos += lineHeight + 2;
    const advancePercentage = booking.totalPrice > 0 && booking.paidAmount > 0 && booking.paymentType === 'advance'
      ? Math.round((booking.paidAmount / booking.totalPrice) * 100)
      : 20;
    addText(`Payment Type: ${booking.paymentType === 'advance' ? `${advancePercentage}% Advance Payment` : 'Full Payment'}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Payment Status: ${booking.paymentStatus === 'partial' ? 'Advance Done' : (booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1))}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Total Amount: Rs. ${((booking.totalPrice - booking.totalDiscount) || 0).toLocaleString('en-IN')}`, margin, yPos, 10);
    yPos += lineHeight;
    addText(`Paid Amount: Rs. ${booking.paidAmount.toLocaleString('en-IN')}`, margin, yPos, 10);
    if (booking.remainingAmount > 0) {
      yPos += lineHeight;
      addText(`Remaining Amount: Rs. ${booking.remainingAmount.toLocaleString('en-IN')}`, margin, yPos, 10);
    }
    yPos += sectionSpacing + lineHeight;

    // Pricing Breakdown
    addText('PRICING BREAKDOWN', margin, yPos, 12, true);
    yPos += lineHeight + 2;
    addText(`Base Price: Rs. ${booking.basePrice.toLocaleString('en-IN')}`, margin, yPos, 10);
    yPos += lineHeight;
    if (booking.weekendMultiplier > 0) {
      addText(`Weekend Multiplier (${(booking.weekendMultiplier * 100).toFixed(0)}%): +Rs. ${((booking.basePrice || 0) * booking.weekendMultiplier).toLocaleString('en-IN')}`, margin, yPos, 10);
      yPos += lineHeight;
    }
    if (booking.couponDiscount > 0) {
      addText(`Coupon Discount (${booking.couponCode || 'Applied'}): -Rs. ${booking.couponDiscount.toLocaleString('en-IN')}`, margin, yPos, 10);
      yPos += lineHeight;
    }
    if (booking.offerDiscount > 0) {
      addText(`Offer Discount (${booking.offerCode || 'Applied'}): -Rs. ${booking.offerDiscount.toLocaleString('en-IN')}`, margin, yPos, 10);
      yPos += lineHeight;
    }
    if (booking.pointsDiscount > 0) {
      addText(`Coins Discount: -Rs. ${booking.pointsDiscount.toLocaleString('en-IN')}`, margin, yPos, 10);
      yPos += lineHeight;
    }
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;
    addText(`Total: Rs. ${(booking.totalPrice - booking.totalDiscount).toLocaleString('en-IN')}`, margin, yPos, 12, true);
    yPos += sectionSpacing + lineHeight;

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing DriveOn!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('For support, contact us at support@driveon.com', pageWidth / 2, footerY + 5, { align: 'center' });

    // Save PDF
    const fileName = `DriveOn_Receipt_${booking.bookingId || booking.id}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The trip details you\'re looking for could not be found.'}</p>
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
      {/* Hidden auto location tracking while trip is active */}
      {user && (
        <LocationTracker
          userId={user._id || user.id}
          userType="user"
          autoStart={true}
          hidden={true}
        />
      )}
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
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium ${
                  booking.status === 'pending' 
                    ? 'bg-yellow-500/30 text-yellow-100' 
                    : booking.status === 'confirmed'
                    ? 'bg-blue-500/30 text-blue-100'
                    : booking.status === 'active'
                    ? 'bg-green-500/30 text-green-100'
                    : booking.status === 'completed'
                    ? 'bg-gray-500/30 text-gray-100'
                    : booking.status === 'cancelled'
                    ? 'bg-red-500/30 text-red-100'
                    : 'bg-white/20 text-white'
                }`}
              >
                {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
              </span>
              {booking.trackingEnabled && (
                <span className="px-3 md:px-4 py-1 md:py-1.5 bg-green-500/30 rounded-lg md:rounded-xl text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                  Live Tracking ON
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-4">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Live Tracking Information */}
        {booking.trackingEnabled && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg md:rounded-xl border-l-4 p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow" style={{ borderLeftColor: theme.colors.primary }}>
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Live Tracking Active</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Current Location</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">📍 {booking.currentLocation}</p>
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Current Speed</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.currentSpeed} km/h</p>
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Distance Traveled</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">
                  {booking.distanceTraveled} / {booking.totalDistance} km
                </p>
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Trip Duration</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.tripDuration}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600">
                <span>Started: {new Date(booking.tripStartTime).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delay Message - Show if trip end date has passed */}
        {(() => {
          if (!booking.dropDate) return null;
          
          // Combine date and time to get exact end datetime
          const dropDateTime = new Date(booking.dropDate);
          if (booking.dropTime) {
            const [hours, minutes] = booking.dropTime.split(':');
            dropDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
          }
          
          const now = new Date();
          const delayMs = now - dropDateTime;
          
          // Only show delay if trip end date has passed and booking is not completed/cancelled
          if (delayMs <= 0 || booking.status === 'completed' || booking.status === 'cancelled') return null;
          
          const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
          const delayDays = Math.floor(delayHours / 24);
          const remainingHours = delayHours % 24;
          
          // Calculate additional charges (dummy data)
          let additionalCharges = 0;
          if (delayDays === 0) {
            additionalCharges = delayHours * 500;
          } else {
            additionalCharges = 24 * 500;
            additionalCharges += delayDays * 1000;
            if (remainingHours > 0) {
              additionalCharges += remainingHours * 500;
            }
          }
          
          const delayText = delayDays > 0 
            ? `${delayDays} day${delayDays > 1 ? 's' : ''} ${remainingHours > 0 ? `and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : ''}`
            : `${delayHours} hour${delayHours > 1 ? 's' : ''}`;
          
          return (
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-orange-900 mb-1">
                    Trip End Date Passed
                  </h3>
                  <p className="text-sm md:text-base text-orange-800 mb-3">
                    Your trip end date has passed by {delayText}. Additional charges will be applied.
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                    <span className="text-sm md:text-base font-medium text-orange-900">
                      Additional Charges:
                    </span>
                    <span className="text-lg md:text-xl font-bold text-orange-600">
                      ₹{additionalCharges.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
            <div className="pt-3 md:pt-4 border-t border-gray-200">
              <div>
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Car Owner</label>
                <p className="text-sm md:text-base font-semibold text-gray-900 mt-1">{booking.car.owner.name}</p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{booking.car.owner.phone}</p>
              </div>
              <div className="mt-2 md:mt-3 flex items-center gap-2">
                <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Rating</label>
                <div className="flex items-center gap-1">
                  <p className="text-sm md:text-base font-semibold text-gray-900">{booking.car.rating}</p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
                    className={`inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium ${
                      booking.paymentType === 'full'
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
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
          <button
            onClick={handleDownloadReceipt}
            className="flex-1 md:flex-none md:w-auto md:min-w-[200px] px-4 md:px-6 py-3 md:py-3.5 text-white rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ backgroundColor: theme.colors.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary + 'E6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
          >
            Download Receipt
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="flex-1 md:flex-none md:w-auto md:min-w-[200px] px-4 md:px-6 py-3 md:py-3.5 bg-white border-2 rounded-lg md:rounded-xl font-medium text-sm md:text-base transition-all duration-200 shadow-md hover:shadow-lg"
            style={{ borderColor: theme.colors.primary, color: theme.colors.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary + '10'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Back to Bookings
          </button>
        </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveBookingPage;
