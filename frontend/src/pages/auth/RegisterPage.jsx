import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { authService } from '../../services';
import toastUtils from '../../config/toast';
import { theme } from '../../theme/theme.constants';
import { requestForToken, isMobileApp } from '../../services/firebase';

/**
 * Register Schema Validation - OTP Based
 */
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number')
    .transform((val) => val.replace(/\D/g, '')), // Remove non-digits
  referralCode: z.string().optional(),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
});

/**
 * RegisterPage Component
 * OTP-based registration with purple theme matching homepage
 * Fixed view, no scrolling
 */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Prevent body scroll when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Detect ref code from URL and set it in form on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('referralCode');
    if (refCode) {
      setValue('referralCode', refCode.toUpperCase().trim());
    }
  }, [setValue]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      referralCode: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      console.error("🚀🚀🚀 STARTING REGISTRATION PROCESS 🚀🚀🚀");

      let fcmToken = "HARDCODED_TEST_TOKEN";

      try {
        console.log("Attempting to fetch FCM Token...");
        const realToken = await requestForToken();
        if (realToken) {
          fcmToken = realToken;
          console.log("✅ Got Real Token:", realToken);
        } else {
          console.error("❌ Token was null, using hardcoded fallback");
        }
      } catch (err) {
        console.error('Error fetching FCM token:', err);
      }

      console.error("📦 Sending Payload with Token:", fcmToken);

      const registerPayload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        referralCode: data.referralCode || undefined,
        fcmToken: fcmToken,
        platform: isMobileApp() ? 'mobile' : 'web'
      };

      console.log("Sending Register Payload:", registerPayload);

      // Send OTP for registration
      const response = await authService.register(registerPayload);

      console.log('Register Response:', response);

      toastUtils.success('OTP sent successfully! Please verify.');

      // Navigate to OTP verification
      navigate('/verify-otp', {
        state: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          type: 'register',
        },
        replace: true,
      });
    } catch (error) {
      console.error('Register Error:', error);
      console.error('Error Response:', error.response);
      console.error('Error Data:', error.response?.data);

      // Extract error message from various possible formats
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Registration failed. Please try again.';

      toastUtils.error(errorMessage);

      // Don't navigate to OTP page if there's an error (e.g., user already exists)
      // User stays on register page to see the error message
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
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Create Account
          </h1>
          <p className="text-white/90 text-xs md:text-sm">
            Sign up to get started with DriveOn
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Full Name Input */}
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              error={errors.fullName?.message}
              {...register('fullName')}
              autoComplete="name"
              autoFocus
            />

            {/* Email Input */}
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
            />

            {/* Phone Input */}
            <Input
              type="tel"
              label="Phone Number"
              placeholder="Enter your 10-digit phone number"
              error={errors.phone?.message}
              helperText="Enter 10-digit mobile number"
              {...register('phone')}
              autoComplete="tel"
              maxLength={10}
            />

            {/* Referral Code Input (Optional) */}
            <Input
              type="text"
              label="Referral Code (Optional)"
              placeholder="Enter referral code if you have one"
              error={errors.referralCode?.message}
              {...register('referralCode')}
            />

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="mt-1 w-4 h-4 rounded focus:ring-2"
                  style={{
                    accentColor: theme.colors.primary,
                    borderColor: '#d0d0d0'
                  }}
                />
                <span className="ml-2 text-xs md:text-sm text-gray-700">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="font-medium hover:underline"
                    style={{ color: theme.colors.primary }}
                  >
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link
                    to="/privacy-policy"
                    className="font-medium hover:underline"
                    style={{ color: theme.colors.primary }}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-1 text-sm text-error" role="alert">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-4"
              style={{ backgroundColor: theme.colors.primary }}
            >
              Send OTP
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="mt-4 text-center">
          <p className="text-white/90 text-xs md:text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
