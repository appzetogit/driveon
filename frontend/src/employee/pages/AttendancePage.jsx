import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiRefreshCw, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import api from '../../services/api';

import { useEmployee } from '../../context/EmployeeContext';
import { getAddressFromCoordinates, watchPosition, clearWatch, getCurrentPosition } from '../../services/location.service';

// ─── Calendar Modal ───────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusConfig = {
  Present: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white', dot: 'bg-emerald-400' },
  Late:    { bg: 'bg-amber-500',   border: 'border-amber-500',   text: 'text-white', dot: 'bg-amber-400' },
  Absent:  { bg: 'bg-rose-50',     border: 'border-rose-200',    text: 'text-rose-500', dot: 'bg-rose-400' },
  Leave:   { bg: 'bg-indigo-500',  border: 'border-indigo-500',  text: 'text-white', dot: 'bg-indigo-400' },
  Holiday: { bg: 'bg-red-600',     border: 'border-red-600',     text: 'text-white', dot: 'bg-red-400' },
  'Not Joined': { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-400', dot: '' },
  Weekend: { bg: 'bg-red-50',      border: 'border-red-100',     text: 'text-red-400', dot: '' },
  Pending: { bg: 'bg-white',       border: 'border-gray-100',    text: 'text-gray-400', dot: '' },
};

const AttendanceCalendarModal = ({ isOpen, onClose, userId, user }) => {
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [tooltip, setTooltip] = useState(null);
  const [monthData, setMonthData] = useState([]);
  const [fetchingMonth, setFetchingMonth] = useState(false);
  const [showPicker, setShowPicker] = useState(false); // month/year picker panel

  const selectMonthYear = (m, y) => {
    setCalMonth(m);
    setCalYear(y);
    setShowPicker(false);
  };

  // Fetch attendance + holidays whenever the selected month/year changes
  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchMonth = async () => {
      setFetchingMonth(true);
      setTooltip(null);
      try {
        const dateFrom = new Date(calYear, calMonth, 1).toISOString().split('T')[0];
        const dateTo   = new Date(calYear, calMonth + 1, 0).toISOString().split('T')[0];

        const [attRes, holRes] = await Promise.all([
          api.get(`/crm/attendance?staffId=${userId}&dateFrom=${dateFrom}&dateTo=${dateTo}`),
          api.get('/crm/attendance/holidays')
        ]);

        let records = [];
        if (attRes.data.success) {
          records = (attRes.data.data.records || []).map(r => ({
            date: new Date(r.date),
            status: r.status || 'Present',
            checkIn: r.inTime || '--:--',
            checkOut: r.outTime || '--:--',
            reason: ''
          }));
        }

        if (holRes.data?.success) {
          holRes.data.data.forEach(h => {
            const hDate = new Date(h.date);
            if (hDate.getMonth() === calMonth && hDate.getFullYear() === calYear) {
              const idx = records.findIndex(r => r.date.toDateString() === hDate.toDateString());
              if (idx === -1) {
                records.push({ date: hDate, status: 'Holiday', checkIn: '--:--', checkOut: '--:--', reason: h.reason });
              } else {
                records[idx].status = 'Holiday';
                records[idx].reason = h.reason;
              }
            }
          });
        }

        setMonthData(records);
      } catch (err) {
        console.error('Calendar month fetch error:', err);
        setMonthData([]);
      } finally {
        setFetchingMonth(false);
      }
    };
    fetchMonth();
  }, [calMonth, calYear, isOpen, userId]);

  if (!isOpen) return null;


  // Lock: cannot go before current month; can go up to year 2099
  const maxYear = 2099;

  // Left arrow disabled if already at current month or earlier
  const isPrevDisabled =
    calYear < today.getFullYear() ||
    (calYear === today.getFullYear() && calMonth <= today.getMonth());

  // Right arrow disabled only at Dec 2099
  const isNextDisabled = calYear >= maxYear && calMonth >= 11;

  const goToPrev = () => {
    if (isPrevDisabled) return;
    setShowPicker(false);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const goToNext = () => {
    if (isNextDisabled) return;
    setShowPicker(false);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Picker: allow current month up to Dec 2099
  const pickerMaxYear = 2099;

  const joinDate = user?.joinDate || user?.joiningDate || user?.createdAt || null;
  const startOfJoin = joinDate ? new Date(joinDate) : null;
  if (startOfJoin) startOfJoin.setHours(0,0,0,0);

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();

  // Build grid
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push({ isEmpty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(calYear, calMonth, d);
    cellDate.setHours(0,0,0,0);
    const dateStr  = cellDate.toDateString();
    const record   = monthData.find(r => r.date.toDateString() === dateStr);

    let status = 'Pending';
    let checkIn = '--:--', checkOut = '--:--', reason = '';

    if (startOfJoin && cellDate < startOfJoin) {
      status = 'Not Joined';
    } else if (cellDate > today) {
      status = 'Pending';
    } else if (record) {
      status   = record.status;
      checkIn  = record.checkIn  || '--:--';
      checkOut = record.checkOut || '--:--';
      reason   = record.reason   || '';
    } else if (cellDate.getDay() === 0) {
      status = 'Weekend';
    } else {
      // Past day, not joined, not holiday, not weekend -> Absent
      status = 'Absent';
    }

    grid.push({ isEmpty: false, day: d, status, checkIn, checkOut, reason, date: cellDate });
  }

  // Stats computed from grid
  const presentCount = grid.filter(item => !item.isEmpty && item.status === 'Present').length;
  const lateCount    = grid.filter(item => !item.isEmpty && item.status === 'Late').length;
  const absentCount  = grid.filter(item => !item.isEmpty && item.status === 'Absent').length;
  const leaveCount   = grid.filter(item => !item.isEmpty && (item.status === 'Leave' || item.status === 'Leaves')).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-t-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-[#1C205C]" size={18} />
            <h2 className="font-black text-[#1C205C] text-base">Attendance Calendar</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <FiX size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {/* Month Navigator */}
          <div className="flex items-center justify-between py-4">
            {/* Prev Arrow */}
            <button
              onClick={goToPrev}
              disabled={isPrevDisabled}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90
                ${isPrevDisabled
                  ? 'opacity-25 cursor-not-allowed bg-gray-50'
                  : 'bg-gray-100 hover:bg-[#1C205C] hover:text-white'}`}
            >
              <FiChevronLeft size={20} />
            </button>

            {/* Month / Year — tap to open picker */}
            <button
              onClick={() => setShowPicker(p => !p)}
              className="flex flex-col items-center px-4 py-1 rounded-xl hover:bg-blue-50 active:scale-95 transition-all"
            >
              <span className="font-black text-[#1C205C] text-lg leading-tight flex items-center gap-1">
                {MONTH_NAMES[calMonth]}
                <span className="text-xs text-blue-400 font-bold">▾</span>
              </span>
              <span className="text-xs text-gray-400 font-semibold">{calYear}</span>
            </button>

            {/* Next Arrow */}
            <button
              onClick={goToNext}
              disabled={isNextDisabled}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90
                ${isNextDisabled
                  ? 'opacity-25 cursor-not-allowed bg-gray-50'
                  : 'bg-gray-100 hover:bg-[#1C205C] hover:text-white'}`}
            >
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* Month / Year Picker Panel */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="mb-4 bg-[#1C205C]/5 rounded-2xl p-4 border border-[#1C205C]/10"
              >
                {/* Year selector — current year and next year */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalYear(y => Math.max(today.getFullYear(), y - 1))}
                    disabled={calYear <= today.getFullYear()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${calYear <= today.getFullYear() ? 'opacity-25 cursor-not-allowed' : 'bg-white hover:bg-[#1C205C] hover:text-white shadow-sm active:scale-90'}`}
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span className="font-black text-[#1C205C] text-base">{calYear}</span>
                  <button
                    onClick={() => setCalYear(y => Math.min(pickerMaxYear, y + 1))}
                    disabled={calYear >= pickerMaxYear}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                      ${calYear >= pickerMaxYear ? 'opacity-25 cursor-not-allowed' : 'bg-white hover:bg-[#1C205C] hover:text-white shadow-sm active:scale-90'}`}
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>

                {/* Month grid — grey past months, allow current + future */}
                <div className="grid grid-cols-4 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => {
                    // Disable: past months in current year only
                    const isPast   = calYear === today.getFullYear() && idx < today.getMonth();
                    const disabled = isPast;
                    return (
                      <button
                        key={name}
                        disabled={disabled}
                        onClick={() => !disabled && selectMonthYear(idx, calYear)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95
                          ${disabled ? 'opacity-30 cursor-not-allowed text-gray-400' :
                            idx === calMonth && calYear === calYear ? 'bg-[#1C205C] text-white shadow-md' :
                            'bg-white text-gray-700 hover:bg-blue-50 hover:text-[#1C205C] shadow-sm'}`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Present', count: presentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Late',    count: lateCount,    color: 'text-amber-500',   bg: 'bg-amber-50' },
              { label: 'Absent',  count: absentCount,  color: 'text-rose-500',    bg: 'bg-rose-50' },
              { label: 'Leave',   count: leaveCount,   color: 'text-indigo-500',  bg: 'bg-indigo-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl py-2.5 text-center`}>
                <p className={`text-lg font-black ${s.color}`}>{s.count}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wide ${s.color} opacity-70`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 relative">
            {/* Loading overlay when switching months */}
            {fetchingMonth && (
              <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1C205C]" />
              </div>
            )}
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {grid.map((item, idx) => {
                if (item.isEmpty) return <div key={idx} />;
                const cfg = statusConfig[item.status] || statusConfig.Pending;
                const isToday = item.date.toDateString() === today.toDateString();
                return (
                  <div
                    key={idx}
                    onClick={() => item.status !== 'Not Joined' && item.status !== 'Pending' && item.status !== 'Weekend'
                      ? setTooltip(tooltip?.day === item.day ? null : item)
                      : null
                    }
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center border text-[11px] font-black relative transition-all
                      ${cfg.bg} ${cfg.border} ${cfg.text}
                      ${isToday ? 'ring-2 ring-[#1C205C] ring-offset-1' : ''}
                      ${item.status !== 'Not Joined' && item.status !== 'Pending' && item.status !== 'Weekend' ? 'cursor-pointer active:scale-95' : 'cursor-default'}
                    `}
                  >
                    {item.day}
                    {isToday && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1C205C] rounded-full" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tooltip/Detail Card */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-[#1C205C] text-sm">
                    {MONTH_NAMES[calMonth]} {tooltip.day}, {calYear}
                  </p>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    tooltip.status === 'Present' ? 'bg-emerald-100 text-emerald-600' :
                    tooltip.status === 'Late'    ? 'bg-amber-100 text-amber-600' :
                    tooltip.status === 'Absent'  ? 'bg-rose-100 text-rose-600' :
                    tooltip.status === 'Leave'   ? 'bg-indigo-100 text-indigo-600' :
                    tooltip.status === 'Holiday' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {tooltip.status === 'Late' ? 'Present (Late)' : tooltip.status}
                  </span>
                </div>
                {tooltip.status === 'Holiday' ? (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-xl">🎉</div>
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-0.5">Holiday</p>
                      <p className="text-base font-black text-red-600">{tooltip.reason || 'Official Holiday'}</p>
                    </div>
                  </div>
                ) : tooltip.status === 'Absent' || tooltip.status === 'Leave' || tooltip.status === 'Leaves' ? (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      {tooltip.status === 'Absent' ? 'No attendance recorded' : 'On Leave'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Check In</p>
                      <p className="font-black text-[#1C205C] text-sm">{tooltip.checkIn}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Check Out</p>
                      <p className="font-black text-[#1C205C] text-sm">{tooltip.checkOut}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {[
              { color: 'bg-emerald-500', label: 'Present' },
              { color: 'bg-amber-500',   label: 'Late' },
              { color: 'bg-rose-200',    label: 'Absent' },
              { color: 'bg-indigo-500',  label: 'Leave' },
              { color: 'bg-red-600',     label: 'Holiday' },
              { color: 'bg-gray-200',    label: 'Not Joined' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                <span className="text-[10px] font-bold text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AttendancePage = () => {
  const navigate = useNavigate();
  const { clockedIn, handleClockToggle, startTime } = useEmployee();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isClockedIn = clockedIn;
  const [locationAddress, setLocationAddress] = useState('Fetching Live Location...');

  const { user } = useSelector((state) => state.user);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Present', value: 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Late', value: 0, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Absent', value: 0, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Leaves', value: 0, color: 'text-blue-500', bg: 'bg-blue-50' }
  ]);

  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      const userId = user?.id || user?._id;
      if (!userId) return;
      try {
        setLoading(true);
        const [response, holidaysRes] = await Promise.all([
          api.get(`/crm/attendance?staffId=${userId}`),
          api.get('/crm/attendance/holidays')
        ]);
        if (response.data.success) {
          const records = response.data.data.records || [];
          const formatted = records.map(r => ({
            date: new Date(r.date),
            status: r.status || 'Present',
            checkIn: r.inTime || '--:--',
            checkOut: r.outTime || '--:--',
            hours: r.workHours || '-'
          }));
          const holidaysList = holidaysRes.data?.success ? holidaysRes.data.data : [];
          const combined = [...formatted];

          // Build holidays map for quick lookup
          const holidaysMap = {};
          holidaysList.forEach(h => {
            holidaysMap[new Date(h.date).toDateString()] = h.reason;
          });

          holidaysList.forEach(h => {
            const hDate = new Date(h.date);
            const exists = combined.some(r => r.date.toDateString() === hDate.toDateString());
            if (!exists) {
              combined.push({ date: hDate, status: 'Holiday', checkIn: '--:--', checkOut: '--:--', hours: '-', reason: h.reason });
            } else {
              const idx = combined.findIndex(r => r.date.toDateString() === hDate.toDateString());
              combined[idx].status = 'Holiday';
              combined[idx].reason = h.reason;
            }
          });

          // Add implicit absent days for the current month up to yesterday/today
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          const todayDate = new Date();
          todayDate.setHours(0,0,0,0);

          const joinDate = user?.joiningDate || user?.joinDate || user?.createdAt || new Date();
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
                combined.push({
                  date: compDate,
                  status: 'Absent',
                  checkIn: '--:--',
                  checkOut: '--:--',
                  hours: '-'
                });
              }
            }
          }

          combined.sort((a, b) => b.date - a.date);
          setAttendanceData(combined);
          const currentMonthRecords = combined.filter(r =>
            r.date.getMonth() === currentMonth && r.date.getFullYear() === currentYear
          );
          setStats([
            { label: 'Present', value: currentMonthRecords.filter(r => r.status === 'Present').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Late',    value: currentMonthRecords.filter(r => r.status === 'Late').length,    color: 'text-amber-500',   bg: 'bg-amber-50' },
            { label: 'Absent',  value: currentMonthRecords.filter(r => r.status === 'Absent').length,  color: 'text-rose-500',    bg: 'bg-rose-50' },
            { label: 'Leaves',  value: currentMonthRecords.filter(r => r.status === 'Leave' || r.status === 'Leaves').length, color: 'text-blue-500', bg: 'bg-blue-50' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [user, clockedIn]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Location Tracking
  useEffect(() => {
    let watchId = null;
    let lastLat = 0, lastLng = 0;
    const isLocationEnabled = localStorage.getItem('location_access_enabled') !== 'false';
    if (!isLocationEnabled) { setLocationAddress('Location access disabled in settings'); return; }
    const handlePositionSuccess = async (position) => {
      const { latitude, longitude } = position.coords;
      const dist = Math.sqrt(Math.pow(latitude - lastLat, 2) + Math.pow(longitude - lastLng, 2));
      if (dist > 0.0002 || lastLat === 0) {
        lastLat = latitude; lastLng = longitude;
        const address = await getAddressFromCoordinates(latitude, longitude);
        setLocationAddress(address || 'Address Unavailable');
        localStorage.setItem('emp_latest_location', JSON.stringify({
          employeeId: 'EMP001', name: 'Current User',
          address: address || 'Address Unavailable',
          coords: { lat: latitude, long: longitude },
          timestamp: new Date().toISOString()
        }));
      }
    };
    const handlePositionError = () => setLocationAddress('Location access denied');
    watchId = watchPosition(handlePositionSuccess, handlePositionError);
    return () => { if (watchId !== null) clearWatch(watchId); };
  }, []);

  const fetchLocation = async () => {
    const isLocationEnabled = localStorage.getItem('location_access_enabled') !== 'false';
    if (!isLocationEnabled) { setLocationAddress('Location access disabled in settings'); return; }
    try {
      setLocationAddress('Updating location...');
      const position = await getCurrentPosition();
      const address = await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
      setLocationAddress(address || 'Address Unavailable');
    } catch { setLocationAddress('Location access denied'); }
  };

  const onClockAction = () => handleClockToggle();

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const userData = {
    name: user?.name || '',
    joinDate: user?.joinDate || user?.joiningDate || null,
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F7FA] font-sans selection:bg-blue-100">
      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        <div className="relative z-30">
          <div className="bg-[#1C205C] pb-8 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
            <div className="pt-6 px-4">
              <HeaderTopBar title="Attendance" />
              <div className="mt-2 text-center text-blue-100/80 text-sm font-semibold">
                Manage your daily work hours
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="px-6 mt-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className={`${stat.bg} p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-black/5 transition-all`}>
                <div>
                  <p className={`text-xs font-bold uppercase ${stat.color} opacity-70`}>{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color} mt-0.5`}>{stat.value}</p>
                </div>
                {idx === 0 && <FiCheckCircle className="text-emerald-200" size={24} />}
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVITY LOG */}
        <div className="px-6 mt-8 flex-1">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[#1C205C] font-bold text-sm">Activity Log</h3>
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1C205C] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all active:scale-95 border border-blue-100"
            >
              <FiCalendar size={12} />
              This Month
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-8 bg-white rounded-xl border border-gray-100">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1C205C]" />
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 font-semibold text-sm">
                No attendance logs found for this period.
              </div>
            ) : (
              attendanceData.map((record, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  key={index}
                  className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold border
                      ${record.status === 'Present'  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        record.status === 'Absent'   ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        record.status === 'Late'     ? 'bg-amber-50 text-amber-500 border-amber-100' :
                        record.status === 'Leave' || record.status === 'Leaves' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        record.status === 'Holiday'  ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200 animate-pulse' :
                        'bg-gray-50 text-gray-400 border-gray-100'}
                    `}>
                      <span className="text-xs uppercase">{record.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="text-lg leading-none">{record.date.getDate()}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[#1C205C] font-bold text-sm mb-0.5">
                        {record.status === 'Late' ? 'Present (Late)' : record.status}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                        {record.status === 'Holiday' ? (
                          <span className="text-red-600 font-extrabold tracking-wide">{record.reason || 'Official Holiday'}</span>
                        ) : (
                          <span className="flex items-center gap-1"><FiClock size={10} /> {record.checkIn} - {record.checkOut}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <AttendanceCalendarModal
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
            userId={user?.id || user?._id}
            user={userData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;
