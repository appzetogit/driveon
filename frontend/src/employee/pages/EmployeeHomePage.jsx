import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, parseISO, format } from 'date-fns';
import {
  FiHome, FiUsers, FiCheckSquare, FiUser, FiBell, FiMenu,
  FiClock, FiActivity, FiPhone, FiTarget, FiBriefcase, FiArrowRight,
  FiCalendar, FiFileText, FiPieChart, FiMapPin, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { BiTask, BiTimeFive } from 'react-icons/bi';
import { FaUserFriends } from 'react-icons/fa';
import BottomNav from '../components/BottomNav';
import api from '../../services/api';

// Theme Colors
const THEME_COLOR = "#1C205C";
// Using the reference image style: deep blue header with curve
const GRADIENT_HEADER = "linear-gradient(135deg, #1C205C 0%, #0f1642 100%)";

import { useEmployee } from '../../context/EmployeeContext';

import { getCurrentPosition, getAddressFromCoordinates, watchPosition, clearWatch, updateUserLocation } from '../../services/location.service';
import { requestForToken, onMessageListener } from '../../services/firebase';
import toastUtils from '../../config/toast';

const EmployeeHomePage = () => {
  const navigate = useNavigate();

  // Helper to get clean 2-letter initials from name
  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const {
    clockedIn,
    elapsedSeconds,
    handleClockToggle,
    formatDuration,
    accumulatedSeconds,
    attendanceStatus,
    attendanceDays,
    formatTotalHours,
    unreadCount,
    fetchUnreadCount,
    setUnreadCount,
    checkedOutToday
  } = useEmployee();
  const [time, setTime] = useState(new Date());
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [todayHoliday, setTodayHoliday] = useState(null); // { date, reason } if today is holiday

  // Fetch holidays and check if today is one
  useEffect(() => {
    const checkTodayHoliday = async () => {
      try {
        const res = await api.get('/crm/attendance/holidays');
        if (res.data?.success) {
          const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          const holiday = res.data.data.find(h => {
            // Compare date strings (stored as YYYY-MM-DD)
            const hStr = typeof h.date === 'string' ? h.date.split('T')[0] : new Date(h.date).toISOString().split('T')[0];
            return hStr === todayStr;
          });
          setTodayHoliday(holiday || null);
        }
      } catch (e) {
        console.error('Error fetching holidays:', e);
      }
    };
    checkTodayHoliday();
  }, []);

  const handleClockClick = () => {
    if (checkedOutToday) return;
    if (clockedIn) {
      setShowCheckoutConfirm(true);
    } else {
      handleClockToggle();
    }
  };

  // Get user data from Redux
  const { user, isInitializing } = useSelector(state => ({
    user: state.user.user,
    isInitializing: state.auth.isInitializing
  }));

  // Live Location State
  const [locationState, setLocationState] = useState({
    lat: null,
    lng: null,
    address: "Fetching Live Location..."
  });

  const [quickStatsCounts, setQuickStatsCounts] = useState({ enquiries: 0, pending: 0, closed: 0, converted: 0 });
  const [teamPresenceData, setTeamPresenceData] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    activeStaff: []
  });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Live Location Tracking
  useEffect(() => {
    let watchId;
    let lastLat = 0;
    let lastLng = 0;

    const handlePositionSuccess = async (position) => {
      const { latitude, longitude } = position.coords;

      // Only reverse geocode if moved significantly (approx 10-20 meters) to save API calls
      // 0.0002 degrees is roughly 20 meters
      const dist = Math.sqrt(Math.pow(latitude - lastLat, 2) + Math.pow(longitude - lastLng, 2));

      if (dist > 0.0002 || lastLat === 0) {
        lastLat = latitude;
        lastLng = longitude;

        // Update state with coords immediately
        setLocationState(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));

        // Fetch new address
        const address = await getAddressFromCoordinates(latitude, longitude);
        setLocationState(prev => ({
          lat: latitude,
          lng: longitude,
          address: address || "Address Unavailable"
        }));

        // Send to Backend to update DB
        await updateUserLocation(latitude, longitude, address);
      } else {
        // Just update coords if small movement
        setLocationState(prev => ({ ...prev, lat: latitude, lng: longitude }));
      }
    };

    const handlePositionError = (error) => {
      console.error("Location watch error:", error);
      setLocationState(prev => ({
        ...prev,
        address: "Location access denied or unavailable."
      }));
    };

    // Start watching position
    watchId = watchPosition(handlePositionSuccess, handlePositionError);

    return () => {
      if (watchId !== null) clearWatch(watchId);
    };
  }, []);

  // Fetch Enquiry Stats
  useEffect(() => {
    const fetchStats = async () => {
      const userId = user?._id || user?.id;
      if (!userId) return;
      try {
        const response = await api.get(`/crm/enquiries?assignedTo=${userId}`);
        if (response.data.success) {
          const allEnquiries = response.data.data.enquiries;
          const total = allEnquiries.length;
          const pending = allEnquiries.filter(e => ['New', 'In Progress', 'Follow-up'].includes(e.status)).length;
          const closed = allEnquiries.filter(e => e.status === 'Closed').length;
          const converted = allEnquiries.filter(e => e.status === 'Converted').length;

          setQuickStatsCounts({ enquiries: total, pending, closed, converted });
        }
      } catch (error) {
        console.error('Error fetching enquiry stats:', error);
      }
    };
    if (user) {
      fetchStats();
    }
    fetchTeamPresence(); // Fetch team presence
  }, [user]);

  const fetchTeamPresence = async () => {
    try {
      const response = await api.get('/crm/team-presence');
      if (response.data.success) {
        setTeamPresenceData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching team presence:', error);
    }
  };

  // FCM Notification Setup (Now handled globally in EmployeeContext)
  useEffect(() => {
    // Logic moved to context for global real-time updates
  }, [user]);

  // Role Checker Flags
  const role = user?.role || '';
  const roleLower = role.toLowerCase();
  const isDriver = roleLower === 'driver' || roleLower.includes('driver');
  const isTelecaller = roleLower === 'telecaller' || roleLower === 'tellecaller';
  const isAccountantOrHR = roleLower.includes('account') || roleLower.includes('hr') || roleLower.includes('admin') || roleLower.includes('executive');

  const [driverBookingsCount, setDriverBookingsCount] = useState({ total: 0, pending: 0, active: 0, completed: 0 });

  useEffect(() => {
    if (isDriver) {
      const fetchDriverBookings = async () => {
        try {
          const res = await api.get('/bookings/driver/assigned');
          if (res.data?.success) {
            const bookingsList = res.data.data.bookings || [];
            const total = bookingsList.length;
            const pending = bookingsList.filter(b => (b.status === 'confirmed' || b.status === 'pending') && (b.tripStatus === 'not_started' || !b.tripStatus)).length;
            const active = bookingsList.filter(b => (b.status === 'active' || ['started', 'picked_up', 'ongoing'].includes(b.tripStatus)) && b.tripStatus !== 'completed').length;
            const completed = bookingsList.filter(b => b.status === 'completed' || b.tripStatus === 'completed').length;
            setDriverBookingsCount({ total, pending, active, completed });
          }
        } catch (e) {
          console.error('Error fetching driver bookings on home:', e);
        }
      };
      fetchDriverBookings();
    }
  }, [user, isDriver]);

  const [personalAttendanceCounts, setPersonalAttendanceCounts] = useState({
    present: 0,
    late: 0,
    absent: 0,
    leave: 0
  });

  useEffect(() => {
    if (isAccountantOrHR) {
      const fetchPersonalAttendance = async () => {
        try {
          const userId = user?._id || user?.id;
          if (!userId) return;
          const [response, holidaysRes] = await Promise.all([
            api.get(`/crm/attendance?staffId=${userId}`),
            api.get('/crm/attendance/holidays')
          ]);
          if (response.data?.success) {
            const records = response.data.data.records || [];
            const formatted = records.map(r => ({
              date: new Date(r.date),
              status: r.status || 'Present',
            }));
            const holidaysList = holidaysRes.data?.success ? holidaysRes.data.data : [];
            const combined = [...formatted];
            
            // Build holidays map for quick lookup
            const holidaysMap = {};
            holidaysList.forEach(h => {
              holidaysMap[new Date(h.date).toDateString()] = h.reason;
            });

            // Process holidays on combined list
            holidaysList.forEach(h => {
              const hDate = new Date(h.date);
              const exists = combined.some(r => r.date.toDateString() === hDate.toDateString());
              if (!exists) {
                combined.push({ date: hDate, status: 'Holiday' });
              } else {
                const idx = combined.findIndex(r => r.date.toDateString() === hDate.toDateString());
                combined[idx].status = 'Holiday';
              }
            });

            // Add implicit absent days for current month up to yesterday/today
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);

            const joinDate = user.joiningDate || user.joinDate || user.createdAt || new Date();
            const startOfJoin = new Date(joinDate);
            startOfJoin.setHours(0,0,0,0);

            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
              const compDate = new Date(currentYear, currentMonth, day);
              compDate.setHours(0,0,0,0);

              if (compDate < todayDate) {
                const dayOfWeek = compDate.getDay();
                const dateStr = compDate.toDateString();
                const hasRecord = combined.some(r => r.date.toDateString() === dateStr);

                if (!hasRecord && dayOfWeek !== 0 && compDate >= startOfJoin && !holidaysMap[dateStr]) {
                  combined.push({ date: compDate, status: 'Absent' });
                }
              }
            }

            // Filter records for the current month
            const currentMonthRecords = combined.filter(r => {
              return r.date.getFullYear() === currentYear && r.date.getMonth() === currentMonth;
            });

            // Count statuses
            const present = currentMonthRecords.filter(r => r.status === 'Present').length;
            const late = currentMonthRecords.filter(r => r.status === 'Late').length;
            const absent = currentMonthRecords.filter(r => r.status === 'Absent').length;
            const leave = currentMonthRecords.filter(r => r.status === 'Leave' || r.status === 'Leaves').length;

            setPersonalAttendanceCounts({ present, late, absent, leave });
          }
        } catch (error) {
          console.error('Error fetching personal attendance:', error);
        }
      };
      fetchPersonalAttendance();
    }
  }, [user, isAccountantOrHR]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening,";
  };



  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 50 }
    }
  };

  const [targetsData, setTargetsData] = useState({
    daily: { total: 0, current: 0 },
    highPriority: { total: 0, current: 0 },
    score: 0
  });
  const [ongoingTask, setOngoingTask] = useState(null);

  // Fetch Tasks for Targets
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || (!user._id && !user.id)) return;
      try {
        const userId = user._id || user.id;
        const response = await api.get(`/crm/staff-tasks?assignedTo=${userId}`);
        if (response.data.success) {
          const tasks = response.data.data.tasks;

          // Daily Goals (Tasks due today)
          const dailyTasks = tasks.filter(t => isToday(parseISO(t.dueDate)));
          const dailyTotal = dailyTasks.length;
          const dailyCompleted = dailyTasks.filter(t => t.status === 'Done').length;

          // High Priority (Tasks with priority High) - Active or Completed Recently
          // For targets, usually we track all current active + completed recently.
          // Let's count ALL High priority tasks assigned to this user that are due Today or Future (or just all valid tasks)
          const highPriorityTasks = tasks.filter(t => t.priority === 'High');
          const highTotal = highPriorityTasks.length;
          const highCompleted = highPriorityTasks.filter(t => t.status === 'Done').length;

          // Score Calculation (Simple avg of completion rates)
          let score = 0;
          if (dailyTotal > 0 || highTotal > 0) {
            const dailyRate = dailyTotal > 0 ? (dailyCompleted / dailyTotal) : 0;
            const highRate = highTotal > 0 ? (highCompleted / highTotal) : 0;
            // If both exist, avg them. If only one, use that.
            if (dailyTotal > 0 && highTotal > 0) score = ((dailyRate + highRate) / 2) * 100;
            else if (dailyTotal > 0) score = dailyRate * 100;
            else score = highRate * 100;
          }

          setTargetsData({
            daily: { total: dailyTotal, current: dailyCompleted },
            highPriority: { total: highTotal, current: highCompleted },
            score: Math.round(score)
          });

          // Determine Ongoing Priority Task
          const pendingTasks = tasks.filter(t => t.status !== 'Done');
          const priorityWeights = { Critical: 3, High: 2, Medium: 1, Low: 0 };

          // Sort by Priority Desc, then Due Date Asc
          pendingTasks.sort((a, b) => {
            const pA = priorityWeights[a.priority] || 0;
            const pB = priorityWeights[b.priority] || 0;
            if (pB !== pA) return pB - pA; // Higher priority first
            return new Date(a.dueDate) - new Date(b.dueDate); // Earlier due date first
          });

          if (pendingTasks.length > 0) {
            setOngoingTask(pendingTasks[0]);
          } else {
            setOngoingTask(null);
          }
        }
      } catch (error) {
        console.error('Error fetching tasks for targets:', error);
      }
    };
    fetchTasks();
  }, [user]);

  // Dummy Data with dynamic overrides
  const employeeData = {
    name: user?.name || "Team Member",
    role: user?.role || "Employee",
    department: user?.department || "",
    todayHours: "06h 42m",
    status: "On Time",
    targets: {
      calls: { current: targetsData.daily.current, total: targetsData.daily.total, percent: 0 },
      followUps: { current: targetsData.highPriority.current, total: targetsData.highPriority.total, percent: 0 },
      conversions: { current: 1, total: 2, percent: 50 },
      score: targetsData.score
    },
    quickStats: [
      { id: 1, label: "Enquiries", value: quickStatsCounts.enquiries, icon: <FaUserFriends size={20} />, color: "text-green-600", bg: "bg-green-100" },
      { id: 2, label: "Pending", value: quickStatsCounts.pending, icon: <BiTask size={20} />, color: "text-blue-600", bg: "bg-blue-100" },
      { id: 3, label: "Converted", value: quickStatsCounts.converted, icon: <FiCheckSquare size={20} />, color: "text-emerald-500", bg: "bg-emerald-100" },
      { id: 4, label: "Closed", value: quickStatsCounts.closed, icon: <FiBell size={20} />, color: "text-orange-500", bg: "bg-orange-100" },
    ],
    // Remove hardcoded teamPresence, we now use teamPresenceData state
    projects: [
      { id: 1, title: "Calls Target", subtitle: "Daily Goal", status: "Ongoing", color: "bg-blue-50", iconColor: "text-blue-600" },
      { id: 2, title: "Follow-ups", subtitle: "High Priority", status: "In Process", color: "bg-indigo-50", iconColor: "text-indigo-600" },
    ],
    upcomingTasks: [
      { id: 1, title: "Candidate Management", subtitle: "For - Zoho Project", progress: 88, due: "June 6, 2022" },
    ]
  };

  if (isInitializing || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4">
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
          style={{ borderColor: THEME_COLOR }}
        ></div>
        <p className="text-[#1C205C] font-medium">Initializing...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F7FA] font-sans selection:bg-blue-100"
    >
      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        <div className="relative z-30">
        {/* HEADER SECTION - Curved & Clean */}
        <motion.div
          variants={itemVariants}
          className={`text-white pt-10 ${isDriver ? 'pb-12' : 'pb-24'} rounded-b-[40px] relative overflow-hidden shadow-xl`}
          style={{ background: GRADIENT_HEADER }}
        >
          <div className="px-6 relative z-10 flex justify-between items-start">
            <div className="flex flex-col text-left">
              <span className="text-blue-100 text-sm font-medium mb-1 tracking-wide">{getGreeting()}</span>
              <h1 className="text-3xl font-bold tracking-tight">{employeeData.name}</h1>
              <div className="flex items-center gap-2 mt-2 opacity-90 text-xs font-medium">
                <span className="bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">{employeeData.role}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/employee/notifications')}
                className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-lg shadow-blue-900/20 relative"
              >
                <FiBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1C205C]"></span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
        </motion.div>

        {/* OVERLOGGING CARD - "Working Time" Style */}
        {!isDriver && (
          <div className="px-6 -mt-16 relative z-40">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-white"
            >
              {/* Top Row: Time on Left, Check In/Out Button on Right */}
              <div className="flex justify-between items-center mb-5 gap-3">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-0.5">Current Time</p>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                      {formatTime(time).split(' ')[0]}
                      <span className="text-sm text-gray-400 font-medium ml-1">{formatTime(time).split(' ')[1]}</span>
                    </h2>
                  </div>
                  <p className="text-[11px] text-[#1C205C]/70 font-bold mt-1.5 flex items-center gap-1 tracking-wide">
                    <FiCalendar className="text-[#1C205C]" size={12} />
                    {format(time, 'EEEE, d MMMM yyyy')}
                  </p>
                </div>

                {/* Clock Out/In Button — hidden on holidays */}
                {todayHoliday ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl shrink-0">
                    <span className="text-lg">🎉</span>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none">Holiday</p>
                      <p className="text-sm font-black text-red-600 leading-tight">{todayHoliday.reason}</p>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    whileTap={checkedOutToday ? undefined : { scale: 0.95 }}
                    disabled={checkedOutToday}
                    onClick={handleClockClick}
                    className={`${checkedOutToday ? 'bg-gray-400 cursor-not-allowed opacity-70' : clockedIn ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'} 
                        text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap`}
                  >
                    <FiClock />
                    {checkedOutToday ? 'Checked Out' : clockedIn ? 'Check Out' : 'Check In'}
                  </motion.button>
                )}
              </div>

              {/* Bottom Row: Timer & Full-Width Address */}
              <div className="space-y-3 mb-6 pt-4 border-t border-gray-100">
                {/* Timer Display */}
                <div className="px-3 py-1.5 bg-blue-50/80 rounded-lg border border-blue-100 w-fit">
                  <p className="text-blue-500 text-[9px] font-bold uppercase tracking-wider mb-0 leading-none">Session Timer</p>
                  <div className="text-lg font-mono font-bold text-blue-700 flex items-center gap-1.5 mt-0.5 leading-none">
                    <FiActivity className={`${clockedIn ? 'animate-pulse' : ''}`} size={14} />
                    {formatDuration(elapsedSeconds)}
                  </div>
                </div>

                {/* Live Location Full-Width */}
                <div className="flex items-start gap-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
                  <FiMapPin className="text-blue-500 mt-0.5 shrink-0" size={14} />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 font-bold leading-relaxed break-words">{locationState.address}</p>
                  </div>
                </div>
              </div>

              {/* Stats Row within Card */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <span className="block text-xl font-bold text-gray-800">
                    {formatTotalHours(accumulatedSeconds + (clockedIn ? elapsedSeconds : 0))}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Hours</span>
                </div>
                <div className="text-center border-l border-gray-100">
                  <span className={`block text-xl font-bold ${
                    todayHoliday ? 'text-rose-500' :
                    attendanceStatus === 'Late' ? 'text-amber-500' : 
                    attendanceStatus === 'Absent' ? 'text-rose-500' : 
                    attendanceStatus === '—' ? 'text-gray-400' : 'text-emerald-500'
                  }`}>
                    {todayHoliday ? 'Holiday' : (attendanceStatus === 'Late' ? 'Present (Late)' : attendanceStatus)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Status</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Dynamic Quick Overview based on role */}
      <div className="px-6 mt-8 space-y-8">
        <motion.div variants={itemVariants}>
          <h3 className="text-gray-800 font-bold text-lg mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {isDriver ? (
              // Driver Specific Stats
              [
                { id: 1, label: "All Trips", value: driverBookingsCount.total, icon: <FiBriefcase size={20} />, color: "text-indigo-600", bg: "bg-indigo-100", tab: 'All' },
                { id: 2, label: "Assigned", value: driverBookingsCount.pending, icon: <FiClock size={20} />, color: "text-blue-600", bg: "bg-blue-100", tab: 'Pending' },
                { id: 3, label: "Active", value: driverBookingsCount.active, icon: <FiActivity size={20} />, color: "text-emerald-500", bg: "bg-emerald-100", tab: 'Active' },
                { id: 4, label: "Completed", value: driverBookingsCount.completed, icon: <FiCheckSquare size={20} />, color: "text-gray-500", bg: "bg-gray-100", tab: 'Completed' },
              ].map((stat) => (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  key={stat.id}
                  onClick={() => navigate('/employee/bookings', { state: { activeTab: stat.tab } })}
                  className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-gray-800">{stat.label}</span>
                    <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                </motion.div>
              ))
            ) : isAccountantOrHR ? (
              // Accountant / HR Specific Stats: Present (On Time), Present (Late), Absent, On Leave
              [
                { id: 1, label: "Present (On Time)", value: personalAttendanceCounts.present, icon: <FiCheckCircle size={20} />, color: "text-emerald-600", bg: "bg-emerald-100" },
                { id: 2, label: "Present (Late)", value: personalAttendanceCounts.late, icon: <FiClock size={20} />, color: "text-amber-500", bg: "bg-amber-100" },
                { id: 3, label: "Absent", value: personalAttendanceCounts.absent, icon: <FiXCircle size={20} />, color: "text-rose-500", bg: "bg-rose-100" },
                { id: 4, label: "On Leave", value: personalAttendanceCounts.leave, icon: <FiCalendar size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map((stat) => (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  key={stat.id}
                  onClick={() => navigate('/employee/attendance')}
                  className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-gray-800 text-xs">{stat.label}</span>
                    <span className={`text-xs font-extrabold ${stat.color}`}>{stat.value}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              // Telecaller (or default fallback) Specific Stats
              employeeData.quickStats.map((stat) => (
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  key={stat.id}
                  onClick={() => {
                    let tab = 'All';
                    if (stat.label === 'Pending') tab = 'Pending';
                    if (stat.label === 'Closed') tab = 'Closed';
                    if (stat.label === 'Converted') tab = 'Converted';
                    navigate('/employee/enquiries', { state: { activeTab: tab } });
                  }}
                  className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm border border-gray-50 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    {stat.icon}
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-gray-800">{stat.label}</span>
                    <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      </div>

      <BottomNav />

      {/* Checkout Confirmation Modal */}
      <AnimatePresence>
        {showCheckoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutConfirm(false)}
              className="absolute inset-0 bg-[#1C205C]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiClock className="text-amber-500" size={36} />
                </div>
                <h3 className="text-2xl font-black text-[#1C205C] mb-3">Check Out?</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  Are you sure you want to end your shift? Your session timer will be saved to your attendance logs.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      handleClockToggle();
                      setShowCheckoutConfirm(false);
                    }}
                    className="w-full bg-[#1C205C] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Confirm Check Out
                  </button>
                  <button
                    onClick={() => setShowCheckoutConfirm(false)}
                    className="w-full bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmployeeHomePage;
