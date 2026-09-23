import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { setUser } from '../../store/slices/userSlice';
import { colors } from '../theme/colors';
import { authService } from '../../services';
import toastUtils from '../../config/toast';
import { requestForToken, isMobileApp } from '../../services/firebase';

/**
 * ModuleRegisterPage Component
 * OTP-based registration page with module theme colors
 * Design based on login page with module color scheme
 * Based on document.txt requirements: Email + Phone Number Registration with OTP Verification
 */
const ModuleRegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).fullName || '') : '';
    } catch (e) {
      return '';
    }
  });
  const [email, setEmail] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).email || '') : '';
    } catch (e) {
      return '';
    }
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).phoneNumber || '') : '';
    } catch (e) {
      return '';
    }
  });
  const [referralCode, setReferralCode] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).referralCode || '') : '';
    } catch (e) {
      return '';
    }
  });
  const [heardAbout, setHeardAbout] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).heardAbout || '') : '';
    } catch (e) {
      return '';
    }
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(() => {
    try {
      const saved = sessionStorage.getItem('register_form_state');
      return saved ? (JSON.parse(saved).termsAccepted || false) : false;
    } catch (e) {
      return false;
    }
  });
  const [timeLeft, setTimeLeft] = useState(0); // Timer for OTP resend

  // Options for "How did you hear about DriveOn?"
  const heardAboutOptions = [
    { value: '', label: 'How did you hear about DriveOn? (Optional)' },
    { value: 'friend_family', label: 'Friend / Family' },
    { value: 'social_media', label: 'Social Media (Instagram, Facebook, etc.)' },
    { value: 'google_search', label: 'Google / Online Search' },
    { value: 'ads', label: 'Online Ads' },
    { value: 'office_visit', label: 'Visited DriveOn Office' },
    { value: 'other', label: 'Other' },
  ];

  // Prevent body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Detect ref code from URL and set it in state on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('referralCode');
    if (refCode) {
      setReferralCode(refCode.toUpperCase().trim());
    }
  }, []);

  // Save registration form state to sessionStorage whenever it changes
  useEffect(() => {
    const formState = {
      fullName,
      email,
      phoneNumber,
      referralCode,
      heardAbout,
      termsAccepted
    };
    sessionStorage.setItem('register_form_state', JSON.stringify(formState));
  }, [fullName, email, phoneNumber, referralCode, heardAbout, termsAccepted]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle OTP timer countdown
  useEffect(() => {
    if (!showOTP || timeLeft === 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [showOTP, timeLeft]);

  // Validate full name
  const validateFullName = (value) => {
    if (!value) {
      return 'Full name is required';
    }
    if (value.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    return '';
  };

  // Validate email
  const validateEmail = (value) => {
    if (!value) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Validate phone number
  const validatePhoneNumber = (value) => {
    if (!value) {
      return 'Phone number is required';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanedPhone = value.replace(/\D/g, '');

    if (phoneRegex.test(cleanedPhone)) {
      return '';
    }
    return 'Please enter a valid 10-digit phone number';
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const phoneError = validatePhoneNumber(phoneNumber);

    if (nameError) {
      setError(nameError);
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);

    // Attempt to fetch FCM Token
    let fcmToken = null;
    try {
      console.log("Attempting to fetch FCM Token for registration...");
      fcmToken = await requestForToken();
      console.log("FCM Token Fetched:", fcmToken);
    } catch (err) {
      console.error('Error fetching FCM token in ModuleRegisterPage:', err);
    }

    try {
      // Clean phone number (remove non-digits)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');

      // Call actual registration API
      const response = await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: cleanedPhone,
        referralCode: referralCode.trim() || undefined,
        heardAbout: heardAbout.trim() || '', // Send empty string if not selected
        fcmToken: fcmToken,
        platform: isMobileApp() ? 'mobile' : 'web'
      });

      console.log('Register Response:', response);

      // Show success message
      toastUtils.success('OTP sent successfully! Please check your phone.');

      // Show OTP input field
      setShowOTP(true);
      setTimeLeft(120); // Start 2 minute timer
      setError('');
    } catch (error) {
      console.error('Register Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Data:', error.response?.data);

      // Extract error message from various possible formats
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to send OTP. Please try again.';

      setError(errorMessage);
      toastUtils.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number (remove non-digits)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');

      // Call actual OTP verification API
      const response = await authService.verifyOTP({
        phone: cleanedPhone,
        email: email.trim(),
        otp: otp,
        fcmToken: await requestForToken(), // Ensure token is sent during verification too
        platform: isMobileApp() ? 'mobile' : 'web'
      });

      console.log('✅ Verify OTP Response:', response);
      console.log('✅ Response structure:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        hasToken: !!response.data?.data?.token,
        hasUser: !!response.data?.data?.user,
      });

      // Backend returns: { success: true, data: { token, refreshToken, user: {...} } }
      // Axios wraps: response.data = { success: true, data: { token, refreshToken, user: {...} } }
      // authService.verifyOTP returns: response.data.data = { token, refreshToken, user: {...} }
      // So response is already: { token, refreshToken, user: {...} } ✅
      const token = response?.token;
      const refreshToken = response?.refreshToken;
      const userData = response?.user;

      console.log('📱 Extracted data:', {
        token: !!token,
        refreshToken: !!refreshToken,
        userData: !!userData,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        userName: userData?.name,
        userEmail: userData?.email,
        userPhone: userData?.phone,
      });

      // Update Redux store with auth tokens
      if (token) {
        console.log('🔐 Storing JWT token in Redux and localStorage');
        dispatch(
          loginSuccess({
            token: token,
            refreshToken: refreshToken,
            userRole: userData?.role || 'user',
          })
        );
        console.log('✅ Authentication state updated');
      } else {
        console.warn('⚠️ No token found in response');
      }

      // Update Redux store with user data if available
      if (userData) {
        console.log('👤 Storing user data in Redux:', userData);
        dispatch(setUser(userData));
        console.log('✅ User data stored in Redux');
      } else {
        console.warn('⚠️ No user data found in response');
      }

      // Show success message
      toastUtils.success('Registration successful! Welcome to DriveOn.');

      // Navigate to profile page after successful registration
      console.log('🔄 Redirecting to profile page...');
      sessionStorage.removeItem('register_form_state');
      navigate('/profile/complete', { replace: true });
    } catch (error) {
      console.error('❌ Verify OTP Error:', error);
      console.error('❌ Error Response:', error.response);
      console.error('❌ Error Data:', error.response?.data);

      // Extract error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Invalid OTP. Please try again.';

      setError(errorMessage);
      toastUtils.error(errorMessage);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      // Clean phone number (remove non-digits)
      const cleanedPhone = phoneNumber.replace(/\D/g, '');

      // Call actual resend OTP API
      const response = await authService.resendOTP({
        phone: cleanedPhone,
        email: email.trim(),
        purpose: 'register',
      });

      console.log('Resend OTP Response:', response);

      toastUtils.success('OTP resent successfully! Please check your phone.');
      toastUtils.success('OTP resent successfully! Please check your phone.');
      setOtp('');
      setError('');
      setTimeLeft(120); // Reset timer
    } catch (error) {
      console.error('Resend OTP Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Data:', error.response?.data);

      // Extract error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to resend OTP. Please try again.';

      setError(errorMessage);
      toastUtils.error(errorMessage);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden md:overflow-auto"
      style={{
        backgroundColor: '#F1F2F4',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* Web View Container - Centered Card Layout */}
      <div className="hidden md:flex min-h-screen items-center justify-center p-8">
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          {/* Header Section - Dark Background with Wave Graphics */}
          <div
            className="relative flex flex-col justify-center px-6 py-8"
            style={{
              backgroundColor: colors.backgroundTertiary,
              minHeight: '150px'
            }}
          >
            {/* Abstract Wave Graphics */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <svg
                className="absolute top-0 right-0 w-64 h-64"
                viewBox="0 0 200 200"
                fill="none"
                style={{ color: colors.backgroundSecondary }}
              >
                {/* Wave 1 */}
                <path
                  d="M50 50 Q100 20, 150 50 T250 50"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-50"
                />
                {/* Wave 2 */}
                <path
                  d="M30 100 Q80 70, 130 100 T230 100"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-30"
                />
                {/* Wave 3 */}
                <path
                  d="M10 150 Q60 120, 110 150 T210 150"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-20"
                />
                {/* Additional flowing lines */}
                <path
                  d="M70 30 Q120 0, 170 30"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  className="opacity-40"
                />
                <path
                  d="M90 80 Q140 50, 190 80"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  className="opacity-25"
                />
              </svg>
            </div>

            {/* Header Content */}
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.backgroundSecondary }}>
                Welcome!
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
                Create your account to get started with DriveOn.
              </p>
            </div>
          </div>

          {/* Main Content Area - White Background */}
          <div
            className="px-6 py-6 overflow-y-auto max-h-[600px]"
            style={{
              backgroundColor: colors.backgroundSecondary
            }}
          >
            <form onSubmit={showOTP ? handleVerifyOTP : handleSendOTP}>
              {/* Title */}
              <h2 className="text-xl font-bold mb-4" style={{ color: colors.backgroundTertiary }}>
                Sign up
              </h2>

              {!showOTP ? (
                <>
                  {/* Full Name Input Field */}
                  <div className="mb-3">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: error && error.includes('name') ? colors.error : colors.backgroundTertiary + '40',
                        backgroundColor: colors.backgroundPrimary
                      }}
                    >
                      {/* User Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
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

                      {/* Input */}
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your full name"
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: colors.backgroundTertiary }}
                        onFocus={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                          e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                          e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                        }}
                      />
                    </div>
                    {error && error.includes('name') && (
                      <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Email Input Field */}
                  <div className="mb-3">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: error && error.includes('Email') ? colors.error : colors.backgroundTertiary + '40',
                        backgroundColor: colors.backgroundPrimary
                      }}
                    >
                      {/* Envelope Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>

                      {/* Input */}
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your email"
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: colors.backgroundTertiary }}
                        onFocus={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                          e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                          e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                        }}
                      />
                    </div>
                    {error && error.includes('Email') && (
                      <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Phone Number Input Field */}
                  <div className="mb-3">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: error && error.includes('phone') ? colors.error : colors.backgroundTertiary + '40',
                        backgroundColor: colors.backgroundPrimary
                      }}
                    >
                      {/* Phone Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>

                      {/* Input */}
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhoneNumber(value);
                          setError('');
                        }}
                        placeholder="Enter your phone number"
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        style={{ color: colors.backgroundTertiary }}
                        maxLength={10}
                        onFocus={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                          e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                          e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                        }}
                      />
                    </div>
                    {error && error.includes('phone') && (
                      <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                        {error}
                      </p>
                    )}
                  </div>

                  {/* How did you hear about DriveOn? Custom Dropdown */}
                  <div className="mb-3 relative dropdown-container">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: isDropdownOpen ? colors.backgroundTertiary : colors.backgroundTertiary + '40',
                        backgroundColor: isDropdownOpen ? colors.backgroundSecondary : colors.backgroundPrimary
                      }}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      tabIndex={0}
                    >
                      {/* Info/Question Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
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

                      {/* Selected Value or Placeholder */}
                      <span
                        className="flex-1 bg-transparent border-none outline-none text-sm cursor-pointer"
                        style={{
                          color: heardAbout ? colors.backgroundTertiary : colors.backgroundTertiary + '80'
                        }}
                      >
                        {heardAboutOptions.find(opt => opt.value === heardAbout)?.label || 'How did you hear about DriveOn? (Optional)'}
                      </span>

                      {/* Dropdown Arrow */}
                      <svg
                        className={`w-5 h-5 flex-shrink-0 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                        style={{ color: colors.backgroundTertiary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <div
                        className="absolute z-50 w-full mt-1 rounded-xl border-2 shadow-lg overflow-hidden"
                        style={{
                          backgroundColor: colors.backgroundSecondary,
                          borderColor: colors.backgroundTertiary + '40',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {heardAboutOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setHeardAbout(option.value);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-opacity-10"
                            style={{
                              backgroundColor: heardAbout === option.value ? colors.backgroundTertiary + '20' : 'transparent',
                              color: heardAbout === option.value ? colors.backgroundTertiary : colors.backgroundTertiary,
                            }}
                            onMouseEnter={(e) => {
                              if (heardAbout !== option.value) {
                                e.currentTarget.style.backgroundColor = colors.backgroundPrimary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (heardAbout !== option.value) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Referral Code Input Field (Optional) */}
                  <div className="mb-3">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: colors.backgroundTertiary + '40',
                        backgroundColor: colors.backgroundPrimary
                      }}
                    >
                      {/* Gift/Referral Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                      </svg>

                      {/* Input */}
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                          setReferralCode(e.target.value.toUpperCase());
                        }}
                        placeholder="Referral code (Optional)"
                        className="flex-1 bg-transparent border-none outline-none text-sm uppercase"
                        style={{ color: colors.backgroundTertiary }}
                        onFocus={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                          e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                          e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                        }}
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          setError('');
                        }}
                        className="w-5 h-5 mt-0.5 rounded flex-shrink-0 cursor-pointer"
                        style={{ accentColor: colors.backgroundTertiary }}
                      />
                      <span className="text-sm leading-relaxed" style={{ color: colors.backgroundTertiary }}>
                        I agree to the <Link to="/terms" className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>terms and conditions</Link> and <Link to="/privacy-policy" className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>privacy policy</Link>. <span className="font-semibold" style={{ color: colors.error }}>*</span>
                      </span>
                    </label>
                    {error && error.includes('terms') && (
                      <p className="text-xs mt-1 ml-8" style={{ color: colors.error }}>
                        {error}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Input Field (shown after registration details are submitted) */}
                  <div className="mb-3">
                    <div
                      className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: error ? colors.error : colors.backgroundTertiary + '40',
                        backgroundColor: colors.backgroundPrimary
                      }}
                    >
                      {/* Lock/OTP Icon */}
                      <svg
                        className="w-5 h-5 mr-3 flex-shrink-0"
                        style={{ color: colors.backgroundTertiary }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>

                      {/* OTP Input */}
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(value);
                          setError('');
                        }}
                        placeholder="Enter OTP"
                        className="flex-1 bg-transparent border-none outline-none text-sm tracking-widest"
                        style={{ color: colors.backgroundTertiary }}
                        maxLength={6}
                        onFocus={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                          e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                          e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                        }}
                      />
                    </div>
                    {error && (
                      <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                        {error}
                      </p>
                    )}
                    <p className="text-xs mt-1 ml-1" style={{ color: colors.backgroundTertiary }}>
                      OTP sent to +91 {phoneNumber}
                    </p>
                  </div>

                  {/* Resend OTP */}
                  <div className="mb-4 flex justify-end">
                    {timeLeft > 0 ? (
                      <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                        Resend OTP in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: colors.backgroundTertiary }}
                      >
                        Resend OTP?
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (!showOTP && (!fullName || !email || !phoneNumber || phoneNumber.length !== 10 || !termsAccepted)) ||
                  (showOTP && otp.length !== 6)
                }
                className="w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                style={{
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.backgroundSecondary,
                  boxShadow: (isLoading || (!showOTP && (!fullName || !email || !phoneNumber || phoneNumber.length !== 10 || !termsAccepted)) || (showOTP && otp.length !== 6))
                    ? 'none'
                    : `0 4px 20px ${colors.backgroundTertiary}40`
                }}
              >
                {isLoading
                  ? (showOTP ? 'Verifying...' : 'Sending OTP...')
                  : (showOTP ? 'Verify OTP' : 'Sign up')
                }
              </button>

              {/* Sign In Link */}
              <div className="text-center mt-4">
                <p className="text-sm" style={{ color: colors.backgroundTertiary }}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold hover:underline"
                    style={{ color: colors.backgroundTertiary }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile View - Original Layout */}
      <div className="md:hidden flex flex-col h-full">
        {/* Status Bar Area (for mobile) */}
        <div className="h-6" style={{ backgroundColor: '#F1F2F4' }}></div>

        {/* Header Section - Dark Background with Wave Graphics */}
        <div
          className="relative flex-1 flex flex-col justify-center px-6 pb-8"
          style={{
            backgroundColor: colors.backgroundTertiary,
            minHeight: '35%'
          }}
        >
          {/* Abstract Wave Graphics */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <svg
              className="absolute top-0 right-0 w-64 h-64"
              viewBox="0 0 200 200"
              fill="none"
              style={{ color: colors.backgroundSecondary }}
            >
              {/* Wave 1 */}
              <path
                d="M50 50 Q100 20, 150 50 T250 50"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="opacity-50"
              />
              {/* Wave 2 */}
              <path
                d="M30 100 Q80 70, 130 100 T230 100"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="opacity-30"
              />
              {/* Wave 3 */}
              <path
                d="M10 150 Q60 120, 110 150 T210 150"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="opacity-20"
              />
              {/* Additional flowing lines */}
              <path
                d="M70 30 Q120 0, 170 30"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-40"
              />
              <path
                d="M90 80 Q140 50, 190 80"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-25"
              />
            </svg>
          </div>

          {/* Header Content */}
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.backgroundSecondary }}>
              Welcome!
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
              Create your account to get started with DriveOn.
            </p>
          </div>
        </div>

        {/* Main Content Area - White Background */}
        <div
          className="flex-1 bg-white rounded-t-3xl px-6 py-6 overflow-y-auto"
          style={{
            backgroundColor: colors.backgroundSecondary,
            minHeight: '65%'
          }}
        >
          <form onSubmit={showOTP ? handleVerifyOTP : handleSendOTP} className="max-w-md mx-auto">
            {/* Title */}
            <h2 className="text-xl font-bold mb-4" style={{ color: colors.backgroundTertiary }}>
              Sign up
            </h2>

            {!showOTP ? (
              <>
                {/* Full Name Input Field */}
                <div className="mb-3">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: error && error.includes('name') ? colors.error : colors.backgroundTertiary + '40',
                      backgroundColor: colors.backgroundPrimary
                    }}
                  >
                    {/* User Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
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

                    {/* Input */}
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your full name"
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                      style={{ color: colors.backgroundTertiary }}
                      onFocus={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }}
                      onBlur={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }}
                    />
                  </div>
                  {error && error.includes('name') && (
                    <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                </div>

                {/* Email Input Field */}
                <div className="mb-3">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: error && error.includes('Email') ? colors.error : colors.backgroundTertiary + '40',
                      backgroundColor: colors.backgroundPrimary
                    }}
                  >
                    {/* Envelope Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>

                    {/* Input */}
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your email"
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                      style={{ color: colors.backgroundTertiary }}
                      onFocus={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }}
                      onBlur={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }}
                    />
                  </div>
                  {error && error.includes('Email') && (
                    <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                </div>

                {/* Phone Number Input Field */}
                <div className="mb-3">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: error && error.includes('phone') ? colors.error : colors.backgroundTertiary + '40',
                      backgroundColor: colors.backgroundPrimary
                    }}
                  >
                    {/* Phone Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>

                    {/* Input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhoneNumber(value);
                        setError('');
                      }}
                      placeholder="Enter your phone number"
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                      style={{ color: colors.backgroundTertiary }}
                      maxLength={10}
                      onFocus={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }}
                      onBlur={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }}
                    />
                  </div>
                  {error && error.includes('phone') && (
                    <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                </div>

                {/* How did you hear about DriveOn? Custom Dropdown */}
                <div className="mb-3 relative dropdown-container">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: isDropdownOpen ? colors.backgroundTertiary : colors.backgroundTertiary + '40',
                      backgroundColor: isDropdownOpen ? colors.backgroundSecondary : colors.backgroundPrimary
                    }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    tabIndex={0}
                  >
                    {/* Info/Question Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
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

                    {/* Selected Value or Placeholder */}
                    <span
                      className="flex-1 bg-transparent border-none outline-none text-sm cursor-pointer"
                      style={{
                        color: heardAbout ? colors.backgroundTertiary : colors.backgroundTertiary + '80'
                      }}
                    >
                      {heardAboutOptions.find(opt => opt.value === heardAbout)?.label || 'How did you hear about DriveOn? (Optional)'}
                    </span>

                    {/* Dropdown Arrow */}
                    <svg
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                      style={{ color: colors.backgroundTertiary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown Options */}
                  {isDropdownOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-xl border-2 shadow-lg overflow-hidden"
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.backgroundTertiary + '40',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      {heardAboutOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setHeardAbout(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-opacity-10"
                          style={{
                            backgroundColor: heardAbout === option.value ? colors.backgroundTertiary + '20' : 'transparent',
                            color: heardAbout === option.value ? colors.backgroundTertiary : colors.backgroundTertiary,
                          }}
                          onMouseEnter={(e) => {
                            if (heardAbout !== option.value) {
                              e.currentTarget.style.backgroundColor = colors.backgroundPrimary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (heardAbout !== option.value) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Referral Code Input Field (Optional) */}
                <div className="mb-3">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: colors.backgroundTertiary + '40',
                      backgroundColor: colors.backgroundPrimary
                    }}
                  >
                    {/* Gift/Referral Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                      />
                    </svg>

                    {/* Input */}
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                      }}
                      placeholder="Referral code (Optional)"
                      className="flex-1 bg-transparent border-none outline-none text-sm uppercase"
                      style={{ color: colors.backgroundTertiary }}
                      onFocus={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }}
                      onBlur={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }}
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        setError('');
                      }}
                      className="w-5 h-5 mt-0.5 rounded flex-shrink-0 cursor-pointer"
                      style={{ accentColor: colors.backgroundTertiary }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: colors.backgroundTertiary }}>
                      I agree to the <Link to="/terms" className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>terms and conditions</Link> and <Link to="/privacy-policy" className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>privacy policy</Link>. <span className="font-semibold" style={{ color: colors.error }}>*</span>
                    </span>
                  </label>
                  {error && error.includes('terms') && (
                    <p className="text-xs mt-1 ml-8" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* OTP Input Field (shown after registration details are submitted) */}
                <div className="mb-3">
                  <div
                    className="relative flex items-center px-3 py-2.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: error ? colors.error : colors.backgroundTertiary + '40',
                      backgroundColor: colors.backgroundPrimary
                    }}
                  >
                    {/* Lock/OTP Icon */}
                    <svg
                      className="w-5 h-5 mr-3 flex-shrink-0"
                      style={{ color: colors.backgroundTertiary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>

                    {/* OTP Input */}
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                        setError('');
                      }}
                      placeholder="Enter OTP"
                      className="flex-1 bg-transparent border-none outline-none text-sm tracking-widest"
                      style={{ color: colors.backgroundTertiary }}
                      maxLength={6}
                      onFocus={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }}
                      onBlur={(e) => {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }}
                    />
                  </div>
                  {error && (
                    <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                  <p className="text-xs mt-1 ml-1" style={{ color: colors.backgroundTertiary }}>
                    OTP sent to +91 {phoneNumber}
                  </p>
                </div>

                {/* Resend OTP */}
                <div className="mb-4 flex justify-end">
                  {timeLeft > 0 ? (
                    <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                      Resend OTP in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                      className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: colors.backgroundTertiary }}
                    >
                      Resend OTP?
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={
                isLoading ||
                (!showOTP && (!fullName || !email || !phoneNumber || phoneNumber.length !== 10 || !termsAccepted)) ||
                (showOTP && otp.length !== 6)
              }
              className="w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              style={{
                backgroundColor: colors.backgroundTertiary,
                color: colors.backgroundSecondary,
                boxShadow: (isLoading || (!showOTP && (!fullName || !email || !phoneNumber || phoneNumber.length !== 10 || !termsAccepted)) || (showOTP && otp.length !== 6))
                  ? 'none'
                  : `0 4px 20px ${colors.backgroundTertiary}40`
              }}
            >
              {isLoading
                ? (showOTP ? 'Verifying...' : 'Sending OTP...')
                : (showOTP ? 'Verify OTP' : 'Sign up')
              }
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: colors.backgroundTertiary }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: colors.backgroundTertiary }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModuleRegisterPage;

