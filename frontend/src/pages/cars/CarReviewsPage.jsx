import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2-removebg-preview.png';
import carImg3 from '../../assets/car_img3-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg7 from '../../assets/car_img7-removebg-preview.png';

/**
 * CarReviewsPage Component
 * Displays all reviews for a specific car
 * Based on document.txt - User rates car, trip experience, and car owner ratings
 */
const CarReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock car data
  const carsData = {
    '1': { id: '1', brand: 'Tesla', model: 'Model X', image: carImg1, rating: 4.8, reviews: 50 },
    '2': { id: '2', brand: 'Mercedes-Benz', model: 'S-Class', image: carImg2, rating: 4.7, reviews: 45 },
    '3': { id: '3', brand: 'BMW', model: '7 Series', image: carImg3, rating: 4.6, reviews: 38 },
    '4': { id: '4', brand: 'Audi', model: 'A8 L', image: carImg4, rating: 4.9, reviews: 52 },
    '5': { id: '5', brand: 'Jaguar', model: 'XF', image: carImg5, rating: 4.5, reviews: 32 },
    '6': { id: '6', brand: 'Lexus', model: 'LS 500', image: carImg6, rating: 4.8, reviews: 41 },
    '7': { id: '7', brand: 'Porsche', model: 'Panamera', image: carImg7, rating: 4.9, reviews: 48 },
  };

  // Mock reviews data - Single rating for trip experience
  const reviewsData = {
    '1': [
      {
        id: 1,
        userName: 'Rahul Sharma',
        userPhoto: null,
        rating: 4,
        comment: 'Amazing experience! The Tesla Model X is a beast. The autopilot feature is incredible and the car is in perfect condition. Owner was very professional and responsive.',
        date: '2024-01-15',
        verified: true,
      },
      {
        id: 2,
        userName: 'Priya Patel',
        userPhoto: null,
        rating: 4,
        comment: 'Great car for family trips! Very spacious and comfortable. The owner was very helpful and the car was clean. Highly recommended!',
        date: '2024-01-10',
        verified: true,
      },
      {
        id: 3,
        userName: 'Amit Kumar',
        userPhoto: null,
        rating: 3,
        comment: 'Excellent car with all modern features. The performance is outstanding. Owner was punctual and the handover process was smooth.',
        date: '2024-01-05',
        verified: true,
      },
      {
        id: 4,
        userName: 'Sneha Reddy',
        userPhoto: null,
        rating: 4,
        comment: 'Best rental experience ever! The car exceeded all expectations. The owner is very professional and the car is maintained perfectly.',
        date: '2023-12-28',
        verified: true,
      },
      {
        id: 5,
        userName: 'Vikram Singh',
        userPhoto: null,
        rating: 3,
        comment: 'Very good car, smooth driving experience. Owner was very cooperative and understanding. Would definitely rent again!',
        date: '2023-12-20',
        verified: true,
      },
    ],
    '2': [
      {
        id: 1,
        userName: 'Anjali Desai',
        userPhoto: null,
        rating: 4,
        comment: 'Luxury at its finest! The Mercedes S-Class is absolutely stunning. Every detail is perfect. Owner is very professional.',
        date: '2024-01-12',
        verified: true,
      },
      {
        id: 2,
        userName: 'Rajesh Mehta',
        userPhoto: null,
        rating: 4,
        comment: 'Premium experience! The car is in excellent condition and the owner was very helpful throughout the trip.',
        date: '2024-01-08',
        verified: true,
      },
      {
        id: 3,
        userName: 'Kavita Nair',
        userPhoto: null,
        rating: 3,
        comment: 'Beautiful car with amazing features. Very comfortable for long drives. Owner was responsive and professional.',
        date: '2024-01-03',
        verified: true,
      },
    ],
    '3': [
      {
        id: 1,
        userName: 'Mohit Agarwal',
        userPhoto: null,
        rating: 4,
        comment: 'Outstanding BMW! The performance is incredible and the car handles beautifully. Owner was very professional.',
        date: '2024-01-14',
        verified: true,
      },
      {
        id: 2,
        userName: 'Divya Joshi',
        userPhoto: null,
        rating: 4,
        comment: 'Great car with excellent features. Very comfortable and stylish. Owner was very helpful and understanding.',
        date: '2024-01-09',
        verified: true,
      },
    ],
    '4': [
      {
        id: 1,
        userName: 'Arjun Malhotra',
        userPhoto: null,
        rating: 4,
        comment: 'Perfect Audi! The luxury and comfort are unmatched. Owner is very professional and the car is immaculate.',
        date: '2024-01-13',
        verified: true,
      },
      {
        id: 2,
        userName: 'Neha Kapoor',
        userPhoto: null,
        rating: 4,
        comment: 'Amazing experience! The car is perfect in every way. Owner was very responsive and helpful throughout.',
        date: '2024-01-07',
        verified: true,
      },
    ],
    '5': [
      {
        id: 1,
        userName: 'Siddharth Rao',
        userPhoto: null,
        rating: 3,
        comment: 'Good car with nice features. Owner was professional and the car was clean. Overall good experience.',
        date: '2024-01-11',
        verified: true,
      },
    ],
    '6': [
      {
        id: 1,
        userName: 'Meera Iyer',
        userPhoto: null,
        rating: 4,
        comment: 'Excellent Lexus! Very comfortable and luxurious. Owner was very professional and helpful.',
        date: '2024-01-06',
        verified: true,
      },
    ],
    '7': [
      {
        id: 1,
        userName: 'Karan Thakur',
        userPhoto: null,
        rating: 4,
        comment: 'Incredible Porsche! The performance is mind-blowing. Owner is very professional and the car is perfect.',
        date: '2024-01-04',
        verified: true,
      },
    ],
  };

  const car = carsData[id];
  const reviews = reviewsData[id] || [];

  // Redirect if car not found
  useEffect(() => {
    if (!car) {
      navigate('/cars');
    }
  }, [car, navigate]);

  if (!car) {
    return null;
  }

  // Render stars for rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-fill-${id}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path fill={`url(#half-fill-${id})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen pb-20 bg-white">
      {/* Header */}
      <header className="text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 touch-target"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Reviews</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Car Summary Card */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
          <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-14 h-14 object-contain" />
          <div className="flex-1">
            <h3 className="font-bold" style={{ color: theme.colors.textPrimary }}>{car.brand} {car.model}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                {renderStars(car.rating)}
              </div>
              <span className="text-xs" style={{ color: theme.colors.textSecondary }}>{car.rating} ({car.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Rating Summary */}
      {reviews.length > 0 && (
        <div className="px-4 py-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
            <h3 className="font-semibold mb-2 text-sm" style={{ color: theme.colors.primary }}>Average Rating</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="text-xs" style={{ color: theme.colors.textSecondary }}>Trip Experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {renderStars(parseFloat(avgRating))}
                </div>
                <span className="text-xs font-semibold" style={{ color: theme.colors.primary }}>{avgRating}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: theme.colors.primary }}>
          All Reviews ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
            <p style={{ color: theme.colors.textSecondary }}>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-2.5 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
                {/* User Info */}
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                      {review.userPhoto ? (
                        <img src={review.userPhoto} alt={review.userName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <svg className="w-3.5 h-3.5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold" style={{ color: theme.colors.textPrimary }}>{review.userName}</p>
                        {review.verified && (
                          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[10px]" style={{ color: theme.colors.textSecondary }}>{formatDate(review.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="flex items-center gap-0.5">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: theme.colors.primary }}>{review.rating}</span>
                </div>

                {/* Comment */}
                <p className="text-xs leading-relaxed" style={{ color: theme.colors.textSecondary }}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarReviewsPage;

