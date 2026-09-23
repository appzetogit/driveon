import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateUser, setUser } from '../../store/slices/userSlice';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import { kycService } from '../../services/kyc.service';

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
 * ModuleCompleteProfilePage Component
 * Multi-step form to complete user profile (100% required for booking)
 * Based on document.txt requirements:
 * - Name, Email, Phone, Age, Gender, Address, Profile Photo
 * - Aadhaar, PAN, Driving License (via DigiLocker)
 * Uses module theme colors and design patterns
 */
const ModuleCompleteProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isInitializing } = useAppSelector((state) => ({
    user: state.user.user,
    isInitializing: state.auth.isInitializing,
  }));
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const rcInputRef = useRef(null);
  const [rcDocument, setRcDocument] = useState(null);
  const [rcPreview, setRcPreview] = useState(user?.rcDocument || null);
  const [isUploadingRc, setIsUploadingRc] = useState(false);

  // QuickEKYC States
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRequestId, setAadhaarRequestId] = useState('');
  const [aadhaarStep, setAadhaarStep] = useState(1); // 1: Number, 2: OTP
  const [isSendingAadhaarOtp, setIsSendingAadhaarOtp] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);

  const [panNumberInput, setPanNumberInput] = useState(user?.kycDetails?.pan?.idNumber || '');
  const [isVerifyingPan, setIsVerifyingPan] = useState(false);

  const [dlNumber, setDlNumber] = useState(user?.kycDetails?.dl?.idNumber || '');
  const [dlDob, setDlDob] = useState(user?.kycDetails?.dl?.dob || '');
  const [isVerifyingDl, setIsVerifyingDl] = useState(false);

  useEffect(() => {
    if (user?.rcDocument) {
      setRcPreview(user.rcDocument);
    }
  }, [user]);

  // Auto-scroll focused input into view above virtual keyboard on mobile
  useEffect(() => {
    const scrollFieldIntoView = (el) => {
      if (!el) return;
      // Small delay to let the keyboard open and layout shift settle
      setTimeout(() => {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    };

    const handleFocusin = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        scrollFieldIntoView(e.target);
      }
    };

    // Also handle visualViewport resize (fires when keyboard opens/closes on mobile)
    const handleViewportResize = () => {
      const focused = document.activeElement;
      if (!focused) return;
      const tag = focused.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        scrollFieldIntoView(focused);
      }
    };

    document.addEventListener('focusin', handleFocusin);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusin);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  // Form state - Initialize with user data if available
  const [formData, setFormData] = useState(() => {
    // Initialize with user data if available at mount time
    const initialData = {
      name: user?.name || user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age ? String(user.age) : '',
      gender: user?.gender || '',
      address: user?.address || '',
      panNumber: user?.panNumber || '',
    };
    console.log('📝 Initial formData state:', initialData);
    console.log('📝 User at initialization:', user);
    return initialData;
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [errors, setErrors] = useState({});

  // Fetch user profile data when component mounts - ALWAYS fetch fresh data
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping profile fetch');
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      try {
        console.log('📱 ===== Fetching User Profile for Complete Profile Page =====');
        console.log('📱 Current user in Redux before fetch:', user);
        console.log('📱 isAuthenticated:', isAuthenticated);

        const response = await userService.getProfile();

        console.log('📱 ===== API Response Analysis =====');
        console.log('📱 Raw response from userService.getProfile():', response);
        console.log('📱 Response type:', typeof response);
        console.log('📱 Is response an object?', typeof response === 'object' && response !== null);
        console.log('📱 Response keys:', response ? Object.keys(response) : 'null');
        console.log('📱 response.success:', response?.success);
        console.log('📱 response.data:', response?.data);
        console.log('📱 response.data?.user:', response?.data?.user);
        console.log('📱 response.user:', response?.user);

        // Backend returns: { success: true, data: { user: {...} } }
        // Axios wraps: response.data = { success: true, data: { user: {...} } }
        // userService.getProfile() returns: response.data = { success: true, data: { user: {...} } }
        // So we access: response.data.user ✅
        let userData = null;

        if (response?.data?.user) {
          // Standard format: { success: true, data: { user: {...} } }
          userData = response.data.user;
          console.log('✅ Found user data in response.data.user');
        } else if (response?.user) {
          // Alternative format: { user: {...} }
          userData = response.user;
          console.log('✅ Found user data in response.user');
        } else if (response?.data && typeof response.data === 'object' && !response.data.user) {
          // Direct user object: { name, email, phone, ... }
          userData = response.data;
          console.log('✅ Found user data directly in response.data');
        } else {
          console.warn('⚠️ Could not find user data in response');
          console.warn('⚠️ Full response:', JSON.stringify(response, null, 2));
        }

        if (userData) {
          console.log('📱 ===== Extracted User Data =====');
          console.log('📱 userData:', userData);
          console.log('📱 userData type:', typeof userData);
          console.log('📱 userData keys:', Object.keys(userData));
          console.log('📱 User name:', userData.name);
          console.log('📱 User email:', userData.email);
          console.log('📱 User phone:', userData.phone);
          console.log('📱 User age:', userData.age);
          console.log('📱 User gender:', userData.gender);
          console.log('📱 User address:', userData.address);

          // Ensure all fields are properly set
          const normalizedUserData = {
            ...userData,
            name: userData.name || userData.fullName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            age: userData.age || undefined,
            gender: userData.gender || '',
            address: userData.address || '',
          };

          console.log('📱 ===== Normalized User Data =====');
          console.log('📱 Normalized data:', normalizedUserData);

          // Update Redux store - always use setUser to ensure complete replacement
          console.log('📱 Dispatching setUser with normalized data');
          dispatch(setUser(normalizedUserData));

          console.log('✅ User data set in Redux successfully');

          // Immediately update formData after setting Redux state
          console.log('📝 Immediately updating formData after Redux update');
          setFormData({
            name: normalizedUserData.name || '',
            email: normalizedUserData.email || '',
            phone: normalizedUserData.phone || '',
            age: normalizedUserData.age ? String(normalizedUserData.age) : '',
            gender: normalizedUserData.gender || '',
            address: normalizedUserData.address || '',
            panNumber: normalizedUserData.panNumber || '',
          });
          console.log('✅ FormData updated immediately');
        } else {
          console.error('❌ No user data extracted from response');
          console.error('❌ Response structure:', JSON.stringify(response, null, 2));
        }
      } catch (error) {
        console.error('❌ ===== Error Fetching User Profile =====');
        console.error('❌ Error object:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error response status:', error.response?.status);
        console.error('❌ Error response data:', error.response?.data);

        // Show error toast for network/auth errors
        if (error.response?.status === 401) {
          console.error('❌ Authentication failed - redirecting to login');
          toastUtils.error('Session expired. Please login again.');
          // Don't redirect automatically, let user handle it
        } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
          console.error('❌ Network error - backend not reachable');
          toastUtils.error('Unable to connect to server. Please check your connection.');
        } else {
          toastUtils.error('Failed to load profile data. Please try again.');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Always fetch, even if user exists in Redux (to get latest data)
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isAuthenticated]);

  // Update form data when user data changes - use user object directly
  useEffect(() => {
    console.log('📝 ===== FormData Update Effect Triggered =====');
    console.log('📝 Current user in Redux:', user);
    console.log('📝 User is null?', user === null);
    console.log('📝 User is undefined?', user === undefined);

    if (!user) {
      console.log('⚠️ User data is null/undefined, form data not updated');
      return;
    }

    // Only update if user has essential data
    if (!user.name && !user.email && !user.phone) {
      console.log('⚠️ User data incomplete, skipping form update');
      console.log('⚠️ User object:', user);
      console.log('⚠️ User keys:', Object.keys(user));
      return;
    }

    console.log('📝 ===== Updating form data from user =====');
    console.log('📝 User object:', user);
    console.log('📝 User name:', user.name);
    console.log('📝 User email:', user.email);
    console.log('📝 User phone:', user.phone);
    console.log('📝 User age:', user.age);
    console.log('📝 User gender:', user.gender);
    console.log('📝 User address:', user.address);

    const updatedFormData = {
      name: user.name || user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      age: user.age ? String(user.age) : '',
      gender: user.gender || '',
      address: user.address || '',
      panNumber: user.panNumber || '',
    };

    console.log('📝 Updated form data:', updatedFormData);
    console.log('📝 Setting formData state...');

    // Always update formData - don't check for changes, just update
    setFormData(updatedFormData);
    console.log('✅ FormData state updated');

    if (user.profilePhoto) {
      setPhotoPreview(user.profilePhoto);
    }
  }, [user]); // Use user object directly - React will handle deep comparison

  // Debug: Log formData changes - use specific fields to avoid object reference issues
  useEffect(() => {
    console.log('📋 Current formData state:', formData);
    console.log('📋 formData.name:', formData.name);
    console.log('📋 formData.email:', formData.email);
    console.log('📋 formData.phone:', formData.phone);
  }, [formData.name, formData.email, formData.phone, formData.age, formData.gender, formData.address]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Validation functions
  const validateStep1 = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 18 || age > 100) {
        newErrors.age = 'Age must be between 18 and 100';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.address || formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    // Auto-capitalize PAN number
    if (field === 'panNumber') {
      value = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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

  // Upload profile photo to Cloudinary and save to database
  const handlePhotoUpload = async () => {
    if (!profilePhoto && !photoPreview) {
      toastUtils.error('Please select a profile photo');
      return;
    }

    // If photo already exists (from previous upload or user data), skip upload and move to next step
    if (!profilePhoto && photoPreview && user?.profilePhoto) {
      console.log('📸 Profile photo already exists, moving to next step');
      setCurrentStep(4);
      return;
    }

    // If no new photo selected, move to next step
    if (!profilePhoto) {
      setCurrentStep(4);
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', profilePhoto);

      console.log('📸 Uploading profile photo to Cloudinary...');
      console.log('📸 File name:', profilePhoto.name);
      console.log('📸 File size:', profilePhoto.size);
      console.log('📸 File type:', profilePhoto.type);

      // Upload to Cloudinary via backend API
      const response = await userService.uploadPhoto(formData);

      console.log('📸 Upload response:', response);

      // Extract profile photo URL from response
      const uploadedPhotoUrl = response.data?.profilePhoto || response.profilePhoto || response.data?.user?.profilePhoto;

      if (uploadedPhotoUrl) {
        // Update photo preview with Cloudinary URL
        setPhotoPreview(uploadedPhotoUrl);

        // Update Redux store with uploaded photo
        const userData = response.data?.user || response.user;
        if (userData) {
          dispatch(updateUser(userData));
          console.log('✅ Profile photo uploaded and saved to database');
        }

        toastUtils.success('Profile photo uploaded successfully!');

        // Move to next step
        setCurrentStep(4);
      } else {
        throw new Error('No photo URL received from server');
      }
    } catch (error) {
      console.error('❌ Error uploading profile photo:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload profile photo. Please try again.';
      toastUtils.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle step navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        // Save Step 1 data (Name only - Email and Phone are set during registration)
        setIsSavingStep1(true);
        try {
          const updateData = {
            name: formData.name || '',
            // Note: Email and Phone are set during registration and typically shouldn't be changed
            // They are shown in Step 1 for reference but not updated here
          };

          console.log('💾 Saving Step 1 data to database:', updateData);

          const response = await userService.updateProfile(updateData);

          // Update Redux store with saved data
          const userData = response.data?.user || response.data?.data?.user || response.user;
          if (userData) {
            dispatch(updateUser(userData));
            console.log('✅ Step 1 data saved successfully');
            toastUtils.success('Basic information saved!');
          }

          // Move to next step
          setCurrentStep(2);
        } catch (error) {
          console.error('❌ Error saving Step 1 data:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to save basic information. Please try again.';
          toastUtils.error(errorMessage);
        } finally {
          setIsSavingStep1(false);
        }
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        // Save Step 2 data (Age, Gender, Address) to database
        setIsSavingStep2(true);
        try {
          const ageValue = formData.age ? parseInt(formData.age, 10) : undefined;
          if (formData.age && isNaN(ageValue)) {
            toastUtils.error('Please enter a valid age');
            setIsSavingStep2(false);
            return;
          }

          const updateData = {
            age: ageValue,
            gender: formData.gender || '',
            address: formData.address || '',
          };

          console.log('💾 Saving Step 2 data to database:', updateData);

          const response = await userService.updateProfile(updateData);

          // Update Redux store with saved data
          const userData = response.data?.user || response.data?.data?.user || response.user;
          if (userData) {
            dispatch(updateUser(userData));
            console.log('✅ Step 2 data saved successfully');
            toastUtils.success('Personal details saved!');
          }

          // Move to next step
          setCurrentStep(3);
        } catch (error) {
          console.error('❌ Error saving Step 2 data:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to save personal details. Please try again.';
          toastUtils.error(errorMessage);
        } finally {
          setIsSavingStep2(false);
        }
      }
    } else if (currentStep === 3) {
      handlePhotoUpload();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/profile');
    }
  };

  // Submit profile completion (Frontend only - no backend call)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate save delay (frontend only)
    setTimeout(() => {
      toastUtils.success('Profile completed successfully!');
      setIsSubmitting(false);
      navigate('/profile');
    }, 1000);
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

      const uploadedRcUrl = response.data?.rcDocument || response.data?.data?.rcDocument || response.rcDocument;
      const userData = response.data?.user || response.data?.data?.user || response.user;

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

  // QuickEKYC Handlers
  const handleSendAadhaarOtp = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toastUtils.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsSendingAadhaarOtp(true);
    try {
      const response = await kycService.generateAadhaarOTP(aadhaarNumber);
      if (response.success && (response.data?.requestId || response.data?.request_id)) {
        setAadhaarRequestId(response.data.requestId || response.data.request_id);
        setAadhaarStep(2);
        toastUtils.success('OTP sent to your Aadhaar-linked mobile number');
      } else {
        toastUtils.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Aadhaar OTP Error:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSendingAadhaarOtp(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length !== 6) {
      toastUtils.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingAadhaar(true);
    try {
      const response = await kycService.verifyAadhaarOTP(aadhaarRequestId, aadhaarOtp);
      if (response.success) {
        toastUtils.success('Aadhaar verified successfully!');
        // Refresh profile to get updated KYC status
        const profileRes = await userService.getProfile();
        if (profileRes?.data?.user) {
          dispatch(updateUser(profileRes.data.user));
        }
      } else {
        toastUtils.error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Aadhaar Verify Error:', error);
      toastUtils.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!panNumberInput || panNumberInput.length !== 10) {
      toastUtils.error('Please enter a valid 10-digit PAN number');
      return;
    }

    setIsVerifyingPan(true);
    try {
      const response = await kycService.verifyPAN(panNumberInput.toUpperCase());
      if (response.success) {
        toastUtils.success('PAN verified successfully!');
        const profileRes = await userService.getProfile();
        if (profileRes?.data?.user) {
          dispatch(updateUser(profileRes.data.user));
        }
      } else {
        toastUtils.error(response.message || 'PAN verification failed');
      }
    } catch (error) {
      console.error('PAN Verify Error:', error);
      toastUtils.error(error.response?.data?.message || 'PAN verification failed');
    } finally {
      setIsVerifyingPan(false);
    }
  };

  const handleVerifyDl = async () => {
    if (!dlNumber || !dlDob) {
      toastUtils.error('Please enter DL number and Date of Birth');
      return;
    }

    setIsVerifyingDl(true);
    try {
      const formattedDate = formatDateToDDMMYYYY(dlDob);
      const response = await kycService.verifyDL(dlNumber, formattedDate);
      if (response.success) {
        toastUtils.success('Driving License verified successfully!');
        const profileRes = await userService.getProfile();
        if (profileRes?.data?.user) {
          dispatch(updateUser(profileRes.data.user));
        }
      } else {
        toastUtils.error(response.message || 'DL verification failed');
      }
    } catch (error) {
      console.error('DL Verify Error:', error);
      toastUtils.error(error.response?.data?.message || 'DL verification failed');
    } finally {
      setIsVerifyingDl(false);
    }
  };

  // Show loading state while initializing or loading profile
  if (isInitializing || (isLoadingProfile && !user)) {
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
      className="min-h-screen w-full relative pb-[140px] md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <ProfileHeader showBack />

      {/* Web Container - Centered with max-width */}
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-8" style={{ backgroundColor: colors.backgroundPrimary }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: colors.backgroundIcon }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.backgroundTertiary,
              }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-6 md:py-8 lg:py-10 pb-32 md:pb-8 overflow-y-auto">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name || user?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-base"
                  style={{
                    borderColor: errors.name ? colors.error : colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
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
                  value={formData.email || user?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={isLoadingProfile ? "Loading..." : "Enter your email"}
                  disabled={isLoadingProfile}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-base disabled:opacity-50"
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || user?.phone || ''}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-base cursor-not-allowed"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundIcon,
                    color: colors.textSecondary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Phone number cannot be changed as it was set during registration.</p>
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Personal Details
              </h2>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none text-base"
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
                  Gender *
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
                {errors.gender && (
                  <p className="text-xs mt-1" style={{ color: colors.error }}>{errors.gender}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your complete address"
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none resize-none text-base"
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
          )}

          {/* Step 3: Profile Photo */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                Profile Photo
              </h2>

              <div className="flex flex-col items-center">
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
                  capture="user"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
                    style={{
                      backgroundColor: colors.backgroundPrimary,
                      color: colors.textPrimary,
                    }}
                  >
                    <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
                    style={{
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.backgroundSecondary,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Camera
                  </button>
                </div>

                {isUploading && (
                  <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                    Uploading...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: KYC Documents */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
                KYC Documents
              </h2>
              <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
                Verify your identity with official government databases. All documents are required for booking.
              </p>

              {/* Aadhaar Verification Card */}
              <div
                className="p-4 rounded-xl border-2 mb-4"
                style={{
                  borderColor: (user?.kycDetails?.aadhaar?.verified || user?.kycDetails?.aadhaar?.isVerified) ? colors.success : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg mt-1"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    <svg className="w-6 h-6" style={{ color: colors.textPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>
                        Aadhaar Verification
                      </p>
                      {(user?.kycDetails?.aadhaar?.verified || user?.kycDetails?.aadhaar?.isVerified) && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">VERIFIED</span>
                      )}
                    </div>

                    {!(user?.kycDetails?.aadhaar?.verified || user?.kycDetails?.aadhaar?.isVerified) ? (
                      <div className="space-y-3">
                        {aadhaarStep === 1 ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={aadhaarNumber}
                              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                              placeholder="12-digit Aadhaar Number"
                              className="w-full px-4 py-3 rounded-xl border focus:outline-none text-sm"
                              style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary, color: colors.textPrimary }}
                            />
                            <button
                              onClick={handleSendAadhaarOtp}
                              disabled={isSendingAadhaarOtp || aadhaarNumber.length !== 12}
                              className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                              style={{ backgroundColor: colors.backgroundTertiary }}
                            >
                              {isSendingAadhaarOtp ? 'Sending OTP...' : 'Send OTP via QuickEKYC'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={aadhaarOtp}
                                onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="6-digit OTP"
                                className="w-full px-4 py-3 rounded-xl border focus:outline-none text-sm"
                                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary, color: colors.textPrimary }}
                              />
                              <button
                                onClick={handleVerifyAadhaarOtp}
                                disabled={isVerifyingAadhaar || aadhaarOtp.length !== 6}
                                className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                                style={{ backgroundColor: '#16a34a' }}
                              >
                                {isVerifyingAadhaar ? 'Verifying...' : 'Verify via QuickEKYC'}
                              </button>
                            </div>
                            <button 
                              onClick={() => setAadhaarStep(1)} 
                              className="text-xs text-blue-600 font-semibold"
                            >
                              Change Number
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {(user.kycDetails.aadhaar.number || user.kycDetails.aadhaar.idNumber)?.replace(/.(?=.{4})/g, '*')} verified successfully.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* PAN Verification Card */}
              <div
                className="p-4 rounded-xl border-2 mb-4"
                style={{
                  borderColor: (user?.kycDetails?.pan?.verified || user?.kycDetails?.pan?.isVerified) ? colors.success : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg mt-1"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    <svg className="w-6 h-6" style={{ color: colors.textPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>
                        PAN Verification
                      </p>
                      {(user?.kycDetails?.pan?.verified || user?.kycDetails?.pan?.isVerified) && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">VERIFIED</span>
                      )}
                    </div>

                    {!(user?.kycDetails?.pan?.verified || user?.kycDetails?.pan?.isVerified) ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={panNumberInput}
                          onChange={(e) => setPanNumberInput(e.target.value.toUpperCase())}
                          placeholder="PAN Number (ABCDE1234F)"
                          maxLength={10}
                          className="w-full px-4 py-3 rounded-xl border focus:outline-none uppercase text-sm"
                          style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary, color: colors.textPrimary }}
                        />
                        <button
                          onClick={handleVerifyPan}
                          disabled={isVerifyingPan || panNumberInput.length !== 10}
                          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                          style={{ backgroundColor: colors.backgroundTertiary }}
                        >
                          {isVerifyingPan ? 'Verifying...' : 'Verify via QuickEKYC'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        PAN Card {user.kycDetails.pan.number || user.kycDetails.pan.idNumber} verified.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* DL Verification Card */}
              <div
                className="p-4 rounded-xl border-2 mb-4"
                style={{
                  borderColor: (user?.kycDetails?.dl?.verified || user?.kycDetails?.dl?.isVerified) ? colors.success : colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg mt-1"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    <svg className="w-6 h-6" style={{ color: colors.textPrimary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base" style={{ color: colors.textPrimary }}>
                        Driving License
                      </p>
                      {(user?.kycDetails?.dl?.verified || user?.kycDetails?.dl?.isVerified) && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">VERIFIED</span>
                      )}
                    </div>

                    {!(user?.kycDetails?.dl?.verified || user?.kycDetails?.dl?.isVerified) ? (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700">Driving License Number</label>
                          <input
                            type="text"
                            value={dlNumber}
                            onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                            placeholder="DL Number (e.g. DL1420110012345)"
                            className="w-full px-4 py-2 rounded-lg border focus:outline-none uppercase"
                            style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700">Enter date of birth</label>
                          <input
                            type="date"
                            value={dlDob}
                            onChange={(e) => setDlDob(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border focus:outline-none text-sm"
                            style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary, color: colors.textPrimary }}
                          />
                        </div>
                        <button
                          onClick={handleVerifyDl}
                          disabled={isVerifyingDl || !dlNumber || !dlDob}
                          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                          style={{ backgroundColor: colors.backgroundTertiary }}
                        >
                          {isVerifyingDl ? 'Verifying...' : 'Verify via QuickEKYC'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        License {user.kycDetails.dl.number || user.kycDetails.dl.idNumber} verified.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle RC hidden as per user request */}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="fixed md:relative md:max-w-3xl md:mx-auto bottom-[100px] md:bottom-auto left-0 right-0 px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 bg-white md:bg-transparent border-t md:border-t-0 z-40 md:mt-8" style={{ borderColor: colors.borderMedium }}>
          <div className="flex gap-3 md:gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-base border-2"
              style={{
                borderColor: colors.backgroundTertiary,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textPrimary,
              }}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              onClick={currentStep === 4 ? handleSubmit : handleNext}
              disabled={isUploading || isSubmitting || isSavingStep1 || isSavingStep2}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-base"
              style={{
                backgroundColor: (isUploading || isSubmitting || isSavingStep1 || isSavingStep2) ? colors.textTertiary : colors.backgroundTertiary,
                color: colors.backgroundSecondary,
              }}
            >
              {isSavingStep1 || isSavingStep2 ? 'Saving...' : isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : currentStep === 4 ? 'Complete Profile' : 'Next'}
            </button>
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

export default ModuleCompleteProfilePage;

