import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';

const ProfileHeader = ({ title = 'Profile', showBack = false, onBack }) => {
  const navigate = useNavigate();

  return (
    <header 
      className="w-full relative rounded-b-3xl sticky top-0 z-50"
      style={{ backgroundColor: '#1C205C' }}
    >
      {/* Status Bar Area (for mobile) */}
      <div className="h-2" style={{ backgroundColor: '#1C205C' }}></div>

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
      <div className="relative z-10 px-4 py-3 flex items-center justify-center">
        {/* Back button */}
        {showBack && (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="absolute left-4 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: '#F1F2F4',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#111827',
            }}
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: '#111827' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Profile Title - Center */}
        <h1 className="text-lg font-bold text-center" style={{ color: colors.textWhite }}>{title}</h1>
      </div>
    </header>
  );
};

export default ProfileHeader;

