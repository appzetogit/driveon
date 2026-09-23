import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../theme/colors';
import SearchHeader from '../components/layout/SearchHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import toastUtils from '../../config/toast';
import reviewService from '../../services/review.service';

/**
 * ModuleWriteReviewPage Component
 * Review page for completed bookings with module theme
 * Based on document.txt - User rates car, trip experience, and car owner ratings
 */
const ModuleWriteReviewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking || null;

  // Form state
  const [tripRating, setTripRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredTripRating, setHoveredTripRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if no booking data
  useEffect(() => {
    if (!booking && !bookingId) {
      navigate('/bookings', { replace: true });
    }
  }, [booking, bookingId, navigate]);

  // Render star rating component
  const renderStarRating = (rating, hovered, onRate, onHover, onLeave, label, error) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {label} <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1.5" onMouseLeave={onLeave}>
          {[1, 2, 3, 4, 5].map((star) => {
            const displayRating = hovered || rating;
            const isFilled = star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onRate(star)}
                onMouseEnter={() => onHover(star)}
                className="focus:outline-none transition-transform active:scale-95 hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <svg
                  className={`w-7 h-7 md:w-8 md:h-8 transition-colors ${
                    isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            );
          })}
        </div>
        {rating > 0 && (
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {rating} out of 5 stars
          </p>
        )}
        {error && (
          <p className="text-xs mt-1" style={{ color: colors.error }}>
            {error}
          </p>
        )}
      </div>
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (tripRating === 0) {
      newErrors.tripRating = 'Please rate your trip experience';
    }
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review comment';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewService.submitReview(booking?.id || booking?._id || bookingId, {
        rating: tripRating,
        comment: comment.trim(),
      });

      toastUtils.success('Review submitted successfully!');
      navigate('/bookings', { replace: true });
    } catch (error) {
      console.error('Error submitting review:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.backgroundPrimary }}>
        <div className="text-center">
          <p style={{ color: colors.textSecondary }}>Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full pb-20 md:pb-8"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Header */}
      <SearchHeader title="Write Review" backRoute="/bookings" />

      {/* Web container - max-width and centered on larger screens */}
      <div className="max-w-3xl mx-auto">
        {/* Car Summary Card */}
        <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-4">
          <div 
            className="rounded-2xl p-4 shadow-lg"
            style={{ 
              backgroundColor: colors.backgroundSecondary,
              border: `1px solid ${colors.borderMedium}`
            }}
          >
            <div className="flex items-center gap-4">
              <img 
                src={booking.car?.image} 
                alt={`${booking.car?.brand} ${booking.car?.model}`} 
                className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl"
                style={{ backgroundColor: colors.backgroundImage }}
              />
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {booking.car?.brand} {booking.car?.model}
                </h3>
                <p className="text-sm md:text-base mb-1" style={{ color: colors.textSecondary }}>
                  Booking ID: <span className="font-semibold" style={{ color: colors.textPrimary }}>{booking.bookingId}</span>
                </p>
                <p className="text-xs md:text-sm" style={{ color: colors.textSecondary }}>
                  {booking.pickupDate} to {booking.dropDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="px-4 md:px-6 lg:px-8 pb-6 md:pb-8 space-y-4 md:space-y-6">
          {/* Trip Experience Rating */}
          <div 
            className="rounded-2xl p-4 md:p-6 shadow-lg"
            style={{ 
              backgroundColor: colors.backgroundSecondary,
              border: `1px solid ${colors.borderMedium}`
            }}
          >
            {renderStarRating(
              tripRating,
              hoveredTripRating,
              setTripRating,
              (star) => setHoveredTripRating(star),
              () => setHoveredTripRating(0),
              'Rate Your Trip Experience',
              errors.tripRating
            )}
          </div>

          {/* Review Comment */}
          <div 
            className="rounded-2xl p-4 md:p-6 shadow-lg"
            style={{ 
              backgroundColor: colors.backgroundSecondary,
              border: `1px solid ${errors.comment ? colors.error : colors.borderMedium}`
            }}
          >
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Write Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment) {
                  setErrors({ ...errors, comment: '' });
                }
              }}
              placeholder="Share your experience with this car rental..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-sm resize-none transition-all"
              style={{
                borderColor: errors.comment ? colors.error : colors.borderMedium,
                backgroundColor: colors.backgroundPrimary,
                color: colors.textPrimary,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.backgroundTertiary;
                e.target.style.backgroundColor = colors.backgroundSecondary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.comment ? colors.error : colors.borderMedium;
                e.target.style.backgroundColor = colors.backgroundPrimary;
              }}
            />
            {errors.comment && (
              <p className="text-xs mt-1" style={{ color: colors.error }}>
                {errors.comment}
              </p>
            )}
            <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              {comment.length} characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || tripRating === 0 || !comment.trim()}
            className="w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            style={{ 
              backgroundColor: colors.backgroundTertiary,
              color: colors.backgroundSecondary,
              boxShadow: (isSubmitting || tripRating === 0 || !comment.trim())
                ? 'none' 
                : `0 4px 20px ${colors.backgroundTertiary}40`
            }}
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ModuleWriteReviewPage;

