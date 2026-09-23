import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { clearUser, updateUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import BottomNavbar from '../components/layout/BottomNavbar';
import carImg1 from '../../assets/car_img1-removebg-preview.png';

/**
 * ModuleNewProfilePage Component
 * Profile page matching the image design with black background and white rounded card
 * Uses menu items from the existing profile page: Complete Profile, KYC Status, Guarantor, etc.
 */
const ModuleNewProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.user);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await userService.getProfile();
        
        // Extract user data from response
        const userData = response.data?.user || response.data?.data?.user || response.user;
        
        if (userData) {
          // Update Redux store with fetched data
          dispatch(updateUser(userData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't show error toast - just use Redux store data as fallback
      }
    };

    fetchUserProfile();
  }, [dispatch, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearUser());
    toastUtils.success('Logged out successfully');
    navigate('/');
  };

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


  const userName = user?.name || 'User';
  const userEmail = user?.email || user?.phone || 'user@example.com';
  const userPhoto = user?.profilePhoto;

  // Combine all menu items - same as existing profile page
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

  return (
    <div 
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: '#1C205C' }}
    >
      {/* Top Section - Dark Background */}
      <div className="relative pt-12 pb-8 px-4">
        {/* Back Button - Top Left */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-900 transition-colors"
          aria-label="Back"
        >
          <svg
            className="w-5 h-5 text-white"
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

        {/* Settings Icon - Top Right */}
        <button
          onClick={() => navigate('/profile/settings')}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-900 transition-colors"
          aria-label="Settings"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {/* Profile Picture - Centered */}
        <div className="flex flex-col items-center mt-8">
          <div className="relative mb-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-24 h-24 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-white"
                style={{ backgroundColor: '#1C205C' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGdpcmwlMjBwcm9maWxlfGVufDB8fDB8fHww"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          {/* User Name */}
          <h2 className="text-xl font-bold text-white mb-1">
            {userName}
          </h2>
          
          {/* User Email */}
          <p className="text-sm text-gray-400">
            {userEmail}
          </p>
        </div>
      </div>

      {/* White Rounded Card - Main Content */}
      <div 
        className="bg-white rounded-t-3xl relative z-10 flex-1"
        style={{ marginTop: '8px', minHeight: 'calc(100vh - 140px)' }}
      >
        <div className="px-4 pt-8 pb-10">
          {/* Menu Items List */}
          <div className="space-y-2">
            {allMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between py-3.5 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 ${
                  item.id === 'logout' ? 'text-red-600' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon */}
                  <div className="p-2 rounded-lg flex items-center justify-center flex-shrink-0 bg-white">
                    <svg
                      className={`w-5 h-5 ${item.id === 'logout' ? 'text-red-600' : 'text-gray-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  
                  {/* Label */}
                  <span className={`text-base font-semibold flex-1 text-left ${
                    item.id === 'logout' ? 'text-red-600' : 'text-black'
                  }`}>
                    {item.label}
                  </span>
                </div>
                
                {/* Right Arrow */}
                <svg
                  className={`w-5 h-5 flex-shrink-0 ${item.id === 'logout' ? 'text-red-600' : 'text-gray-400'}`}
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

export default ModuleNewProfilePage;

