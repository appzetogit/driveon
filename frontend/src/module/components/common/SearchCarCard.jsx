import { useState } from 'react';
import { colors } from '../../theme/colors';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useInViewAnimation from '../../hooks/useInViewAnimation';
import { useFavorites } from '../../../context/FavoritesContext';

/**
 * SearchCarCard Component - Car card for search page
 * Supports both vertical (default) and horizontal (popular) layouts
 */
const SearchCarCard = ({ car, horizontal = false, index = 0 }) => {
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

  // Horizontal layout for Popular Cars section (matches second image)
  if (horizontal) {
    return (
      <motion.div 
        className="w-full rounded-xl md:rounded-2xl overflow-hidden flex cursor-pointer"
        style={{ 
          backgroundColor: colors.backgroundSecondary, // White background on desktop
          border: `1px solid ${colors.borderSubtle}`
        }}
        onClick={() => navigate(`/car-details/${car.id}`, { state: { car } })}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        transition={{ duration: 0.3 }}
      >
        {/* Car Image - Left Side */}
        <div 
          className="relative w-32 md:w-48 lg:w-56 h-28 md:h-40 lg:h-44 flex items-center justify-center flex-shrink-0 rounded-l-xl md:rounded-l-2xl overflow-hidden"
          style={{ backgroundColor: isTransparentPNG ? colors.backgroundLight : '#ffffff' }}
        >
          <motion.img 
            ref={imageRef}
            src={car.image} 
            alt={car.name} 
            loading="lazy"
            className={`w-full h-full ${
              isTransparentPNG ? "object-contain md:p-2" : "object-cover"
            }`}
            style={{ transform: isTransparentPNG ? 'scale(1.2)' : 'none' }}
            initial={{ x: 100, opacity: 0 }}
            animate={isImageInView ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          />
        </div>

        {/* Car Details - Right Side */}
        <div className="flex-1 min-w-0 flex flex-col justify-center px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5">
          {/* Car Name and Rating in same row */}
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 min-w-0">
            <h3 className="text-base md:text-xl lg:text-2xl font-bold text-black truncate flex-1 min-w-0">
              {car.name}
            </h3>
            <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
              <span className="text-sm md:text-base lg:text-lg text-gray-600">{car.rating}</span>
              <svg 
                className="w-4 h-4 md:w-5 md:h-5" 
                fill={colors.accentOrange} 
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center">
            <span className="text-base md:text-lg lg:text-xl font-bold text-black">{car.price}/Day</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Vertical layout for Recommend For You section (default)
  return (
    <motion.div 
      className="w-full rounded-xl overflow-hidden cursor-pointer md:rounded-2xl"
      style={{ 
        backgroundColor: colors.backgroundSecondary,
        border: `1px solid ${colors.borderLight}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
      onClick={() => navigate(`/car-details/${car.id}`, { state: { car } })}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.3 }}
    >
      {/* Car Image Container - Compact on mobile, larger on desktop */}
      <div 
        className="relative w-full h-28 md:h-48 lg:h-56 flex items-center justify-center rounded-t-xl md:rounded-t-2xl overflow-hidden"
        style={{ backgroundColor: isTransparentPNG ? colors.backgroundImage : '#ffffff' }}
      >
        <motion.img 
          ref={imageRef}
          src={car.image} 
          alt={car.name} 
          loading="lazy"
          className={`w-full h-full ${
            isTransparentPNG 
              ? "object-contain p-1.5 md:p-3 lg:p-4" 
              : "object-cover"
          }`}
          initial={{ x: 100, opacity: 0 }}
          animate={isImageInView ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
        
        {/* Heart Icon - Top Left */}
        <button 
          className="absolute -top-1 left-1.5 md:-top-1 md:left-3 z-10 md:w-10 md:h-10 md:rounded-full md:bg-white md:bg-opacity-80 md:flex md:items-center md:justify-center touch-target"
          onClick={(e) => {
            e.stopPropagation();
            const wasFav = toggleFavorite(car);
            if (wasFav) {
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
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-200 ${
                isFav ? 'text-red-500 heart-icon liked' : 'text-white md:text-gray-700 heart-icon'
              }`}
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor" 
              strokeWidth={2}
              viewBox="0 0 24 24"
              style={{ overflow: 'visible' }}
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

      {/* Car Details - Compact on mobile, more spacious on desktop */}
      <div className="p-2 md:p-4 lg:p-5">
        {/* Car Name and Rating in same row */}
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 lg:mb-3">
          <h3 className="text-xs md:text-lg lg:text-xl font-bold text-black line-clamp-1 flex-1">{car.name}</h3>
          <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
            <span className="text-xs md:text-sm lg:text-base font-semibold text-black">{car.rating}</span>
            <svg 
              className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" 
              fill={colors.accentOrange} 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-3">
          <svg 
            className="w-3 h-3 md:w-4 md:h-4 text-gray-500" 
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
          <span className="text-[10px] md:text-sm text-gray-500 line-clamp-1">{car.location}</span>
        </div>

        {/* Price and Details Button */}
        <div className="flex items-center justify-between mt-1.5 md:mt-3">
          {/* Price */}
          <div className="flex items-center gap-1">
            <span className="text-xs md:text-base lg:text-lg font-bold text-black">{car.price}/Day</span>
          </div>

          {/* Details Button - Compact on mobile, larger on desktop */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/car-details/${car.id}`, { state: { car } });
            }}
            className="px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-sm lg:text-base font-semibold text-white"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchCarCard;

