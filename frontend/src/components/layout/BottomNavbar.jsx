import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { theme } from '../../theme/theme.constants';

/**
 * BottomNavbar Component
 * Mobile-only bottom navigation bar
 * Tabs: Home, Search, Add (center button), Bookings, Profile
 */
const BottomNavbar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
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

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      path: '/cars',
      label: 'Search',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      ),
    },
    {
      path: '/bookings',
      label: 'Bookings',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
      requiresAuth: true,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      ),
      requiresAuth: true,
    },
  ];

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = (item, e) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      window.location.href = '/login';
    }
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };

  const hideOnRoutes = ['/terms', '/privacy-policy'];
  if (isKeyboardVisible || hideOnRoutes.includes(location.pathname)) return null;

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 z-50 shadow-lg safe-area-inset-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        overflow: 'visible',
      }}
    >
      <div className="flex items-center justify-around min-h-20 px-2 py-2 max-w-full" style={{ overflow: 'visible' }}>
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          const disabled = item.requiresAuth && !isAuthenticated;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => handleClick(item, e)}
              className={`flex flex-col items-center justify-center gap-1 touch-target shrink-0 min-w-0 ${disabled ? 'opacity-50' : ''}`}
              aria-label={item.label}
            >
              {active ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: theme.colors.primary }}>
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {item.icon}
                  </svg>
                </div>
              ) : (
                <svg
                  className="w-6 h-6"
                  style={{ color: '#6b7280' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
              )}
              <span className="text-xs font-medium" style={{ color: active ? theme.colors.primary : '#6b7280' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;

