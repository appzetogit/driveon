import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { loginSuccess, logout, authInitialized } from '../../store/slices/authSlice';
import { setUser } from '../../store/slices/userSlice';
import { requestForToken, onMessageListener, isMobileApp } from '../../services/firebase';
import toastUtils from '../../config/toast';
import api from '../../services/api';

/**
 * AuthInitializer Component
 * Checks and restores authentication state on app mount/refresh
 * Verifies token validity and restores user session
 */
const AuthInitializer = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token, isInitializing } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  useEffect(() => {
    const initializeAuth = async () => {
      // Determine context based on URL to enforce strict model separation
      const currentPath = window.location.pathname;
      const isEmployeeApp = currentPath.startsWith('/employee');
      const isAdminApp = currentPath.startsWith('/admin') || currentPath.startsWith('/crm');

      // Admin and CRM portals are managed separately by AdminContext.jsx
      // Return early to prevent loading/refreshing customer user profiles on admin pages
      if (isAdminApp) {
        console.log('ℹ️ Admin/CRM context detected. Skipping user/staff auth initialization in AuthInitializer.');
        dispatch(authInitialized());
        return;
      }

      // Get token from localStorage based on context
      const storedToken = isEmployeeApp
        ? localStorage.getItem('staffToken')
        : localStorage.getItem('authToken');

      // Select correct refresh token based on context
      const storedRefreshToken = isEmployeeApp
        ? localStorage.getItem('staffRefreshToken')
        : localStorage.getItem('refreshToken');

      // If no token for this context, just finish initialization
      // DO NOT call logout() here because it might clear a valid session from the OTHER context
      // (e.g. if a staff visits a user page, we don't want to clear their staff session)
      if (!storedToken) {
        console.log(`ℹ️ No ${isEmployeeApp ? 'staff' : 'user'} token found for this context.`);
        dispatch(authInitialized());
        return;
      }

      // If already authenticated and user exists, skip
      // But only if token matches and we're not in the middle of initialization
      if (isAuthenticated && user && token === storedToken && token) {
        // Mark initialization as complete since we're already authenticated
        dispatch(authInitialized());
        return;
      }

      // If token exists but user is not in state, verify token and restore session
      if (storedToken) {
        try {
          let profileResponse;

          if (isEmployeeApp) {
            console.log('🔄 Restoring STAFF session (Employee Context)...');
            profileResponse = await userService.getStaffProfile();
          } else {
            console.log('🔄 Restoring USER session (User Context)...');
            profileResponse = await userService.getProfile();
          }

          if (profileResponse.success && profileResponse.data?.user) {
            const userData = profileResponse.data.user;

            // Get the latest tokens (they might have been refreshed during the getProfile call)
            const latestToken = isEmployeeApp ? localStorage.getItem('staffToken') : localStorage.getItem('authToken');
            const latestRefreshToken = isEmployeeApp ? localStorage.getItem('staffRefreshToken') : localStorage.getItem('refreshToken');

            // Restore authentication state
            dispatch(loginSuccess({
              token: latestToken || storedToken,
              refreshToken: latestRefreshToken || storedRefreshToken,
              userRole: isEmployeeApp ? 'employee' : (userData.role || 'user'),
            }));

            // Restore user data
            dispatch(setUser(userData));
            dispatch(authInitialized());

            console.log('✅ Authentication restored');
          } else {
            // Profile fetch failed - token might be invalid for this context
            console.warn('⚠️ Failed to restore session - profile check returned success: false');
            // If we have a token but profile check fails, it might be the wrong role
            // Only logout if we are very sure it's invalid
            dispatch(authInitialized());
          }
        } catch (error) {
          // If profile fetch fails, token might be expired
          // Try to refresh token
          if (storedRefreshToken) {
            try {
              const refreshResponse = await authService.refreshToken(storedRefreshToken);

              if (refreshResponse?.token || refreshResponse?.data?.token) {
                const newToken = refreshResponse.token || refreshResponse.data.token;
                const newRefreshToken = refreshResponse.refreshToken || refreshResponse.data.refreshToken || storedRefreshToken;

                // Store new tokens in correct slots
                if (isEmployeeApp) {
                  localStorage.setItem('staffToken', newToken);
                } else {
                  localStorage.setItem('authToken', newToken);
                }

                // Store new refresh token in correct slot
                if (newRefreshToken) {
                  if (isEmployeeApp) {
                    localStorage.setItem('staffRefreshToken', newRefreshToken);
                  } else {
                    localStorage.setItem('refreshToken', newRefreshToken);
                  }
                }

                // Retry profile fetch based on URL context
                let profileResponse;

                if (isEmployeeApp) {
                  profileResponse = await userService.getStaffProfile();
                } else {
                  profileResponse = await userService.getProfile();
                }

                if (profileResponse.success && profileResponse.data?.user) {
                  const userData = profileResponse.data.user;

                  // Restore authentication state
                  dispatch(loginSuccess({
                    token: newToken,
                    refreshToken: newRefreshToken,
                    userRole: isEmployeeApp ? 'employee' : (userData.role || 'user'),
                  }));

                  // Restore user data
                  dispatch(setUser(userData));

                  // Mark initialization as complete
                  dispatch(authInitialized());

                  console.log('✅ Authentication restored after refresh');
                } else {
                  // Still failed (e.g., Staff trying to access User App) -> Logout
                  // Only logout if it's a definitive auth failure, not a generic success:false
                  if (profileResponse.message?.toLowerCase().includes('not found') ||
                    profileResponse.message?.toLowerCase().includes('unauthorized')) {
                    dispatch(logout());
                  }
                  dispatch(authInitialized());
                }
              } else {
                // Refresh returned no token
                console.warn('⚠️ Refresh token call returned no token');
                dispatch(authInitialized());
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              // Only logout if refresh token is definitively invalid (401)
              if (refreshError.response?.status === 401) {
                dispatch(logout());
              }
              dispatch(authInitialized());
            }
          } else {
            // No refresh token available
            console.warn('⚠️ No refresh token found, but token exists. Setting authInitialized.');
            dispatch(authInitialized());
          }
        }
      }
    };

    // Only run on mount, not on every render
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // FCM Notification Setup for users
  useEffect(() => {
    const currentPath = window.location.pathname;
    const isEmployeeApp = currentPath.startsWith('/employee');

    // Only handle user FCM here if we are in user context
    // Staff FCM is handled in EmployeeHomePage
    if (isAuthenticated && user && (user._id || user.id) && !isEmployeeApp) {
      console.log('🔔 Setting up FCM for user:', user.name);

      // Request and Save Token
      requestForToken().then(async (token) => {
        if (token) {
          const platform = isMobileApp() ? 'mobile' : 'web';
          try {
            await api.post('/auth/user-fcm-token', {
              fcmToken: token,
              platform: platform
            });
            console.log(`✅ User FCM Token saved via AuthInitializer (${platform})`);
          } catch (error) {
            console.error("❌ Error saving user FCM token:", error);
          }
        }
      });

      // Listen for foreground messages
      onMessageListener()
        .then((payload) => {
          if (payload && payload.notification) {
            toastUtils.info(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
            console.log("Foreground Notification Received:", payload);
          }
        })
        .catch((err) => console.error("FCM Listener error: ", err));
    }
  }, [isAuthenticated, user]);

  // Show global loading state while initializing auth
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthInitializer;
