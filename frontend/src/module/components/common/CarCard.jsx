import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors } from '../../theme/colors';
import useInViewAnimation from '../../hooks/useInViewAnimation';
import { useFavorites } from '../../../context/FavoritesContext';

/**
 * CarCard Component - Exact match to design
 * Car card with image, heart icon, rating, location, seats, and price
 */
const CarCard = memo(({ car, index = 0 }) => {
  const navigate = useNavigate();
  const [imageRef, isImageInView] = useInViewAnimation({ threshold: 0.1 });
  const [isAnimating, setIsAnimating] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(car.id);

  const isTransparentPNG = car.image && (
    typeof car.image === 'string' && (
      car.image.includes('removebg') || 
      car.image.includes('car_img') || 
      car.image.includes('logo') ||
      car.image.startsWith('data:image/svg') ||
      car.image.endsWith('.svg')
    )
  );

  const handleOpenDetails = () => {
    try {
      sessionStorage.setItem('driveon:selectedCar', JSON.stringify(car));
    } catch (err) {
      console.warn('Failed to persist selected car', err);
    }
    navigate(`/car-details/${car.id}`, { state: { car } });
  };

  return (
    <div
      className="w-full rounded-xl overflow-hidden cursor-pointer"
      style={{
        backgroundColor: colors.backgroundSecondary,
        border: `1px solid ${colors.borderLight}`
      }}
      onClick={handleOpenDetails}
    >
      {/* Car Image Container */}
      <div
        className="relative w-full h-28 md:h-40 lg:h-48 flex items-center justify-center rounded-t-xl overflow-hidden"
        style={{ backgroundColor: isTransparentPNG ? colors.backgroundImage : '#ffffff' }}
      >
        <motion.img
          ref={imageRef}
          src={car.image}
          alt={car.name}
          loading="lazy"
          className={`w-full h-full ${
            isTransparentPNG ? "object-contain scale-125" : "object-cover"
          }`}
          initial={{ opacity: 0, scale: isTransparentPNG ? 0.8 : 1, x: isTransparentPNG ? -15 : 0 }}
          animate={
            isImageInView 
              ? { opacity: 1, scale: isTransparentPNG ? 1.25 : 1, x: 0 } 
              : { opacity: 0, scale: isTransparentPNG ? 0.8 : 1, x: isTransparentPNG ? -15 : 0 }
          }
          transition={{
            duration: 0.6,
            delay: index * 0.1,
            ease: [0.16, 1, 0.3, 1],
            type: "tween"
          }}
          whileHover={{
            scale: isTransparentPNG ? 1.35 : 1.05,
            x: isTransparentPNG ? 5 : 0,
            transition: { duration: 0.3, ease: "easeOut" }
          }}
        />

        {/* Heart Icon - Top Left */}
        <button
          className="absolute -top-1 left-1.5 md:-top-1 md:left-2 z-10 touch-target flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            const wasFav = toggleFavorite(car);
            if (wasFav) { // If it became favorite (toggle returns true if added)
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 800);
            }
          }}
        >
          <div className="like-button-container" style={{ width: '24px', height: '24px' }}>
            {/* Sparkles Burst */}
            <div className="sparkles-container">
              {[...Array(8)].map((_, i) => (
                <span 
                  key={i} 
                  className={`sparkle-burst ${isAnimating ? 'active' : ''}`} 
                  style={{ '--angle': `${i * 45}deg` }} 
                />
              ))}
            </div>

            {/* Heart Icon */}
            <svg
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-200 ${isFav ? 'text-red-500 heart-icon liked' : 'text-white heart-icon'
                }`}
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              style={{ overflow: 'visible' }} // Allow scale to overflow slightly
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Car Details */}
      <div className="p-2 md:p-3 lg:p-4">
        {/* Car Name */}
        <h3 className="text-xs md:text-sm lg:text-base font-bold text-black mb-1 md:mb-1.5">{car.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1 md:mb-1.5">
          <span className="text-xs md:text-sm font-semibold text-black">{car.rating}</span>
          <svg
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            fill={colors.accentOrange}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mb-1.5 md:mb-2">
          <svg
            className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-[10px] md:text-xs text-gray-500">{car.location}</span>
        </div>

        {/* Seats and Price Row */}
        <div className="flex items-center justify-between mt-1.5 md:mt-2">
          {/* Seats */}
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
              />
            </svg>
            <span className="text-[10px] md:text-xs text-gray-500">{car.seats} Seats</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] md:text-xs text-gray-500">{car.price}/Day</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CarCard;

