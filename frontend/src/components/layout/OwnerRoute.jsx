import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * OwnerRoute Component
 * Guards routes that require owner role
 * Redirects to home if user is not owner
 */
const OwnerRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, userRole, isLoading } = useSelector((state) => state.auth);
  const isOwner = isAuthenticated && userRole === 'owner';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner) {
    // Redirect to home if not owner
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OwnerRoute;

