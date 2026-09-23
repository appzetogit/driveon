import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { requestForToken, onMessageListener, isMobileApp } from '../services/firebase';
import api from '../services/api';
import toastUtils from '../config/toast';

const parseWorkHoursToSeconds = (str) => {
  if (!str || str === '-') return 0;
  const match = str.match(/(\d+)h\s*(\d+)m/);
  if (match) {
    return (parseInt(match[1], 10) * 3600) + (parseInt(match[2], 10) * 60);
  }
  const hoursMatch = str.match(/(\d+)h/);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 3600;
  }
  const minsMatch = str.match(/(\d+)m/);
  if (minsMatch) {
    return parseInt(minsMatch[1], 10) * 60;
  }
  return 0;
};

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  // Initialize state from localStorage or default
  const [clockedIn, setClockedIn] = useState(() => {
    const saved = localStorage.getItem('emp_clocked_in');
    return saved === 'true';
  });

  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem('emp_start_time');
    return saved ? parseInt(saved) : null;
  });

  const [accumulatedSeconds, setAccumulatedSeconds] = useState(() => {
    const saved = localStorage.getItem('emp_accumulated_seconds');
    return saved ? parseInt(saved) : 0;
  });

  const [attendanceStatus, setAttendanceStatus] = useState(() => {
    return localStorage.getItem('emp_attendance_status') || '—';
  });

  const [attendanceDays, setAttendanceDays] = useState(() => {
    // Dynamic days in current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  });

  const [checkedOutToday, setCheckedOutToday] = useState(() => {
    const savedDate = localStorage.getItem('emp_checked_out_date');
    const todayStr = new Date().toDateString();
    return savedDate === todayStr;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useSelector(state => state.user);

  const fetchUnreadCount = async () => {
    try {
      if (!user) return;
      // Dynamic import to avoid circular dependency or early loading issues
      const { notificationService } = await import('../services/notification.service');
      const res = await notificationService.getNotifications();
      if (res.success) {
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Notification Sync & Listener
  useEffect(() => {
    if (user && (user._id || user.id)) {
      fetchUnreadCount();

      // Request and Save Token
      requestForToken().then(async (token) => {
        if (token) {
          const platform = isMobileApp() ? 'mobile' : 'web';
          try {
            await api.post('/auth/staff-fcm-token', {
              fcmToken: token,
              platform: platform
            });
            console.log(`FCM Token saved for staff (${platform})`);
          } catch (error) {
            console.error("Error saving FCM token:", error);
          }
        }
      });

      // Listen for foreground messages
      const unsubscribe = onMessageListener((payload) => {
        const cleanTitle = payload.notification.title?.replace('💰 ', '');
        toastUtils.info(`🔔 ${cleanTitle}: ${payload.notification.body}`);
        console.log("Foreground Notification:", payload);
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [user]);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('emp_clocked_in', clockedIn);
    if (startTime) {
      localStorage.setItem('emp_start_time', startTime.toString());
    } else {
      localStorage.removeItem('emp_start_time');
    }
    localStorage.setItem('emp_accumulated_seconds', accumulatedSeconds.toString());
    localStorage.setItem('emp_attendance_status', attendanceStatus);
    if (checkedOutToday) {
      localStorage.setItem('emp_checked_out_date', new Date().toDateString());
    } else {
      localStorage.removeItem('emp_checked_out_date');
    }
  }, [clockedIn, startTime, accumulatedSeconds, attendanceStatus, attendanceDays, checkedOutToday]);

  // Sync attendance to backend when app loads and restore state dynamically
  const syncTodayAttendanceStatus = async (staffId) => {
    if (!staffId) return;
    try {
      // 1. Fetch current settings first
      const settingsRes = await api.get('/crm/attendance/settings');
      let officeEndTimeStr = '06:00 PM';
      if (settingsRes.data && settingsRes.data.success) {
        officeEndTimeStr = settingsRes.data.data.officeEndTime || '06:00 PM';
      }

      // 2. Fetch today's attendance records for this staff
      const response = await api.get(`/crm/attendance?staffId=${staffId}`);
      if (response.data && response.data.success) {
        const records = response.data.data.records || [];
        const todayStr = new Date().toDateString();
        
        // Find if there is a record for today
        const todayRecord = records.find(r => new Date(r.date).toDateString() === todayStr);

        if (todayRecord) {
          // User has checked in / has a record today
          setAttendanceStatus(todayRecord.status);
          
          // Sync clockedIn state with database record: if inTime is present and outTime is not, they are clocked in!
          if (todayRecord.inTime && (!todayRecord.outTime || todayRecord.outTime === '-')) {
            setClockedIn(true);
            setCheckedOutToday(false);
            // Parse inTime and set startTime
            const [timeStr, modifier] = todayRecord.inTime.split(' ');
            let [hours, minutes] = timeStr.split(':');
            let hr = parseInt(hours, 10);
            const mins = parseInt(minutes, 10);
            if (modifier === 'PM' && hr < 12) hr += 12;
            if (modifier === 'AM' && hr === 12) hr = 0;
            const inDate = new Date();
            inDate.setHours(hr, mins, 0, 0);
            setStartTime(inDate.getTime());
            setAccumulatedSeconds(0);
          } else if (todayRecord.inTime && todayRecord.outTime && todayRecord.outTime !== '-') {
            setClockedIn(false);
            setCheckedOutToday(true);
            setStartTime(null);
            if (todayRecord.workHours) {
              const seconds = parseWorkHoursToSeconds(todayRecord.workHours);
              setAccumulatedSeconds(seconds);
            } else {
              setAccumulatedSeconds(0);
            }
          } else {
            setClockedIn(false);
            setCheckedOutToday(false);
            setStartTime(null);
            setAccumulatedSeconds(0);
          }
        } else {
          // No record today - check if current time is past office end time
          const now = new Date();
          
          // Parse officeEndTime, e.g. "06:00 PM"
          const parts = officeEndTimeStr.split(' ');
          let endHr = 18;
          let endMin = 0;
          if (parts.length === 2) {
            const [timeStr, modifier] = parts;
            let [hours, minutes] = timeStr.split(':');
            endHr = parseInt(hours, 10);
            endMin = parseInt(minutes, 10);
            if (modifier === 'PM' && endHr < 12) endHr += 12;
            if (modifier === 'AM' && endHr === 12) endHr = 0;
          }
          
          const shiftEnd = new Date();
          shiftEnd.setHours(endHr, endMin, 0, 0);

          if (now > shiftEnd) {
            setAttendanceStatus('Absent');
          } else {
            setAttendanceStatus('—'); // Shows black "—" before check-in or end time
          }
          
          setClockedIn(false);
          setCheckedOutToday(false);
          setStartTime(null);
          setAccumulatedSeconds(0);
        }
      }
    } catch (error) {
      console.error('Error syncing today attendance status:', error);
    }
  };

  useEffect(() => {
    const staffId = user?._id || user?.id;
    if (staffId) {
      syncTodayAttendanceStatus(staffId);
    }
  }, [user]); // Run when user data becomes available

  // Handle automatic midnight transition and day changes
  useEffect(() => {
    let lastCheckedDate = new Date().toDateString();
    
    const interval = setInterval(() => {
      const todayStr = new Date().toDateString();
      if (todayStr !== lastCheckedDate) {
        console.log("📅 Day transitioned to a new day. Resetting checkedOutToday.");
        lastCheckedDate = todayStr;
        setCheckedOutToday(false);
        setClockedIn(false);
        setStartTime(null);
        setElapsedSeconds(0);
        
        // Fetch new day status
        const staffId = user?._id || user?.id;
        if (staffId) {
          syncTodayAttendanceStatus(staffId);
        }
      }
    }, 30000); // Check every 30 seconds for quick transition
    
    return () => clearInterval(interval);
  }, [user]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (clockedIn && startTime) {
      // Calculate initial elapsed time
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));

      timer = setInterval(() => {
        const currentNow = Date.now();
        setElapsedSeconds(Math.floor((currentNow - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [clockedIn, startTime]);

  const handleClockToggle = async () => {
    if (checkedOutToday) {
      console.log("Already checked out today, action disabled");
      return;
    }
    const staffId = user?._id || user?.id;

    if (clockedIn) {
      // Clock Out
      setClockedIn(false);
      setCheckedOutToday(true);
      // Add current session time to accumulated total
      const sessionSeconds = elapsedSeconds;
      setAccumulatedSeconds(prev => prev + sessionSeconds);
      setStartTime(null);
      setElapsedSeconds(0);

      // Save check-out to backend
      if (staffId) {
        try {
          const now = new Date();
          const outTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const totalSecs = accumulatedSeconds + sessionSeconds;
          const hours = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const workHours = `${hours}h ${mins}m`;

          await api.post('/crm/attendance', {
            staffId,
            date: now.toISOString(),
            status: attendanceStatus === 'Absent' ? 'Present' : attendanceStatus,
            outTime,
            workHours,
          });
          console.log('✅ Check-out saved to backend');
        } catch (error) {
          console.error('❌ Error saving check-out to backend:', error);
        }
      }
    } else {
      // Clock In
      setClockedIn(true);
      setCheckedOutToday(false);
      setStartTime(Date.now());
      setElapsedSeconds(0);

      // Determine attendance status
      let newStatus = 'Present';
      const now = new Date();

      try {
        const settingsRes = await api.get('/crm/attendance/settings');
        if (settingsRes.data && settingsRes.data.success) {
          const { officeStartTime, lateGracePeriod = 15 } = settingsRes.data.data;
          const parts = officeStartTime.split(' ');
          if (parts.length === 2) {
            const [timeStr, modifier] = parts;
            let [hours, minutes] = timeStr.split(':');
            let hr = parseInt(hours, 10);
            const mins = parseInt(minutes, 10);

            if (modifier === 'PM' && hr < 12) hr += 12;
            if (modifier === 'AM' && hr === 12) hr = 0;

            const shiftStart = new Date();
            shiftStart.setHours(hr, mins, 0, 0);

            const graceThreshold = new Date(shiftStart.getTime() + (Number(lateGracePeriod) || 0) * 60000);
            if (now > graceThreshold) {
              newStatus = 'Late';
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings for late detection, falling back to 10:00 AM:", err);
        const shiftStart = new Date();
        shiftStart.setHours(10, 0, 0, 0); // 10:00 AM
        if (now > shiftStart) {
          newStatus = 'Late';
        }
      }

      if (attendanceStatus === 'Absent' || attendanceStatus === '—') {
        setAttendanceStatus(newStatus);
      }

      // Save check-in to backend
      if (staffId) {
        try {
          const inTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          await api.post('/crm/attendance', {
            staffId,
            date: now.toISOString(),
            status: newStatus,
            inTime,
          });
          console.log('✅ Check-in saved to backend');
        } catch (error) {
          console.error('❌ Error saving check-in to backend:', error);
        }
      }
    }
  };

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTotalHours = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  return (
    <EmployeeContext.Provider value={{
      clockedIn,
      startTime,
      elapsedSeconds,
      accumulatedSeconds,
      attendanceStatus,
      attendanceDays,
      unreadCount,
      checkedOutToday,
      setUnreadCount,
      fetchUnreadCount,
      handleClockToggle,
      formatDuration,
      formatTotalHours
    }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};
