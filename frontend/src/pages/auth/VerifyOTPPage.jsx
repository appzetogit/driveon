import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import { Button } from '../../components/common';
import { useAppDispatch } from '../../hooks/redux';
import { loginSuccess } from '../../store/slices/authSlice';
import { setUser } from '../../store/slices/userSlice';
import { authService } from '../../services';
import toastUtils from '../../config/toast';
import { theme } from '../../theme/theme.constants';
import { isMobileApp } from '../../services/firebase';

/**
 * VerifyOTPPage Component
 * OTP verification with blue theme matching homepage
 * Fixed view, no scrolling
 */
const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds timer (1 minute)
  const [canResend, setCanResend] = useState(false);

  // Get email/phone and type from location state
  const { email, phone, emailOrPhone, type = 'register', from = '/', fcmToken } = location.state || {};

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
    if (timer > 0) {
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
  }, [timer]);

  // Auto-submit when OTP is complete (6 digits)
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toastUtils.error('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // Call verify OTP API
      const response = await authService.verifyOTP({
        email: email || (emailOrPhone?.includes('@') ? emailOrPhone : undefined),
        phone: phone || (!emailOrPhone?.includes('@') ? emailOrPhone?.replace(/\D/g, '') : undefined),
        otp: otp,
        fcmToken: fcmToken,
        platform: isMobileApp() ? 'mobile' : 'web'
      });

      // Extract data from response (handle different response formats)
      const responseData = response.data || response;
      const token = responseData.token || responseData.data?.token;
      const refreshToken = responseData.refreshToken || responseData.data?.refreshToken;
      const userData = responseData.user || responseData.data?.user || response.user;

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

      // Redirect to intended page or home
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Verify OTP Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Invalid OTP. Please try again.';
      toastUtils.error(errorMessage);
      setOtp(''); // Clear OTP on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      // Use resend OTP API
      await authService.resendOTP({
        email: email || (emailOrPhone?.includes('@') ? emailOrPhone : undefined),
        phone: phone || (!emailOrPhone?.includes('@') ? emailOrPhone?.replace(/\D/g, '') : undefined),
        purpose: type || 'register',
      });

      toastUtils.success('OTP resent successfully!');
      setTimer(60);
      setCanResend(false);
      setOtp('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toastUtils.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get display text for email/phone
  const getDisplayText = () => {
    if (emailOrPhone) {
      return emailOrPhone.includes('@') ? emailOrPhone : `+91 ${emailOrPhone}`;
    }
    if (email) return email;
    if (phone) return `+91 ${phone}`;
    return '';
  };

  // Redirect if no email/phone
  if (!email && !phone && !emailOrPhone) {
    navigate(type === 'login' ? '/login' : '/register', { replace: true });
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        backgroundColor: theme.colors.primary,
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Verify OTP
          </h1>
          <p className="text-white/90 text-sm md:text-base mb-1">
            We've sent a 6-digit code to
          </p>
          <p className="text-white font-medium">
            {getDisplayText()}
          </p>
        </div>

        {/* OTP Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-2xl">
          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Enter the verification code
            </label>
            <div className="flex justify-center otp-input-container">
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderSeparator={<span className="mx-1 md:mx-2"></span>}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="w-11 h-12 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 bg-white text-gray-900 transition-all hover:shadow-md"
                    style={{
                      '--focus-border': theme.colors.primary,
                      '--focus-ring': `${theme.colors.primary}33`,
                      minWidth: '44px',
                      minHeight: '44px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  />
                )}
                inputType="number"
                shouldAutoFocus
              />
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="text-center mb-6">
            {timer > 0 ? (
              <p className="text-sm text-gray-600">
                Resend code in{' '}
                <span className="font-semibold" style={{ color: theme.colors.primary }}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                className="text-sm font-medium hover:underline"
                style={{ color: theme.colors.primary }}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Verify Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleVerifyOTP}
            isLoading={isLoading}
            disabled={isLoading || otp.length !== 6}
            style={{ backgroundColor: theme.colors.primary }}
          >
            Verify OTP
          </Button>

          {/* Back to Register/Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate(type === 'login' ? '/login' : '/register')}
              className="text-sm hover:underline transition-colors"
              style={{ color: theme.colors.primary }}
            >
              Change {type === 'login' ? 'email/phone' : 'email/phone number'}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/80">
            Didn't receive the code? Check your spam folder or{' '}
            <button
              onClick={handleResendOTP}
              disabled={!canResend}
              className="hover:underline disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              style={{ color: '#ffffff' }}
            >
              resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
