import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { useAdminAuth } from '../../context/AdminContext';
import toastUtils from '../../config/toast';

/**
 * Admin Signup Schema Validation
 */
const adminSignupSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * AdminSignupPage Component
 * Admin registration page with purple theme matching admin login
 * Fixed view, no scrolling
 */
const AdminSignupPage = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    resolver: zodResolver(adminSignupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await signup(data.name, data.email, data.password, data.confirmPassword);
      toastUtils.success('Account created successfully!');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      console.error('Admin Signup Error:', error);
      const errorMessage =
        error.message || 'Signup failed. Please try again.';
      toastUtils.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        backgroundColor: '#1e6262',
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
        maxHeight: '100%',
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Admin Signup
          </h1>
          <p className="text-white/90 text-xs md:text-sm">
            Create an admin account to manage DriveOn
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            {/* Name Input */}
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name')}
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

            {/* Password Input */}
            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mt-0.5 text-[10px] text-gray-600 hover:text-gray-900 flex items-center gap-0.5"
                style={{ color: '#1e6262' }}
              >
                {showPassword ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71l3.71 3.71M12 12l3.71-3.71m0 0a9.97 9.97 0 011.88-1.88m-3.17-3.17L12 12m3.71 3.71L12 12"
                      />
                    </svg>
                    Hide Password
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show Password
                  </>
                )}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="mt-0.5 text-[10px] text-gray-600 hover:text-gray-900 flex items-center gap-0.5"
                style={{ color: '#1e6262' }}
              >
                {showConfirmPassword ? (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71l3.71 3.71M12 12l3.71-3.71m0 0a9.97 9.97 0 011.88-1.88m-3.17-3.17L12 12m3.71 3.71L12 12"
                      />
                    </svg>
                    Hide
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Show
                  </>
                )}
              </button>
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="mt-0.5 w-3 h-3 rounded focus:ring-2"
                  style={{
                    accentColor: '#1e6262',
                    borderColor: '#d0d0d0',
                  }}
                />
                <span className="ml-1.5 text-[11px] text-gray-700">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="font-medium hover:underline"
                    style={{ color: '#1e6262' }}
                    target="_blank"
                  >
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link
                    to="/privacy"
                    className="font-medium hover:underline"
                    style={{ color: '#1e6262' }}
                    target="_blank"
                  >
                    Privacy
                  </Link>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-0.5 text-[10px] text-error" role="alert">
                  {errors.termsAccepted.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
              className="mt-2"
              style={{ backgroundColor: '#1e6262' }}
            >
              Create Account
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="mt-2 text-center">
          <p className="text-white/90 text-xs">
            Already have an admin account?{' '}
            <Link
              to="/admin/login"
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

export default AdminSignupPage;

