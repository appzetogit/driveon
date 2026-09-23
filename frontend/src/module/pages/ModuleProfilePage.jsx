import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUser, updateUser, setUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import carImg1 from '../../assets/car_img1-removebg-preview.png';

/**
 * ModuleProfilePage Component
 * Profile page matching the image design with white background
 * Uses menu items from the old profile page: Complete Profile, KYC Status, Guarantor, etc.
 */
const ModuleProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.user);
  const { profileComplete, kycStatus, guarantor, referralCode, points } = useAppSelector(
    (state) => state.user
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // State for image loading error (for main profile photo)
  const [imageError, setImageError] = useState(false);
  // State for header profile photo error
  const [headerImageError, setHeaderImageError] = useState(false);

  // Fetch user profile data when component mounts - ALWAYS fetch fresh data
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping profile fetch');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        console.log('📱 ===== Fetching User Profile =====');
        console.log('📱 Current user in Redux before fetch:', user);

        const response = await userService.getProfile();

        console.log('📱 Raw API response:', response);
        console.log('📱 Response type:', typeof response);
        console.log('📱 Response keys:', response ? Object.keys(response) : 'null');
        console.log('📱 Response.data:', response?.data);
        console.log('📱 Response.data?.user:', response?.data?.user);
        console.log('📱 Response.user:', response?.user);

        // Extract user data from response - handle various response formats
        // Backend returns: { success: true, data: { user: {...} } }
        // userService.getProfile() returns response.data which is: { success: true, data: { user: {...} } }
        // So we need to access: response.data.user (not response.data.data.user)
        const userData = response?.data?.user || response?.user || response?.data;

        console.log('📱 Extracted user data:', userData);
        console.log('📱 User data type:', typeof userData);
        console.log('📱 User data keys:', userData ? Object.keys(userData) : 'null');

        if (userData) {
          // Ensure we have the essential fields - preserve all existing fields
          const normalizedUserData = {
            ...userData,
            name: userData.name || userData.fullName || '',
            phone: userData.phone || '',
            email: userData.email || '',
          };

          console.log('📱 Normalized user data:', normalizedUserData);
          console.log('📱 Normalized name:', normalizedUserData.name);
          console.log('📱 Normalized phone:', normalizedUserData.phone);
          console.log('📱 Normalized email:', normalizedUserData.email);

          // Always use setUser to ensure complete replacement
          console.log('📱 Dispatching setUser with normalized data');
          dispatch(setUser(normalizedUserData));

          console.log('✅ User data set in Redux');


        } else {
          console.warn('⚠️ No user data found in response:', response);
          console.warn('⚠️ Response structure:', JSON.stringify(response, null, 2));
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        // Don't show error toast - just use Redux store data as fallback
      }
    };

    // Always fetch, even if user exists in Redux (to get latest data)
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // General section menu items
  const generalMenuItems = [
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
    },
  ];

  // Support section menu items
  const supportMenuItems = [
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
    {
      id: 'languages',
      label: 'Languages',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      ),
      path: '/profile/settings',
    },
    {
      id: 'invite',
      label: 'Invite Friends',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      ),
      path: '/profile/referrals',
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
      path: '/privacy',
    },
    {
      id: 'support',
      label: 'Help Support',
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
      id: 'logout',
      label: 'Log out',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      ),
      onClick: handleLogout,
    },
  ];

  // Debug: Log user data
  useEffect(() => {
    console.log('👤 ===== User Data Debug =====');
    console.log('👤 Current user data in Redux:', user);
    console.log('👤 User is null?', user === null);
    console.log('👤 User is undefined?', user === undefined);
    console.log('👤 User name:', user?.name);
    console.log('👤 User phone:', user?.phone);
    console.log('👤 User email:', user?.email);
    console.log('👤 ============================');
  }, [user]);

  // Get user data with proper fallbacks - ensure we always have values
  const userName = (user?.name || user?.fullName || '').trim() || 'User';
  const userPhone = (user?.phone || '').trim();
  const userEmail = (user?.email || '').trim() || 'N/A';
  // Profile photo - check for valid URL (not empty string)
  const userPhoto = user?.profilePhoto && user.profilePhoto.trim() !== '' ? user.profilePhoto : null;
  const username = user?.username || `@${userName.toLowerCase().replace(/\s+/g, '')}`;

  // Reset image error when user photo changes
  useEffect(() => {
    if (userPhoto) {
      setImageError(false);
    }
    if (user?.profilePhoto) {
      setHeaderImageError(false);
    }
  }, [userPhoto, user?.profilePhoto]);

  // Format phone number for display (add +91 prefix if it's a 10-digit number)
  const formatPhoneNumber = (phone) => {
    if (!phone || phone === '' || phone.trim() === '') {
      console.log('📞 Phone is empty, returning N/A');
      return 'N/A';
    }
    const cleaned = String(phone).replace(/\D/g, '');
    console.log('📞 Formatting phone:', phone, '-> cleaned:', cleaned);
    if (cleaned.length === 10) {
      const formatted = `+91 ${cleaned}`;
      console.log('📞 Formatted phone:', formatted);
      return formatted;
    }
    // If phone exists but not 10 digits, return as is
    if (cleaned.length > 0) {
      console.log('📞 Phone length not 10, returning original:', phone);
      return phone;
    }
    console.log('📞 Phone is invalid, returning N/A');
    return 'N/A';
  };

  // Format phone number - use direct user.phone first, then fallback
  // Priority: user?.phone > userPhone > 'N/A'
  const displayPhone = (() => {
    const phoneToFormat = user?.phone || userPhone;
    if (phoneToFormat) {
      return formatPhoneNumber(phoneToFormat);
    }
    return 'N/A';
  })();

  console.log('📞 ===== Phone Number Display Debug =====');
  console.log('📞 User object:', user);
  console.log('📞 user?.phone:', user?.phone);
  console.log('📞 userPhone variable:', userPhone);
  console.log('📞 displayPhone:', displayPhone);
  console.log('📞 ======================================');

  // Log computed values for debugging
  console.log('🔍 Computed values:', {
    userName,
    userPhone,
    displayPhone,
    userEmail,
    hasUser: !!user,
    userKeys: user ? Object.keys(user) : [],
  });

  // Debug display values - log whenever user or display values change
  useEffect(() => {
    console.log('📺 ===== Display Values =====');
    console.log('📺 user object:', user);
    console.log('📺 userName:', userName);
    console.log('📺 userPhone:', userPhone);
    console.log('📺 displayPhone:', displayPhone);
    console.log('📺 userEmail:', userEmail);
    console.log('📺 ==========================');
  }, [user, userName, userPhone, displayPhone, userEmail]);

  // Combine all menu items in the order shown in the image
  const allMenuItems = [
    ...generalMenuItems,
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
      id: 'favorites',
      label: 'My Favorites',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      ),
      path: '/favorites',
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
    {
      id: 'support',
      label: 'Help & Support',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      path: '/profile/support',
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      ),
      onClick: handleLogout,
    },
  ];

  // Light version of dark background for profile section
  const profileSectionBg = colors.backgroundPrimary || '#F1F2F4';
  const iconBgColor = colors.backgroundPrimary || colors.backgroundImage;

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary, contain: 'layout style' }}
    >
      {/* Web Header - Only visible on web */}
      <header
        className="hidden md:block w-full sticky top-0 z-50"
        style={{ backgroundColor: colors.brandBlack }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center h-16 md:h-20 lg:h-24 justify-between">
            {/* Left - Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/driveonlogo.png"
                alt="DriveOn Logo"
                className="h-8 md:h-10 lg:h-12 xl:h-14 w-auto object-contain"
              />
            </Link>

            {/* Center - Navigation Tabs */}
            <nav className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 h-full">
              <Link
                to="/"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                FAQs
              </Link>
            </nav>

            {/* Right - Login/Signup and Profile Icon */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                >
                  {/* Circular profile icon with white border */}
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    {user?.profilePhoto && user.profilePhoto.trim() !== '' && !headerImageError ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        onError={() => {
                          console.log('🖼️ Header profile photo failed to load, showing default');
                          setHeaderImageError(true);
                        }}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img
                        src={carImg1}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 md:py-2 lg:py-2.5 rounded-lg border text-xs md:text-sm lg:text-base font-medium transition-all hover:opacity-90"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Header - Mobile view only */}
      <div className="md:hidden">
        <ProfileHeader />
      </div>


      {/* Web Container - Centered with max-width */}
      <div className="max-w-5xl mx-auto">
        {/* Profile Section with Light Background - Like Third Image */}
        <div
          className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-8 lg:pt-10 xl:pt-12 pb-3 md:pb-4 lg:pb-5 xl:pb-6 rounded-b-3xl"
          style={{ backgroundColor: profileSectionBg }}
        >
          {/* Profile Picture - Centered */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3 md:mb-4" style={{ contain: 'layout' }}>
              {userPhoto && !imageError ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  onError={() => {
                    console.log('🖼️ Profile photo failed to load, showing default icon');
                    setImageError(true);
                  }}
                  className="w-20 h-20 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-white shadow-md transition-transform duration-300 hover:scale-105"
                  style={{ borderColor: profileSectionBg }}
                  loading="eager"
                  width="96"
                  height="96"
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-transform duration-300 hover:scale-105"
                  style={{ backgroundColor: iconBgColor }}
                >
                  <svg
                    className="w-10 h-10 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-500"
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
            </div>

            {/* User Name - Direct from user object with fallbacks */}
            <h2 className="text-lg md:text-lg lg:text-xl font-bold text-black mb-1.5 md:mb-2 text-center w-full">
              {user?.name || user?.fullName || userName || 'User'}
            </h2>

            {/* Phone Number Display - Direct from user object with formatting */}
            <p className="text-xs md:text-xs lg:text-sm text-black mb-1 md:mb-1.5 text-center w-full">
              {displayPhone}
            </p>

            {/* Email Display (if available) - Direct from user object */}
            {(user?.email || (userEmail && userEmail !== 'N/A')) && (
              <p className="text-xs md:text-xs lg:text-sm text-black mb-0 leading-tight text-center w-full">
                {user?.email || userEmail}
              </p>
            )}

            {/* User ID Display with Copy Button - Centered below email */}
            {user?._id || user?.id ? (() => {
              const userId = (user._id || user.id).toString();
              // Format as user-XXXXX (last 5 characters of MongoDB ID)
              const formattedUserId = `user-${userId.slice(-5)}`;

              const handleCopyUserId = async () => {
                try {
                  await navigator.clipboard.writeText(formattedUserId);
                  toastUtils.success('User ID copied to clipboard!');
                } catch (err) {
                  console.error('Failed to copy:', err);
                  toastUtils.error('Failed to copy User ID');
                }
              };

              return (
                <div className="w-full flex justify-center mt-[-6.5px] pl-9 leading-tight">
                  <div className="flex items-center gap- md:gap-2">
                    <span className="text-xs md:text-xs lg:text-sm text-black font-mono">
                      {formattedUserId}
                    </span>
                    <button
                      onClick={handleCopyUserId}
                      className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      title="Copy User ID"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700"
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
              );
            })() : null}
          </div>
        </div>

        {/* Menu Items Section - White Background with Card Design - Like First Image */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-3 md:pt-4 lg:pt-5 xl:pt-6 pb-6 md:pb-6 lg:pb-8 xl:pb-10" style={{ backgroundColor: colors.backgroundSecondary }}>
          {/* Menu Items List - Single column on mobile, 2 columns on web */}
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 lg:gap-4 xl:gap-5 md:space-y-0">
            {allMenuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between py-4 md:py-3 lg:py-3.5 px-3 md:px-4 lg:px-5 bg-white rounded-xl shadow-sm hover:shadow-lg active:bg-gray-50 transition-all duration-300 md:hover:scale-[1.02] ${item.id === 'logout' ? 'text-red-600' : ''
                  }`}
              >
                <div className="flex items-center gap-3 md:gap-3 flex-1">
                  {/* Icon with background circle */}
                  <div
                    className="p-2 md:p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBgColor }}
                  >
                    <svg
                      className={`w-5 h-5 md:w-5 md:h-5 ${item.id === 'logout' ? 'text-red-600' : 'text-gray-700'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  {/* Label */}
                  <span className={`text-base md:text-sm lg:text-base font-medium flex-1 text-left ${item.id === 'logout' ? 'text-red-600' : 'text-black'}`}>
                    {item.label}
                  </span>
                </div>
                {/* Right Arrow */}
                <svg
                  className={`w-5 h-5 md:w-5 md:h-5 flex-shrink-0 ${item.id === 'logout' ? 'text-red-600' : 'text-gray-400'}`}
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
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ModuleProfilePage;

