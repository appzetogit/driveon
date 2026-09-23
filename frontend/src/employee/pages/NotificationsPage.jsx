import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiClock, FiCheckCircle } from 'react-icons/fi';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import { useEmployee } from '../../context/EmployeeContext';

const NotificationsPage = () => {
  const { setUnreadCount } = useEmployee();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Dynamically import service to ensure api is initialized
      const { notificationService } = await import('../../services/notification.service');
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.unreadCount || 0); // Update context
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0); // Clear context count
      const { notificationService } = await import('../../services/notification.service');
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark read:", error);
      fetchNotifications(); // Revert on failure
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    // Map backend types to icons
    switch (type) {
      case 'alert':
      case 'warning': return <FiClock className="text-amber-600" />; // Keep consistency with previous design or adapt
      // 'enquiry_assigned' -> maybe user icon?
      case 'enquiry_assigned': return <FiInfo className="text-blue-600" />;
      case 'task_assigned': return <FiAlertCircle className="text-purple-600" />;
      case 'success':
      case 'payment_received': return <FiCheckCircle className="text-emerald-600" />;
      case 'info': default: return <FiInfo className="text-blue-600" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'alert':
      case 'warning': return 'bg-amber-100';
      case 'success':
      case 'payment_received': return 'bg-emerald-100';
      case 'task_assigned': return 'bg-purple-100';
      case 'info':
      case 'enquiry_assigned':
      default: return 'bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-32 font-sans selection:bg-blue-100 flex flex-col">

      {/* HEADER */}
      <div className="bg-[#1C205C] pt-6 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        <HeaderTopBar title="Notifications" />

        <div className="mt-6 flex justify-between items-end text-white">
          <div>
            <h2 className="text-2xl font-bold">Inbox</h2>
            <p className="text-blue-200 text-sm">You have {notifications.filter(n => !n.isRead).length} unread messages</p>
          </div>
          <button onClick={markAllAsRead} className="text-xs font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1">
            <FiCheck /> Mark all read
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="px-5 -mt-8 z-10 space-y-3 flex-1">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <FiBell size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">No notifications</p>
          </div>
        ) : (
          notifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={notif._id || index}
              className={`p-4 rounded-2xl shadow-sm border flex gap-4 transition-all ${notif.isRead ? 'bg-white border-gray-100 opacity-80' : 'bg-white border-blue-100 shadow-md ring-1 ring-blue-50'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBgColor(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-bold text-sm ${notif.isRead ? 'text-gray-700' : 'text-[#1C205C]'}`}>
                    {notif.title?.replace('💰 ', '')}
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">{formatTime(notif.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                {notif.image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 max-h-48 flex items-center bg-gray-50 cursor-pointer">
                    <img 
                      src={notif.image} 
                      alt="Notification attachment" 
                      onClick={() => setLightboxImage(notif.image)}
                      className="w-full object-cover max-h-48 hover:scale-[1.02] transition-transform duration-200"
                    />
                  </div>
                )}
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
              )}
            </motion.div>
          )))}
      </div>

      {/* Lightbox / Modal View */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Notification attachment zoom" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl mx-auto"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all text-xl font-bold leading-none w-10 h-10 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
