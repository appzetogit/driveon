import { useNavigate } from 'react-router-dom';
import { colors } from '../../module/theme/colors';

/**
 * AccessDenied Component
 * Renders when a user tries to access a route they do not have permission for.
 */
const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-md w-full text-center p-8 rounded-2xl border shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: colors.backgroundSecondary || '#ffffff',
          borderColor: colors.borderMedium || '#e2e8f0'
        }}
      >
        {/* Animated Glowing Danger Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-red-50 text-red-500 animate-pulse">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-md"></div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold mb-3" style={{ color: colors.textPrimary || '#1e293b' }}>
          Access Denied
        </h2>

        {/* Description */}
        <p className="text-sm mb-8 leading-relaxed" style={{ color: colors.textSecondary || '#64748b' }}>
          You do not have permission to view this page. Please contact your system administrator if you think this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              // Try navigating to a safe fallback
              navigate('/admin/profile');
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-white shadow-md hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.backgroundTertiary || '#6366f1',
            }}
          >
            Go to Profile
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:bg-gray-50 active:scale-95"
            style={{
              borderColor: colors.borderMedium || '#cbd5e1',
              color: colors.textPrimary || '#1e293b'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
