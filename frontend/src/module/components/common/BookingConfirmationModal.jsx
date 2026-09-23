import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../../hooks/redux';
import { colors } from '../../theme/colors';
import { generateBookingPDF } from '../../../utils/pdfGenerator';

/**
 * BookingConfirmationModal Component
 * Shows booking confirmation success message with document verification reminder
 * Based on document.txt - Document verification happens physically at office
 */
const BookingConfirmationModal = ({ bookingId, bookingData, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleViewBookings = () => {
    onClose();
    console.log("onclose function called")
    navigate('/bookings');
  };

  const handleDownloadPDF = () => {
    if (!bookingData) {
      alert('Booking data not available');
      return;
    }
    console.log("download pdf function called")
    // Merge user data with booking data for PDF
    const pdfData = {
      ...bookingData,
      user: user || {},
    };

    try {
      generateBookingPDF(pdfData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto bg-white"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        {/* Success Icon and Header */}
        <div className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 text-center">
          {/* Success Checkmark Icon */}
          <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.success}20` }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: colors.success }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Booking Confirmed Title */}
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Booking Confirmed!
          </h2>

          {/* Booking ID */}
          {bookingId && (
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Booking ID: <span className="font-semibold" style={{ color: colors.textPrimary }}>{bookingId}</span>
            </p>
          )}
        </div>

        {/* Document Verification Notice */}
        <div className="px-6 pb-6">
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              backgroundColor: `${colors.warning}15`,
              border: `1px solid ${colors.warning}40`
            }}
          >
            <div className="flex items-start gap-3">
              {/* Warning Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5"
                  style={{ color: colors.warning }}
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
              </div>

              {/* Message */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Important: Physical Document Verification Required
                </h3>
                <p className="text-xs leading-relaxed mb-2" style={{ color: colors.textSecondary }}>
                  Your booking will only be confirmed and finalized when you physically visit our office to complete document verification. This step is mandatory before you can start your trip.
                </p>
                <p className="text-xs leading-relaxed font-semibold" style={{ color: colors.warning }}>
                  ⚠️ If you fail to complete physical document verification, 30% of the paid amount will be refunded and the booking will be cancelled.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-3 rounded-xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: colors.textPrimary }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Booking Receipt (PDF)
            </button>
            <button
              onClick={handleViewBookings}
              className="w-full py-3 rounded-xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              View My Bookings
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-base border-2 transition-all"
              style={{
                borderColor: colors.borderMedium,
                color: colors.textSecondary,
                backgroundColor: 'transparent'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingConfirmationModal;

