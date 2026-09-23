import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUser, updateUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import { theme } from '../../theme/theme.constants';
import LocationTracker from '../../components/common/LocationTracker';

/**
 * ProfileDashboardPage Component
 * Beautiful profile page with user info and menu options
 * Matches homepage theme (teal #1e6262)
 * Mobile-first design
 */
const ProfileDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.user);
  const { profileComplete, kycStatus, guarantor, referralCode, points } = useAppSelector(
    (state) => state.user
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Handle back navigation - if came from complete profile, go to home, otherwise go back
  const handleBack = () => {
    const state = location.state;
    // If we came from complete profile page, navigate to home instead of going back
    // This prevents the loop where back would go to complete profile page
    if (state?.from === '/profile/complete') {
      navigate('/');
    } else {
      // Otherwise, go back in history to the previous page
      navigate(-1);
    }
  };

  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await userService.getProfile();

        // Extract user data from response (handle different response formats)
        const userData = response.data?.user || response.data?.data?.user || response.user;

        if (userData) {
          // Update Redux store with fetched data
          dispatch(updateUser(userData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Show error toast only if it's not a network error
        if (error.response?.status !== 401) {
          toastUtils.error('Failed to load profile data');
        }
      }
    };

    fetchUserProfile();
  }, [dispatch, isAuthenticated]);

  const handleLogout = async () => {
    try {
      // Call async logout thunk that calls backend API
      await dispatch(logoutUser()).unwrap();
      // Clear user data
      dispatch(clearUser());
      toastUtils.success('Logged out successfully');
      // Force redirect to login page using window.location for complete page reload
      window.location.href = '/login';
    } catch (error) {
      // Even if logout fails, clear state and force redirect
      dispatch(clearUser());
      toastUtils.success('Logged out successfully');
      // Force redirect to login page
      window.location.href = '/login';
    }
  };

  // Calculate profile completion percentage from user data
  const profileCompletePercentage = user?.profileComplete ?? 0;
  const isProfileFullyComplete = profileCompletePercentage >= 100;

  // Menu options based on project requirements
  const menuOptions = [
    {
      id: 'complete',
      label: 'Complete Profile',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      ),
      path: '/profile/complete',
      badge: `${profileCompletePercentage}%`,
      badgeColor: isProfileFullyComplete ? 'bg-green-500' : profileCompletePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500',
    },
    {
      id: 'kyc',
      label: 'KYC Status',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      ),
      path: '/profile/kyc',
      badge: kycStatus.verified ? 'Verified' : 'Pending',
      badgeColor: kycStatus.verified ? 'bg-green-500' : 'bg-yellow-500',
    },
    {
      id: 'guarantor',
      label: 'Guarantor',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
      path: '/profile/guarantor',
      badge: user?.guarantorId || (guarantor.verified ? 'Added' : 'Not Added'),
      badgeColor: user?.guarantorId ? 'bg-blue-500' : (guarantor.verified ? 'bg-green-500' : 'bg-gray-400'),
    },
    {
      id: 'referrals',
      label: 'Referral Dashboard',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      ),
      path: '/profile/referrals',
      badge: points > 0 ? `${points} pts` : null,
      badgeColor: 'bg-primary',
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
      path: '/bookings',
    },
    {
      id: 'support',
      label: 'Support',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      ),
      path: '/profile/support',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
      ),
      path: '/profile/settings',
    },
  ];

  const userName = user?.name || 'User';
  const userEmail = user?.email || user?.phone || 'user@example.com';
  const userPhoto = user?.profilePhoto;

  /**
   * Format user ID to USER001 format
   * Takes MongoDB ObjectId and converts to USER + padded number
   */
  const formatUserId = (userId) => {
    if (!userId) return '';

    // Extract last 5 characters from MongoDB ObjectId
    const lastChars = userId.toString().slice(-5);

    return `user-${lastChars}`;
  };

  const formattedUserId = user?._id || user?.id ? formatUserId(user._id || user.id) : '';

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20 overflow-x-hidden relative z-0" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {/* Header Section - Blue Background */}
      <header className="w-full text-white relative overflow-hidden rounded-b-3xl shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        {/* Abstract blue pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Header Content */}
        <div className="relative px-4 py-4 md:px-6 md:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button, Profile Icon, and User Name - All Aligned */}
            <div className="flex items-center gap-3 md:gap-6">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1 touch-target flex-shrink-0 md:p-2"
                aria-label="Go back"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Profile Photo */}
              <div className="relative">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/20 border-2 border-white flex items-center justify-center shadow-md">
                    <svg
                      className="w-7 h-7 md:w-10 md:h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                {profileComplete && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 flex items-center justify-center" style={{ borderColor: theme.colors.primary }}>
                    <svg
                      className="w-2 h-2 md:w-2.5 md:h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Name, Email, and User ID */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1 truncate">{userName}</h1>
                <p className="text-xs md:text-sm text-white/80 truncate">{userEmail}</p>
                {formattedUserId && (
                  <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                    <p className="text-xs md:text-sm text-white/70 font-mono">{formattedUserId}</p>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(formattedUserId);
                          toastUtils.success('User ID copied!');
                        } catch (err) {
                          toastUtils.error('Failed to copy');
                        }
                      }}
                      className="p-0.5 hover:bg-white/10 rounded transition-colors"
                      title="Copy User ID"
                    >
                      <svg
                        className="w-3 h-3 text-white/70 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="px-4 pt-6 pb-6 md:px-3 md:pt-10 md:pb-3 md:px-6 md:pt-14 md:pb-6 w-full max-w-7xl mx-auto"
        style={{
          backgroundColor: `${theme.colors.primary}08`,
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            main {
              background-color: transparent !important;
            }
          }
        `}</style>
        {/* Mobile View - Single White Rounded Card */}
        <div className="md:hidden mt-6">
          {/* Profile Completion Banner - Between header and white card - Mobile Only */}
          {(!profileComplete && (!user?.profileComplete || user.profileComplete < 100)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 max-w-2xl mx-auto">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-yellow-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="text-xs font-semibold text-yellow-900">
                      Complete Your Profile
                    </h3>
                    <span className="text-xs font-bold text-yellow-900">
                      {user?.profileComplete || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-1.5">
                    Complete your profile to start booking cars
                  </p>
                  <button
                    onClick={() => navigate('/profile/complete')}
                    className="text-xs font-medium text-yellow-900 underline hover:no-underline"
                  >
                    Complete Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm max-w-2xl mx-auto overflow-hidden">
            {/* Menu Options - Clean Vertical List - Mobile Only */}
            <div className="divide-y divide-gray-100">
              {menuOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => navigate(option.path)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors touch-target"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Icon in rounded square */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.colors.primary}15` }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: theme.colors.primary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {option.icon}
                      </svg>
                    </div>

                    {/* Label */}
                    <span className="text-base font-medium text-gray-900">{option.label}</span>
                  </div>

                  {/* Badge and Chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {option.badge && (
                      <>
                        <span
                          className={`${option.badgeColor} text-white text-xs font-semibold px-2 py-1 rounded-full`}
                        >
                          {option.badge}
                        </span>
                        {option.id === 'guarantor' && user?.guarantorId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(user.guarantorId);
                              toastUtils.success('Guarantor ID copied!');
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label="Copy guarantor ID"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}

              {/* Logout Button - Mobile Only */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors touch-target"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icon in rounded square */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>

                  {/* Label */}
                  <span className="text-base font-medium text-gray-900">Logout</span>
                </div>

                {/* Chevron */}
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Referral Code Display - Inside card - Mobile Only */}
            {referralCode && (
              <div className="mx-4 my-4 p-3 rounded-lg border" style={{ backgroundColor: `${theme.colors.primary}08`, borderColor: `${theme.colors.primary}20` }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
                    <p className="text-sm font-bold font-mono truncate" style={{ color: theme.colors.primary }}>
                      {referralCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toastUtils.success('Referral code copied!');
                    }}
                    className="p-2 rounded-lg hover:bg-white transition-colors flex-shrink-0 touch-target"
                    style={{ color: theme.colors.primary }}
                    aria-label="Copy referral code"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop View - Keep existing layout */}
        <div className="hidden md:block">
          {/* Profile Completion Status Card - Only show if profile is not complete */}
          {(!profileComplete && (!user?.profileComplete || user.profileComplete < 100)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-3 md:mb-6 mt-4 md:mt-6">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-yellow-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5 md:mb-1">
                    <h3 className="text-xs md:text-sm font-semibold text-yellow-900">
                      Complete Your Profile
                    </h3>
                    <span className="text-xs md:text-sm font-bold text-yellow-900">
                      {user?.profileComplete || 0}%
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-yellow-700 mb-1.5 md:mb-2">
                    Complete your profile to start booking cars
                  </p>
                  <button
                    onClick={() => navigate('/profile/complete')}
                    className="text-xs md:text-sm font-medium text-yellow-900 underline hover:no-underline"
                  >
                    Complete Now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Menu Options */}
          <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 pt-3">
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => navigate(option.path)}
                className="w-full bg-white rounded-xl p-3.5 md:p-4 flex items-center justify-between shadow-md border border-gray-100/90 hover:shadow-lg md:hover:shadow-xl transition-all touch-target group"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors flex-shrink-0" style={{ backgroundColor: `${theme.colors.primary}1A` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}33`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}>
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      style={{ color: theme.colors.primary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {option.icon}
                    </svg>
                  </div>

                  {/* Label */}
                  <span className="text-sm md:text-base font-medium text-gray-900 truncate">{option.label}</span>
                </div>

                {/* Badge and Arrow */}
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {option.badge && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`${option.badgeColor} text-white text-xs md:text-sm font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full`}
                      >
                        {option.badge}
                      </span>
                      {option.id === 'guarantor' && user?.guarantorId && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(user.guarantorId);
                            toastUtils.success('Guarantor ID copied!');
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors touch-target cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label="Copy guarantor ID"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(user.guarantorId);
                              toastUtils.success('Guarantor ID copied!');
                            }
                          }}
                        >
                          <svg
                            className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 hover:text-gray-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 rounded-lg p-3 md:p-4 flex items-center justify-between shadow-sm border border-red-100 hover:shadow-md md:hover:shadow-lg transition-all touch-target group mt-3 md:mt-4 md:col-span-2"
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {/* Icon */}
                <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors flex-shrink-0">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>

                {/* Label */}
                <span className="text-sm md:text-base font-medium text-red-600">Logout</span>
              </div>

              {/* Arrow */}
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Referral Code Display - Desktop Only */}
          {referralCode && (
            <div
              className="mt-3 md:mt-6 rounded-lg p-3 md:p-4 text-white"
              style={{
                background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.primaryLight || theme.colors.primary
                  })`,
              }}
            >
              <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-white/80 mb-0.5 md:mb-1">Your Referral Code</p>
                  <p className="text-sm md:text-lg font-bold font-mono truncate">{referralCode}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    toastUtils.success('Referral code copied!');
                  }}
                  className="p-1.5 md:p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex-shrink-0 touch-target"
                  aria-label="Copy referral code"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>


      </main>
    </div>
  );
};

export default ProfileDashboardPage;
