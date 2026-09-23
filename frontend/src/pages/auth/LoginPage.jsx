import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { authService } from '../../services';
import toastUtils from '../../config/toast';
import { theme } from '../../theme/theme.constants';
import { requestForToken } from '../../services/firebase';

/**
 * Login Schema Validation - OTP Based
 */
const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, 'Email or phone number is required')
    .refine(
      (val) => {
        // Check if it's an email or phone
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanedPhone = val.replace(/\D/g, '');
        return emailRegex.test(val) || phoneRegex.test(cleanedPhone);
      },
      { message: 'Please enter a valid email or phone number' }
    ),
});

/**
 * LoginPage Component
 * OTP-based login with purple theme matching homepage
 * Fixed view, no scrolling
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Get return URL from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // Prevent body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      let fcmToken = null;
      try {
        fcmToken = await requestForToken();
      } catch (err) {
        console.log('Error fetching FCM token:', err);
      }

      // Send OTP for login
      const response = await authService.sendLoginOTP({
        emailOrPhone: data.emailOrPhone,
      });

      console.log('Login OTP Response:', response);

      toastUtils.success('OTP sent successfully!');

      // Navigate to OTP verification
      navigate('/verify-otp', {
        state: {
          emailOrPhone: data.emailOrPhone,
          type: 'login',
          from: from,
          fcmToken: fcmToken,
        },
        replace: true,
      });
    } catch (error) {
      // Extract error message from various possible formats
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to send OTP. Please try again.';

      // Check if it's user not found error (expected error, don't log to console)
      const isUserNotFound = errorMessage.toLowerCase().includes('user not found') ||
        errorMessage.toLowerCase().includes('signup first') ||
        (error.response?.status === 400 && error.response?.data?.message?.toLowerCase().includes('user not found'));

      // Only log unexpected errors to console
      if (!isUserNotFound) {
        console.error('Login OTP Error:', error);
        console.error('Error Response:', error.response);
        console.error('Error Data:', error.response?.data);
      }

      toastUtils.error(errorMessage);

      // Don't navigate to OTP page if user not found - stay on login page
      // Only navigate if it's a different error (like network issue) or in mock mode
      if (!isUserNotFound) {
        // For other errors (network, server issues), still navigate to OTP page
        navigate('/verify-otp', {
          state: {
            emailOrPhone: data.emailOrPhone,
            type: 'login',
            from: from,
            fcmToken: fcmToken,
          },
          replace: true,
        });
      }
      // If user not found, stay on login page (don't navigate)
    } finally {
      setIsLoading(false);
    }
  };

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
            Welcome Back
          </h1>
          <p className="text-white/90 text-sm md:text-base">
            Enter your phone number to receive OTP
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email/Phone Input */}
            <Input
              type="text"
              label="Phone Number"
              placeholder="Enter your phone number"
              error={errors.emailOrPhone?.message}
              {...register('emailOrPhone')}
              autoComplete="username"
              autoFocus
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-6"
              style={{ backgroundColor: theme.colors.primary }}
            >
              Send OTP
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-white/90 text-sm md:text-base">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-white font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
