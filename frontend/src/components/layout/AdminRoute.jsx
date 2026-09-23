import { Navigate, Outlet } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import { useAdminAuth } from '../../context/AdminContext';

/**
 * AdminRoute Component
 * Guards routes that require admin role
 * Redirects to admin login if user is not authenticated
 * Uses React Hooks only - No Redux, No localStorage
 */
const AdminRoute = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    // Show loading spinner while checking admin status
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

