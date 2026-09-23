import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';

/**
 * ModuleChangePasswordPage Component
 * Change password page - allows users to update their account password
 * Based on document.txt - Security settings
 * Uses module theme colors and design patterns
 */
const ModuleChangePasswordPage = () => {
  const navigate = useNavigate();
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let initialWidth = window.innerWidth;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const currentWidth = window.innerWidth;

      // If width changed significantly (like orientation change), update initial tracking values
      if (Math.abs(currentWidth - initialWidth) > 20) {
        initialHeight = currentHeight;
        initialWidth = currentWidth;
        setIsKeyboardVisible(false);
        return;
      }

      // If visualViewport is available, check its height ratio (primarily iOS)
      if (window.visualViewport) {
        const isIOSKeyboard = window.visualViewport.height < window.innerHeight * 0.85;
        if (isIOSKeyboard) {
          setIsKeyboardVisible(true);
          return;
        }
      }

      // Android/Browser height shrink detection
      if (initialHeight - currentHeight > 150) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isChanging, setIsChanging] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Validation functions
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Submit password change
  const handleSubmit = async () => {
    if (!validateForm()) {
      toastUtils.error('Please fix the errors before saving');
      return;
    }

    setIsChanging(true);
    try {
      const response = await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      if (response.success !== false) {
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        toastUtils.success('Password changed successfully!');
        navigate('/profile/settings');
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      toastUtils.error(errorMessage);
      
      // Set specific error for current password if it's incorrect
      if (error.response?.status === 401 || errorMessage.toLowerCase().includes('incorrect')) {
        setErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <ProfileHeader title="Change Password" />

      {/* Web Container - Centered with max-width */}
      <div className="max-w-3xl mx-auto">
      {/* Form Content */}
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8 lg:py-10 pb-32 md:pb-8 overflow-y-auto">
        {/* Info Card */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{
            backgroundColor: colors.backgroundPrimary,
            border: `1px solid ${colors.borderMedium}`,
          }}
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: colors.info }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Your password should be at least 6 characters long. Make sure to use a strong password that you haven't used before.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.currentPassword ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: colors.textSecondary }}
              >
                {showPasswords.current ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter your new password"
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.newPassword ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: colors.textSecondary }}
              >
                {showPasswords.new ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.confirmPassword ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: colors.textSecondary }}
              >
                {showPasswords.confirm ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isKeyboardVisible && (
        <div className="fixed md:relative md:max-w-3xl md:mx-auto bottom-16 left-0 right-0 px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 bg-white md:bg-transparent border-t md:border-t-0 z-40" style={{ borderColor: colors.borderMedium }}>
          <div className="flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile/settings')}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-base border-2 transition-all"
              style={{
                borderColor: colors.backgroundTertiary,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textPrimary,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isChanging}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isChanging ? colors.textTertiary : colors.backgroundTertiary,
                color: colors.backgroundSecondary,
              }}
            >
              {isChanging ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      )}

      </div>
      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ModuleChangePasswordPage;

