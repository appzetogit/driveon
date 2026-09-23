import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProfileCompleteRoute Component
 * Guards routes that require 100% profile completion
 * Redirects to profile completion page if profile is incomplete
 */
const ProfileCompleteRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { profileComplete } = useSelector((state) => state.user);
  const isProfileComplete = isAuthenticated && profileComplete;

  if (!isProfileComplete) {
    // Redirect to profile completion page
    return <Navigate to="/profile/complete" state={{ from: location }} replace />;
  }

  return children;
};

export default ProfileCompleteRoute;

