import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHome, FiUsers, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve logged-in user details from Redux
  const user = useSelector(state => state.user.user);
  const role = user?.role || 'Employee';
  const roleLower = role.toLowerCase();

  const isActive = (path) => location.pathname === path;

  // Determine dynamic tabs based on role
  const isDriver = roleLower === 'driver' || roleLower.includes('driver');
  const isTelecaller = roleLower === 'telecaller' || roleLower === 'tellecaller';
  const isAccountantOrHR = roleLower.includes('account') || roleLower.includes('hr') || roleLower.includes('admin') || roleLower.includes('executive');

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-50 rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
    >
      <NavIcon 
        icon={<FiHome size={22} />} 
        label="Home" 
        active={isActive('/employee')} 
        onClick={() => navigate('/employee')}
      />

      {/* Driver gets 'Bookings', Telecaller gets 'Enquiries', HR/Accountant gets nothing here */}
      {isDriver && (
        <NavIcon 
          icon={<FiBriefcase size={22} />} 
          label="Bookings" 
          active={isActive('/employee/bookings')} 
          onClick={() => navigate('/employee/bookings')}
        />
      )}

      {isTelecaller && (
        <NavIcon 
          icon={<FiUsers size={22} />} 
          label="Enquiries" 
          active={isActive('/employee/enquiries')} 
          onClick={() => navigate('/employee/enquiries')}
        />
      )}
      
      {!isDriver && (
        <NavIcon 
          icon={<FiClock size={22} />} 
          label="Attendance" 
          active={isActive('/employee/attendance')} 
          onClick={() => navigate('/employee/attendance')}
        />
      )}

      <NavIcon 
        icon={<FiUser size={22} />} 
        label="Profile" 
        active={isActive('/employee/profile')} 
        onClick={() => navigate('/employee/profile')}
      />
    </motion.div>
  );
};

const NavIcon = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 ${active ? 'text-[#1C205C]' : 'text-gray-300 hover:text-gray-500'} transition-colors`}
  >
    {icon}
    <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
  </button>
);

export default BottomNav;
