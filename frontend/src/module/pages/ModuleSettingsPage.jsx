import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';
import { clearUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';

/**
 * ModuleSettingsPage Component
 * Premium Settings page matching module theme
 * Based on document.txt - Profile fields, notification preferences, privacy settings
 */
const ModuleSettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);

  // Settings state — default to true; loaded from profile on mount
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  // Load saved preferences from the user profile on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await userService.getProfile();
        const prefs = res?.data?.user?.notificationPreferences;
        if (prefs) {
          setPushNotifications(prefs.push !== false);
          setEmailNotifications(prefs.email !== false);
        }
      } catch (e) {
        // Fail silently — defaults remain true
      }
    };
    loadPreferences();
  }, []);

  // Save a single preference key immediately when toggled
  const savePreference = async (key, value) => {
    try {
      await userService.updateNotificationPreferences({ [key]: value });
    } catch (e) {
      toastUtils.error('Failed to save notification preference');
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const response = await userService.deleteAccount();
      if (response.success) {
        toastUtils.success("Account deleted successfully");
        // Reuse logout logic
        await dispatch(logoutUser()).unwrap();
        dispatch(clearUser());
        window.location.href = "/login";
      } else {
        toastUtils.error(response.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toastUtils.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };


  // Handle save settings
  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toastUtils.success('Settings saved successfully!');
    }, 1000);
  };

  // Settings sections based on document.txt
  const settingsSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      ),
      items: [
        {
          id: 'push-notifications',
          label: 'Push Notifications',
          description: 'Receive push notifications on your device',
          toggle: pushNotifications,
          onToggle: (val) => {
            setPushNotifications(val);
            savePreference('push', val);
          },
        },
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          description: 'Receive updates via email',
          toggle: emailNotifications,
          onToggle: (val) => {
            setEmailNotifications(val);
            savePreference('email', val);
          },
        },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      ),
      items: [
        {
          id: 'privacy-policy',
          label: 'Privacy Policy',
          description: 'View our privacy policy',
          action: () => navigate('/privacy-policy'),
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          ),
        },
        {
          id: 'terms',
          label: 'Terms & Conditions',
          description: 'View terms and conditions',
          action: () => navigate('/terms'),
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          ),
        },
        {
          id: 'cancellation-policy',
          label: 'Cancellation & Refund Policy',
          description: 'View cancellation and refund policy',
          action: () => navigate('/cancellation-policy'),
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 15v-6a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3m9 14V17a4 4 0 00-4-4H4m0 0l3-3m-3 3l3 3"
            />
          ),
        },
      ],
    },
  ];

  const iconBgColor = colors.backgroundPrimary || colors.backgroundPrimary;

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <ProfileHeader title="Settings" showBack />

      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
        {/* Settings Content */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-8 lg:pb-10" style={{ backgroundColor: colors.backgroundSecondary }}>
          {/* Settings Sections */}
          <div className="space-y-2 md:space-y-3 lg:space-y-4">
            {settingsSections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Section Header - Premium Style */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: iconBgColor }}
                    >
                      <svg
                        className="w-5 h-5 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {section.icon}
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-black">{section.title}</h2>
                  </div>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`px-4 transition-colors hover:bg-gray-50 active:bg-gray-100 ${index === 0 ? 'pt-4' : ''
                        } ${index === section.items.length - 1 ? 'pb-4' : 'py-4'}`}
                    >
                      {item.toggle !== undefined ? (
                        // Toggle Item - Premium Black & White Style
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {item.icon && (
                              <div
                                className="p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: iconBgColor }}
                              >
                                <svg
                                  className="w-4 h-4 text-gray-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {item.icon}
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium mb-0.5 text-black">{item.label}</p>
                              <p className="text-xs text-gray-600">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={item.toggle}
                              onChange={(e) => item.onToggle(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div
                              className="w-11 h-6 rounded-full transition-all duration-300 relative"
                              style={{
                                backgroundColor: item.toggle ? colors.brandBlack : colors.borderCheckbox,
                              }}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${item.toggle ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              ></div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        // Action Item - Premium Black & White Style
                        <button
                          onClick={item.action}
                          className="w-full flex items-center justify-between group active:scale-[0.99] transition-all"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                            {item.icon && (
                              <div
                                className="p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: iconBgColor }}
                              >
                                <svg
                                  className="w-5 h-5 text-gray-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {item.icon}
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium mb-0.5 text-black">
                                {item.label}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.description}
                              </p>
                              {item.value && (
                                <p className="text-xs font-medium mt-1.5 inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                                  {item.value}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
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
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons - Premium Black & White Style */}
          <div className="flex flex-col gap-3 md:gap-4 mt-6 md:mt-8 lg:mt-10">
            {/* Delete Account Button - White with Red Border Premium Style */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2.5 bg-white border-2 border-red-500 text-red-500"
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
                  strokeWidth={2.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete Account</span>
            </button>
          </div>
        </div>

      </div>
      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <motion.div
            className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete your account? This action is irreversible and you will lose all your data.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="py-3 px-4 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="py-3 px-4 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModuleSettingsPage;

