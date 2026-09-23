import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const EmployeeResetPasswordPage = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(`/auth/staff-reset-password/${token}`, {
                password: formData.password
            });

            if (response.data.success) {
                toast.success('Password reset successfully');
                navigate('/employee/login');
            }
        } catch (error) {
            console.error('Reset error:', error);
            toast.error(error.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Abstract Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 opacity-50 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 p-8 md:p-10 relative z-10 border border-white/50 backdrop-blur-sm"
            >
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-[#1C205C] tracking-tighter italic">
                        Drive<span className="text-blue-500">On</span>
                    </h1>
                    <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mt-1">Employee Portal</p>
                </div>

                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                    <p className="text-gray-400 text-sm mt-1">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* New Password */}
                        <div className="relative group">
                            <FiLock className="absolute left-0 top-3.5 text-gray-400 group-focus-within:text-[#1C205C] transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="New Password"
                                className="w-full pl-8 pr-12 py-3 bg-transparent border-b border-gray-200 focus:border-[#1C205C] outline-none transition-colors placeholder:text-gray-300 text-gray-700 font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                            >
                                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative group">
                            <FiLock className="absolute left-0 top-3.5 text-gray-400 group-focus-within:text-[#1C205C] transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Confirm Password"
                                className="w-full pl-8 pr-12 py-3 bg-transparent border-b border-gray-200 focus:border-[#1C205C] outline-none transition-colors placeholder:text-gray-300 text-gray-700 font-medium"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-[#1C205C] text-white py-4 rounded-xl font-bold shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 group mt-8"
                    >
                        <span>{loading ? 'RESETTING...' : 'RESET PASSWORD'}</span>
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default EmployeeResetPasswordPage;
