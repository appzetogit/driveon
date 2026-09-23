import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { theme } from '../../theme/theme.constants';

/**
 * ProtectedRoute Component
 * Guards routes that require authentication
 * Redirects to login if user is not authenticated
 * Uses Outlet for nested routes in React Router v6
 */
const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitializing } = useSelector((state) => state.auth);

  // Show loading spinner while checking auth or initializing
  // IMPORTANT: Wait for initialization to complete before checking authentication
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only check authentication AFTER initialization is complete
  // This prevents redirecting to login during token verification on page refresh
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

