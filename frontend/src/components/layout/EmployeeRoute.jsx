import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * EmployeeRoute Component
 * Guards routes that require employee/staff role
 * Redirects to employee login if user is not authenticated
 * Shows loading state while auth is initializing
 */
const EmployeeRoute = () => {
    const { isAuthenticated, isInitializing, userRole } = useSelector((state) => state.auth);

    if (isInitializing) {
        // Show loading spinner while checking auth status
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 border-[#1C205C]"
                    ></div>
                    <p className="text-[#1C205C] font-medium tracking-wide">Initializing Session...</p>
                </div>
            </div>
        );
    }

    // Check if authenticated AND has employee role (or role not yet set but token exists)
    // We check for userRole !== 'admin' to avoid cross-access, but technically 'employee' role is preferred
    if (!isAuthenticated || (userRole && userRole !== 'employee' && userRole !== 'staff')) {
        // Redirect to employee login if not authenticated or wrong role
        return <Navigate to="/employee/login" replace />;
    }

    return <Outlet />;
};

export default EmployeeRoute;
