import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';

/**
 * ModuleEditProfilePage Component
 * Edit user profile page - allows updating personal information
 * Based on document.txt - Name, Email, Phone, Age, Gender, Address, Profile Photo
 * Uses module theme colors and design patterns
 */
const ModuleEditProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isInitializing } = useAppSelector((state) => ({
    user: state.user.user,
    isInitializing: state.auth.isInitializing,
  }));

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

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age ? String(user.age) : '',
    gender: user?.gender || '',
    address: user?.address || '',
  });

  const [errors, setErrors] = useState({});

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age ? String(user.age) : '',
        gender: user.gender || '',
        address: user.address || '',
      });
      setPhotoPreview(user.profilePhoto || null);
    }
  }, [user]);

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18 || age > 100) {
        newErrors.age = 'Age must be between 18 and 100';
      }
    }

    if (formData.address && formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
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

  // Handle photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastUtils.error('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toastUtils.error('Please select an image file');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload profile photo
  const handlePhotoUpload = async () => {
    if (!profilePhoto) {
      return null;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', profilePhoto);

      const response = await userService.uploadPhoto(formData);

      // Extract photo URL safely
      const photoUrl = response.data?.profilePhoto || response.profilePhoto || response.data?.user?.profilePhoto || response.photo || response.url;

      if (photoUrl) {
        setPhotoPreview(photoUrl);
        setProfilePhoto(null);
        toastUtils.success('Profile photo uploaded successfully');
        return photoUrl;
      } else {
        throw new Error('No photo URL received from server');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toastUtils.error('Failed to upload profile photo');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Submit profile update
  const handleSubmit = async () => {
    if (!validateForm()) {
      toastUtils.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      // Upload photo first if there's a new one
      let uploadedUrl = null;
      if (profilePhoto) {
        uploadedUrl = await handlePhotoUpload();
      }

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        ...(formData.age && { age: parseInt(formData.age) }),
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.address && { address: formData.address.trim() }),
      };

      // Update profile
      const response = await userService.updateProfile(updateData);

      if (response.success !== false) {
        // Update Redux store
        const updatedUser = response?.data?.user || response?.data?.data?.user || response?.user;
        if (updatedUser) {
          if (uploadedUrl) {
            updatedUser.profilePhoto = uploadedUrl;
          }
          dispatch(updateUser(updatedUser));
        } else {
          dispatch(updateUser({
            ...user,
            ...updateData,
            profilePhoto: uploadedUrl || photoPreview || user?.profilePhoto,
          }));
        }

        toastUtils.success('Profile updated successfully!');
        navigate('/profile', { replace: true });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toastUtils.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while initializing
  if (isInitializing || !user) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.backgroundPrimary || "#F1F2F4" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
          style={{ borderColor: colors.backgroundTertiary || "#1C205C" }}
        ></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <ProfileHeader title="Edit Profile" showBack />

      {/* Web Container - Centered with max-width */}
      <div className="max-w-3xl mx-auto">
        {/* Form Content */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8 lg:py-10 pb-32 md:pb-8 overflow-y-auto">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 shadow-lg"
                  style={{ borderColor: colors.backgroundPrimary }}
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-lg"
                  style={{
                    backgroundColor: colors.backgroundPrimary,
                    borderColor: colors.backgroundPrimary,
                  }}
                >
                  <svg
                    className="w-16 h-16"
                    style={{ color: colors.textSecondary }}
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{
                  backgroundColor: colors.backgroundPrimary,
                  color: colors.textPrimary,
                }}
              >
                {isUploading ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Upload Photo'}
              </button>

              {showPhotoOptions && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 w-48">
                  <button
                    type="button"
                    onClick={() => {
                      cameraInputRef.current?.click();
                      setShowPhotoOptions(false);
                    }}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowPhotoOptions(false);
                    }}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose from Gallery
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.name ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                  focusRingColor: colors.backgroundTertiary,
                }}
              />
              {errors.name && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.email ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                readOnly
                disabled
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-base cursor-not-allowed opacity-60"
                style={{
                  borderColor: colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary, // Keep background slightly different if needed, or consistent
                  color: colors.textSecondary, // Use secondary text color to indicate disabled state
                }}
              />
              {errors.phone && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter your age"
                min="18"
                max="100"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 text-base transition-all"
                style={{
                  borderColor: errors.age ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              {errors.age && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.age}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['male', 'female', 'other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => handleInputChange('gender', gender)}
                    className="px-4 py-3 rounded-xl border-2 font-semibold text-sm capitalize transition-all"
                    style={{
                      borderColor: formData.gender === gender ? colors.backgroundTertiary : colors.borderMedium,
                      backgroundColor: formData.gender === gender ? colors.backgroundTertiary : colors.backgroundSecondary,
                      color: formData.gender === gender ? colors.backgroundSecondary : colors.textPrimary,
                    }}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your complete address"
                rows="4"
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 resize-none text-base transition-all"
                style={{
                  borderColor: errors.address ? colors.error : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                }}
              />
              {errors.address && (
                <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.address}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 mb-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                disabled={isSaving || isUploading}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSaving || isUploading ? colors.textTertiary : colors.backgroundTertiary,
                  color: colors.backgroundSecondary,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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

export default ModuleEditProfilePage;

