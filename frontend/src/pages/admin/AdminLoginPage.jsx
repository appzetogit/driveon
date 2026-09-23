import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminAuth } from '../../context/AdminContext';
import toastUtils from '../../config/toast';
import { colors } from '../../module/theme/colors';
import { requestForToken } from '../../services/firebase';

/**
 * Admin Login Schema Validation - Password Based
 */
const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * AdminLoginPage Component
 * Password-based login for admin panel with module theme
 * Design based on module LoginPage with module color scheme
 */
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Get return URL from location state or default to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = watch('email') || '';
  const passwordValue = watch('password') || '';

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🔵 AdminLoginPage: Attempting login with:', { email: data.email });

      // Get FCM Token
      let fcmToken = null;
      try {
        fcmToken = await requestForToken();
        console.log('✅ Admin FCM Token retrieved:', fcmToken ? 'Yes' : 'No');
      } catch (tokenError) {
        console.warn('⚠️ Failed to get FCM token for admin:', tokenError);
      }

      const result = await login(data.email, data.password, fcmToken);
      console.log('✅ AdminLoginPage: Login successful:', result);
      toastUtils.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('❌ AdminLoginPage: Login Error:', error);
      // Extract user-friendly error message
      let errorMessage = 'Login failed. Please check your credentials.';

      if (error.message) {
        // Filter out technical error messages
        if (error.message.includes('No token provided')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('authorization denied')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (!error.message.includes('Request failed') && !error.message.includes('Network')) {
          errorMessage = error.message;
        }
      }

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
        backgroundColor: colors.backgroundPrimary,
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
              backgroundColor: colors.backgroundTertiary,
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
                Admin Login
              </h1>
              <p className="text-base leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
                Enter your credentials to access the admin panel.
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
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Title */}
              <h2 className="text-2xl font-bold mb-6" style={{ color: colors.backgroundTertiary }}>
                Sign in
              </h2>

              {/* Email Input Field */}
              <div className="mb-4">
                <div
                  className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: (error || errors.email) ? colors.error : colors.backgroundTertiary + '40',
                    backgroundColor: colors.backgroundPrimary
                  }}
                >
                  {/* Email Icon */}
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
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    style={{ color: colors.backgroundTertiary }}
                    autoComplete="email"
                    autoFocus
                    {...register('email')}
                    value={emailValue}
                    onChange={(e) => setValue('email', e.target.value)}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                      e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = (error || errors.email) ? colors.error : colors.backgroundTertiary + '40';
                      e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                    }}
                  />
                </div>
                {(error && error.includes('email')) || errors.email ? (
                  <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                    {errors.email?.message || error}
                  </p>
                ) : null}
              </div>

              {/* Password Input Field */}
              <div className="mb-4">
                <div
                  className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: (error || errors.password) ? colors.error : colors.backgroundTertiary + '40',
                    backgroundColor: colors.backgroundPrimary
                  }}
                >
                  {/* Lock Icon */}
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

                  {/* Input */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    style={{ color: colors.backgroundTertiary }}
                    autoComplete="current-password"
                    {...register('password')}
                    value={passwordValue}
                    onChange={(e) => setValue('password', e.target.value)}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                      e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = (error || errors.password) ? colors.error : colors.backgroundTertiary + '40';
                      e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                    }}
                  />

                  {/* Show/Hide Password Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 p-1 hover:opacity-70 transition-opacity"
                    style={{ color: colors.backgroundTertiary }}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
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
                    ) : (
                      <svg
                        className="w-5 h-5"
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
                    )}
                  </button>
                </div>
                {(error && error.includes('password')) || errors.password ? (
                  <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                    {errors.password?.message || error}
                  </p>
                ) : null}
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
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile View - Original Layout */}
      <div className="md:hidden flex flex-col h-full">
        {/* Status Bar Area (for mobile) */}
        <div className="h-6" style={{ backgroundColor: colors.backgroundPrimary }}></div>

        {/* Header Section - Dark Background with Wave Graphics */}
        <div
          className="relative flex-1 flex flex-col justify-center px-6 pb-8"
          style={{
            backgroundColor: colors.backgroundTertiary,
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
              Admin Login
            </h1>
            <p className="text-base leading-relaxed" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
              Enter your credentials to access the admin panel.
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
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
            {/* Title */}
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.backgroundTertiary }}>
              Sign in
            </h2>

            {/* Email Input Field */}
            <div className="mb-4">
              <div
                className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: (error || errors.email) ? colors.error : colors.backgroundTertiary + '40',
                  backgroundColor: colors.backgroundPrimary
                }}
              >
                {/* Email Icon */}
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
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: colors.backgroundTertiary }}
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  value={emailValue}
                  onChange={(e) => setValue('email', e.target.value)}
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                    e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.borderColor = (error || errors.email) ? colors.error : colors.backgroundTertiary + '40';
                    e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                  }}
                />
              </div>
              {(error && error.includes('email')) || errors.email ? (
                <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                  {errors.email?.message || error}
                </p>
              ) : null}
            </div>

            {/* Password Input Field */}
            <div className="mb-4">
              <div
                className="relative flex items-center px-4 py-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: (error || errors.password) ? colors.error : colors.backgroundTertiary + '40',
                  backgroundColor: colors.backgroundPrimary
                }}
              >
                {/* Lock Icon */}
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

                {/* Input */}
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: colors.backgroundTertiary }}
                  autoComplete="current-password"
                  {...register('password')}
                  value={passwordValue}
                  onChange={(e) => setValue('password', e.target.value)}
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = colors.backgroundTertiary;
                    e.target.parentElement.style.backgroundColor = colors.backgroundSecondary;
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.borderColor = (error || errors.password) ? colors.error : colors.backgroundTertiary + '40';
                    e.target.parentElement.style.backgroundColor = colors.backgroundPrimary;
                  }}
                />

                {/* Show/Hide Password Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword((prev) => !prev);
                  }}
                  className="ml-2 p-1 hover:opacity-70 transition-opacity"
                  style={{ color: colors.backgroundTertiary }}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
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
                  ) : (
                    <svg
                      className="w-5 h-5"
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
                  )}
                </button>
              </div>
              {(error && error.includes('password')) || errors.password ? (
                <p className="text-xs mt-1 ml-1" style={{ color: colors.error }}>
                  {errors.password?.message || error}
                </p>
              ) : null}
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
