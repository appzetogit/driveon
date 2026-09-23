import { useEffect, Suspense } from 'react';
import ScrollToTop from '../common/ScrollToTop';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/redux';
import LocationTracker from '../../../components/common/LocationTracker';

/**
 * ModuleLayout Component
 * Wraps all module routes and ensures scroll to top on navigation
 * Also handles background location tracking for authenticated users
 */
const ModuleLayout = () => {
  const { user } = useAppSelector((state) => state.user);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Debug logging
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('📍 ModuleLayout: User authenticated, starting location tracking', {
        userId: user._id || user.id,
        userType: user.role === 'guarantor' ? 'guarantor' : 'user',
        isAuthenticated,
      });
    } else {
      console.log('📍 ModuleLayout: User not authenticated or missing', {
        isAuthenticated,
        hasUser: !!user,
      });
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 border-purple-600"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        <Outlet />
      </Suspense>
      {/* Background Location Tracking for Authenticated Users */}
      {/* Disabled by default - enable only when needed to avoid Socket.IO connection errors */}
      {/* To enable: set VITE_ENABLE_LOCATION_TRACKING=true in .env */}
      {isAuthenticated && user && (
        <LocationTracker
          userId={user._id || user.id}
          userType={user.role === 'guarantor' ? 'guarantor' : 'user'}
          autoStart={true}
          hidden={true}
        />
      )}
    </>
  );
};

export default ModuleLayout;

