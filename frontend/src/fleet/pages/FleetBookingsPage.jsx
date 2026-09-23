import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import { colors } from '../../module/theme/colors';
import { useFleet } from '../context/FleetContext';
import { FLEET_BOOKING_FILTERS } from '../constants/fleetConstants';
import api from '../../services/api';
import CompleteBookingModal from '../components/CompleteBookingModal';

const RUPEE = '\u20B9';
const DOT = '\u2022';
const ARROW = '\u2192';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  const safe = Number.isFinite(num) ? num : 0;
  return `${RUPEE}${new Intl.NumberFormat('en-IN').format(safe)}`;
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  if (!hours || !minutes) return time24;
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
};

const getTodayStr = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(
    2,
    '0'
  )}`;
};

const getBookingStatus = (booking) => {
  const todayStr = getTodayStr();
  const fromDate = booking?.fromDate || '';
  const toDate = booking?.toDate || '';
  if (!fromDate || !toDate) return 'unknown';
  if (todayStr < fromDate) return 'upcoming';
  if (todayStr > toDate) return 'completed';
  return 'active';
};

const BookingDetailsModal = ({ open, booking, cars = [], onClose }) => {
  if (!open || !booking) return null;

  const bookingStatus = booking.status || getBookingStatus(booking);
  const paymentStatus = booking.paymentStatus || 'pending';
  const paymentMode = booking.paymentMode || '';
  const paidAmount = Number(booking.paidAmount || 0);
  const advanceAmount = Number(booking.advanceAmount || 0);
  const totalPrice = Number(booking.totalPrice || 0);
  const safePaidAmount = Math.max(
    0,
    Math.min(Number.isFinite(totalPrice) ? totalPrice : 0, Number.isFinite(paidAmount) ? paidAmount : 0)
  );
  const dueAmount = Math.max(0, (Number.isFinite(totalPrice) ? totalPrice : 0) - safePaidAmount);
  const bookingStatusLabel = bookingStatus ? `${String(bookingStatus).charAt(0).toUpperCase()}${String(bookingStatus).slice(1)}` : '';
  const paymentStatusLabel =
    paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'partial' ? 'Partial' : 'Pending';

  const discount = Number(booking.discount || 0);
  const basePrice = totalPrice + discount;
  const remainingPaid = Math.max(0, safePaidAmount - advanceAmount);

  const car = cars.find(c => c.id === booking.carId);
  const displayCarNumber = car?.registrationNumber || booking.carId;

  // Graceful fallback for older bookings that don't have explicit mode fields
  const getAdvanceMode = () => {
    if (booking.advancePaymentMode) return booking.advancePaymentMode;
    if (!booking.paymentMode) return 'N/A';
    if (booking.paymentMode.includes(' & ')) return booking.paymentMode.split(' & ')[0];
    return booking.paymentMode;
  };

  const getRemainingMode = () => {
    if (booking.remainingPaymentMode) return booking.remainingPaymentMode;
    if (!booking.paymentMode) return 'N/A';
    if (booking.paymentMode.includes(' & ')) return booking.paymentMode.split(' & ')[1];
    return booking.paymentMode;
  };

  const InfoItem = ({ label, value, valueClass = '' }) => (
    <div className="flex flex-col">
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>{label}</span>
      <span className={`text-sm font-semibold mt-1 ${valueClass}`} style={{ color: valueClass ? undefined : colors.textPrimary }}>
        {value || '-'}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className="relative w-full max-w-6xl rounded-2xl shadow-2xl border flex flex-col max-h-[95vh] overflow-hidden"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-white" style={{ borderBottomColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: colors.textPrimary }}>
              Booking #{booking.id?.slice(-8) || booking.id}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Status: {bookingStatusLabel}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${paymentStatus === 'paid' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                Payment: {paymentStatusLabel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border hover:bg-gray-100 transition-colors"
            style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 min-h-0 overflow-y-auto" style={{ backgroundColor: colors.backgroundSecondary }}>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Customer & Documents */}
            <div className="lg:col-span-1 space-y-6">
              {/* Customer Profile */}
              <Card className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: colors.textSecondary }}>Customer Details</h3>
                <div className="flex items-center gap-5 mb-6">
                  {booking.customerImage ? (
                    <img
                      src={booking.customerImage}
                      alt="Customer"
                      className="h-20 w-20 object-cover rounded-full border-2 shadow-sm"
                      style={{ borderColor: colors.borderMedium }}
                    />
                  ) : (
                    <div
                      className="h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center text-xs font-medium"
                      style={{ borderColor: colors.borderMedium, color: colors.textSecondary }}
                    >
                      No Photo
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-black" style={{ color: colors.textPrimary }}>{booking.customerName}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: colors.textSecondary }}>{booking.customerPhone || 'No Phone'}</p>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>{booking.customerEmail || 'No Email'}</p>
                  </div>
                </div>
              </Card>

              {/* Documents */}
              <Card className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: colors.textSecondary }}>KYC Documents</h3>
                <div className="space-y-4">

                  {/* DL */}
                  <div className="p-4 rounded-xl border bg-gray-50/50" style={{ borderColor: colors.borderMedium }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>Driving License</span>
                      {booking.licenseVerified ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">✓ Verified</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Unverified</span>
                      )}
                    </div>
                    <span className="font-mono text-sm tracking-wide font-medium" style={{ color: colors.textSecondary }}>
                      {booking.licenseNumber || 'Not provided'}
                    </span>
                  </div>

                  {/* PAN */}
                  <div className="p-4 rounded-xl border bg-gray-50/50" style={{ borderColor: colors.borderMedium }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>PAN Card</span>
                      {booking.panVerified ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">✓ Verified</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">Unverified</span>
                      )}
                    </div>
                    <span className="font-mono text-sm tracking-wide font-medium" style={{ color: colors.textSecondary }}>
                      {booking.panNumber || 'Not provided'}
                    </span>
                  </div>

                  {/* Aadhaar */}
                  <div className="p-4 rounded-xl border bg-gray-50/50" style={{ borderColor: colors.borderMedium }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>Aadhaar Card</span>
                      {booking.aadhaarNumber ? (
                        booking.aadhaarVerified ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">✓ Verified</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Unverified</span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">Not provided</span>
                      )}
                    </div>
                    <span className="font-mono text-sm tracking-wide font-medium" style={{ color: colors.textSecondary }}>
                      {booking.aadhaarNumber ? `XXXX-XXXX-${booking.aadhaarNumber.slice(-4)}` : 'Not provided'}
                    </span>
                  </div>

                </div>
              </Card>
            </div>

            {/* Right Column: Car, Rental, Payment */}
            <div className="lg:col-span-2 space-y-6">

              {/* Car & Rental Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: colors.textSecondary }}>Car Details</h3>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <InfoItem label="Car Name" value={booking.carName} />
                    <InfoItem label="Car Type" value={booking.carType} />
                    <InfoItem label="Number Plate" value={displayCarNumber} valueClass="font-mono text-xs break-all uppercase" />
                    <InfoItem label="Car Owner" value={booking.carOwnerName || 'DriveOn Admin'} />
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: colors.textSecondary }}>Rental Timeline</h3>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Pickup</span>
                        <span className="block text-sm font-bold" style={{ color: colors.textPrimary }}>{formatDateStr(booking.fromDate)}</span>
                        <span className="block text-sm font-medium" style={{ color: colors.textSecondary }}>{booking.startTime ? formatTime12Hour(booking.startTime) : 'Time N/A'}</span>
                      </div>
                      <div className="text-2xl text-gray-300">→</div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Drop-off</span>
                        <span className="block text-sm font-bold" style={{ color: colors.textPrimary }}>{formatDateStr(booking.toDate)}</span>
                        <span className="block text-sm font-medium" style={{ color: colors.textSecondary }}>{booking.endTime ? formatTime12Hour(booking.endTime) : 'Time N/A'}</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t" style={{ borderTopColor: colors.borderLight }}>
                      <InfoItem label="Booking Created On" value={booking.createdAt ? formatDateTime(booking.createdAt) : 'N/A'} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Payment Details */}
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50" style={{ borderBottomColor: colors.borderMedium }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Financial & Payment Details</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <InfoItem label="Base Rental Price" value={formatCurrency(basePrice)} />
                    {discount > 0 && <InfoItem label="Discount Applied" value={`-${formatCurrency(discount)}`} valueClass="text-green-600" />}
                    <InfoItem label="Final Total Price" value={formatCurrency(totalPrice)} valueClass="text-lg text-blue-600" />
                    {booking.deposit > 0 && <InfoItem label="Security Deposit" value={formatCurrency(booking.deposit)} valueClass="text-purple-600 font-bold" />}
                    <InfoItem label="Payment Status" value={paymentStatusLabel} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y" style={{ borderColor: colors.borderLight }}>
                    {advanceAmount < basePrice && (
                      <>
                        <InfoItem label="Advance Paid" value={formatCurrency(advanceAmount)} />
                        {advanceAmount > 0 && (
                          <InfoItem label="Advance Payment Mode" value={getAdvanceMode()} />
                        )}
                        {advanceAmount > 0 && getAdvanceMode()?.toLowerCase() === 'cash' && (
                          <InfoItem label="Advance Cash Collector" value={booking.advanceCashCollector || booking.cashCollector || 'Staff'} valueClass="text-green-600" />
                        )}
                      </>
                    )}
                    <InfoItem label="Total Paid" value={formatCurrency(safePaidAmount)} valueClass="text-green-600" />
                    <InfoItem label="Remaining Due" value={formatCurrency(dueAmount)} valueClass="text-orange-600 text-lg" />
                  </div>

                  {remainingPaid > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b" style={{ borderColor: colors.borderLight }}>
                      <InfoItem label="Remaining Paid" value={formatCurrency(remainingPaid)} />
                      <InfoItem label="Remaining Payment Mode" value={getRemainingMode()} />
                      {getRemainingMode()?.toLowerCase() === 'cash' && (
                        <InfoItem label="Remaining Cash Collector" value={booking.remainingCashCollector || booking.cashCollector || 'Staff'} valueClass="text-green-600" />
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <InfoItem label="Payment Mode" value={paymentMode || 'N/A'} />
                    {booking.transactionId && (
                      <InfoItem label="Transaction ID / UTR" value={booking.transactionId} valueClass="font-mono text-sm" />
                    )}
                  </div>
                </div>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const FleetBookingsPage = () => {
  const { bookings, cars, updateBookingInContext } = useFleet();
  const location = useLocation();
  const typeFilter = location.pathname.includes('outward-bookings')
    ? FLEET_BOOKING_FILTERS.OUTWARD
    : location.pathname.includes('inward-bookings')
      ? FLEET_BOOKING_FILTERS.INWARD
      : FLEET_BOOKING_FILTERS.ALL;
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [completingBooking, setCompletingBooking] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setLoadingId(bookingId);
    try {
      const response = await api.post(`/fleet/outward-bookings/${bookingId}/cancel`);
      if (response.data.success) {
        updateBookingInContext(bookingId, { status: 'cancelled' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setLoadingId(null);
    }
  };


  const renderStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          Completed
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
          Cancelled
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        Active
      </span>
    );
  };

  const filteredBookings = useMemo(() => {
    // Exclude regular bookings from being displayed in Fleet Bookings page
    const fleetBookingsOnly = bookings.filter(b => !b.isRegularBooking);

    if (typeFilter === FLEET_BOOKING_FILTERS.ALL) return fleetBookingsOnly;
    return fleetBookingsOnly.filter((b) => b.carType === typeFilter);
  }, [bookings, typeFilter]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            {typeFilter === FLEET_BOOKING_FILTERS.OUTWARD ? 'Outward Bookings' : typeFilter === FLEET_BOOKING_FILTERS.INWARD ? 'Inward Bookings' : 'All Bookings'} ({filteredBookings.length})
          </h2>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.length === 0 ? (
          <Card className="p-6">
            <p style={{ color: colors.textSecondary }}>No bookings found.</p>
          </Card>
        ) : (
          filteredBookings.map((b) => {
            const totalPrice = Number(b.totalPrice || 0);
            const paidAmount = Number(b.paidAmount || 0);
            const dueAmount = Math.max(0, totalPrice - paidAmount);
            const status = b.status || 'active';

            return (
              <Card
                key={b.id}
                className="p-5 border"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                  {/* Left Column: Car & Customer details */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                        {b.carName}
                      </h3>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        #{b.id}
                      </span>
                      {renderStatusBadge(status)}
                    </div>

                    <div className="flex items-center gap-3">
                      {b.customerImage ? (
                        <img
                          src={b.customerImage}
                          alt={b.customerName}
                          className="h-10 w-10 rounded-full object-cover border"
                          style={{ borderColor: colors.borderMedium }}
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-full border flex items-center justify-center text-[10px] font-bold bg-gray-700"
                          style={{ borderColor: colors.borderMedium, color: colors.textSecondary }}
                        >
                          N/A
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                          {b.customerName}
                        </p>
                        {b.customerPhone && (
                          <p className="text-xs" style={{ color: colors.textSecondary }}>
                            {b.customerPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Dates: <span style={{ color: colors.textPrimary }}>{formatDateStr(b.fromDate)} {b.startTime ? `(${formatTime12Hour(b.startTime)})` : ''} {ARROW} {formatDateStr(b.toDate)} {b.endTime ? `(${formatTime12Hour(b.endTime)})` : ''}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}>
                        Type: {b.carType}
                      </span>
                      {b.licenseVerified ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ DL Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          DL Unverified
                        </span>
                      )}
                      {b.panVerified ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          ✓ PAN Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          PAN Unverified
                        </span>
                      )}
                      {b.aadhaarNumber ? (
                        b.aadhaarVerified ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            ✓ Aadhaar Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                            Aadhaar Unverified
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">
                          Aadhaar Not Provided
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Payment Details */}
                  <div className="w-full lg:w-64 p-4 rounded-xl border space-y-1.5" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Payment Status & Mode</p>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.textSecondary }}>Total Price:</span>
                      {Number(b.discount || 0) > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="line-through text-xs text-gray-500">{formatCurrency(totalPrice + Number(b.discount || 0))}</span>
                          <span className="font-bold text-blue-400">{formatCurrency(totalPrice)}</span>
                        </div>
                      ) : (
                        <span className="font-bold" style={{ color: colors.textPrimary }}>{formatCurrency(totalPrice)}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.textSecondary }}>Paid Amount:</span>
                      <span className="font-semibold text-green-400">{formatCurrency(paidAmount)}</span>
                    </div>
                    {b.deposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: colors.textSecondary }}>Security Deposit:</span>
                        <span className="font-bold text-purple-400">{formatCurrency(b.deposit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-1.5" style={{ borderTopColor: colors.borderLight }}>
                      <span style={{ color: colors.textSecondary }}>Due Amount:</span>
                      <span className="font-bold text-orange-400">{formatCurrency(dueAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="px-1.5 py-0.5 rounded font-medium" style={{
                        backgroundColor: dueAmount === 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: dueAmount === 0 ? '#4ade80' : '#facc15'
                      }}>
                        {dueAmount === 0 ? 'Fully Paid' : 'Pending Balance'}
                      </span>
                      <span style={{ color: colors.textSecondary }}>{b.paymentMode || 'Cash'}</span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="w-full lg:w-48 flex flex-col gap-2 justify-center">
                    {status === 'active' ? (
                      <>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="w-full py-2 px-3 text-xs font-bold rounded-lg text-white transition-all bg-blue-600 hover:bg-blue-700"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setCompletingBooking(b)}
                          disabled={loadingId === b.id}
                          className="w-full py-2 px-3 text-xs font-bold rounded-lg text-white transition-all bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark as Completed
                        </button>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={loadingId === b.id}
                          className="w-full py-2 px-3 text-xs font-bold rounded-lg text-white transition-all bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Cancel Booking
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="w-full py-2 px-3 text-xs font-bold rounded-lg text-white transition-all bg-gray-600 hover:bg-gray-700"
                      >
                        View Details & Payment
                      </button>
                    )}
                  </div>

                </div>
              </Card>
            );
          })
        )}
      </div>

      <BookingDetailsModal
        open={!!selectedBooking}
        booking={selectedBooking}
        cars={cars}
        onClose={() => setSelectedBooking(null)}
      />
      <CompleteBookingModal
        open={Boolean(completingBooking)}
        booking={completingBooking}
        onClose={() => setCompletingBooking(null)}
        onConfirm={(updatedData) => updateBookingInContext(completingBooking.id, updatedData)}
      />
    </div>
  );
};

export default FleetBookingsPage;
