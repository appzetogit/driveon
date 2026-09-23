import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { loginSuccess } from '../../store/slices/authSlice';
import { setUser } from '../../store/slices/userSlice';
import { requestForToken, isMobileApp } from '../../services/firebase';

const EmployeeLoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('login'); // login | forgot-password
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Fetch FCM Token before login API
      console.log("🔑 Attempting to fetch FCM Token for staff login...");
      let fcmToken = null;
      try {
        fcmToken = await requestForToken();
        if (fcmToken) {
          console.log("✅ Staff FCM Token captured:", fcmToken.substring(0, 10) + "...");
        } else {
          console.warn("⚠️ FCM Token not generated (Permission denied or browser block)");
        }
      } catch (err) {
        console.error('❌ Error fetching FCM token for staff:', err);
      }

      // 2. Call staff-login with token
      const response = await api.post('/auth/staff-login', {
        ...formData,
        fcmToken: fcmToken,
        platform: isMobileApp() ? 'mobile' : 'web'
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;

        // Dispatch login success to update auth state
        dispatch(loginSuccess({
          token,
          refreshToken,
          userRole: 'employee'
        }));

        // Dispatch set user to update user profile data
        dispatch(setUser(user));

        toast.success('Login Successful');
        navigate('/employee');
      }
    } catch (error) {
      // Avoid printing technical red stack traces for expected validation/credential failures
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.warn('Login failed: Invalid credentials');
      } else {
        console.error('Login error:', error);
      }
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/staff-forgot-password', { email: forgotEmail });
      if (response.data.success) {
        toast.success('Password reset link sent to your email.');
        setView('login');
        setForgotEmail('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">

      {/* Background Abstract Shapes (Subtle) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 opacity-50 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 p-8 md:p-10 relative z-10 border border-white/50 backdrop-blur-sm"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <h1 className="text-4xl font-black text-[#1C205C] tracking-tighter italic">
              Drive<span className="text-blue-500">On</span>
            </h1>
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mt-1">Employee Portal</p>
          </motion.div>
        </div>

        {/* Welcome Text */}
        {view === 'login' ? (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-400 text-sm mt-1">Please login to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">

              {/* Phone Number */}
              <div className="space-y-1">
                <div className="relative group">
                  <FiPhone className="absolute left-0 top-3.5 text-gray-400 group-focus-within:text-[#1C205C] transition-colors" size={20} />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#1C205C] outline-none transition-colors placeholder:text-gray-300 text-gray-700 font-medium"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="relative group">
                  <FiLock className="absolute left-0 top-3.5 text-gray-400 group-focus-within:text-[#1C205C] transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    className="w-full pl-8 pr-12 py-3 bg-transparent border-b border-gray-200 focus:border-[#1C205C] outline-none transition-colors placeholder:text-gray-300 text-gray-700 font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-xs font-semibold text-[#1C205C] hover:text-blue-600 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#1C205C] text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 group mt-8"
              >
                <span>{loading ? 'LOGGING IN...' : 'LOGIN'}</span>
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
                <p className="text-gray-400 text-sm mt-1">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-1">
                  <div className="relative group">
                    <FiUser className="absolute left-0 top-3.5 text-gray-400 group-focus-within:text-[#1C205C] transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      placeholder="Enter your registered email"
                      className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#1C205C] outline-none transition-colors placeholder:text-gray-300 text-gray-700 font-medium"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-[#1C205C] text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 group mt-6"
                >
                  <span>SEND RESET LINK</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full text-gray-500 text-sm font-bold hover:text-gray-800 transition-colors mt-4"
                >
                  Back to Login
                </button>
              </form>
            </motion.div>
          </>
        )}

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          &copy; {new Date().getFullYear()} DriveOn Systems.
        </p>

      </motion.div>
    </div>
  );
};

export default EmployeeLoginPage;
