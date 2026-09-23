import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdNotifications, MdDoneAll, MdInfo, MdWarning, MdError, MdCheckCircle } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import { premiumColors } from '../../theme/colors';
import { notificationService } from '../../services/notification.service';
import { onMessageListener } from '../../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminActive = location.pathname.startsWith('/admin');
  const isCrmActive = location.pathname.startsWith('/crm');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    const setupNotificationListener = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          fetchNotifications();
        }
      } catch (err) {
        console.error('Notification listener error:', err);
      }
    };

    setupNotificationListener();

    // Click outside handler
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning': return <MdWarning className="text-amber-500" />;
      case 'alert': return <MdError className="text-red-500" />;
      case 'success': return <MdCheckCircle className="text-emerald-500" />;
      default: return <MdInfo className="text-blue-500" />;
    }
  };

  return (
    <header
      className="bg-white sticky top-0 z-20 h-16 border-b border-gray-200 px-4 flex items-center justify-between shadow-sm md:ml-64 transition-all duration-300"
      style={{ borderColor: premiumColors.border.light }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 md:hidden"
        >
          <MdMenu size={24} />
        </button>

        {/* Sleek Segmented Switcher for Admin Panel and CRM Panel */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/60">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
              isAdminActive
                ? 'bg-white shadow-md text-[#1C205C] transform scale-100'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
            }`}
            style={isAdminActive ? { color: '#1C205C' } : {}}
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-inherit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Admin Panel</span>
            <span className="sm:hidden">Admin</span>
          </button>
          <button
            onClick={() => navigate('/crm/dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
              isCrmActive
                ? 'bg-white shadow-md text-[#1C205C] transform scale-100'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/40'
            }`}
            style={isCrmActive ? { color: '#1C205C' } : {}}
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-inherit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden sm:inline">CRM Panel</span>
            <span className="sm:hidden">CRM</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600 transition-colors group"
          >
            <MdNotifications size={22} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 text-left"
              >
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <MdDoneAll size={14} /> Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="shrink-0 mt-0.5 text-lg">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-gray-900 truncate ${notif.isRead ? 'font-medium' : ''}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MdNotifications className="text-gray-300 text-2xl" />
                      </div>
                      <p className="text-xs text-gray-400 font-bold">No notifications yet</p>
                    </div>
                  )}
                </div>


              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date Display */}
        <div className="hidden sm:block text-right mr-2">
          <p className="text-xs text-gray-500 font-medium tracking-tight">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
