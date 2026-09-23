import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';
import { generateBookingPDF, generateAllBookingsPDF } from '../../../utils/pdfGenerator';
import toastUtils from '../../../config/toast';
import { onMessageListener } from "../../../services/firebase";
import api from '../../../services/api';

/**
 * Format user ID to USER001 format
 * Takes MongoDB ObjectId and converts to USER + padded number
 */
const formatUserId = (userId) => {
  if (!userId) return 'N/A';
  return `user-${userId.toString().slice(-5)}`;
};

/**
 * Format time to AM/PM format
 * Converts 24-hour format (HH:mm) to 12-hour format with AM/PM
 */
const formatTimeToAMPM = (timeString) => {
  if (!timeString) return '';

  // If already contains AM/PM, return as is
  if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
    return timeString;
  }

  // Parse time string (format: HH:mm or HH:mm:ss)
  const timeParts = timeString.split(':');
  if (timeParts.length < 2) return timeString;

  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];

  if (isNaN(hours) || isNaN(parseInt(minutes, 10))) {
    return timeString;
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Booking List Page
 * Admin can view, filter, and manage all bookings
 * No localStorage or Redux - All state managed via React hooks
 */
const BookingListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial status from URL
  const getInitialStatus = () => {
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/active')) return 'active';
    return 'all';
  };

  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetailsBooking, setPaymentDetailsBooking] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [addOnPrices, setAddOnPrices] = useState({
    driver: 500,
    bodyguard: 1000,
    gunmen: 1500,
    bouncer: 800
  });

  // Fetch dynamic add-on prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await adminService.getAddOnServices();
        if (response.success && response.data) {
          const pricesMap = {};
          response.data.forEach(service => {
            pricesMap[service.key] = service.price;
          });
          setAddOnPrices(prev => ({ ...prev, ...pricesMap }));
        }
      } catch (err) {
        console.error('Error fetching add-on prices in booking list page:', err);
      }
    };
    fetchPrices();
  }, []);

  // For Mark as Complete flow
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeBookingTarget, setCompleteBookingTarget] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: getInitialStatus(), // all, pending, confirmed, active, completed, cancelled
    paymentStatus: 'all', // all, paid, pending, refunded
    dateRange: 'all', // all, today, week, month, custom
    startDate: '', // YYYY-MM-DD
    endDate: '', // YYYY-MM-DD
    car: 'all',
    user: 'all',
  });

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 Booking Alert: ${payload.notification.title}`);
        console.log("Booking Notification:", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isModalOpen = showBookingDetail || showCompleteModal || showPaymentDetails;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBookingDetail, showCompleteModal, showPaymentDetails]);

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getAllBookings({
          status: filters.status !== 'all' ? filters.status : undefined,
          paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus : undefined,
        });

        // Extract bookings from response.data (backend returns { success: true, data: { bookings, ... } })
        const bookingsData = response?.data?.bookings || response?.bookings || [];
        setGlobalStats(response?.data?.stats || null);

        // Transform API response to match component structure
        const transformedBookings = bookingsData.map((booking) => ({
          originalData: booking, // Preserve original data for PDF generation
          id: booking._id || booking.id,
          bookingId: booking.bookingId,
          userId: booking.user?._id || booking.userId,
          userName: booking.user?.name || booking.userName || 'N/A',
          userEmail: booking.user?.email || booking.userEmail || 'N/A',
          userPhone: booking.user?.phone || booking.userPhone || 'N/A',
          guarantorId: booking.guarantor?._id || booking.guarantorId,
          guarantorName: booking.guarantor?.name || booking.guarantorName,
          carId: booking.car?._id || booking.carId,
          carName: booking.car ? `${booking.car.brand || ''} ${booking.car.model || ''} ${booking.car.year || ''}`.trim() : booking.carName || 'N/A',
          carOwner: booking.car?.owner || booking.carOwner || 'N/A',
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.pricing 
            ? (booking.pricing.totalPrice - (booking.pricing.discount || 0)) 
            : ((booking.paidAmount || 0) + (booking.remainingAmount || 0)),
          paidAmount: booking.paidAmount || 0,
          refundAmount: booking.refundAmount,
          pickupDate: booking.tripStart?.date || booking.pickupDate || booking.pickupDateTime,
          pickupTime: booking.tripStart?.time || booking.pickupTime || (booking.pickupDateTime ? new Date(booking.pickupDateTime).toLocaleTimeString() : 'N/A'),
          dropDate: booking.tripEnd?.date || booking.dropDate || booking.dropDateTime,
          dropTime: booking.tripEnd?.time || booking.dropTime || (booking.dropDateTime ? new Date(booking.dropDateTime).toLocaleTimeString() : 'N/A'),
          pickupLocation: booking.tripStart?.location || booking.pickupLocation || 'N/A',
          dropLocation: booking.tripEnd?.location || booking.dropLocation || 'N/A',
          bookingDate: booking.createdAt || booking.bookingDate,
          days: booking.totalDays || booking.days || booking.duration || 0,
          currentLocation: booking.currentLocation,
          completedDate: booking.completedDate,
          cancelledDate: booking.cancelledDate,
          cancellationReason: booking.cancellationReason,
          rating: booking.rating,
          transactions: booking.transactions || [],
          remainingAmount: booking.remainingAmount || 0,
          assignedDriver: booking.assignedDriver || null,
          addOnServices: booking.addOnServices || {},
        })) || [];

        setBookings(transformedBookings);
        setFilteredBookings(transformedBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError(err.response?.data?.message || 'Failed to fetch bookings');
        setBookings([]);
        setFilteredBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and search bookings
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((booking) => {
        const bookingId = (booking.bookingId || '').toLowerCase();
        const userName = (booking.userName || '').toLowerCase();
        const userEmail = (booking.userEmail || '').toLowerCase();
        const carName = (booking.carName || '').toLowerCase();

        return keywords.every((keyword) =>
          bookingId.includes(keyword) ||
          userName.includes(keyword) ||
          userEmail.includes(keyword) ||
          carName.includes(keyword)
        );
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((booking) => booking.status === filters.status);
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter((booking) => booking.paymentStatus === filters.paymentStatus);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.bookingDate);
        switch (filters.dateRange) {
          case 'today':
            return bookingDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return bookingDate >= monthAgo;
          case 'custom':
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            
            if (start && end) {
              return bookingDate >= start && bookingDate <= end;
            } else if (start) {
              return bookingDate >= start;
            } else if (end) {
              return bookingDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Car filter
    if (filters.car !== 'all') {
      filtered = filtered.filter((booking) => booking.carId === filters.car);
    }

    // User filter
    if (filters.user !== 'all') {
      filtered = filtered.filter((booking) => booking.userId === filters.user);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, filters]);

  // Handle booking actions
  const handleApprove = async (bookingId) => {
    try {
      // Call backend API to update booking status to confirmed
      const response = await adminService.updateBooking(bookingId, {
        status: 'confirmed',
      });

      if (response.success) {
        // Update local state
        setBookings((prevList) =>
          prevList.map((booking) => {
            if (booking.id === bookingId) {
              return { ...booking, status: 'confirmed' };
            }
            return booking;
          })
        );

        // Show success message
        alert('Booking approved successfully! Status changed to Confirmed.');
      } else {
        alert('Failed to approve booking. Please try again.');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.message || 'Failed to approve booking. Please try again.');
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    try {
      // Call backend API to update booking status to cancelled
      const response = await adminService.updateBooking(bookingId, {
        status: 'cancelled',
        cancellationReason: 'Rejected by admin',
      });

      if (response.success) {
        // Update local state
        setBookings((prevList) =>
          prevList.map((booking) => {
            if (booking.id === bookingId) {
              return { ...booking, status: 'cancelled', cancellationReason: 'Rejected by admin' };
            }
            return booking;
          })
        );

        // Show success message
        alert('Booking rejected successfully!');
      } else {
        alert('Failed to reject booking. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.message || 'Failed to reject booking. Please try again.');
    }
  };

  const handleCancel = async (bookingId) => {
    console.log('🔄 handleCancel called with bookingId:', bookingId);

    if (!bookingId) {
      console.error('❌ No booking ID provided');
      alert('Error: Booking ID is missing');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      console.log('🔄 Cancelling booking:', bookingId);
      // Call backend API to update booking status to cancelled
      const response = await adminService.updateBooking(bookingId, {
        status: 'cancelled',
        cancellationReason: 'Cancelled by admin',
      });

      console.log('📊 Cancel booking response:', response);
      console.log('📊 Response success:', response?.success);

      if (response && response.success) {
        // Update local state for both bookings and filteredBookings
        setBookings((prevList) => {
          const updated = prevList.map((booking) => {
            if (booking.id === bookingId || booking._id === bookingId) {
              console.log('✅ Updating booking in bookings state:', booking.id);
              return {
                ...booking,
                status: 'cancelled',
                cancellationReason: 'Cancelled by admin',
                cancelledDate: new Date().toISOString(),
              };
            }
            return booking;
          });
          return updated;
        });

        // Also update filteredBookings to reflect the change immediately
        setFilteredBookings((prevList) => {
          const updated = prevList.map((booking) => {
            if (booking.id === bookingId || booking._id === bookingId) {
              console.log('✅ Updating booking in filteredBookings state:', booking.id);
              return {
                ...booking,
                status: 'cancelled',
                cancellationReason: 'Cancelled by admin',
                cancelledDate: new Date().toISOString(),
              };
            }
            return booking;
          });
          return updated;
        });

        // Show success message
        alert('Booking cancelled successfully!');

        // Refresh bookings list to get updated data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('❌ API returned success: false');
        alert(response?.message || 'Failed to cancel booking. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      alert(error.response?.data?.message || error.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const handleProcessRefund = async (bookingId) => {
    if (!window.confirm('Are you sure you want to process refund for this booking?')) {
      return;
    }

    try {
      // Get the booking to calculate refund amount
      const booking = bookings.find(b => b.id === bookingId);
      const refundAmount = booking?.paidAmount || booking?.totalAmount || 0;

      // Call backend API to update payment status to refunded
      const response = await adminService.updateBooking(bookingId, {
        paymentStatus: 'refunded',
        refundAmount: refundAmount,
      });

      if (response.success) {
        // Update local state
        setBookings((prevList) =>
          prevList.map((booking) => {
            if (booking.id === bookingId) {
              return {
                ...booking,
                paymentStatus: 'refunded',
                refundAmount: refundAmount,
              };
            }
            return booking;
          })
        );

        // Show success message
        alert('Refund processed successfully! Payment status updated to refunded. User side will reflect the changes on next refresh.');
      } else {
        alert('Failed to process refund. Please try again.');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(error.response?.data?.message || 'Failed to process refund. Please try again.');
    }
  };

  const handleMarkAsComplete = (bookingId) => {
    if (!bookingId) {
      alert('Error: Booking ID is missing');
      return;
    }
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      alert('Booking not found.');
      return;
    }
    setCompleteBookingTarget(booking);
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async (bookingId, paymentData) => {
    try {
      const response = await adminService.completeBookingWithPayment(bookingId, paymentData);
      if (response && response.success) {
        const updatedBooking = response.data?.booking || response.booking;
        if (updatedBooking) {
          const updateFn = (prev) => prev.map(b =>
            (b.id === bookingId || b._id === bookingId) ? { ...b, ...updatedBooking, id: b.id } : b
          );
          setBookings(updateFn);
          setFilteredBookings(updateFn);
        } else {
          // Fallback if booking isn't returned
          const updateFn = (prev) => prev.map(b =>
            (b.id === bookingId || b._id === bookingId)
              ? { ...b, status: 'completed', paymentStatus: 'paid', completedDate: new Date().toISOString() }
              : b
          );
          setBookings(updateFn);
          setFilteredBookings(updateFn);
        }
        setShowCompleteModal(false);
        setCompleteBookingTarget(null);
        toastUtils.success('✅ Booking completed and payment recorded!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to complete booking.';
      toastUtils.error(`❌ ${msg}`);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetail(true);
  };

  // Export to PDF
  const handleExport = () => {
    if (!bookings || bookings.length === 0) {
      alert('No bookings available to export.');
      return;
    }
    
    // Use globalStats if available, else use local calculated stats
    const statsToUse = globalStats || stats;
    generateAllBookingsPDF(filteredBookings, statsToUse);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get unique cars using Map to handle duplicates by ID
  const carsMap = new Map();
  bookings.forEach((booking) => {
    if (booking.carId && booking.carName) {
      carsMap.set(booking.carId, {
        id: booking.carId,
        name: booking.carName,
      });
    }
  });
  const cars = Array.from(carsMap.values());

  // Get unique users using Map to handle duplicates by ID
  const usersMap = new Map();
  bookings.forEach((booking) => {
    if (booking.userId && booking.userName) {
      usersMap.set(booking.userId, {
        id: booking.userId,
        name: booking.userName,
      });
    }
  });
  const users = Array.from(usersMap.values());

  // Stats calculation (fallback if globalStats is not available)
  const stats = globalStats || {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    active: bookings.filter((b) => b.status === 'active').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter((b) => b.status === 'completed' || b.status === 'active')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  // Helper to format revenue cleanly
  const formatRevenue = (revenue) => {
    if (!revenue) return '₹0';
    if (revenue >= 1000) {
      // If it's a clean thousand, show K (e.g. 15000 -> 15K)
      if (revenue % 1000 === 0) return `₹${revenue / 1000}K`;
      // Otherwise just show the formatted number
      return `₹${revenue.toLocaleString('en-IN')}`;
    }
    return `₹${revenue.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
                Booking Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Manage all bookings and trips</p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600">Pending</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-blue-600">{stats.confirmed}</div>
            <div className="text-xs md:text-sm text-gray-600">Confirmed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-green-600">{stats.active}</div>
            <div className="text-xs md:text-sm text-gray-600">Active</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-gray-600">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {formatRevenue(stats.totalRevenue)}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Revenue</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-4 items-end">
            {/* Search Bar */}
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Search</label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-span-1 lg:col-span-2">
              <AdminCustomSelect
                label="Booking Status"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>

            {/* Payment Status Filter */}
            <div className="col-span-1 lg:col-span-2">
              <AdminCustomSelect
                label="Payment Status"
                value={filters.paymentStatus}
                onChange={(value) => setFilters({ ...filters, paymentStatus: value })}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'refunded', label: 'Refunded' },
                ]}
              />
            </div>

            {/* Date Range Filter */}
            <div className="col-span-1 lg:col-span-2">
              <AdminCustomSelect
                label="Date Range"
                value={filters.dateRange}
                onChange={(value) => setFilters({ ...filters, dateRange: value })}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
              />
            </div>

            {/* Car Filter */}
            <div className="col-span-1 lg:col-span-2">
              <AdminCustomSelect
                label="Car"
                value={filters.car}
                onChange={(value) => setFilters({ ...filters, car: value })}
                options={[
                  { value: 'all', label: 'All Cars' },
                  ...cars.map((car, index) => ({
                    value: car.id || `car-${index}`,
                    label: car.name,
                  })),
                ]}
              />
            </div>

            {/* User Filter */}
            <div className="col-span-1 lg:col-span-2">
              <AdminCustomSelect
                label="User"
                value={filters.user}
                onChange={(value) => setFilters({ ...filters, user: value })}
                options={[
                  { value: 'all', label: 'All Users' },
                  ...users.map((user, index) => ({
                    value: user.id || `user-${index}`,
                    label: user.name,
                  })),
                ]}
              />
            </div>
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Bookings List */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredBookings.length}</span> of <span className="font-semibold">{bookings.length}</span> bookings
          </p>
        </div>

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {booking.bookingId} - {booking.carName}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {booking.userName} • {booking.userEmail} {booking.userPhone && `• ${booking.userPhone}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.status === 'cancelled' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.paymentStatus === 'refunded' ? 'refunded' : 'cancelled')}`}>
                          Payment: {booking.paymentStatus === 'refunded' ? 'Refunded' : 'Cancelled'}
                        </span>
                      ) : booking.paymentStatus === 'partial' ? (
                        <>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor('paid')}`}>
                            Advance Paid
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor('pending')}`}>
                            Remaining Pending
                          </span>
                        </>
                      ) : booking.paymentStatus === 'paid' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor('paid')}`}>
                          Payment: Paid
                        </span>
                      ) : booking.paymentStatus === 'refunded' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor('refunded')}`}>
                          Payment: Refunded
                        </span>
                      ) : booking.paymentStatus === 'failed' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Payment: Failed
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(booking.paymentStatus)}`}>
                          Payment: {booking.paymentStatus ? booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1) : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Pickup</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(booking.pickupDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeToAMPM(booking.pickupTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Drop</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(booking.dropDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeToAMPM(booking.dropTime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="text-sm font-semibold text-gray-900">{booking.days} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                        ₹{booking.totalAmount.toLocaleString()}
                      </p>
                      {booking.guarantorName && (
                        <p className="text-xs text-gray-500">Guarantor: {booking.guarantorName}</p>
                      )}
                    </div>
                  </div>
                  
                  {booking.addOnServices && Object.values(booking.addOnServices).some(qty => qty > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2 items-center bg-purple-50/50 border border-purple-100 p-2.5 rounded-xl mb-3">
                      <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Add-ons:</span>
                      {Object.entries(booking.addOnServices).map(([key, qty]) => {
                        if (!qty || qty <= 0) return null;
                        const labelMap = {
                          driver: 'Driver',
                          bodyguard: 'Body Guard',
                          gunmen: 'Gun Man',
                          bouncer: 'Bouncer'
                        };
                        const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                        return (
                          <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700 border border-purple-200">
                            {label}: {qty}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>Booked: {new Date(booking.bookingDate).toLocaleString()}</span>
                    {booking.status === 'active' && booking.currentLocation && (
                      <span className="text-green-600 font-medium">📍 {booking.currentLocation}</span>
                    )}
                    {booking.status === 'completed' && booking.completedDate && (
                      <span>Completed: {new Date(booking.completedDate).toLocaleString()}</span>
                    )}
                    {booking.status === 'cancelled' && booking.cancellationReason && (
                      <span className="text-red-600">Reason: {booking.cancellationReason}</span>
                    )}
                    {booking.originalData?.pricing?.couponCode && (() => {
                      const couponDetails = booking.originalData.pricing.couponDetails;
                      const displayVal = couponDetails
                        ? `${booking.originalData.pricing.couponCode} (${couponDetails.discountValue}${couponDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off)`
                        : booking.originalData.pricing.couponCode;
                      return (
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium border border-green-200 text-xs">
                          🎫 Coupon: {displayVal}
                        </span>
                      );
                    })()}
                    {booking.originalData?.pricing?.offerCode && (() => {
                      const offerDetails = booking.originalData.pricing.offerDetails;
                      const displayVal = offerDetails
                        ? `${offerDetails.title} (${offerDetails.discountType === 'free' ? 'Free' : `${offerDetails.discountValue}${offerDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`})`
                        : booking.originalData.pricing.offerCode;
                      return (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200 text-xs">
                          🏷️ Offer: {displayVal}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-40">
                  <button
                    type="button"
                    onClick={() => handleViewBooking(booking)}
                    className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    View Details
                  </button>

                  {booking.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => { setPaymentDetailsBooking(booking); setShowPaymentDetails(true); }}
                      className="w-full px-3 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 600 }}
                    >
                      💳 Payment Details
                    </button>
                  )}


                  {booking.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(booking.id)}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(booking.id)}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {(booking.status === 'confirmed' || booking.status === 'active') && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Cancel button clicked for booking:', booking.id);
                          handleCancel(booking.id);
                        }}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Booking
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Mark complete button clicked for booking:', booking.id);
                          handleMarkAsComplete(booking.id);
                        }}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Mark as Complete
                      </button>
                    </>
                  )}

                  {booking.status === 'cancelled' && booking.paidAmount > 0 && (
                    <button
                      type="button"
                      disabled={booking.paymentStatus === 'refunded'}
                      onClick={() => handleProcessRefund(booking.id)}
                      className={`w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        booking.paymentStatus === 'refunded'
                          ? 'bg-purple-300 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {booking.paymentStatus === 'refunded' ? 'Refunded' : 'Refund'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No bookings found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          addOnPrices={addOnPrices}
          onClose={() => {
            setShowBookingDetail(false);
            setSelectedBooking(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
          onProcessRefund={handleProcessRefund}
        />
      )}

      {/* Complete Payment Collection Modal */}
      {showCompleteModal && completeBookingTarget && (
        <CompletePaymentModal
          booking={completeBookingTarget}
          onClose={() => { setShowCompleteModal(false); setCompleteBookingTarget(null); }}
          onConfirm={handleConfirmComplete}
        />
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && paymentDetailsBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>Payment Details</h2>
              <button onClick={() => { setShowPaymentDetails(false); setPaymentDetailsBooking(null); }} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Advance Payment */}
              <div style={{ padding: 16, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Advance Payment</h3>
                {paymentDetailsBooking.transactions && paymentDetailsBooking.transactions.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                    <div><span style={{ color: '#64748b' }}>Amount:</span> <span style={{ fontWeight: 600 }}>₹{paymentDetailsBooking.transactions[0].amount}</span></div>
                    <div><span style={{ color: '#64748b' }}>Method:</span> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{paymentDetailsBooking.transactions[0].paymentMethod || 'Online'}</span></div>
                    {!(paymentDetailsBooking.transactions[0].paymentMethod?.toLowerCase() === 'cash' || paymentDetailsBooking.transactions[0].transactionId?.startsWith('CASH-')) && (
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Transaction ID:</span> <span style={{ fontWeight: 600 }}>{paymentDetailsBooking.transactions[0].transactionId || 'N/A'}</span></div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Date:</span> <span style={{ fontWeight: 600 }}>{paymentDetailsBooking.transactions[0].paymentDate ? new Date(paymentDetailsBooking.transactions[0].paymentDate).toLocaleString() : new Date(paymentDetailsBooking.bookingDate).toLocaleString()}</span></div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No advance payment recorded.</p>
                )}
              </div>

              {/* Completion Payment */}
              <div style={{ padding: 16, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 12 }}>Completion Payment</h3>
                {paymentDetailsBooking.transactions && paymentDetailsBooking.transactions.length > 1 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                    {paymentDetailsBooking.transactions.slice(1).map((tx, idx) => (
                      <div key={idx} style={{ display: 'contents' }}>
                        <div><span style={{ color: '#64748b' }}>Amount:</span> <span style={{ fontWeight: 600 }}>₹{tx.amount}</span></div>
                        <div><span style={{ color: '#64748b' }}>Method:</span> <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{tx.paymentMethod}</span></div>
                        {tx.transactionId && !tx.transactionId.startsWith('CASH-') && tx.paymentMethod?.toLowerCase() !== 'cash' && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Transaction ID:</span> <span style={{ fontWeight: 600 }}>{tx.transactionId}</span></div>}
                        {tx.receivedBy && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Received By:</span> <span style={{ fontWeight: 600 }}>{tx.receivedBy}</span></div>}
                        <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}><span style={{ color: '#64748b' }}>Date:</span> <span style={{ fontWeight: 600 }}>{tx.paymentDate ? new Date(tx.paymentDate).toLocaleString() : new Date(paymentDetailsBooking.completedDate).toLocaleString()}</span></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No additional payments found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Booking Detail Modal Component
 */
const BookingDetailModal = ({ booking, addOnPrices = {}, onClose, onApprove, onReject, onCancel, onProcessRefund }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus || 'pending');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [guarantorPoints, setGuarantorPoints] = useState(null);
  const [loadingGuarantorPoints, setLoadingGuarantorPoints] = useState(false);



  // Update payment status when booking prop changes
  useEffect(() => {
    setPaymentStatus(booking.paymentStatus || 'pending');
  }, [booking.paymentStatus]);

  // Fetch guarantor points when modal opens
  useEffect(() => {
    const fetchGuarantorPoints = async () => {
      if (!booking?.id) return;

      try {
        setLoadingGuarantorPoints(true);
        const response = await adminService.getBookingGuarantorPoints(booking.id);
        if (response.success && response.data) {
          setGuarantorPoints(response.data);
        }
      } catch (error) {
        console.error('Error fetching guarantor points:', error);
        // Don't show error to user, just log it
      } finally {
        setLoadingGuarantorPoints(false);
      }
    };

    fetchGuarantorPoints();
  }, [booking?.id]);

  // Calculate remaining amount
  const remainingAmount = (booking.totalAmount || 0) - (booking.paidAmount || 0);
  const advanceAmount = booking.paidAmount || 0;

  // Determine advance payment status based on booking status
  const advancePaymentStatus = booking.status === 'cancelled'
    ? 'cancelled'
    : advanceAmount > 0 ? 'done' : 'pending';

  // Determine remaining payment status based on booking status and payment
  const remainingPaymentStatus = booking.status === 'cancelled'
    ? 'cancelled'
    : paymentStatus === 'paid' ? 'done' : (remainingAmount <= 0 ? 'done' : 'pending');

  // Handle payment status update
  const handlePaymentStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to change payment status to "${newStatus}"?`)) {
      return;
    }

    try {
      setIsUpdatingPayment(true);
      const response = await adminService.updateBooking(booking.id, {
        paymentStatus: newStatus,
      });

      if (response.success) {
        setPaymentStatus(newStatus);
        // Update booking object locally
        booking.paymentStatus = newStatus;

        // If status is changed to "paid", update paidAmount to totalAmount
        if (newStatus === 'paid' && booking.paidAmount < booking.totalAmount) {
          booking.paidAmount = booking.totalAmount;
        }

        alert('Payment status updated successfully! User side will reflect the changes on next refresh.');
      } else {
        alert('Failed to update payment status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{booking.bookingId}</h2>
            <p className="text-sm text-gray-600">{booking.carName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['details', 'user', 'payment', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === tab
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                style={activeTab === tab ? { borderBottomColor: colors.backgroundTertiary } : {}}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'details' && (
              <div className="space-y-6">


                {/* Car Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Car Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Car</label>
                      <p className="text-sm text-gray-900">{booking.carName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900 capitalize">{booking.status}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Trip Start Date & Time</label>
                      <p className="text-sm text-gray-900">
                        {new Date(booking.pickupDate).toLocaleDateString()} at {formatTimeToAMPM(booking.pickupTime)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Trip End Date & Time</label>
                      <p className="text-sm text-gray-900">
                        {new Date(booking.dropDate).toLocaleDateString()} at {formatTimeToAMPM(booking.dropTime)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900">{booking.days} days</p>
                    </div>
                    {booking.status === 'active' && booking.currentLocation && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Current Location</label>
                        <p className="text-sm text-green-600 font-medium">📍 {booking.currentLocation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                {(() => {
                  const dbBasePrice = booking.originalData?.pricing?.basePrice;
                  const addOnServicesTotal = booking.originalData?.pricing?.addOnServicesTotal || 0;
                  const calculatedCarTotal = booking.totalAmount - addOnServicesTotal + (booking.originalData?.pricing?.discount || 0);
                  const basePrice = dbBasePrice || Math.max(0, Math.round(calculatedCarTotal / (booking.days || 1)));
                  const discount = booking.originalData?.pricing?.discount || 0;
                  const offerDiscount = booking.originalData?.pricing?.offerDiscount || 0;
                  const pointsDiscount = booking.originalData?.pricing?.pointsDiscount || 0;
                  const pointsUsed = booking.originalData?.pricing?.pointsUsed || 0;
                  const couponDiscount = Math.max(0, discount - offerDiscount - pointsDiscount);
                  const couponCode = booking.originalData?.pricing?.couponCode;
                  const offerCode = booking.originalData?.pricing?.offerCode;

                  return (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {/* Car rental daily rate and days */}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Car Rental Rate</span>
                          <span className="text-gray-900 font-medium">₹{basePrice.toLocaleString()} / day</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rental Duration</span>
                          <span className="text-gray-900 font-medium">{booking.days} {booking.days === 1 ? 'day' : 'days'}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2 border-b border-gray-200">
                          <span className="text-gray-600">Car Rental Total</span>
                          <span className="text-gray-900 font-semibold">₹{(basePrice * booking.days).toLocaleString()}</span>
                        </div>

                        {/* Add-on Services details */}
                        {booking.addOnServices && Object.values(booking.addOnServices).some(qty => qty > 0) && (
                          <div className="py-2 border-b border-gray-200 space-y-1">
                            <span className="text-xs font-bold text-gray-500 block uppercase tracking-wider mb-1">Add-on Services Breakdown</span>
                            {Object.entries(booking.addOnServices).map(([key, qty]) => {
                              if (!qty || qty <= 0) return null;
                              const labelMap = {
                                driver: 'Driver',
                                bodyguard: 'Body Guard',
                                gunmen: 'Gun Man',
                                bouncer: 'Bouncer'
                              };
                              const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                              const unitPrice = addOnPrices[key] || 0;
                              const addOnTotal = qty * unitPrice;
                              return (
                                <div key={key} className="flex justify-between text-xs pl-2">
                                  <span className="text-gray-600">{label} ({qty} × ₹{unitPrice.toLocaleString()})</span>
                                  <span className="text-gray-900 font-medium">₹{addOnTotal.toLocaleString()}</span>
                                </div>
                              );
                            })}
                            <div className="flex justify-between text-xs font-bold pt-1 pl-2">
                              <span className="text-gray-700">Add-on Services Total</span>
                              <span className="text-gray-900">₹{addOnServicesTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        {/* Discounts if any */}
                        {couponDiscount > 0 && (() => {
                          const couponDetails = booking.originalData?.pricing?.couponDetails;
                          const promoText = couponDetails
                            ? `${couponCode} (${couponDetails.discountValue}${couponDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off)`
                            : couponCode;
                          return (
                            <div className="flex justify-between text-sm text-green-600 py-1 border-b border-gray-200">
                              <span>Coupon Discount ({promoText})</span>
                              <span className="font-semibold">-₹{couponDiscount.toLocaleString()}</span>
                            </div>
                          );
                        })()}
                        {offerDiscount > 0 && (() => {
                          const offerDetails = booking.originalData?.pricing?.offerDetails;
                          const promoText = offerDetails
                            ? `${offerDetails.title} (${offerDetails.discountType === 'free' ? 'Free' : `${offerDetails.discountValue}${offerDetails.discountType === 'percentage' ? '%' : ' Rs.'} Off`})`
                            : offerCode;
                          return (
                            <div className="flex justify-between text-sm text-green-600 py-1 border-b border-gray-200">
                              <span>Offer Discount ({promoText})</span>
                              <span className="font-semibold">-₹{offerDiscount.toLocaleString()}</span>
                            </div>
                          );
                        })()}
                        {pointsDiscount > 0 && (
                          <div className="flex justify-between text-sm py-1 border-b border-gray-200" style={{ color: '#A16207' }}>
                            <span>🪙 Coins Discount ({pointsUsed} coins)</span>
                            <span className="font-semibold">-₹{pointsDiscount.toLocaleString()}</span>
                          </div>
                        )}

                        {/* Total Amount */}
                        <div className="pt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-gray-900">Total Amount</span>
                            <span className="text-base font-black" style={{ color: colors.backgroundTertiary }}>
                              ₹{booking.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Add-On Services */}
                {booking.addOnServices && Object.values(booking.addOnServices).some(qty => qty > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-On Services</h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-3">
                      {Object.entries(booking.addOnServices).map(([key, qty]) => {
                        if (!qty || qty <= 0) return null;
                        const labelMap = {
                          driver: 'Driver',
                          bodyguard: 'Body Guard',
                          gunmen: 'Gun Man',
                          bouncer: 'Bouncer'
                        };
                        const label = labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                        const unitPrice = addOnPrices[key] || 0;
                        const totalAddOn = qty * unitPrice;
                        return (
                          <span key={key} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            {label}: {qty} Unit(s) (₹{unitPrice.toLocaleString()} × {qty} = ₹{totalAddOn.toLocaleString()})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'user' && (
              <div className="space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{booking.userName}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{booking.userEmail}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{booking.userPhone}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{formatUserId(booking.userId)}</p>
                    </div>
                  </div>
                </div>

                {/* Guarantor Information */}
                {booking.guarantorName && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guarantor Information</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Name</label>
                        <p className="text-sm text-gray-900">{booking.guarantorName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Guarantor ID</label>
                        <p className="text-sm text-gray-900">{booking.guarantorId}</p>
                      </div>
                    </div>

                    {/* Guarantor Points Section */}
                    {loadingGuarantorPoints ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Loading guarantor points...</p>
                      </div>
                    ) : guarantorPoints && guarantorPoints.guarantors && guarantorPoints.guarantors.length > 0 ? (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Guarantor Points Allocation</h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-gray-600">Booking Amount:</span>
                              <p className="font-semibold text-gray-900">₹{guarantorPoints.bookingAmount?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">10% Pool Amount:</span>
                              <p className="font-semibold text-gray-900">
                                ₹{(() => {
                                  const amt = Number(guarantorPoints.totalPoolAmount);
                                  if (amt % 1 === 0) return amt.toLocaleString();
                                  const decimals = amt.toString().split('.')[1]?.length || 0;
                                  return decimals <= 3 ? amt.toFixed(decimals) : amt.toFixed(3);
                                })()}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Guarantors:</span>
                              <p className="font-semibold text-gray-900">{guarantorPoints.totalGuarantors || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Active Guarantors:</span>
                              <p className="font-semibold text-green-600">{guarantorPoints.activeGuarantors || 0}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-blue-200">
                            <h5 className="text-xs font-semibold text-gray-900 mb-2">Points Per Guarantor:</h5>
                            <div className="space-y-2">
                              {guarantorPoints.guarantors.map((guarantor, index) => (
                                <div key={guarantor.id || index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">{guarantor.guarantorName}</p>
                                    <p className="text-xs text-gray-500">{guarantor.guarantorEmail}</p>
                                    {guarantor.guarantorGuarantorId && (
                                      <p className="text-xs text-gray-500">ID: {guarantor.guarantorGuarantorId}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-bold ${guarantor.status === 'active' ? 'text-green-600' : 'text-red-600 line-through'}`}>
                                      {(() => {
                                        const pts = Number(guarantor.pointsAllocated);
                                        if (pts % 1 === 0) return pts.toLocaleString();
                                        const decimals = pts.toString().split('.')[1]?.length || 0;
                                        return decimals <= 3 ? pts.toFixed(decimals) : pts.toFixed(3);
                                      })()}
                                    </p>
                                    <p className={`text-xs ${guarantor.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                      {guarantor.status === 'active' ? 'Active' : 'Reversed'}
                                    </p>
                                    {guarantor.reversedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(guarantor.reversedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>

                {/* Payment Status Dropdown */}
                <div className="mb-6">
                  <AdminCustomSelect
                    label="Payment Status"
                    value={paymentStatus}
                    onChange={(value) => handlePaymentStatusUpdate(value)}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'refunded', label: 'Refunded' },
                      { value: 'failed', label: 'Failed' },
                    ]}
                    className={isUpdatingPayment ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                  />
                  {isUpdatingPayment && (
                    <p className="text-xs text-gray-500 mt-1">Updating...</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Total Amount</label>
                    <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                      ₹{booking.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Paid Amount</label>
                    <p className="text-sm text-gray-900">₹{advanceAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Advance Payment Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Advance Payment Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${advancePaymentStatus === 'done'
                      ? 'bg-green-100 text-green-800'
                      : advancePaymentStatus === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {advancePaymentStatus === 'done' ? 'Done' : advancePaymentStatus === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Advance Amount: ₹{advanceAmount.toLocaleString()}</p>
                </div>

                {/* Remaining Payment Status */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Remaining Payment Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${remainingPaymentStatus === 'done'
                      ? 'bg-green-100 text-green-800'
                      : remainingPaymentStatus === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {remainingPaymentStatus === 'done' ? 'Done' : remainingPaymentStatus === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Remaining Amount: ₹{remainingAmount.toLocaleString()}</p>
                </div>

                {booking.refundAmount && booking.refundAmount > 0 && (
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-700">Refund Amount</label>
                    <p className="text-sm text-gray-900">₹{booking.refundAmount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Timeline</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Booking Created</p>
                    <p className="text-xs text-gray-500">{new Date(booking.bookingDate).toLocaleString()}</p>
                  </div>
                  {booking.status === 'confirmed' && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Booking Confirmed</p>
                      <p className="text-xs text-gray-500">Status: Confirmed</p>
                    </div>
                  )}
                  {booking.status === 'active' && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Trip Started</p>
                      <p className="text-xs text-gray-500">Pickup: {new Date(booking.pickupDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {booking.status === 'completed' && booking.completedDate && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Trip Completed</p>
                      <p className="text-xs text-gray-500">{new Date(booking.completedDate).toLocaleString()}</p>
                    </div>
                  )}
                  {booking.status === 'cancelled' && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Booking Cancelled</p>
                      {booking.cancellationReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {booking.cancellationReason}</p>
                      )}
                      {booking.cancelledDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(booking.cancelledDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          {['pending', 'confirmed', 'completed', 'active'].includes(booking.status) && (
            <button
              onClick={() => generateBookingPDF(booking.originalData || booking)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Receipt
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {booking.status === 'pending' && (
            <>
              <button
                onClick={async () => {
                  await onApprove(booking.id);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={async () => {
                  await onReject(booking.id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {(booking.status === 'confirmed' || booking.status === 'active') && (
            <button
              onClick={async () => {
                await onCancel(booking.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Booking
            </button>
          )}
          {booking.status === 'cancelled' && booking.paidAmount > 0 && (
            <button
              disabled={booking.paymentStatus === 'refunded'}
              onClick={() => {
                onProcessRefund(booking.id);
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                booking.paymentStatus === 'refunded'
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {booking.paymentStatus === 'refunded' ? 'Refunded' : 'Process Refund'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingListPage;

/**
 * CompletePaymentModal
 * Shows remaining due amount and lets admin collect it via Online / Cash / Partial
 */
const CompletePaymentModal = ({ booking, onClose, onConfirm }) => {
  const totalAmount = booking.totalAmount || 0;
  const paidAmount = booking.paidAmount || 0;
  const remaining = Math.max(0, totalAmount - paidAmount);

  const [mode, setMode] = useState('online'); // 'online' | 'cash' | 'partial'
  const [transactionId, setTransactionId] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [onlineAmt, setOnlineAmt] = useState('');
  const [cashAmt, setCashAmt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [cashCollectors, setCashCollectors] = useState([]);

  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const response = await adminService.getSystemSettings();
        if (response.success && response.data?.settings?.cashCollectors) {
          const list = response.data.settings.cashCollectors;
          setCashCollectors(list);
          if (list.length > 0) {
            setReceivedBy(list[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching cash collectors:', err);
      }
    };
    fetchCollectors();
  }, []);

  const formatAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  // Partial: auto-fill cash when online changes
  const handleOnlineAmtChange = (val) => {
    setOnlineAmt(val);
    const o = parseFloat(val) || 0;
    const c = Math.max(0, remaining - o);
    setCashAmt(c > 0 ? c.toString() : '');
  };
  const handleCashAmtChange = (val) => {
    setCashAmt(val);
    const c = parseFloat(val) || 0;
    const o = Math.max(0, remaining - c);
    setOnlineAmt(o > 0 ? o.toString() : '');
  };

  const validate = () => {
    const e = {};
    if (mode === 'online') {
      if (!transactionId.trim()) e.transactionId = 'Transaction ID is required';
    } else if (mode === 'cash') {
      if (!receivedBy.trim()) e.receivedBy = 'Received By name is required';
    } else {
      const o = parseFloat(onlineAmt) || 0;
      const c = parseFloat(cashAmt) || 0;
      if (Math.round(o + c) !== Math.round(remaining))
        e.partial = `Online + Cash must equal ${formatAmt(remaining)}. Currently: ${formatAmt(o + c)}`;
      if (o > 0 && !transactionId.trim()) e.transactionId = 'Transaction ID required for online portion';
      if (c > 0 && !receivedBy.trim()) e.receivedBy = 'Received By required for cash portion';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (remaining === 0) {
      // No payment needed — just complete the booking
      setSubmitting(true);
      try {
        await onConfirm(booking.id, { paymentMode: 'none' });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    const payload = { paymentMode: mode };
    if (mode === 'online' || (mode === 'partial' && parseFloat(onlineAmt) > 0)) {
      payload.transactionId = transactionId.trim();
    }
    if (mode === 'cash' || (mode === 'partial' && parseFloat(cashAmt) > 0)) {
      payload.receivedBy = receivedBy.trim();
    }
    if (mode === 'partial') {
      payload.onlineAmount = parseFloat(onlineAmt) || 0;
      payload.cashAmount = parseFloat(cashAmt) || 0;
    }
    try {
      await onConfirm(booking.id, payload);
    } finally {
      setSubmitting(false);
    }
  };

  const tabStyle = (active) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    background: active ? '#1e40af' : '#f1f5f9',
    color: active ? '#ffffff' : '#475569',
    boxShadow: active ? '0 2px 8px rgba(30,64,175,0.25)' : 'none',
  });

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1e293b',
    background: '#f8fafc',
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Complete Booking
              </h2>
              <p style={{ color: '#bfdbfe', fontSize: '13px', margin: '4px 0 0' }}>
                {booking.bookingId} &mdash; {booking.carName}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              &times;
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Amount Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Amount', value: formatAmt(totalAmount), color: '#1e293b', bg: '#f1f5f9' },
              { label: 'Already Paid', value: formatAmt(paidAmount), color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Remaining Due', value: formatAmt(remaining), color: '#d97706', bg: '#fffbeb', bold: true, ring: true },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: item.bg,
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  border: item.ring ? '2px solid #fbbf24' : '1.5px solid #e2e8f0',
                  boxShadow: item.ring ? '0 0 12px rgba(251,191,36,0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '16px', fontWeight: item.bold ? 800 : 700, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Mode Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Payment Mode</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'online', label: '💳 Online' },
                { key: 'cash', label: '💵 Cash' },
                { key: 'partial', label: '⚡ Partial' },
              ].map(({ key, label }) => (
                <button key={key} style={tabStyle(mode === key)} onClick={() => { setMode(key); setErrors({}); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ---- Online Fields ---- */}
          {mode === 'online' && (
            <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', border: '1.5px solid #bfdbfe' }}>
              <div style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Collecting</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>{formatAmt(remaining)}</span>
                </div>
                <label style={labelStyle}>Transaction ID <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
                <input
                  required
                  style={{ ...inputStyle, borderColor: errors.transactionId ? '#ef4444' : (transactionId.trim() ? '#22c55e' : '#e2e8f0') }}
                  placeholder="Enter UPI / Bank Txn ID (required)"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                />
                {errors.transactionId && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.transactionId}</p>}
              </div>
            </div>
          )}

          {/* ---- Cash Fields ---- */}
          {mode === 'cash' && (
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', border: '1.5px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Collecting</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{formatAmt(remaining)}</span>
              </div>
              <label style={labelStyle}>Received By (Admin/Staff Name) <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span></label>
              {cashCollectors.length > 0 ? (
                <select
                  required
                  style={{ ...inputStyle, borderColor: errors.receivedBy ? '#ef4444' : (receivedBy.trim() ? '#22c55e' : '#e2e8f0') }}
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                >
                  <option value="">-- Select Cash Collector --</option>
                  {cashCollectors.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <div style={{ ...inputStyle, color: '#ef4444', borderColor: '#ef4444', fontSize: '13px' }}>
                  ⚠️ No cash collectors defined in System Settings. Please add them first!
                </div>
              )}
              {errors.receivedBy && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.receivedBy}</p>}
            </div>
          )}

          {/* ---- Partial Fields ---- */}
          {mode === 'partial' && (
            <div style={{ background: '#fafafa', borderRadius: '12px', padding: '12px 14px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total to collect</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#d97706' }}>{formatAmt(remaining)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '10px 12px', border: '1.5px solid #bfdbfe' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Online</div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Amount</label>
                  <input style={{ ...inputStyle, marginBottom: '8px', padding: '7px 10px', fontSize: '13px' }} type='number' min='0' max={remaining} placeholder='0' value={onlineAmt} onChange={e => handleOnlineAmtChange(e.target.value)} />
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Transaction ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input required style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px', borderColor: errors.transactionId ? '#ef4444' : (transactionId.trim() ? '#22c55e' : '#e2e8f0') }} placeholder='UPI / Bank Txn (required)' value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                  {errors.transactionId && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>⚠ {errors.transactionId}</p>}
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px 12px', border: '1.5px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cash</div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Amount</label>
                  <input style={{ ...inputStyle, marginBottom: '8px', padding: '7px 10px', fontSize: '13px' }} type='number' min='0' max={remaining} placeholder='0' value={cashAmt} onChange={e => handleCashAmtChange(e.target.value)} />
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Received By <span style={{ color: '#ef4444' }}>*</span></label>
                  {cashCollectors.length > 0 ? (
                    <select
                      required
                      style={{ ...inputStyle, padding: '7px 10px', fontSize: '13px', borderColor: errors.receivedBy ? '#ef4444' : (receivedBy.trim() ? '#22c55e' : '#e2e8f0') }}
                      value={receivedBy}
                      onChange={e => setReceivedBy(e.target.value)}
                    >
                      <option value="">-- Select Cash Collector --</option>
                      {cashCollectors.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ ...inputStyle, padding: '7px 10px', fontSize: '11px', color: '#ef4444', borderColor: '#ef4444' }}>
                      ⚠️ Add cash collectors in Settings!
                    </div>
                  )}
                  {errors.receivedBy && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>⚠ {errors.receivedBy}</p>}
                </div>
              </div>
              {errors.partial && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginTop: '10px' }}>
                  <p style={{ color: '#dc2626', fontSize: 12, margin: 0, fontWeight: 600 }}>{errors.partial}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px',
                background: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || remaining === 0}
              style={{
                flex: 2, padding: '12px', border: 'none', borderRadius: '12px',
                background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: '#fff', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 15px rgba(30,64,175,0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {submitting ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Processing...
                </>
              ) : (
                `✅ Save & Complete`
              )}
            </button>
          </div>

          {remaining === 0 && (
            <p style={{ textAlign: 'center', color: '#16a34a', fontSize: 13, fontWeight: 600, marginTop: 12 }}>
              ✅ No remaining amount — booking can be directly completed.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
