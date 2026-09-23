import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import { toast } from 'react-hot-toast';
import userService from '../../services/user.service';

const PrivacySecurityPage = () => {
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [updating, setUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Both password fields are required');
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setUpdating(true);
    try {
      const response = await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      if (response.success) {
        toast.success(response.message || 'Password updated successfully');
        setPasswords({ currentPassword: '', newPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-32 font-sans selection:bg-blue-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-[#1C205C] pt-6 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        <HeaderTopBar title="Privacy & Security" />
      </div>

      {/* CONTENT */}
      <div className="px-6 -mt-8 z-10 space-y-6 flex-1">

        {/* PASSWORD CHANGE */}
        <SectionContainer title="Change Password" icon={<FiLock />}>
          <div className="space-y-4">
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
            <button
              onClick={handleUpdatePassword}
              disabled={updating}
              className={`w-full bg-[#1C205C] text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] ${updating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
            >
              {updating ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </SectionContainer>

        {/* LEGAL */}
        <SectionContainer title="Legal & Compliance" icon={<FiFileText />}>
          <div className="space-y-2">
            <LinkRow label="Privacy Policy" onClick={() => navigate('/employee/privacy-policy')} />
            <LinkRow label="Terms of Service" onClick={() => navigate('/employee/terms-of-service')} />
          </div>
        </SectionContainer>

      </div>

      <BottomNav />
    </div>
  );
};

const SectionContainer = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
  >
    <div className="flex items-center gap-2 mb-4 text-[#1C205C]">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const PasswordInput = ({ label, placeholder, show, onToggle, value, onChange }) => (
  <div className="relative">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{label}</label>
    <div className="relative group">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 text-[#1C205C] font-bold py-3.5 pl-4 pr-12 rounded-xl border border-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 transition-all placeholder:text-gray-300 placeholder:font-medium"
        placeholder={placeholder}
      />
      <button
        onClick={onToggle}
        className="absolute right-2 top-[55%] -translate-y-1/2 text-gray-400 hover:text-[#1C205C] p-2 rounded-lg hover:bg-white transition-all active:scale-95"
      >
        {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
  </div>
);

const LinkRow = ({ label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
    <span className="font-bold text-gray-600 text-sm group-hover:text-[#1C205C] transition-colors">{label}</span>
    <span className="text-gray-300 group-hover:text-blue-500 transition-colors">↗</span>
  </button>
);

export default PrivacySecurityPage;
