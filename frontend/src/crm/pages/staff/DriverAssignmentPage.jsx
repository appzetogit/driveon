import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiSearch, FiCalendar, FiMapPin, FiUser, FiClock,
  FiCheckCircle, FiEye, FiPhone, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import api from '../../../services/api';
import { premiumColors } from '../../../theme/colors';

const GRADIENT_HEADER = "linear-gradient(135deg, #1C205C 0%, #0f1642 100%)";

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime12h = (t24) => {
  if (!t24) return '';
  const parts = t24.split(':');
  if (parts.length < 2) return t24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return t24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
};

const calcDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s) || isNaN(e)) return null;
  const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
};

const getTripStatusBadge = (booking) => {
  const ts = booking.tripStatus || 'not_started';
  if (booking.status === 'completed' || ts === 'completed')
    return { label: 'Completed', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  if (booking.status === 'cancelled' || ts === 'cancelled')
    return { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border-red-100' };
  if (ts === 'started')
    return { label: 'Started', cls: 'bg-blue-50 text-blue-600 border-blue-100' };
  if (ts === 'picked_up')
    return { label: 'Picked Up', cls: 'bg-amber-50 text-amber-600 border-amber-100' };
  if (ts === 'ongoing')
    return { label: 'Ongoing', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  // All other states = Not Started
  return { label: 'Not Started', cls: 'bg-orange-50 text-orange-600 border-orange-100' };
};

const DriverAssignmentPage = () => {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Unassigned', 'Assigned'

  // Modals state
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, staffRes] = await Promise.all([
        api.get('/admin/bookings'),
        api.get('/crm/staff')
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data.bookings || []);
      }
      if (staffRes.data.success) {
        const staffList = staffRes.data.data.staff || [];
        // Filter staff with role matching driver (case-insensitive)
        const driverList = staffList.filter(s =>
          s.role && (s.role.toLowerCase().includes('driver'))
        );
        setDrivers(driverList);
      }
    } catch (error) {
      console.error('Error fetching driver assignment data:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Check if booking1 dates overlap with booking2 dates
  const checkOverlap = (b1, b2) => {
    if (!b1.tripStart?.date || !b1.tripEnd?.date || !b2.tripStart?.date || !b2.tripEnd?.date) return null;
    if (b1._id === b2._id || b1.id === b2.id) return null;
    // Skip checking cancelled or completed bookings
    if (b2.status === 'cancelled' || b2.tripStatus === 'cancelled') return null;
    if (b2.status === 'completed' || b2.tripStatus === 'completed') return null;

    const start1 = new Date(b1.tripStart.date);
    const end1 = new Date(b1.tripEnd.date);
    const start2 = new Date(b2.tripStart.date);
    const end2 = new Date(b2.tripEnd.date);

    // Overlap logic: (StartA < EndB) && (EndA > StartB)
    if (start1 < end2 && end1 > start2) {
      return b2.bookingId || b2._id;
    }
    return null;
  };

  // Find if driver has any scheduling conflicts for targetBooking
  const getDriverConflict = (driver, targetBooking) => {
    if (!targetBooking) return null;

    // Scan all bookings to check if driver is already assigned to a conflicting booking
    for (const booking of bookings) {
      const assignedDriverId = booking.assignedDriver?._id || booking.assignedDriver;
      if (assignedDriverId && assignedDriverId.toString() === driver._id.toString()) {
        const conflictId = checkOverlap(targetBooking, booking);
        if (conflictId) {
          return conflictId;
        }
      }
    }
    return null;
  };

  const handleAssignDriver = async (driverId) => {
    if (!selectedBookingForAssign) return;

    try {
      setAssigningLoading(true);
      const bId = selectedBookingForAssign._id || selectedBookingForAssign.id;

      const res = await api.patch(`/admin/bookings/${bId}`, {
        assignedDriver: driverId || null
      });

      if (res.data.success) {
        toast.success('🎉 Driver assigned successfully!');
        setSelectedBookingForAssign(null);
        fetchData(); // Refresh list to update drivers
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast.error(err.response?.data?.message || 'Failed to assign driver.');
    } finally {
      setAssigningLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    // Hide cancelled bookings
    if (b.status === 'cancelled' || b.tripStatus === 'cancelled') return false;
    // Hide completed bookings ONLY if they do not have an assigned driver
    if ((b.status === 'completed' || b.tripStatus === 'completed') && !b.assignedDriver) return false;

    // Only show bookings that require a driver (driver count > 0)
    if (!b.addOnServices || !(b.addOnServices.driver > 0)) return false;

    const searchWords = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesSearch = searchWords.length === 0 || searchWords.every(word => {
      return (
        (b.bookingId && b.bookingId.toLowerCase().includes(word)) ||
        (b.user?.name && b.user.name.toLowerCase().includes(word)) ||
        (b.tripStart?.location && b.tripStart.location.toLowerCase().includes(word)) ||
        (b.tripEnd?.location && b.tripEnd.location.toLowerCase().includes(word))
      );
    });

    if (!matchesSearch) return false;

    if (activeTab === 'Unassigned') return !b.assignedDriver;
    if (activeTab === 'Assigned') return !!b.assignedDriver;
    return true;
  });

  return (
    <div className="space-y-6 min-h-screen bg-[#F5F7FA] pb-10">

      {/* Premium Header */}
      <div
        className="text-white pt-10 pb-16 px-8 rounded-b-[40px] shadow-xl relative overflow-hidden"
        style={{ background: GRADIENT_HEADER }}
      >
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm text-blue-100/70 mb-1 font-semibold uppercase tracking-wider">
              <span>Staff</span> <span>/</span> <span className="text-blue-100">Driver Assign</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Driver Assignment & Scheduling</h1>
            <p className="text-blue-200/80 text-sm mt-1">Assign drivers to incoming bookings and resolve active timeline conflicts.</p>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md text-left">
              <span className="text-xs text-blue-200 font-bold block uppercase tracking-wide">Unassigned Rides</span>
              <span className="text-2xl font-black">
                {bookings.filter(b =>
                  !b.assignedDriver &&
                  b.status !== 'cancelled' &&
                  b.status !== 'completed' &&
                  b.tripStatus !== 'cancelled' &&
                  b.tripStatus !== 'completed' &&
                  b.addOnServices &&
                  b.addOnServices.driver > 0
                ).length}
              </span>
            </div>
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md text-left">
              <span className="text-xs text-blue-200 font-bold block uppercase tracking-wide">Total Drivers</span>
              <span className="text-2xl font-black">{drivers.length}</span>
            </div>
          </div>
        </div>

        {/* abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 -mt-8 space-y-6">

        {/* Search & Tabs Card */}
        <div className="bg-white rounded-3xl p-5 shadow-lg shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by Booking ID, customer, or location..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] font-semibold text-xs text-gray-700 transition-all shadow-inner"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.trimStart())}
            />
          </div>

          {/* Dynamic Tabs */}
          <div className="flex gap-2 bg-gray-100/80 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
            {['All', 'Unassigned', 'Assigned'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab
                  ? 'bg-[#1C205C] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Listing Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C205C]"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100/80 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                    <th className="py-4 px-6">Booking Ref</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Pickup &amp; Drop Details</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Onduty Car</th>
                    <th className="py-4 px-6">Assigned Driver</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBookings.map((booking) => {
                    const hasDriver = !!booking.assignedDriver;
                    const driverInfo = booking.assignedDriver;
                    const tripStatus = getTripStatusBadge(booking);
                    const tripDays = calcDuration(booking.tripStart?.date, booking.tripEnd?.date);

                    return (
                      <tr
                        key={booking._id || booking.id}
                        className="hover:bg-gray-50/30 transition-colors text-xs font-semibold text-gray-700"
                      >
                        {/* Booking Ref */}
                        <td className="py-5 px-6 align-middle">
                          <div className="space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Booking ID</span>
                            <span className="font-extrabold text-[#1C205C] text-sm block">#{booking.bookingId}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[8px] font-black border uppercase tracking-wider ${tripStatus.cls}`}>
                              {tripStatus.label}
                            </span>
                          </div>
                        </td>


                        {/* Customer */}
                        <td className="py-5 px-6 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-[#1C205C] flex items-center justify-center font-black">
                              <FiUser size={13} />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-gray-800 text-xs">{booking.user?.name || 'Walk-in Customer'}</h5>
                            </div>
                          </div>
                        </td>

                        {/* Pickup & Drop Details */}
                        <td className="py-5 px-6 align-middle">
                          <div className="space-y-1.5 text-[11px] max-w-sm">
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <FiCalendar className="text-blue-500 shrink-0" size={12} />
                              <span>
                                <strong className="text-gray-700 font-bold">Pickup Date &amp; Time:</strong>{' '}
                                <span className="font-mono text-gray-800 font-bold">
                                  {formatDateDDMMYYYY(booking.tripStart?.date)} at {formatTime12h(booking.tripStart?.time)}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 pt-1 border-t border-gray-50">
                              <FiCalendar className="text-rose-500 shrink-0" size={12} />
                              <span>
                                <strong className="text-gray-700 font-bold">Drop Date &amp; Time:</strong>{' '}
                                <span className="font-mono text-gray-800 font-bold">
                                  {formatDateDDMMYYYY(booking.tripEnd?.date)} at {formatTime12h(booking.tripEnd?.time)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-5 px-6 align-middle">
                          {tripDays ? (
                            <div className="inline-flex items-center gap-1.5 bg-indigo-50/60 px-2.5 py-1.5 rounded-xl border border-indigo-100/40 text-xs whitespace-nowrap">
                              <FiClock className="text-indigo-500" size={12} />
                              <span className="font-extrabold text-indigo-800">{tripDays} {tripDays === 1 ? 'Day' : 'Days'}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Onduty Car */}
                        <td className="py-5 px-6 align-middle">
                          {booking.car ? (
                            <div className="inline-flex items-center gap-2 bg-blue-50/40 px-2.5 py-1.5 rounded-xl border border-blue-100/30 text-xs">
                              <span className="text-blue-800 font-bold">{booking.car.brand} {booking.car.model}</span>
                              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100/60 px-1.5 py-0.5 rounded font-black uppercase font-mono tracking-wider">
                                {booking.car.registrationNumber || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px] font-medium">No car assigned</span>
                          )}
                        </td>

                        {/* Assigned Driver */}
                        <td className="py-5 px-6 align-middle">
                          {hasDriver ? (
                            <div className="inline-flex items-center gap-2.5 bg-emerald-50/40 border border-emerald-100/40 px-3 py-1.5 rounded-xl">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-[10px]">
                                {driverInfo.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h6 className="font-extrabold text-gray-800 text-[11px]">{driverInfo.name}</h6>
                                <span className="text-[9px] text-emerald-600 font-bold block leading-none">{driverInfo.employeeId || 'DRV-N/A'}</span>
                                {driverInfo.phone && (
                                  <span className="text-[9px] text-gray-500 font-mono block mt-0.5">{driverInfo.phone}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-md text-[8px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">
                              Needs Driver
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-5 px-6 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedBookingForDetails(booking)}
                              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl hover:text-gray-800 border border-gray-100 transition-colors shadow-inner flex items-center justify-center"
                              title="View Details"
                            >
                              <FiEye size={14} />
                            </button>
                            {!(booking.status === 'completed' || booking.tripStatus === 'completed') && (
                              <button
                                onClick={() => setSelectedBookingForAssign(booking)}
                                className={`px-4 py-2 rounded-xl font-black text-[11px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 ${hasDriver
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                                  : 'bg-[#1C205C] hover:bg-[#2c3180] text-white shadow-lg shadow-blue-900/10'
                                  }`}
                              >
                                <FiUser size={12} /> {hasDriver ? 'Change' : 'Assign'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-3xl p-16 shadow-md border border-gray-100 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3 shadow-inner">
              <FiCalendar size={32} />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">No bookings found</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              We couldn't find any pending or confirmed bookings matching the "{activeTab}" filter.
            </p>
          </div>
        )}
      </div>

      {/* --- MODAL 1: SELECT DRIVER ASSIGNER --- */}
      <AnimatePresence>
        {selectedBookingForAssign && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForAssign(null)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-gray-100 z-10"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Assign Driver</h3>
                  <p className="text-xs text-gray-500">Booking #{selectedBookingForAssign.bookingId}</p>
                </div>
                <button
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable Driver Directory list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">

                {/* Time frame details */}
                <div className="bg-blue-50/40 border border-blue-100/50 p-3 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2 mb-2">
                  <FiClock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold block uppercase tracking-wide">Target Itinerary Interval:</span>
                    <span className="font-medium text-blue-800">
                      {formatDateDDMMYYYY(selectedBookingForAssign.tripStart?.date)} at {formatTime12h(selectedBookingForAssign.tripStart?.time)}
                    </span>
                    <span className="font-bold mx-1 text-blue-400">to</span>
                    <span className="font-medium text-blue-800">
                      {formatDateDDMMYYYY(selectedBookingForAssign.tripEnd?.date)} at {formatTime12h(selectedBookingForAssign.tripEnd?.time)}
                    </span>
                    {(() => {
                      const d = calcDuration(selectedBookingForAssign.tripStart?.date, selectedBookingForAssign.tripEnd?.date);
                      return d ? <span className="block font-black text-blue-700 mt-1">Duration: {d} {d === 1 ? 'Day' : 'Days'}</span> : null;
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  {drivers.length > 0 ? (
                    drivers.map((driver) => {
                      const conflictBookingId = getDriverConflict(driver, selectedBookingForAssign);
                      const isBusy = !!conflictBookingId;

                      return (
                        <div
                          key={driver._id || driver.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${isBusy
                            ? 'bg-amber-50/30 border-amber-100 text-gray-600'
                            : 'bg-white border-gray-100 hover:border-blue-100 shadow-sm'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full font-black flex items-center justify-center text-xs ${isBusy ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                              {driver.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-gray-800 text-xs leading-none">{driver.name}</h5>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${driver.salaryMethod === 'Per Trip' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50' : 'bg-blue-50 text-blue-700 border border-blue-100/50'}`}>
                                  {driver.salaryMethod === 'Per Trip' ? 'Per Trip' : 'Monthly'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">{driver.employeeId || 'DRV-NEW'}</p>

                              {/* conflict warning badge */}
                              {isBusy && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] bg-red-50 text-red-600 border border-red-100/50 px-2 py-0.5 rounded font-black">
                                  <FiAlertCircle size={10} /> Already booked: #{conflictBookingId}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Assign */}
                          <button
                            disabled={assigningLoading}
                            onClick={() => handleAssignDriver(driver._id || driver.id)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${isBusy
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              : 'bg-[#1C205C] hover:bg-[#2c3180] text-white shadow-md shadow-indigo-900/10'
                              }`}
                          >
                            {selectedBookingForAssign.assignedDriver?._id === driver._id ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-6 text-gray-400 font-bold text-xs">
                      No active driver staff found in directory.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-4 flex justify-end bg-gray-50/50 shrink-0">
                <button
                  onClick={() => setSelectedBookingForAssign(null)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: VIEW BOOKING DETAILS EYE CARD --- */}
      <AnimatePresence>
        {selectedBookingForDetails && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForDetails(null)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 z-10 text-xs text-gray-700"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Trip Details Card</h3>
                  <p className="text-xs text-gray-500">Full specs for Booking #{selectedBookingForDetails.bookingId}</p>
                </div>
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                {/* Top Itinerary Box */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Trip Departure</span>
                      <h5 className="font-extrabold text-gray-800 leading-tight">
                        {formatDateDDMMYYYY(selectedBookingForDetails.tripStart?.date)}
                      </h5>
                      <p className="font-semibold text-gray-500 mt-0.5">{formatTime12h(selectedBookingForDetails.tripStart?.time) || '10:00 AM'}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Trip Return</span>
                      <h5 className="font-extrabold text-gray-800 leading-tight">
                        {formatDateDDMMYYYY(selectedBookingForDetails.tripEnd?.date)}
                      </h5>
                      <p className="font-semibold text-gray-500 mt-0.5">{formatTime12h(selectedBookingForDetails.tripEnd?.time) || '06:00 PM'}</p>
                    </div>
                  </div>
                  {(() => {
                    const d = calcDuration(selectedBookingForDetails.tripStart?.date, selectedBookingForDetails.tripEnd?.date);
                    return d ? (
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-indigo-700 font-black">
                        <FiClock size={11} /> Trip Duration: {d} {d === 1 ? 'Day' : 'Days'}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Customer Details section */}
                <div className="space-y-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Customer Profile</span>
                  <div className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-[#1C205C] flex items-center justify-center font-black shrink-0">
                      <FiUser size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800">{selectedBookingForDetails.user?.name || 'Walk-in Customer'}</h5>
                      <p className="text-[10px] text-gray-400 font-semibold">{selectedBookingForDetails.user?.email || 'N/A'}</p>
                      {selectedBookingForDetails.user?.phone && (
                        <p className="text-[10px] text-gray-500 font-mono font-bold mt-0.5">{selectedBookingForDetails.user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle specifications */}
                {selectedBookingForDetails.car && (
                  <div className="space-y-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Fleet</span>
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                      <div className="flex gap-3 items-center">
                        <div className="w-16 h-12 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                          {selectedBookingForDetails.car.images && selectedBookingForDetails.car.images.length > 0 ? (
                            <img src={selectedBookingForDetails.car.images[0].url} alt="Car" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Car</span>
                          )}
                        </div>
                        <div>
                          <h6 className="font-extrabold text-gray-900 text-xs">{selectedBookingForDetails.car.brand} {selectedBookingForDetails.car.model}</h6>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black border border-blue-100/50 inline-block mt-0.5 uppercase">
                            {selectedBookingForDetails.car.registrationNumber || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* Customer Notes */}
                {selectedBookingForDetails.specialRequests && (
                  <div className="space-y-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Customer Requests & Notes</span>
                    <div className="p-3.5 bg-amber-50/40 border border-amber-100/50 rounded-2xl text-[11px] text-amber-800 font-medium">
                      {selectedBookingForDetails.specialRequests}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-4 flex justify-end bg-gray-50/50 shrink-0">
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold rounded-xl text-xs transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DriverAssignmentPage;
