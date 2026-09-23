import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2-removebg-preview.png';
import carImg3 from '../../assets/car_img3-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg7 from '../../assets/car_img7-removebg-preview.png';

/**
 * ReviewFormPage Component
 * Form for users to write reviews after trip completion
 * Based on document.txt - User rates car, trip experience, and car owner ratings
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

  // Mock booking data
  const getCarImage = (carId) => {
    const images = {
      car1: carImg1,
      car2: carImg2,
      car3: carImg3,
      car4: carImg4,
      car5: carImg5,
      car6: carImg6,
      car7: carImg7,
    };
    return images[carId] || carImg1;
  };

  const mockBookings = {
    '1': {
      id: '1',
      car: {
        id: 'car1',
        brand: 'Toyota',
        model: 'Camry',
        image: getCarImage('car1'),
      },
      pickupDate: '2024-01-10',
      dropDate: '2024-01-12',
      ownerName: 'Rajesh Kumar',
    },
    '2': {
      id: '2',
      car: {
        id: 'car2',
        brand: 'Honda',
        model: 'City',
        image: getCarImage('car2'),
      },
      pickupDate: '2024-01-05',
      dropDate: '2024-01-07',
      ownerName: 'Priya Sharma',
    },
    '3': {
      id: '3',
      car: {
        id: 'car3',
        brand: 'Maruti',
        model: 'Swift',
        image: getCarImage('car3'),
      },
      pickupDate: '2023-12-28',
      dropDate: '2023-12-30',
      ownerName: 'Amit Singh',
    },
    '4': {
      id: '4',
      car: {
        id: 'car4',
        brand: 'Hyundai',
        model: 'i20',
        image: getCarImage('car4'),
      },
      pickupDate: '2023-12-20',
      dropDate: '2023-12-22',
      ownerName: 'Deepika Reddy',
    },
    '5': {
      id: '5',
      car: {
        id: 'car5',
        brand: 'Tata',
        model: 'Nexon',
        image: getCarImage('car5'),
      },
      pickupDate: '2023-12-25',
      dropDate: '2023-12-27',
      ownerName: 'Vikram Rao',
    },
  };

  const booking = mockBookings[bookingId];

  // Redirect if booking not found
  useEffect(() => {
    if (!booking) {
      navigate('/bookings');
    }
  }, [booking, navigate]);

  if (!booking) {
    return null;
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
      alert('Please rate your trip experience');
      return;
    }

    if (!comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate back to bookings page
      navigate('/bookings', { state: { reviewSubmitted: true } });
    }, 1500);
  };

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

      {/* Car Summary Card */}
      <div className="px-4 pt-4 pb-2 md:pt-6 md:pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
            <img src={booking.car.image} alt={`${booking.car.brand} ${booking.car.model}`} className="w-16 h-16 md:w-20 md:h-20 object-contain" />
            <div className="flex-1">
              <h3 className="font-bold text-base md:text-lg" style={{ color: theme.colors.textPrimary }}>{booking.car.brand} {booking.car.model}</h3>
              <p className="text-sm md:text-base" style={{ color: theme.colors.textSecondary }}>
                {booking.pickupDate} to {booking.dropDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-2 md:pt-6 md:pb-2 space-y-3 md:space-y-4">
        <div className="max-w-4xl mx-auto">
          {/* Trip Experience Rating */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
            {renderStarRating(
              tripRating,
              hoveredRating,
              setTripRating,
              (star) => setHoveredRating(star),
              () => setHoveredRating(0),
              'Rate Your Trip Experience'
            )}
          </div>

          {/* Review Comment */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
            <label className="text-sm md:text-base font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>
              Write Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors resize-none"
              style={{ 
                borderColor: theme.colors.borderDefault,
                color: theme.colors.textPrimary,
              }}
              onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
              onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
              placeholder="Share your experience with this car rental..."
              required
            />
            <p className="text-xs md:text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
              {comment.length} characters
            </p>
          </div>
        </div>

        {/* Submit Button - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-white/20 px-4 md:px-6 py-4 md:py-5 z-50 shadow-2xl" style={{ backgroundColor: theme.colors.primary }}>
          <div className="max-w-4xl mx-auto">
            <button
              type="submit"
              disabled={isSubmitting || tripRating === 0 || !comment.trim()}
              className="w-full md:w-auto md:max-w-xs md:mx-auto block py-3 md:py-3.5 px-6 md:px-8 rounded-lg md:rounded-xl font-bold text-sm md:text-base shadow-xl touch-target active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#ffffff',
                color: theme.colors.primary,
                boxShadow: '0 4px 14px 0 rgba(255, 255, 255, 0.3)',
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReviewFormPage;

