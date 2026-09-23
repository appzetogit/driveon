import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { useAdminAuth } from '../../../context/AdminContext';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';

/**
 * Admin Settings Page
 * Admin can manage system settings, features, notifications, and security
 * No localStorage or Redux - All state managed via React hooks
 */
const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { adminUser, refreshProfile } = useAdminAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    adminName: '',
    appName: 'DriveOn',
    contactEmail: 'driveon721@gmail.com',
    contactPhone: '',
    advancePaymentPercentage: 20,
    cashCollectors: [],
  });

  // Password Change Settings
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch system settings from backend
        const settingsResponse = await adminService.getSystemSettings();
        
        if (settingsResponse.success) {
          const settings = settingsResponse.data.settings;
          setGeneralSettings({
            adminName: adminUser?.name || '',
            appName: settings.appName || 'DriveOn',
            contactEmail: settings.contactEmail || 'driveon721@gmail.com',
            contactPhone: adminUser?.phone || settings.contactPhone || '+91 98765 43210',
            advancePaymentPercentage: settings.advancePaymentPercentage !== undefined ? settings.advancePaymentPercentage : 20,
            cashCollectors: settings.cashCollectors || [],
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.response?.data?.message || 'Failed to load settings');
        // Set defaults if fetch fails
        setGeneralSettings({
          adminName: adminUser?.name || '',
          appName: 'DriveOn',
          contactEmail: 'driveon721@gmail.com',
          contactPhone: adminUser?.phone || '+91 98765 43210',
          advancePaymentPercentage: 20,
          cashCollectors: [],
        });
      } finally {
        setLoading(false);
      }
    };

    if (adminUser) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [adminUser]);

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      // Update admin profile (name, phone)
      if (generalSettings.adminName || generalSettings.contactPhone) {
        const profileData = {};
        if (generalSettings.adminName) {
          profileData.name = generalSettings.adminName;
        }
        if (generalSettings.contactPhone) {
          profileData.phone = generalSettings.contactPhone;
        }

        const profileResponse = await adminService.updateProfile(profileData);
        if (!profileResponse.success) {
          throw new Error(profileResponse.message || 'Failed to update profile');
        }
      }

      // Update system settings (app name, contact email, contact phone, advance payment percentage, cash collectors)
      const settingsResponse = await adminService.updateSystemSettings({
        appName: generalSettings.appName,
        contactEmail: generalSettings.contactEmail,
        contactPhone: generalSettings.contactPhone,
        advancePaymentPercentage: Number(generalSettings.advancePaymentPercentage),
        cashCollectors: generalSettings.cashCollectors,
      });

      if (!settingsResponse.success) {
        throw new Error(settingsResponse.message || 'Failed to update settings');
      }

      setSaved(true);
      toastUtils.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 3000);

      // Refresh admin profile to get updated data
      try {
        const updatedAdmin = await refreshProfile();
        if (updatedAdmin) {
          // Update form with new admin data
          setGeneralSettings(prev => ({
            ...prev,
            adminName: updatedAdmin.name || prev.adminName,
            contactPhone: updatedAdmin.phone || prev.contactPhone,
          }));
        }
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save settings';
      setError(errorMessage);
      toastUtils.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordSettings.currentPassword || !passwordSettings.newPassword || !passwordSettings.confirmPassword) {
      toastUtils.error('Please fill all password fields');
      return;
    }

    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      toastUtils.error('New password and confirm password do not match');
      return;
    }

    if (passwordSettings.newPassword.length < 6) {
      toastUtils.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      setError(null);
      setSaved(false);

      const response = await adminService.changePassword({
        currentPassword: passwordSettings.currentPassword,
        newPassword: passwordSettings.newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }

      // Reset password fields
      setPasswordSettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSaved(true);
      toastUtils.success('Password changed successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      setError(errorMessage);
      toastUtils.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };


  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p style={{ color: colors.textSecondary }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <div className="max-w-5xl mx-auto px-4 pt-20 md:pt-6 pb-6 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <button
              onClick={() => navigate('/admin/profile')}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: colors.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.backgroundLight}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Go back to profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textSecondary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: colors.backgroundTertiary }}>
              System Settings
            </h1>
          </div>
          <p className="text-sm md:text-base ml-12 md:ml-14" style={{ color: colors.textSecondary }}>Manage system configuration and preferences</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-800">Settings saved successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Password Change Section */}
        <div className="space-y-6">
          {/* General System & Profile Settings Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>General System & Profile Settings</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Admin Profile Name</label>
                  <input
                    type="text"
                    value={generalSettings.adminName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, adminName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    placeholder="Enter admin name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Contact Phone / Admin Phone</label>
                  <input
                    type="text"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    placeholder="Enter contact phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Application Name</label>
                  <input
                    type="text"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    placeholder="Enter application name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Contact Email Address</label>
                  <input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              {/* Booking Preferences */}
              <div className="pt-4 border-t" style={{ borderColor: colors.borderMedium }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Booking Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Advance Payment Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={generalSettings.advancePaymentPercentage}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, advancePaymentPercentage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 pr-10"
                        style={{
                          border: `1px solid ${colors.borderMedium}`,
                          backgroundColor: colors.backgroundSecondary,
                          color: colors.textPrimary
                        }}
                        placeholder="20"
                      />
                      <span 
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-sm" 
                        style={{ color: colors.textSecondary }}
                      >
                        %
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                      Specify the percentage of total rental amount required upfront to confirm a booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Collection Settings */}
              <div className="pt-4 border-t" style={{ borderColor: colors.borderMedium }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>Cash Collectors</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 max-w-md">
                    <input
                      type="text"
                      id="newCollectorInput"
                      placeholder="Enter collector's name"
                      className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        border: `1px solid ${colors.borderMedium}`,
                        backgroundColor: colors.backgroundSecondary,
                        color: colors.textPrimary
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            if (generalSettings.cashCollectors.includes(val)) {
                              toastUtils.error('Name already exists');
                              return;
                            }
                            setGeneralSettings({
                              ...generalSettings,
                              cashCollectors: [...generalSettings.cashCollectors, val]
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newCollectorInput');
                        const val = input?.value?.trim();
                        if (val) {
                          if (generalSettings.cashCollectors.includes(val)) {
                            toastUtils.error('Name already exists');
                            return;
                          }
                          setGeneralSettings({
                            ...generalSettings,
                            cashCollectors: [...generalSettings.cashCollectors, val]
                          });
                          input.value = '';
                        }
                      }}
                      className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: colors.backgroundTertiary }}
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Press Enter or click Add to append a name. These names will be available in the dropdown when completing booking cash collections.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(!generalSettings.cashCollectors || generalSettings.cashCollectors.length === 0) ? (
                      <span className="text-sm italic" style={{ color: colors.textSecondary }}>No collectors defined yet.</span>
                    ) : (
                      generalSettings.cashCollectors.map((collector, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 border text-gray-800"
                          style={{ borderColor: colors.borderMedium }}
                        >
                          {collector}
                          <button
                            type="button"
                            onClick={() => {
                              setGeneralSettings({
                                ...generalSettings,
                                cashCollectors: generalSettings.cashCollectors.filter(c => c !== collector)
                              });
                            }}
                            className="hover:text-red-500 font-bold transition-colors focus:outline-none ml-1 text-sm leading-none"
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.currentTarget.style.opacity = '1';
                  }}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save General Settings'
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Password Change Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>Change Password</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Current Password</label>
                <input
                  type="password"
                  value={passwordSettings.currentPassword}
                  onChange={(e) => setPasswordSettings({ ...passwordSettings, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${colors.borderMedium}`,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>New Password</label>
                <input
                  type="password"
                  value={passwordSettings.newPassword}
                  onChange={(e) => setPasswordSettings({ ...passwordSettings, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${colors.borderMedium}`,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordSettings.confirmPassword}
                  onChange={(e) => setPasswordSettings({ ...passwordSettings, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${colors.borderMedium}`,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                  onMouseEnter={(e) => {
                    if (!changingPassword) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    if (!changingPassword) e.currentTarget.style.opacity = '1';
                  }}
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

