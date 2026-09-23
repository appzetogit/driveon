import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { colors } from '../theme/colors';
import { authService } from '../../services';
import toastUtils from '../../config/toast';
import { useAppDispatch } from '../../hooks/redux';
import { requestForToken, isMobileApp } from '../../services/firebase';
import { loginSuccess } from '../../store/slices/authSlice';
import { setUser } from '../../store/slices/userSlice';

/**
 * ModuleLoginPage Component
 * OTP-based login page with module theme colors
 * Design based on the provided image with module color scheme
 */
const ModuleLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [timer, setTimer] = useState(60); // 60 seconds timer (1 minute)
  const [canResend, setCanResend] = useState(false);

  // Get return URL from location state or default to module home
  const from = location.state?.from || '/';

  // Prevent body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (showOTP && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showOTP, timer]);

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

    const validationError = validatePhoneNumber(phoneNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to send login OTP
      const response = await authService.sendLoginOTP({
        emailOrPhone: phoneNumber,
      });

      if (response.success) {
        toastUtils.success('OTP sent successfully!');
        setShowOTP(true);
        setError('');
        setTimer(60); // Reset timer to 60 seconds
        setCanResend(false); // Disable resend button
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      const errorMessage =
        error.response?.data?.message ||
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
      // Call backend API to verify OTP
      const response = await authService.verifyOTP({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otp,
        fcmToken: await requestForToken(),
        platform: isMobileApp() ? 'mobile' : 'web'
      });

      // Extract data from response
      const token = response?.token;
      const refreshToken = response?.refreshToken;
      const userData = response?.user;

      // Update Redux store with auth tokens
      if (token) {
        dispatch(
          loginSuccess({
            token: token,
            refreshToken: refreshToken,
            userRole: userData?.role || 'user',
          })
        );
      }

      // Update Redux store with user data if available
      if (userData) {
        dispatch(setUser(userData));
      }

      toastUtils.success('OTP verified successfully!');

      // Navigate to home page after successful login
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Verify OTP Error:', error);
      const errorMessage =
        error.response?.data?.message ||
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
      // Call backend API to resend OTP
      const response = await authService.resendOTP({
        phone: phoneNumber.replace(/\D/g, ''),
        purpose: 'login',
      });

      if (response.success) {
        toastUtils.success('OTP resent successfully!');
        setOtp('');
        setError('');
        setTimer(60); // Reset timer to 60 seconds
        setCanResend(false); // Disable resend button
      } else {
        setError(response.message || 'Failed to resend OTP. Please try again.');
        toastUtils.error(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      toastUtils.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden md:overflow-auto"
      style={{
        backgroundColor: '#f8f8f8',
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
            className="relative flex flex-col justify-center px-8 py-12"
            style={{
              background: colors.gradientHeader,
              minHeight: '200px'
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
              <h1 className="text-4xl font-bold mb-3" style={{ color: colors.backgroundSecondary }}>
                Hello!
              </h1>
              <p className="text-base leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
                Securely log in with your phone number.
              </p>
            </div>
          </div>

          {/* Main Content Area - White Background */}
          <div
            className="px-8 py-8 overflow-y-auto"
            style={{
              backgroundColor: colors.backgroundSecondary
            }}
          >
            <form onSubmit={showOTP ? handleVerifyOTP : handleSendOTP}>
              {/* Title */}
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.backgroundTertiary }}>
                Sign in
              </h2>

              {/* Phone Number Input Field */}
              <div className="mb-4">
                <div
                  className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: error && !showOTP ? colors.error : colors.backgroundTertiary + '40',
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
                    disabled={showOTP}
                    maxLength={10}
                    onFocus={(e) => {
                      if (!showOTP) {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                        e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                      }
                    }}
                    onBlur={(e) => {
                      if (!showOTP) {
                        e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                        e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                      }
                    }}
                  />
                </div>
                {error && !showOTP && (
                  <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                    {error}
                  </p>
                )}
              </div>

              {/* OTP Input Field (shown after email/phone is submitted) */}
              {showOTP && (
                <div className="mb-4">
                  <div
                    className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
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
              )}

              {/* Remember Me and Resend OTP */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded mr-2 cursor-pointer"
                    style={{ accentColor: colors.backgroundTertiary }}
                  />
                  <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                    Remember me
                  </span>
                </label>
                {showOTP && (
                  timer > 0 ? (
                    <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                      Resend in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
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
                  )
                )}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                style={{
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.backgroundSecondary,
                  boxShadow: isLoading
                    ? 'none'
                    : `0 4px 20px ${colors.backgroundTertiary}40`
                }}
              >
                {isLoading
                  ? (showOTP ? 'Verifying...' : 'Sending OTP...')
                  : (showOTP ? 'Verify OTP' : 'Sign in')
                }
              </button>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-sm" style={{ color: colors.backgroundTertiary }}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold hover:underline"
                    style={{ color: colors.backgroundTertiary }}
                  >
                    Sign up
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
        <div className="h-6" style={{ backgroundColor: '#f8f8f8' }}></div>

        {/* Header Section - Dark Background with Wave Graphics */}
        <div
          className="relative flex-1 flex flex-col justify-center px-6 pb-8"
          style={{
            background: colors.gradientHeader,
            minHeight: '40%'
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
            <h1 className="text-4xl font-bold mb-3" style={{ color: colors.backgroundSecondary }}>
              Hello!
            </h1>
            <p className="text-base leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
              Securely log in with your phone number.
            </p>
          </div>
        </div>

        {/* Main Content Area - White Background */}
        <div
          className="flex-1 bg-white rounded-t-3xl px-6 py-8 overflow-y-auto"
          style={{
            backgroundColor: colors.backgroundSecondary,
            minHeight: '60%'
          }}
        >
          <form onSubmit={showOTP ? handleVerifyOTP : handleSendOTP} className="max-w-md mx-auto">
            {/* Title */}
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.backgroundTertiary }}>
              Sign in
            </h2>

            {/* Phone Number Input Field */}
            <div className="mb-4">
              <div
                className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: error && !showOTP ? colors.error : colors.backgroundTertiary + '40',
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
                  disabled={showOTP}
                  maxLength={10}
                  onFocus={(e) => {
                    if (!showOTP) {
                      e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                      e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                    }
                  }}
                  onBlur={(e) => {
                    if (!showOTP) {
                      e.target.parentElement.style.borderColor = colors.backgroundTertiary + '40';
                      e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                    }
                  }}
                />
              </div>
              {error && !showOTP && (
                <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                  {error}
                </p>
              )}
            </div>

            {/* OTP Input Field (shown after email/phone is submitted) */}
            {showOTP && (
              <div className="mb-4">
                <div
                  className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
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
            )}

            {/* Remember Me and Resend OTP */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded mr-2 cursor-pointer"
                  style={{ accentColor: colors.backgroundTertiary }}
                />
                <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                  Remember me
                </span>
              </label>
              {showOTP && (
                timer > 0 ? (
                  <span className="text-sm" style={{ color: colors.backgroundTertiary }}>
                    Resend in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
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
                )
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || (!showOTP && (!phoneNumber || phoneNumber.length !== 10)) || (showOTP && otp.length !== 6)}
              className="w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              style={{
                backgroundColor: colors.backgroundTertiary,
                color: colors.backgroundSecondary,
                boxShadow: (isLoading || (!showOTP && (!phoneNumber || phoneNumber.length !== 10)) || (showOTP && otp.length !== 6))
                  ? 'none'
                  : `0 4px 20px ${colors.backgroundTertiary}40`
              }}
            >
              {isLoading
                ? (showOTP ? 'Verifying...' : 'Sending OTP...')
                : (showOTP ? 'Verify OTP' : 'Sign in')
              }
            </button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <p className="text-sm" style={{ color: '#21292b' }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold hover:underline"
                  style={{ color: colors.backgroundTertiary }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModuleLoginPage;
