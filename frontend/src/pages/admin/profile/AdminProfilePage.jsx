import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import { useAdminAuth } from '../../../context/AdminContext';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import Card from '../../../components/common/Card';

/**
 * Admin Profile Page
 * Shows admin account information and allows editing profile
 * Based on ADMIN_PANEL_PLAN.md and document.txt
 */
const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { adminUser, refreshProfile } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
  });

  // Fetch admin profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await adminService.getProfile();
        
        if (response.success && response.data?.admin) {
          const admin = response.data.admin;
          setProfileData({
            name: admin.name || '',
            email: admin.email || '',
            phone: admin.phone || '',
            department: admin.department || '',
            role: admin.role || '',
          });
        } else {
          // Fallback to context data
          if (adminUser) {
            setProfileData({
              name: adminUser.name || '',
              email: adminUser.email || '',
              phone: adminUser.phone || '',
              department: adminUser.department || '',
              role: adminUser.role || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        // Fallback to context data
        if (adminUser) {
          setProfileData({
            name: adminUser.name || '',
            email: adminUser.email || '',
            phone: adminUser.phone || '',
            department: adminUser.department || '',
            role: adminUser.role || '',
          });
        }
        toastUtils.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [adminUser]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        name: profileData.name,
        phone: profileData.phone,
      };

      const response = await adminService.updateProfile(updateData);
      
      if (response.success) {
        toastUtils.success('Profile updated successfully!');
        setIsEditing(false);
        // Refresh admin profile in context
        await refreshProfile();
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toastUtils.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (adminUser) {
      setProfileData({
        name: adminUser.name || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        department: adminUser.department || '',
        role: adminUser.role || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.backgroundTertiary }}></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayUser = adminUser || {
    name: 'Admin User',
    email: 'admin@driveon.com',
    avatar: null,
    role: 'Admin',
    department: '',
    phone: '',
    lastLogin: null,
    createdAt: null,
  };

  return (
    <div className="pt-20 md:pt-6 lg:pt-8 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Go back to dashboard"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Admin Profile
            </h1>
          </div>
          <p className="text-gray-600 ml-12 md:ml-14">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <div className="p-4 md:p-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6 pb-6 border-b" style={{ borderColor: colors.borderLight }}>
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  {displayUser.avatar ? (
                    <img
                      src={displayUser.avatar}
                      alt={displayUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{displayUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border-2"
                    style={{ borderColor: colors.backgroundTertiary }}
                    title="Edit Profile"
                  >
                    <svg className="w-4 h-4" style={{ color: colors.backgroundTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {profileData.name || displayUser.name}
                </h2>
                <p className="text-gray-600 mb-2">{profileData.email || displayUser.email}</p>
                {profileData.role && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {profileData.role}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Details Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.borderMedium,
                      focusRingColor: colors.backgroundTertiary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.backgroundTertiary}
                    onBlur={(e) => e.target.style.borderColor = colors.borderMedium}
                  />
                ) : (
                  <p className="text-gray-900">{profileData.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Email Address
                </label>
                <p className="text-gray-900">{profileData.email || 'Not set'}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: colors.borderMedium,
                      focusRingColor: colors.backgroundTertiary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.backgroundTertiary}
                    onBlur={(e) => e.target.style.borderColor = colors.borderMedium}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.phone || 'Not set'}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Department
                </label>
                <p className="text-gray-900">{profileData.department || 'Not assigned'}</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                  Role
                </label>
                <p className="text-gray-900">{profileData.role || 'Admin'}</p>
              </div>

              {/* Last Login */}
              {displayUser.lastLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Last Login
                  </label>
                  <p className="text-gray-900">
                    {new Date(displayUser.lastLogin).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              )}

              {/* Account Created */}
              {displayUser.createdAt && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Account Created
                  </label>
                  <p className="text-gray-900">
                    {new Date(displayUser.createdAt).toLocaleDateString('en-IN', {
                      dateStyle: 'long',
                    })}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.borderLight }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2 rounded-lg font-medium border-2 transition-colors disabled:opacity-50"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        {(displayUser.role === 'admin' || displayUser.role === 'super_admin') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="p-4">
                <h3 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
                  Account Settings
                </h3>
                <button
                  onClick={() => navigate('/admin/sub-admins')}
                  className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    Sub-Admin Management
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfilePage;

