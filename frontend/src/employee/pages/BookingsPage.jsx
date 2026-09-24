import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiPhone, FiCheck, FiPlay, FiSquare, FiUser, FiInfo, FiActivity, FiEye, FiMapPin } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import api from '../../services/api';
import toastUtils from '../../config/toast';

const THEME_COLOR = "#1C205C";

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
  hours = hours ? hours : 12;
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

const BookingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.user);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'All'); // 'All', 'Not Started', 'Ongoing', 'Completed'
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [startTripModalBooking, setStartTripModalBooking] = useState(null);
  const [startKmInput, setStartKmInput] = useState('');
  const [startKmError, setStartKmError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAssignedBookings();
  }, []);

  const fetchAssignedBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/driver/assigned');
      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching driver bookings:', error);
      toastUtils.error('Failed to load assigned bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async (bookingId, startKm) => {
    try {
      setActionLoading(bookingId);
      const response = await api.post(`/bookings/${bookingId}/start`, {
        startKm: Number(startKm),
      });
      if (response.data.success) {
        toastUtils.success(`🚀 Trip started successfully! Start KM: ${startKm}`);
        setStartTripModalBooking(null);
        setStartKmInput('');
        setStartKmError('');
        fetchAssignedBookings();
      }
    } catch (error) {
      console.error('Error starting trip:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to start trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = async (bookingId) => {
    if (!window.confirm('Confirm Pickup — Have you picked up the customer?')) return;
    try {
      setActionLoading(bookingId);
      const response = await api.post(`/bookings/${bookingId}/pickup`);
      if (response.data.success) {
        toastUtils.success('📍 Customer picked up!');
        fetchAssignedBookings();
      }
    } catch (error) {
      console.error('Error picking up customer:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to pickup customer.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOngoing = async (bookingId) => {
    try {
      setActionLoading(bookingId);
      const response = await api.post(`/bookings/${bookingId}/ongoing`);
      if (response.data.success) {
        toastUtils.success('🚗 Trip is now ongoing!');
        fetchAssignedBookings();
      }
    } catch (error) {
      console.error('Error setting ongoing trip:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update trip.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndTrip = async (bookingId) => {
    if (!window.confirm('End Trip — Confirm that the trip is complete and you have dropped off the customer?')) {
      return;
    }
    try {
      setActionLoading(bookingId);
      const response = await api.post(`/bookings/${bookingId}/end`);
      if (response.data.success) {
        toastUtils.success('✅ Trip completed successfully!');
        fetchAssignedBookings();
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to complete trip.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter bookings based on status tab
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Not Started') return !(b.status === 'active' || ['started', 'picked_up', 'ongoing'].includes(b.tripStatus)) && !(b.status === 'completed' || b.tripStatus === 'completed');
    if (activeTab === 'Ongoing') return (b.status === 'active' || ['started', 'picked_up', 'ongoing'].includes(b.tripStatus)) && b.tripStatus !== 'completed';
    if (activeTab === 'Completed') return b.status === 'completed' || b.tripStatus === 'completed';
    return true;
  });

  const getTripStatusLabel = (booking) => {
    if (booking.status === 'completed' || booking.tripStatus === 'completed') {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
    if (booking.status === 'active' || ['started', 'picked_up', 'ongoing'].includes(booking.tripStatus)) {
      return { text: 'Ongoing', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }
    // All other states (pending, confirmed, not_started, etc.) = Not Started
    return { text: 'Not Started', color: 'bg-orange-50 text-orange-600 border-orange-100' };
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F7FA] font-sans selection:bg-blue-100">
      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        <div className="relative z-30">
          {/* HEADER BACKGROUND */}
          <div className="bg-[#1C205C] pb-4 rounded-b-[26px] shadow-md relative overflow-hidden z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="pt-4 px-4">
              <HeaderTopBar title="My Assigned Trips" className="mb-0.5" />
              <div className="mt-0.5 text-center text-blue-100/80 text-xs font-medium">
                Manage and execute your scheduled bookings
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="px-6 mt-4 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 z-20 relative">
          {['All', 'Not Started', 'Ongoing', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-sm border whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab 
                  ? 'bg-[#1C205C] text-white border-[#1C205C]' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bookings Card List */}
        <div className="px-6 mt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C205C]"></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking, idx) => {
              const statusInfo = getTripStatusLabel(booking);
              const isTripActive = (booking.status === 'active' || ['started', 'picked_up', 'ongoing'].includes(booking.tripStatus)) && booking.tripStatus !== 'completed';
              const isTripCompleted = booking.status === 'completed' || booking.tripStatus === 'completed';
              const isTripPending = !isTripActive && !isTripCompleted;
              const hasOndutyCar = booking.car;
              const tripDays = calcDuration(booking.tripStart?.date, booking.tripEnd?.date);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 60 }}
                  key={booking._id || booking.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                >
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Booking reference</span>
                      <h4 className="font-extrabold text-[#1C205C] text-sm mt-0.5">#{booking.bookingId}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tripDays && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-black whitespace-nowrap">
                          <FiClock size={9} /> {tripDays} {tripDays === 1 ? 'Day' : 'Days'}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider whitespace-nowrap ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* Customer Information Section */}
                  <div className="flex items-center justify-between bg-gray-50/70 p-3 rounded-2xl border border-gray-100/50 !mt-2.5" style={{ marginTop: '9px' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-[#1C205C] flex items-center justify-center font-black">
                        <FiUser size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">Customer</p>
                        <h5 className="font-bold text-gray-900 text-xs">{booking.user?.name || 'N/A'}</h5>
                      </div>
                    </div>
                    {/* Call + Eye icons on right side */}
                    <div className="flex items-center gap-2">
                      {booking.user?.phone && (
                        <a
                          href={`tel:${booking.user.phone}`}
                          className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Call Customer"
                        >
                          <FiPhone size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedBookingForDetails(booking)}
                        className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer border-none"
                        title="View trip details"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Car / Vehicle Details */}
                  {hasOndutyCar && (
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-12 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {booking.car.images && booking.car.images.length > 0 ? (
                          <img src={booking.car.images[0].url} alt="Car" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Car</span>
                        )}
                      </div>
                      <div>
                        <h6 className="font-bold text-gray-900 text-xs">{booking.car.brand} {booking.car.model}</h6>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black border border-blue-100/50 inline-block mt-0.5 uppercase">
                          {booking.car.registrationNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/30 p-3 rounded-2xl border border-gray-100/50 text-xs">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Trip Start (Pickup)</p>
                      <p className="font-bold text-gray-800">{formatDateDDMMYYYY(booking.tripStart?.date)}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">{formatTime12h(booking.tripStart?.time) || '10:00 AM'}</p>
                    </div>
                    <div className="border-l border-gray-100 pl-3">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Trip End (Drop)</p>
                      <p className="font-bold text-gray-800">{formatDateDDMMYYYY(booking.tripEnd?.date)}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">{formatTime12h(booking.tripEnd?.time) || '06:00 PM'}</p>
                    </div>
                  </div>

                  {/* Starting Kilometer Badge if recorded */}
                  {booking.startKm != null && (
                    <div className="bg-indigo-50/70 p-2.5 rounded-2xl border border-indigo-100/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🚗</span>
                        <div>
                          <p className="text-[9px] text-indigo-800 font-bold uppercase leading-none">Starting Meter</p>
                          <p className="font-extrabold text-[#1C205C] text-xs mt-0.5 font-mono">
                            {Number(booking.startKm).toLocaleString()} KM
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-white text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100 shadow-2xs">
                        Recorded
                      </span>
                    </div>
                  )}

                  {/* Sequential 4-Step Action Buttons */}
                  <div className="pt-3 border-t border-gray-50">
                    {(() => {
                      // Completed state
                      if (isTripCompleted) return (
                        <span className="w-full flex items-center justify-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs">
                          <FiCheck size={12} /> Trip Completed
                        </span>
                      );

                      // STEP 1: Start Trip → opens modal asking for current vehicle KM
                      if (!booking.tripStatus || booking.tripStatus === 'not_started') return (
                        <button
                          disabled={actionLoading === booking._id}
                          onClick={() => {
                            setStartTripModalBooking(booking);
                            setStartKmInput('');
                            setStartKmError('');
                          }}
                          className="w-full bg-[#1C205C] hover:bg-[#2c3180] disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === booking._id
                            ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                            : <><FiPlay fill="currentColor" size={11} /> Start Trip</>}
                        </button>
                      );

                      // STEP 2: Pickup — shown when trip is started
                      if (booking.tripStatus === 'started') return (
                        <button
                          disabled={actionLoading === booking._id}
                          onClick={() => handlePickup(booking._id)}
                          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-amber-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === booking._id
                            ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                            : <><FiMapPin size={12} /> Pickup</>}
                        </button>
                      );

                      // STEP 3: Ongoing — shown after Pickup is clicked
                      if (booking.tripStatus === 'picked_up') return (
                        <button
                          disabled={actionLoading === booking._id}
                          onClick={() => handleOngoing(booking._id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === booking._id
                            ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                            : <><FiActivity size={12} /> Ongoing</>}
                        </button>
                      );

                      // STEP 4: End Trip — calls /end API with confirmation
                      if (booking.tripStatus === 'ongoing') return (
                        <button
                          disabled={actionLoading === booking._id}
                          onClick={() => handleEndTrip(booking._id)}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-red-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === booking._id
                            ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                            : <><FiSquare fill="currentColor" size={11} /> End Trip</>}
                        </button>
                      );

                      return null;
                    })()}
                  </div>

                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-16 opacity-60">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-400 mx-auto mb-3 shadow-sm border border-gray-50">
                <FiActivity size={30} />
              </div>
              <p className="font-bold text-gray-500 text-sm">No assigned bookings</p>
              <p className="text-xs text-gray-400 mt-1">Trips assigned by the Admin will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Booking Details Modal for Drivers */}
      <AnimatePresence>
        {selectedBookingForDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingForDetails(null)}
              className="absolute inset-0 bg-[#1C205C]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative z-10 text-xs text-gray-700"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1C205C]">Trip Specifications</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Booking #{selectedBookingForDetails.bookingId}</p>
                </div>
                <button 
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors border-none"
                >
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                
                {/* Dates + Duration */}
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100/50">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Pickup</span>
                      <h5 className="font-bold text-gray-800 leading-tight">
                        {formatDateDDMMYYYY(selectedBookingForDetails.tripStart?.date)}
                      </h5>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatTime12h(selectedBookingForDetails.tripStart?.time) || '10:00 AM'}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-3">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Return</span>
                      <h5 className="font-bold text-gray-800 leading-tight">
                        {formatDateDDMMYYYY(selectedBookingForDetails.tripEnd?.date)}
                      </h5>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatTime12h(selectedBookingForDetails.tripEnd?.time) || '06:00 PM'}</p>
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

                {/* Car */}
                {selectedBookingForDetails.car && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Fleet</span>
                    <div className="p-3 bg-white border border-gray-100 rounded-2xl flex gap-2.5 items-center">
                      <div className="w-12 h-10 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                        {selectedBookingForDetails.car.images && selectedBookingForDetails.car.images.length > 0 ? (
                          <img src={selectedBookingForDetails.car.images[0].url} alt="Car" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-gray-400 font-bold">Car</span>
                        )}
                      </div>
                      <div>
                        <h6 className="font-bold text-gray-900 text-xs">{selectedBookingForDetails.car.brand} {selectedBookingForDetails.car.model}</h6>
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black border border-blue-100/50 inline-block uppercase">
                          {selectedBookingForDetails.car.registrationNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}



                {/* Odometer / Start Meter Reading in Details Modal */}
                {selectedBookingForDetails.startKm != null && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Odometer / Meter Reading</span>
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          🚗
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Start Meter</p>
                          <h6 className="font-extrabold text-[#1C205C] text-sm font-mono">
                            {Number(selectedBookingForDetails.startKm).toLocaleString()} KM
                          </h6>
                        </div>
                      </div>
                      {selectedBookingForDetails.startKmEnteredAt && (
                        <span className="text-[10px] text-gray-500 font-medium">
                          {new Date(selectedBookingForDetails.startKmEnteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Notes */}
                {selectedBookingForDetails.specialRequests && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Customer Requests &amp; Notes</span>
                    <div className="p-3 bg-amber-50/40 border border-amber-100/50 rounded-2xl text-[10px] text-amber-800 font-medium flex items-start gap-2">
                      <FiInfo className="text-amber-600 mt-0.5 shrink-0" size={12} />
                      <span>{selectedBookingForDetails.specialRequests}</span>
                    </div>
                  </div>
                )}

              </div>

              <div className="border-t border-gray-100 p-4 flex justify-end bg-gray-50/50">
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="w-full bg-[#1C205C] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/10 active:scale-95 transition-all text-center border-none"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Start Trip Meter (KM) Modal */}
      <AnimatePresence>
        {startTripModalBooking && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (actionLoading !== startTripModalBooking._id) {
                  setStartTripModalBooking(null);
                  setStartKmInput('');
                  setStartKmError('');
                }
              }}
              className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden z-10 p-5 text-gray-800 border border-gray-100"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#1C205C] flex items-center justify-center text-lg font-black shrink-0">
                    🚗
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1C205C]">Start Trip — Enter Meter KM</h3>
                    <p className="text-[10px] text-gray-400 font-semibold">Booking #{startTripModalBooking.bookingId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actionLoading === startTripModalBooking._id}
                  onClick={() => {
                    setStartTripModalBooking(null);
                    setStartKmInput('');
                    setStartKmError('');
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <MdClose size={18} />
                </button>
              </div>

              {/* Car details badge */}
              {startTripModalBooking.car && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Assigned Vehicle</p>
                    <p className="text-xs font-bold text-gray-800">
                      {startTripModalBooking.car.brand} {startTripModalBooking.car.model}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 uppercase">
                    {startTripModalBooking.car.registrationNumber || 'N/A'}
                  </span>
                </div>
              )}

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = Number(startKmInput);
                  if (!startKmInput || isNaN(val) || val <= 0) {
                    setStartKmError('Please enter a valid meter reading greater than 0');
                    return;
                  }
                  setStartKmError('');
                  handleStartTrip(startTripModalBooking._id, val);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Current Meter Reading (KM) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="any"
                      autoFocus
                      required
                      placeholder="e.g. 45200"
                      value={startKmInput}
                      onChange={(e) => {
                        setStartKmInput(e.target.value);
                        if (startKmError) setStartKmError('');
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#1C205C] focus:bg-white rounded-xl text-base font-extrabold text-[#1C205C] font-mono outline-none transition-all pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 bg-gray-200/60 px-2 py-1 rounded-md">
                      KM
                    </span>
                  </div>
                  {startKmError && (
                    <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                      <FiInfo size={11} /> {startKmError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                    💡 Please enter the exact kilometer reading currently visible on the vehicle odometer.
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading === startTripModalBooking._id}
                    onClick={() => {
                      setStartTripModalBooking(null);
                      setStartKmInput('');
                      setStartKmError('');
                    }}
                    className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === startTripModalBooking._id || !startKmInput}
                    className="w-full py-2.5 px-3 bg-[#1C205C] hover:bg-[#2c3180] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === startTripModalBooking._id ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    ) : (
                      <>
                        <FiPlay fill="currentColor" size={10} /> Submit &amp; Start
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default BookingsPage;
