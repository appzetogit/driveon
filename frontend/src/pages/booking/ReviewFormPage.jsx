import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import defaultCarImg from '../../assets/car_img1-removebg-preview.png';
import bookingService from '../../services/booking.service';
import reviewService from '../../services/review.service';
import toastUtils from '../../config/toast';

/**
 * ReviewFormPage Component
 * Form for users to write reviews after trip completion
 * Connects directly to backend Review API
 */
const ReviewFormPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [tripRating, setTripRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loadingBooking, setLoadingBooking] = useState(!location.state?.booking);

  // Fetch real booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId || booking) {
        setLoadingBooking(false);
        return;
      }
      try {
        setLoadingBooking(true);
        const res = await bookingService.getBookingDetails(bookingId);
        if (res.success && res.data?.booking) {
          setBooking(res.data.booking);
        } else {
          setBooking(null);
        }
      } catch (err) {
        console.error('Error fetching booking for review:', err);
        setBooking(null);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBooking();
  }, [bookingId, booking]);

  const car = booking?.car || {};
  let carImage = defaultCarImg;
  if (car.images && car.images.length > 0) {
    const primary = car.images.find(i => i.isPrimary) || car.images[0];
    carImage = primary.url || primary.path || primary;
  } else if (car.image) {
    carImage = car.image.url || car.image;
  }

  // Render star rating component
  const renderStarRating = (rating, hovered, onRate, onHover, onLeave, label) => {
    return (
      <div className="space-y-2">
        <label className="text-sm md:text-base font-medium" style={{ color: theme.colors.textSecondary }}>
          {label}
        </label>
        <div className="flex items-center gap-1 md:gap-2" onMouseLeave={onLeave}>
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
                  className={`w-8 h-8 md:w-9 md:h-9 transition-colors ${
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
          <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
            {rating} out of 5 stars
          </p>
        )}
      </div>
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tripRating === 0) {
      toastUtils.error('Please rate your trip experience');
      return;
    }

    if (!comment.trim()) {
      toastUtils.error('Please write a review comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.submitReview(bookingId, {
        tripExperienceRating: tripRating,
        carRating: tripRating,
        ownerRating: tripRating,
        overallRating: tripRating,
        comment: comment.trim(),
      });
      toastUtils.success('Review submitted successfully!');
      navigate('/bookings', { state: { reviewSubmitted: true } });
    } catch (err) {
      console.error('Failed to submit review:', err);
      toastUtils.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
        <p className="text-gray-500 mb-4 text-sm">Cannot write a review for an invalid booking.</p>
        <button onClick={() => navigate('/bookings')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          Go to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-white">
      {/* Header */}
      <header className="text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 md:p-2 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Write Review</h1>
              <div className="w-8 md:w-12"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 md:px-6">
        {/* Car Summary Card */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center gap-4">
          <div className="w-20 h-16 rounded-xl bg-white p-2 flex items-center justify-center border border-gray-200">
            <img src={carImage} alt={`${car.brand || ''} ${car.model || ''}`} className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">{car.brand || 'Vehicle'} {car.model || ''}</h3>
            <p className="text-xs text-gray-500">Booking #{booking.bookingId || bookingId}</p>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            {renderStarRating(
              tripRating,
              hoveredRating,
              setTripRating,
              setHoveredRating,
              () => setHoveredRating(0),
              'Overall Experience Rating *'
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Your Feedback & Comments *
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your driving experience, vehicle condition, and overall service..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-600 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ReviewFormPage;
