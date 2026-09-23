import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateUser, setProfileComplete } from '../../store/slices/userSlice';
import { Input, Button, LoadingSpinner } from '../../components/common';
import { userService } from '../../services';
import toastUtils from '../../config/toast';
import { theme } from '../../theme/theme.constants';
import kycService from '../../services/kyc.service';

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};


/**
 * Profile Completion Schema
 */
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Phone number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  age: z
    .string()
    .min(1, 'Age is required')
    .refine((val) => {
      const age = parseInt(val);
      return age >= 18 && age <= 100;
    }, 'Age must be between 18 and 100'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select your gender',
  }),
  address: z.string().min(10, 'Address must be at least 10 characters'),
});

/**
 * ProfileCompletePage Component
 * Multi-step form to complete user profile (100% required for booking)
 * Mobile-first design with blue theme
 */
const ProfileCompletePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const fileInputRef = useRef(null);
  const rcInputRef = useRef(null);
  const [rcDocument, setRcDocument] = useState(null);
  const [rcPreview, setRcPreview] = useState(user?.rcDocument || null);
  const [isUploadingRc, setIsUploadingRc] = useState(false);

  // KYC States
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dlDob, setDlDob] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRequestId, setAadhaarRequestId] = useState('');
  const [isAadhaarOtpSent, setIsAadhaarOtpSent] = useState(false);
  const [isKycSubmitting, setIsKycSubmitting] = useState(false);


  useEffect(() => {
    if (user?.rcDocument) {
      setRcPreview(user.rcDocument);
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age ? String(user.age) : '',
      gender: user?.gender || '',
      address: user?.address || '',
    },
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch user profile from API when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await userService.getProfile();

        // Extract user data from response
        const userData = response.data?.user || response.data?.data?.user || response.user;

        if (userData) {
          // Update Redux store with fetched data
          dispatch(updateUser(userData));

          // Reset form with fetched data
          reset({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            age: userData.age ? String(userData.age) : '',
            gender: userData.gender || '',
            address: userData.address || '',
          });

          // Set profile photo preview if exists
          if (userData.profilePhoto) {
            setPhotoPreview(userData.profilePhoto);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Don't show error toast - just use Redux store data as fallback
        // The form will use defaultValues from Redux store
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [dispatch, reset]);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Handle photo upload
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

  // Upload profile photo (Mock mode - no backend)
  const handlePhotoUpload = async () => {
    if (!profilePhoto) {
      // Allow skipping if photo already exists
      if (photoPreview) {
        setCurrentStep(3);
        return;
      }
      toastUtils.error('Please select a photo');
      return;
    }

    setIsUploading(true);
    try {
      // Mock mode - just use the preview URL
      const formData = new FormData();
      formData.append('photo', profilePhoto);

      const response = await userService.uploadPhoto(formData);

      // Handle response from backend
      const uploadedPhotoUrl = response.data?.profilePhoto || response.data?.data?.profilePhoto || photoPreview;
      const userData = response.data?.user || response.data?.data?.user;

      // Update Redux store with complete user data
      if (userData) {
        dispatch(updateUser(userData));
      } else {
        dispatch(updateUser({ profilePhoto: uploadedPhotoUrl }));
      }

      toastUtils.success('Profile photo uploaded successfully!');
      setCurrentStep(3);
    } catch (error) {
      console.error('Photo upload error:', error);

      // Handle authentication errors
      if (error.status === 401 || error.code === 'AUTH_ERROR') {
        toastUtils.error('Your session has expired. Please log in again.');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // In mock mode, even if there's an error, use the preview
      if (photoPreview) {
        dispatch(updateUser({ profilePhoto: photoPreview }));
        localStorage.setItem('userProfilePhoto', photoPreview);
        toastUtils.success('Profile photo saved!');
        setCurrentStep(3);
      } else {
        const errorMessage = error.message || 'Failed to upload photo. You can skip and continue.';
        toastUtils.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle RC document upload
  const handleRcChange = (e) => {
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
      setRcDocument(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRcPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRcUpload = async () => {
    if (!rcDocument) return;
    setIsUploadingRc(true);
    try {
      const formData = new FormData();
      formData.append('rcDocument', rcDocument);

      const response = await userService.uploadRcDocument(formData);

      const uploadedRcUrl = response.data?.rcDocument || response.data?.data?.rcDocument;
      const userData = response.data?.user || response.data?.data?.user;

      if (userData) {
        dispatch(updateUser(userData));
      } else if (uploadedRcUrl) {
        dispatch(updateUser({ rcDocument: uploadedRcUrl }));
      }

      toastUtils.success('RC Document uploaded successfully!');
    } catch (error) {
      console.error('RC Upload Error:', error);
      toastUtils.error('Failed to upload RC document');
    } finally {
      setIsUploadingRc(false);
    }
  };

  // Handle DigiLocker KYC
  const handleDigiLockerKYC = async (documentType) => {
    try {
      // Redirect to DigiLocker OAuth
      // This will be implemented when DigiLocker integration is ready
      toastUtils.info('DigiLocker integration coming soon');
      // For now, simulate success
      dispatch(
        updateUser({
          [`${documentType}Verified`]: true,
        })
      );
    } catch (error) {
      toastUtils.error('Failed to verify document');
    }
  };

  // Submit profile completion
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      console.log('📝 Form submission data:', data);

      // Parse age properly - ensure it's a valid number
      const ageValue = data.age ? parseInt(data.age, 10) : undefined;
      if (isNaN(ageValue)) {
        toastUtils.error('Please enter a valid age');
        setIsSubmitting(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: data.name || '',
        age: ageValue,
        gender: data.gender || '',
        address: data.address || '',
      };

      console.log('📤 Sending to backend:', updateData);

      // Update profile with all form data
      const response = await userService.updateProfile(updateData);

      // Handle backend response
      const userData = response.data?.user || response.data?.data?.user || response.user;
      const profileComplete = userData?.profileComplete || 100;

      // Update Redux store with complete user data
      if (userData) {
        dispatch(updateUser(userData));
      } else {
        // Fallback: update with form data
        dispatch(updateUser({
          name: data.name,
          age: parseInt(data.age),
          gender: data.gender,
          address: data.address,
        }));
      }

      dispatch(setProfileComplete(profileComplete >= 100));

      toastUtils.success('Profile completed successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Profile update error:', error);

      // Handle authentication errors
      if (error.status === 401 || error.code === 'AUTH_ERROR') {
        toastUtils.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      // Handle network errors with user-friendly messages
      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.isNetworkError || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = error.message ||
          'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toastUtils.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if step 1 is complete
  const isStep1Complete = () => {
    const values = watch();
    return (
      values.name &&
      values.email &&
      values.phone &&
      values.age &&
      values.gender &&
      values.address &&
      !errors.name &&
      !errors.email &&
      !errors.phone &&
      !errors.age &&
      !errors.gender &&
      !errors.address
    );
  };

  return (
    <div className="w-full min-h-screen bg-white pb-20 overflow-x-hidden relative z-0">
      {/* Header Section - Blue Background */}
      <header className="w-full text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>

        <div className="relative px-4 py-2 md:px-6 md:py-3">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/profile', { state: { from: '/profile/complete' } })}
              className="mb-1.5 md:mb-2 p-1 -ml-1 md:p-1.5 touch-target"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Title */}
            <h1 className="text-lg md:text-xl font-bold text-white mb-1.5">Complete Your Profile</h1>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-1.5 mb-0.5">
              <div
                className="bg-white rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-white/80">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-3 pt-4 pb-2 md:px-6 md:pt-6 md:pb-4 w-full max-w-4xl mx-auto">
        {/* Loading State */}
        {isLoadingProfile && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" message="Loading your profile..." />
          </div>
        )}

        {/* Step 1: Basic Information */}
        {!isLoadingProfile && currentStep === 1 && (
          <form onSubmit={handleSubmit(async (data) => {
            console.log('✅ Step 1 form data validated:', data);

            // Save Step 1 data to database immediately
            setIsSavingStep1(true);
            try {
              const ageValue = data.age ? parseInt(data.age, 10) : undefined;
              if (isNaN(ageValue) && data.age) {
                toastUtils.error('Please enter a valid age');
                setIsSavingStep1(false);
                return;
              }

              const updateData = {
                name: data.name || '',
                age: ageValue,
                gender: data.gender || '',
                address: data.address || '',
              };

              console.log('💾 Saving Step 1 data to database:', updateData);

              const response = await userService.updateProfile(updateData);

              // Update Redux store with saved data
              const userData = response.data?.user || response.data?.data?.user;
              if (userData) {
                dispatch(updateUser(userData));
                console.log('✅ Step 1 data saved successfully');
                toastUtils.success('Profile information saved!');
              }

              // Move to next step
              setCurrentStep(2);
            } catch (error) {
              console.error('❌ Error saving Step 1 data:', error);
              // Still allow user to continue even if save fails
              const errorMessage = error.response?.data?.message || error.message || 'Failed to save data';
              toastUtils.error(errorMessage + '. You can continue and save later.');
              setCurrentStep(2);
            } finally {
              setIsSavingStep1(false);
            }
          })} className="space-y-2">
            <div className="bg-white rounded-lg p-2.5 md:p-4 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Basic Information</h2>

              <div className="md:grid md:grid-cols-2 md:gap-3">
                {/* Name */}
                <div className="mb-2 md:mb-0">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                    {...register('name')}
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="mb-2 md:mb-0">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    {...register('email')}
                    autoComplete="email"
                    disabled={true}
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="mb-2 md:mb-0">
                  <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="Enter 10-digit phone number"
                    error={errors.phone?.message}
                    {...register('phone')}
                    autoComplete="tel"
                    maxLength={10}
                    disabled={true}
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Age */}
                <div className="mb-2 md:mb-0">
                  <Input
                    type="number"
                    label="Age"
                    placeholder="Enter your age"
                    error={errors.age?.message}
                    {...register('age')}
                    min={18}
                    max={100}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="mb-2 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 md:max-w-md">
                  {['male', 'female', 'other'].map((gender) => {
                    const isSelected = watch('gender') === gender;
                    return (
                      <label
                        key={gender}
                        className={`flex items-center justify-center p-1.5 md:p-2 rounded-lg border-2 cursor-pointer transition-colors ${isSelected ? '' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        style={isSelected ? {
                          borderColor: theme.colors.primary,
                          backgroundColor: `${theme.colors.primary}1A`,
                        } : {}}
                      >
                        <input
                          type="radio"
                          value={gender}
                          {...register('gender')}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-900 capitalize">{gender}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.gender && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.gender.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="mb-1.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('address')}
                  placeholder="Enter your complete address"
                  rows={2}
                  className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  style={!errors.address ? {
                    '--focus-border': theme.colors.primary,
                    '--focus-ring': `${theme.colors.primary}33`,
                  } : {}}
                  onFocus={!errors.address ? (e) => {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                  } : undefined}
                  onBlur={!errors.address ? (e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '';
                  } : undefined}
                />
                {errors.address && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <div className="md:flex md:justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                className="md:w-auto md:min-w-[160px]"
                disabled={!isStep1Complete() || isSavingStep1}
                isLoading={isSavingStep1}
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Profile Photo */}
        {!isLoadingProfile && currentStep === 2 && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 md:p-5 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Profile Photo</h2>

              {/* Photo Preview */}
              <div className="flex flex-col items-center mb-3">
                <div className="relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 object-cover shadow-lg"
                      style={{ borderColor: theme.colors.primary }}
                    />
                  ) : (
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-gray-300 bg-gray-100 flex items-center justify-center">
                      <svg
                        className="w-14 h-14 md:w-18 md:h-18 text-gray-400"
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
                <p className="text-xs text-gray-500 mt-1.5 text-center">
                  Upload a clear profile photo
                </p>
              </div>

              {/* Upload Button */}
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="w-full border-2 border-dashed rounded-lg p-2.5 md:p-3 text-center cursor-pointer transition-colors" style={{ backgroundColor: `${theme.colors.primary}1A`, borderColor: theme.colors.primary }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}33`} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`}>
                  <svg
                    className="w-7 h-7 mx-auto mb-1.5"
                    style={{ color: theme.colors.primary }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                    {photoPreview ? 'Change Photo' : 'Select Photo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Max 5MB, JPG/PNG</p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                className="md:w-auto md:min-w-[120px]"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              {profilePhoto ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="md:w-auto md:min-w-[160px]"
                  onClick={handlePhotoUpload}
                  isLoading={isUploading}
                  disabled={isUploading}
                >
                  Upload & Continue
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none md:min-w-[120px]"
                    onClick={() => setCurrentStep(3)}
                  >
                    Skip
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1 md:flex-none md:min-w-[160px]"
                    onClick={() => {
                      // Trigger file input click
                      fileInputRef.current?.click();
                    }}
                  >
                    Select Photo
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: DigiLocker KYC */}
        {!isLoadingProfile && currentStep === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white rounded-lg p-4 md:p-5 border border-gray-200 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">KYC Verification</h2>
              <p className="text-xs text-gray-600 mb-4">
                Verify your identity using DigiLocker. All documents are required for booking.
              </p>

                {/* Aadhaar */}
                <div className="mb-3 md:mb-0 p-4 md:p-5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Aadhaar Card</p>
                        <p className="text-xs text-gray-500">{user?.kycDetails?.aadhaar?.verified ? 'Verified' : 'Verify via OTP'}</p>
                      </div>
                    </div>

                    {!user?.kycDetails?.aadhaar?.verified && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Aadhaar Number"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                          disabled={isAadhaarOtpSent || isKycSubmitting}
                          className="w-full px-3 py-2 text-xs border rounded focus:outline-none"
                        />
                        {isAadhaarOtpSent && (
                          <input
                            type="text"
                            placeholder="6-digit OTP"
                            value={aadhaarOtp}
                            onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={isKycSubmitting}
                            className="w-full px-3 py-2 text-xs border border-blue-400 rounded focus:outline-none"
                          />
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (isAadhaarOtpSent) {
                              setIsKycSubmitting(true);
                              try {
                                const res = await kycService.verifyAadhaarOTP(aadhaarRequestId, aadhaarOtp);
                                if (res.success) {
                                  toastUtils.success('Aadhaar verified!');
                                  setIsAadhaarOtpSent(false);
                                  // Refresh profile to get updated kyc status
                                  const profileRes = await userService.getProfile();
                                  dispatch(updateUser(profileRes.data?.user || profileRes.data?.data?.user));
                                }
                              } catch (err) { toastUtils.error(err.response?.data?.message || 'Verification failed'); }
                              finally { setIsKycSubmitting(false); }
                            } else {
                              if (aadhaarNumber.length !== 12) return toastUtils.error('Enter 12-digit Aadhaar');
                              setIsKycSubmitting(true);
                              try {
                                const res = await kycService.generateAadhaarOTP(aadhaarNumber);
                                if (res.success) {
                                  setAadhaarRequestId(res.data.requestId);
                                  setIsAadhaarOtpSent(true);
                                  toastUtils.success('OTP Sent');
                                }
                              } catch (err) { toastUtils.error(err.response?.data?.message || 'Failed to send OTP'); }
                              finally { setIsKycSubmitting(false); }
                            }
                          }}
                          disabled={isKycSubmitting}
                          className="w-full py-2 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600"
                        >
                          {isKycSubmitting ? '...' : isAadhaarOtpSent ? 'Verify via QuickEKYC' : 'Send OTP via QuickEKYC'}
                        </button>
                      </div>
                    )}
                    {user?.kycDetails?.aadhaar?.verified && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Driving License */}
                <div className="mb-3 md:mb-0 p-4 md:p-5 bg-green-50 border border-green-200 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Driving License</p>
                        <p className="text-xs text-gray-500">{user?.kycDetails?.dl?.verified ? 'Verified' : 'Verify instantly'}</p>
                      </div>
                    </div>

                    {!user?.kycDetails?.dl?.verified && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="DL Number"
                          value={dlNumber}
                          onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                          disabled={isKycSubmitting}
                          className="w-full px-3 py-2 text-xs border rounded focus:outline-none"
                        />
                        <label className="block text-xs text-gray-500 font-medium">Enter date of birth (dd/mm/yyyy)</label>
                        <input
                          type="date"
                          value={dlDob}
                          onChange={(e) => setDlDob(e.target.value)}
                          disabled={isKycSubmitting}
                          className="w-full px-3 py-2 text-xs border rounded focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!dlNumber || !dlDob) return toastUtils.error('Enter DL Number & Date of Birth');
                            setIsKycSubmitting(true);
                            try {
                              const formattedDate = formatDateToDDMMYYYY(dlDob);
                              const res = await kycService.verifyDL(dlNumber, formattedDate);
                              if (res.success) {
                                toastUtils.success('DL verified!');
                                const profileRes = await userService.getProfile();
                                dispatch(updateUser(profileRes.data?.user || profileRes.data?.data?.user));
                              }
                            } catch (err) { toastUtils.error(err.response?.data?.message || 'DL Verification failed'); }
                            finally { setIsKycSubmitting(false); }
                          }}
                          disabled={isKycSubmitting}
                          className="w-full py-2 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600"
                        >
                          {isKycSubmitting ? '...' : 'Verify via QuickEKYC'}
                        </button>
                      </div>
                    )}
                    {user?.kycDetails?.dl?.verified && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* PAN Card */}
                <div className="mb-3 md:mb-0 p-4 md:p-5 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">PAN Card</p>
                        <p className="text-xs text-gray-500">{user?.kycDetails?.pan?.verified ? 'Verified' : 'Verify instantly'}</p>
                      </div>
                    </div>

                    {!user?.kycDetails?.pan?.verified && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="PAN Number"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                          disabled={isKycSubmitting}
                          className="w-full px-3 py-2 text-xs border rounded focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (panNumber.length !== 10) return toastUtils.error('Enter 10-char PAN');
                            setIsKycSubmitting(true);
                            try {
                              const res = await kycService.verifyPAN(panNumber);
                              if (res.success) {
                                toastUtils.success('PAN verified!');
                                const profileRes = await userService.getProfile();
                                dispatch(updateUser(profileRes.data?.user || profileRes.data?.data?.user));
                              }
                            } catch (err) { toastUtils.error(err.response?.data?.message || 'PAN Verification failed'); }
                            finally { setIsKycSubmitting(false); }
                          }}
                          disabled={isKycSubmitting}
                          className="w-full py-2 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600"
                        >
                          {isKycSubmitting ? '...' : 'Verify via QuickEKYC'}
                        </button>
                      </div>
                    )}
                    {user?.kycDetails?.pan?.verified && (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle RC hidden as per user request */}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                className="md:w-auto md:min-w-[130px]"
                onClick={() => setCurrentStep(2)}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                className="md:w-auto md:min-w-[180px]"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Complete Profile
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default ProfileCompletePage;
