import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiSearch, FiCalendar, FiUser, FiClock,
  FiCheckCircle, FiEye, FiPhone, FiMail, FiBookOpen, FiTrendingUp
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
  if (ts === 'ongoing' || ts === 'in_progress')
    return { label: 'Ongoing', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  // All other states = Not Started
  return { label: 'Not Started', cls: 'bg-orange-50 text-orange-600 border-orange-100' };
};

const DriverRecordPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, bookingsRes] = await Promise.all([
        api.get('/crm/staff'),
        api.get('/admin/bookings?limit=10000') // Fetch all bookings for highly accurate counts
      ]);

      if (staffRes.data.success) {
        const staffList = staffRes.data.data.staff || [];
        // Filter drivers: role contains "driver"
        const driverList = staffList.filter(s =>
          s.role && s.role.toLowerCase().includes('driver')
        );
        setDrivers(driverList);
      }

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching driver records data:', error);
      toast.error('Failed to load driver record details.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to count driver bookings
  const getDriverBookings = (driverId) => {
    if (!driverId) return [];
    return bookings.filter(booking => {
      const assignedId = booking.assignedDriver?._id || booking.assignedDriver;
      return assignedId && assignedId.toString() === driverId.toString();
    });
  };

  const filteredDrivers = drivers.filter(d => {
    const term = searchTerm.trim().toLowerCase();
    const keywords = term.split(/\s+/).filter(Boolean);
    return keywords.length === 0 || keywords.every(keyword =>
      (d.name && d.name.toLowerCase().includes(keyword)) ||
      (d.employeeId && d.employeeId.toLowerCase().includes(keyword)) ||
      (d.email && d.email.toLowerCase().includes(keyword)) ||
      (d.phone && d.phone.includes(keyword))
    );
  });


  // Open overlay history details
  const handleOpenDetails = (driver) => {
    const driverWithBookings = {
      ...driver,
      bookingsList: getDriverBookings(driver._id || driver.id)
    };
    setSelectedDriver(driverWithBookings);
  };

  return (
    <div className="space-y-6 min-h-screen bg-[#F5F7FA] pb-10">
      
      {/* Premium Gradient Header */}
      <div
        className="text-white pt-10 pb-16 px-8 rounded-b-[40px] shadow-xl relative overflow-hidden"
        style={{ background: GRADIENT_HEADER }}
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm text-blue-100/70 mb-1 font-semibold uppercase tracking-wider">
              <span>Staff Operations</span> <span>/</span> <span className="text-blue-100">Driver Record</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Driver Performance & Booking Records</h1>
            <p className="text-blue-200/80 text-sm mt-1">Real-time trip counts, job logs, and complete trip history directories.</p>
          </div>

          {/* Quick Stats Metrics */}
          <div className="flex gap-4">
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md text-left">
              <span className="text-xs text-blue-200 font-bold block uppercase tracking-wide">Active Drivers</span>
              <span className="text-2xl font-black">{drivers.length}</span>
            </div>
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md text-left">
              <span className="text-xs text-blue-200 font-bold block uppercase tracking-wide">Total Trips Handled</span>
              <span className="text-2xl font-black">
                {bookings.filter(b => b.assignedDriver).length}
              </span>
            </div>
          </div>
        </div>

        {/* abstract ambient background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="px-8 -mt-8 space-y-6">

        {/* Search Bar Container */}
        <div className="bg-white rounded-3xl p-5 shadow-lg shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search driver by name, ID, or phone..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] font-semibold text-xs text-gray-700 transition-all shadow-inner"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.trimStart())}
            />
          </div>
          <div className="text-xs font-bold text-gray-400">
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </div>
        </div>

        {/* Drivers Table List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C205C]"></div>
          </div>
        ) : filteredDrivers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100/80 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">
                    <th className="py-4 px-6">Driver Bio</th>
                    <th className="py-4 px-6">Employee ID</th>
                    <th className="py-4 px-6">Contact Info</th>
                    <th className="py-4 px-6">Salary Type</th>
                    <th className="py-4 px-6">Salary / Compensation</th>
                    <th className="py-4 px-6">Total Assigned Trips</th>
                    <th className="py-4 px-6">Completed Trips</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDrivers.map((driver) => {
                    const driverTrips = getDriverBookings(driver._id || driver.id);
                    const completedTrips = driverTrips.filter(t => t.status === 'completed' || t.tripStatus === 'completed');
                    const isMonthly = driver.salaryMethod !== 'Per Trip';

                    return (
                      <tr
                        key={driver._id || driver.id}
                        className="hover:bg-gray-50/30 transition-colors text-xs font-semibold text-gray-700"
                      >
                        {/* Driver Bio */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1C205C]/10 border border-[#1C205C]/20 text-[#1C205C] flex items-center justify-center font-black">
                              {driver.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-gray-900 text-sm leading-tight">{driver.name}</h5>
                              <span className="text-[10px] text-gray-400 block mt-0.5 uppercase tracking-wide">{driver.role || 'Driver'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="py-5 px-6">
                          <span className="font-mono text-gray-500 font-bold uppercase tracking-wider">{driver.employeeId || 'DRV-NEW'}</span>
                        </td>

                        {/* Contact Info */}
                        <td className="py-5 px-6">
                          <div className="space-y-1 text-[11px] text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <FiPhone className="text-gray-400 shrink-0" size={11} />
                              <span className="font-mono text-gray-700 font-bold">{driver.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FiMail className="text-gray-400 shrink-0" size={11} />
                              <span className="text-gray-600">{driver.email || 'N/A'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Salary Type */}
                        <td className="py-5 px-6">
                          <span className={`inline-flex px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-wider ${
                            isMonthly
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {isMonthly ? 'Monthly' : 'Per Trip'}
                          </span>
                        </td>

                        {/* Salary / Compensation */}
                        <td className="py-5 px-6">
                          {isMonthly ? (
                            <span className="text-sm font-extrabold text-gray-800">
                              ₹{(driver.salary || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-semibold block">Fixed Salary</span>
                            </span>
                          ) : (
                            <span className="text-sm font-extrabold text-gray-800">
                              ₹{(completedTrips.length * (driver.salary || 0)).toLocaleString()} <span className="text-[10px] text-indigo-500 font-semibold block">₹{(driver.salary || 0).toLocaleString()} / Trip</span>
                            </span>
                          )}
                        </td>

                        {/* Total Assigned Trips */}
                        <td className="py-5 px-6">
                          <div className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 text-xs">
                            <FiClock className="text-gray-400" size={12} />
                            <span className="font-black text-gray-800">{driverTrips.length} {driverTrips.length === 1 ? 'Trip' : 'Trips'}</span>
                          </div>
                        </td>

                        {/* Completed Trips */}
                        <td className="py-5 px-6">
                          <div className="inline-flex items-center gap-1.5 bg-green-50/60 px-3 py-1.5 rounded-xl border border-green-100/40 text-xs">
                            <FiCheckCircle className="text-green-500" size={12} />
                            <span className="font-black text-green-800">{completedTrips.length} {completedTrips.length === 1 ? 'Trip' : 'Trips'}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-5 px-6 text-right">
                          <button
                            onClick={() => handleOpenDetails(driver)}
                            className="p-2.5 bg-[#1C205C]/5 hover:bg-[#1C205C]/10 text-[#1C205C] rounded-xl border border-[#1C205C]/10 transition-colors shadow-inner flex items-center justify-center inline-block"
                            title="View History Details"
                          >
                            <FiEye size={15} />
                          </button>
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
              <FiBookOpen size={30} />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-1">No drivers found</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              We couldn't find any drivers matching the search parameters.
            </p>
          </div>
        )}
      </div>

      {/* --- POPUP MODAL: VIEW DRIVER BOOKING DETAILS HISTORY --- */}
      <AnimatePresence>
        {selectedDriver && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDriver(null)}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 z-10 text-xs text-gray-700"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1C205C] text-white flex items-center justify-center font-black text-sm shadow-md">
                    {selectedDriver.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">{selectedDriver.name}</h3>
                    <p className="text-xs text-gray-500">Employee ID: {selectedDriver.employeeId || 'DRV-NEW'} | Role: {selectedDriver.role || 'Driver'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Profile Brief Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Contract / Salary Type</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                      selectedDriver.salaryMethod !== 'Per Trip'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {selectedDriver.salaryMethod !== 'Per Trip' ? 'Monthly' : 'Per Trip'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Compensation Package</span>
                    <h5 className="font-extrabold text-gray-800 text-sm">
                      {selectedDriver.salaryMethod !== 'Per Trip' 
                        ? `₹${(selectedDriver.salary || 0).toLocaleString()} / month` 
                        : `₹${(selectedDriver.salary || 0).toLocaleString()} / Trip`}
                    </h5>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Total Assigned Rides</span>
                    <h5 className="font-extrabold text-[#1C205C] text-sm">
                      {selectedDriver.bookingsList?.length || 0} Trips
                    </h5>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Calculated Earnings</span>
                    <h5 className="font-extrabold text-green-600 text-sm">
                      ₹{((selectedDriver.salaryMethod !== 'Per Trip'
                        ? (selectedDriver.salary || 0)
                        : (selectedDriver.bookingsList?.filter(t => t.status === 'completed' || t.tripStatus === 'completed')?.length || 0) * (selectedDriver.salary || 0)
                      )).toLocaleString()}
                    </h5>
                  </div>
                </div>

                {/* Booking History Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block">Assigned Booking Logs</h4>
                  {selectedDriver.bookingsList && selectedDriver.bookingsList.length > 0 ? (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100/50 text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                              <th className="py-3 px-4">Booking Ref</th>
                              <th className="py-3 px-4">Customer</th>
                              <th className="py-3 px-4">Vehicle Details</th>
                              <th className="py-3 px-4">Pickup Date/Time</th>
                              <th className="py-3 px-4">Drop Date/Time</th>
                              <th className="py-3 px-4">Duration</th>
                              <th className="py-3 px-4">Trip Badge</th>
                              <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-[11px] font-semibold text-gray-600">
                            {selectedDriver.bookingsList.map((booking) => {
                              const tripStatus = getTripStatusBadge(booking);
                              const durationDays = calcDuration(booking.tripStart?.date, booking.tripEnd?.date);

                              return (
                                <tr key={booking._id || booking.id} className="hover:bg-gray-50/20 transition-colors">
                                  {/* Ref ID */}
                                  <td className="py-4 px-4">
                                    <span className="font-extrabold text-[#1C205C]">#{booking.bookingId}</span>
                                  </td>

                                  {/* Customer */}
                                  <td className="py-4 px-4">
                                    <div className="font-bold text-gray-800">{booking.user?.name || 'Walk-in Customer'}</div>
                                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">{booking.user?.phone || ''}</div>
                                  </td>

                                  {/* Vehicle Details */}
                                  <td className="py-4 px-4">
                                    {booking.car ? (
                                      <div className="space-y-0.5">
                                        <div className="text-gray-800 font-bold">{booking.car.brand} {booking.car.model}</div>
                                        <span className="text-[8px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-black border border-blue-100/50 uppercase font-mono tracking-wider">
                                          {booking.car.registrationNumber || 'N/A'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">No vehicle</span>
                                    )}
                                  </td>

                                  {/* Pickup Date/Time */}
                                  <td className="py-4 px-4">
                                    <div>{formatDateDDMMYYYY(booking.tripStart?.date)}</div>
                                    <div className="text-[9px] text-gray-400 font-bold mt-0.5">{formatTime12h(booking.tripStart?.time)}</div>
                                  </td>

                                  {/* Drop Date/Time */}
                                  <td className="py-4 px-4">
                                    <div>{formatDateDDMMYYYY(booking.tripEnd?.date)}</div>
                                    <div className="text-[9px] text-gray-400 font-bold mt-0.5">{formatTime12h(booking.tripEnd?.time)}</div>
                                  </td>

                                  {/* Duration */}
                                  <td className="py-4 px-4">
                                    {durationDays ? (
                                      <span className="font-bold text-gray-700">{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>

                                  {/* Trip Badge */}
                                  <td className="py-4 px-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${tripStatus.cls}`}>
                                      {tripStatus.label}
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="py-4 px-4 text-right">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : booking.status === 'cancelled'
                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 p-8 rounded-2xl text-center text-gray-400 font-bold text-xs">
                      This driver has not been assigned to any bookings yet.
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 p-4 flex justify-end bg-gray-50/50 shrink-0">
                <button
                  onClick={() => setSelectedDriver(null)}
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

export default DriverRecordPage;
