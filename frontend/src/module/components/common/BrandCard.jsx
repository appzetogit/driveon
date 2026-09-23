import { useEffect, useState } from 'react';
import { colors } from '../../theme/colors';

/**
 * BrandCard Component - Circular brand logo with black background
 */
const BrandCard = ({ logo, name, fallbackLogo }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const [logoSrc, setLogoSrc] = useState(logo || fallbackLogo || "");

  useEffect(() => {
    setLogoSrc(logo || fallbackLogo || "");
  }, [logo, fallbackLogo]);

  const handleImageError = () => {
    if (fallbackLogo && logoSrc !== fallbackLogo) {
      setLogoSrc(fallbackLogo);
    } else {
      setLogoSrc("");
    }
  };

  const hasLogo = Boolean(logoSrc);

  return (
    <div className="flex flex-col items-center gap-1.5 lg:gap-2 shrink-0">
      {/* Circular Logo Container */}
      <div 
        className="w-14 h-14 md:w-16 md:h-16 lg:w-24 lg:h-24 rounded-full flex items-center justify-center p-2.5 md:p-3 lg:p-4"
        style={{ backgroundColor: colors.brandBlack }}
      >
        {hasLogo ? (
          <img 
            src={logoSrc} 
            alt={name} 
            className="w-full h-full object-contain"
            onError={handleImageError}
          />
        ) : (
          <span className="text-white text-lg md:text-xl lg:text-2xl font-semibold">
            {initial}
          </span>
        )}
      </div>
      {/* Brand Name */}
      <span className="text-xs lg:text-base text-gray-600 font-medium">{name}</span>
    </div>
  );
};

export default BrandCard;

