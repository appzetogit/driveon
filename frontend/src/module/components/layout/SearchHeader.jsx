import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';

/**
 * SearchHeader Component - Exact match to design
 * Header with back arrow, title text, and menu icon
 */
const SearchHeader = ({ title = 'Search', onBack, backRoute }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backRoute) {
      navigate(backRoute);
    } else {
      // If there is back history, go back. Otherwise go to Home.
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <header 
      className="w-full relative rounded-b-3xl sticky top-0 z-50"
      style={{ backgroundColor: colors.backgroundTertiary }}
    >
      {/* Status Bar Area (for mobile) */}
      <div className="h-2" style={{ backgroundColor: colors.backgroundTertiary }}></div>

      {/* Abstract Line Graphics Background - Lighter blue patterns */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <svg 
          className="absolute top-0 right-0 w-full h-full" 
          viewBox="0 0 400 200" 
          fill="none"
          style={{ color: colors.accentBlue }}
        >
          {/* Abstract flowing lines */}
          <path 
            d="M50 30 Q150 20, 250 40 T450 50" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-60"
          />
          <path 
            d="M80 60 Q180 50, 280 70 T480 80" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-40"
          />
          <path 
            d="M30 90 Q130 80, 230 100 T430 110" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-30"
          />
          <path 
            d="M100 120 Q200 110, 300 130 T500 140" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            fill="none"
            className="opacity-25"
          />
          {/* Additional subtle lines */}
          <path 
            d="M150 10 Q250 0, 350 20" 
            stroke="currentColor" 
            strokeWidth="1" 
            fill="none"
            className="opacity-50"
          />
          <path 
            d="M200 40 Q300 30, 400 50" 
            stroke="currentColor" 
            strokeWidth="1" 
            fill="none"
            className="opacity-35"
          />
        </svg>
      </div>

      {/* Main Header Content */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 flex items-center justify-between max-w-7xl mx-auto">
        {/* Back Arrow - Circular Button */}
        <button 
          onClick={handleBack}
          className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center md:shadow-md"
          style={{ 
            border: `1px solid ${colors.borderForm}`,
            backgroundColor: colors.backgroundSecondary
          }}
        >
          <svg 
            className="w-5 h-5 md:w-6 md:h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: colors.backgroundTertiary }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>

        {/* Title - Center */}
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold flex-1 text-center" style={{ color: colors.textWhite }}>{title}</h1>

        {/* Spacer to balance the layout */}
        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"></div>
      </div>
    </header>
  );
};

export default SearchHeader;

