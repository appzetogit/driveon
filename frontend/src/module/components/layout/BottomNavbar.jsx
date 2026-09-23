import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';

/**
 * BottomNavbar Component - Exact match to design
 * Fixed bottom navigation with 4 icons
 */
const BottomNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let initialWidth = window.innerWidth;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;

      // If width changed significantly (like orientation change), update initial tracking values
      if (Math.abs(currentWidth - initialWidth) > 20) {
        initialHeight = currentHeight;
        initialWidth = currentWidth;
        setIsKeyboardVisible(false);
        return;
      }

      // If visualViewport is available, check its height ratio (primarily iOS)
      if (window.visualViewport) {
        const isIOSKeyboard = window.visualViewport.height < window.innerHeight * 0.85;
        if (isIOSKeyboard) {
          setIsKeyboardVisible(true);
          return;
        }
      }

      // Android/Browser height shrink detection
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const handleNavClick = (path, e) => {
    e.preventDefault();
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/search') {
      return location.pathname === '/search';
    }
    if (path === '/profile') {
      return location.pathname.startsWith('/profile');
    }
    if (path === '/bookings') {
      return location.pathname === '/bookings';
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', icon: 'home', label: 'Home' },
    { path: '/search', icon: 'search', label: 'Search' },
    { path: '/bookings', icon: 'bookings', label: 'My Bookings' },
    { path: '/profile', icon: 'profile', label: 'Profile' },
  ];

  const getIcon = (iconName, active) => {
    // Icons fixed to white color always
    const iconClass = `w-6 h-6`;
    const iconColor = { color: active ? colors.textPrimary : colors.textWhite }; // Active is dark blue (primary/tertiary), Inactive is white

    // BUT user asked for "Icon should be fixed always".
    // "when you change tabs -> icons should not fluctuate"
    // The previous code had a BIG wrapper div for active state which caused layout shift/fluctuation.
    // I will simplify. Active state will just change color, not size or layout.

    // Actually, looking at the previous code lines 103-109, the active icon was wrapped in a 12x12 (w-12 h-12) white circle.
    // The inactive icon was just the SVG.
    // This size difference (w-12 vs w-6) and the wrapper caused the "fluctuation".

    // TO FIX: I will make the layout consistent.
    // The requirement is "Icon should be fixed always".
    // I will remove the "active wrapper" logic in the map loop and just use color to denote active state,
    // OR keep the wrapper but ensure it doesn't shift layout.

    // The most stable way is to keep the icon size and positions exactly the same.
    // I will remove the conditional wrapper in the render loop (later step) and just return the SVG here.

    return (
      <svg className={iconClass} style={{ color: active ? colors.backgroundSecondary : colors.textWhite }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Using backgroundSecondary (likely white-ish) for active if background is dark, or vice versa. 
            Wait, navbar background is 'backgroundTertiary' (dark blue usually).
            So inactive icons are white.
            Active icons were inside a white circle and colored dark blue.
            
            If I want to stop fluctuation, I should probably remove the "white circle" effect 
            OR make sure the white circle doesn't change the size of the container.
            
            Let's try to just use color change for now to be safe and "fixed".
            Active: White (or a highlight color). Inactive: White transparent / Grey.
            
            Let's look at the "render" part too.
            lines 102-111 is where the structural change happens.
            
            I will update getIcon to just return the paths.
         */}
        {getIconPath(iconName)}
      </svg>
    );
  };

  const getIconPath = (name) => {
    switch (name) {
      case 'home':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
      case 'search':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
      case 'bookings':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />;
      case 'profile':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
      default:
        return null;
    }
  };

  const hideOnRoutes = ['/terms', '/privacy-policy'];
  if (isKeyboardVisible || hideOnRoutes.includes(location.pathname)) return null;

  return (
    <>
      <style>{`
        /* Hide URL preview on navigation buttons */
        nav button {
          text-decoration: none;
          outline: none;
        }
        nav button:focus {
          outline: none;
        }
        nav button:hover {
          text-decoration: none;
        }
      `}</style>
      <nav
        className="fixed bottom-4 left-4 right-4 px-4 py-3.5 rounded-2xl flex items-center justify-around z-50 shadow-lg"
        style={{ backgroundColor: colors.backgroundTertiary }}
      >

        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={(e) => handleNavClick(item.path, e)}
              className="flex flex-col items-center justify-center min-w-[60px] h-full border-none bg-transparent cursor-pointer p-0 gap-1"
              aria-label={item.label}
            >
              {/* Stable Icon Container */}
              <div className={`flex items-center justify-center transition-all duration-200 ${active ? 'transform scale-110' : ''}`}>
                {getIcon(item.icon, active)}
              </div>

              {/* Stable Label */}
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{
                  color: active ? colors.backgroundSecondary : colors.textWhite,
                  opacity: active ? 1 : 0.7
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default BottomNavbar;


