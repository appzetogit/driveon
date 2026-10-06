import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import { colors } from '../../module/theme/colors';
import { useFleet } from '../context/FleetContext';
import { FLEET_BOOKING_FILTERS } from '../constants/fleetConstants';
import api from '../../services/api';
import CompleteBookingModal from '../components/CompleteBookingModal';
import InwardAgreementModal from '../components/InwardAgreementModal';
import BookingGuarantorModal from '../../components/admin/bookings/BookingGuarantorModal';

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

const InfoItem = ({ label, value, valueClass = '' }) => (
  <div className="flex flex-col">
    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>{label}</span>
    <span className={`text-sm font-semibold mt-1 ${valueClass}`} style={{ color: valueClass ? undefined : colors.textPrimary }}>
      {value || '-'}
    </span>
  </div>
);

const BookingDetailsModal = ({ open, booking, cars = [], onClose }) => {
  const [showAgreementModal, setShowAgreementModal] = useState(false);
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

  const numberOfDays = (() => {
    if (!booking.fromDate || !booking.toDate) return 1;
    try {
      const d1 = new Date(booking.fromDate);
      const d2 = new Date(booking.toDate);
      const diff = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  })();

  const isInwardBooking = booking.carType === 'inward' || Boolean(booking.agreement) || !booking.carType;

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
                    {booking.customerAddress && (
                      <p className="text-xs font-medium text-gray-500 mt-1 max-w-sm">
                        📍 {booking.customerAddress}
                      </p>
                    )}
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

                  {/* Inward Rental Agreement */}
                  {isInwardBooking && (
                    <div
                      className="p-4 rounded-xl border transition-all"
                      style={{
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                          <span>📜</span> Rental Agreement
                        </span>
                        {booking.agreement?.status === 'verified' || booking.agreement?.status === 'done' || booking.agreement?.approvedByOtp ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                            <span>✓</span> Verified & Signed
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Available
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-mono text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {booking.agreement?.agreementNumber || `AGR-INW-${(booking.customerPhone || '0000').slice(-4)}`}
                        </span>
                        <span className="text-[11px] text-green-600 font-semibold">
                          📱 Approved via OTP
                        </span>
                      </div>

                      <button
                        onClick={() => setShowAgreementModal(true)}
                        type="button"
                        className="w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:opacity-90 cursor-pointer"
                        style={{
                          backgroundColor: colors.backgroundTertiary,
                          color: colors.textWhite,
                        }}
                      >
                        <span>📜</span>
                        <span>See Agreement</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}

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

              {/* Security & Exchange Collateral Card */}
              {(Number(booking.deposit || 0) > 0 || booking.depositItem?.itemName) && (
                <Card className="p-0 overflow-hidden border" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                  <div className="p-6 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderBottomColor: colors.borderMedium, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🛡️</span>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500">
                        Security Deposit & Exchange Collateral
                      </h3>
                    </div>
                    {booking.depositItem?.itemName && (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${booking.depositItem.returnStatus === 'returned' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                        {booking.depositItem.returnStatus === 'returned' ? '✓ Item Returned to Customer' : '⏳ Item Deposited with Admin'}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Monetary Deposit if any */}
                    {Number(booking.deposit || 0) > 0 && (
                      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'rgba(168, 85, 247, 0.2)', backgroundColor: 'rgba(168, 85, 247, 0.05)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💵</span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Cash Security Deposit</p>
                            <p className="text-xs text-gray-500">Refundable upon vehicle return without damages</p>
                          </div>
                        </div>
                        <span className="text-xl font-black text-purple-600">{formatCurrency(booking.deposit)}</span>
                      </div>
                    )}

                    {/* Physical Collateral Item if any */}
                    {booking.depositItem?.itemName && (
                      <div className="p-4 rounded-xl border" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <InfoItem label="Vehicle Category" value={booking.depositItem.itemType || 'Bike / Motorcycle'} />
                              <InfoItem label="Bike / Scooter Model" value={booking.depositItem.itemName} valueClass="font-bold text-blue-600" />
                              <InfoItem label="Vehicle Plate / Reg No" value={booking.depositItem.itemNumber || '-'} valueClass="font-mono font-bold text-gray-900" />
                              <InfoItem label="Custody Status" value={booking.depositItem.returnStatus === 'returned' ? 'Returned to Customer' : 'Held by Admin'} valueClass={booking.depositItem.returnStatus === 'returned' ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'} />
                            </div>

                            {booking.depositItem.returnedAt && (
                              <div className="pt-2 border-t" style={{ borderTopColor: colors.borderLight }}>
                                <InfoItem label="Returned On" value={formatDateTime(booking.depositItem.returnedAt)} valueClass="text-green-600 font-semibold" />
                              </div>
                            )}
                          </div>

                          {booking.depositItem.itemImage && (
                            <div className="flex-shrink-0">
                              <a href={booking.depositItem.itemImage} target="_blank" rel="noreferrer" className="relative group block">
                                <img
                                  src={booking.depositItem.itemImage}
                                  alt={booking.depositItem.itemName}
                                  className="w-24 h-24 object-cover rounded-lg border shadow-sm transition-transform group-hover:scale-105"
                                  style={{ borderColor: colors.borderMedium }}
                                />
                                <span className="absolute inset-0 bg-black/50 text-white text-[10px] opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity font-semibold">
                                  View
                                </span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}


            </div>
          </div>

        </div>
      </div>

      {/* Inward Agreement Modal */}
      {showAgreementModal && (
        <InwardAgreementModal
          open={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          bookingDetails={{
            id: booking.id || booking.originalBookingId || booking._id,
            bookingId: booking.id || booking.originalBookingId || booking._id,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            customerAddress: booking.customerAddress || booking.address || '',
            numberOfGuests: booking.numberOfGuests || 1,
            licenseNumber: booking.licenseNumber,
            isDlVerified: booking.licenseVerified || booking.isDlVerified || false,
            panNumber: booking.panNumber,
            isPanVerified: booking.panVerified || booking.isPanVerified || false,
            aadhaarNumber: booking.aadhaarNumber,
            isAadhaarVerified: booking.aadhaarVerified || booking.isAadhaarVerified || false,
            car: car || {
              name: booking.carName,
              registrationNumber: displayCarNumber,
              carNumber: displayCarNumber,
              pricePerDay: Math.round(Number(booking.totalPrice || 0) / (numberOfDays || 1)) || 1000,
            },
            fromDate: booking.fromDate,
            toDate: booking.toDate,
            startTime: booking.startTime || '10:00 AM',
            endTime: booking.endTime || '10:00 AM',
            numberOfDays: numberOfDays,
            totalPrice: booking.totalPrice,
            advanceAmount: booking.advanceAmount,
            depositType: booking.depositType,
            deposit: booking.deposit,
            depositItem: booking.depositItem,
            depositItemType: booking.depositItem?.itemType || 'Bike / Motorcycle',
            depositItemName: booking.depositItem?.itemName || '',
            depositItemNumber: booking.depositItem?.itemNumber || booking.depositItemNumber || '',
          }}
          existingAgreement={
            booking.agreement || {
              agreementNumber: `AGR-INW-${(booking.customerPhone || '0000').slice(-4)}`,
              status: 'verified',
              phoneVerified: booking.customerPhone,
              verifiedAt: booking.createdAt || new Date(),
              termsAccepted: true,
              approvedByOtp: true,
            }
          }
          isAlreadyDone={true}
          onMarkDone={() => setShowAgreementModal(false)}
        />
      )}
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
  const [showGuarantorModal, setShowGuarantorModal] = useState(false);
  const [guarantorBooking, setGuarantorBooking] = useState(null);

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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 capitalize">
          Completed
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 capitalize">
          Cancelled
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 capitalize">
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

      {filteredBookings.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-gray-200 rounded-2xl">
          <p className="text-gray-500 font-medium">No bookings found matching your filters.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1700px]">
              <thead>
                <tr className="bg-gray-100/90 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3.5 px-4 w-[160px]">Booking ID</th>
                  <th className="py-3.5 px-4 w-[210px]">Car</th>
                  <th className="py-3.5 px-4 w-[200px]">Customer</th>
                  <th className="py-3.5 px-4 w-[110px]">Status</th>
                  <th className="py-3.5 px-4 w-[210px]">Trip Dates</th>
                  <th className="py-3.5 px-4 w-[200px]">Verifications</th>
                  <th className="py-3.5 px-4 w-[190px]">Payment Details</th>
                  <th className="py-3.5 px-4 min-w-[460px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => {
                  const totalPrice = Number(b.totalPrice || 0);
                  const paidAmount = Number(b.paidAmount || 0);
                  const dueAmount = Math.max(0, totalPrice - paidAmount);
                  const status = b.status || 'active';
                  const bookingDateVal = b.createdAt || b.bookingDate;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-purple-50/20 transition-colors align-middle"
                    >
                      {/* 1. BOOKING ID */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded font-bold bg-gray-100 text-gray-800 border border-gray-200 inline-block">
                            #{b.id}
                          </span>
                          {bookingDateVal && (
                            <p className="text-[11px] text-gray-500 leading-tight">
                              Booked: {formatDateTime(bookingDateVal)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 2. CAR */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-900 leading-snug">
                            {b.carName}
                          </h4>
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 capitalize">
                            Type: {b.carType}
                          </span>
                        </div>
                      </td>

                      {/* 3. CUSTOMER */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2.5">
                          {b.customerImage ? (
                            <img
                              src={b.customerImage}
                              alt={b.customerName}
                              className="h-9 w-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: colors.backgroundTertiary }}
                            >
                              {b.customerName?.charAt(0).toUpperCase() || 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {b.customerName}
                            </p>
                            {b.customerPhone && (
                              <p className="text-xs text-gray-600 font-medium">
                                📞 {b.customerPhone}
                              </p>
                            )}
                            {b.customerEmail && (
                              <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                {b.customerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. STATUS */}
                      <td className="py-4 px-4">
                        {renderStatusBadge(status)}
                      </td>

                      {/* 5. TRIP DATES */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-1.5">
                            <span className="text-gray-400 text-[10px] uppercase font-bold w-10 flex-shrink-0">Start:</span>
                            <span className="font-semibold text-gray-800">
                              {formatDateStr(b.fromDate)} {b.startTime ? `(${formatTime12Hour(b.startTime)})` : ''}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-gray-400 text-[10px] uppercase font-bold w-10 flex-shrink-0">End:</span>
                            <span className="font-semibold text-gray-800">
                              {formatDateStr(b.toDate)} {b.endTime ? `(${formatTime12Hour(b.endTime)})` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. VERIFICATIONS */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {b.licenseVerified ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                              ✓ DL Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                              DL Unverified
                            </span>
                          )}
                          {b.panVerified ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                              ✓ PAN Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                              PAN Unverified
                            </span>
                          )}
                          {b.aadhaarNumber ? (
                            b.aadhaarVerified ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                ✓ Aadhaar Verified
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                                Aadhaar Unverified
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200">
                              No Aadhaar
                            </span>
                          )}
                          {b.carType === 'inward' && (
                            b.agreement?.status === 'verified' || b.agreement?.status === 'done' || b.agreement?.approvedByOtp ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Agreement Approved
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Agreement Pending
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* 7. PAYMENT STATUS */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Paid:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-100 pt-0.5">
                            <span className="text-gray-500">Due:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(dueAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                dueAmount === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {dueAmount === 0 ? 'Fully Paid' : 'Pending Balance'}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">{b.paymentMode || 'Cash'}</span>
                          </div>
                          {b.depositItem?.itemName && (
                            <div className="mt-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-700 font-medium flex items-center justify-between">
                              <span className="truncate">🛵 {b.depositItem.itemName}</span>
                              <span className="font-bold ml-1">{b.depositItem.returnStatus === 'returned' ? 'Returned' : 'Deposited'}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                          {status === 'active' ? (
                            <>
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg text-white transition-all bg-blue-600 hover:bg-blue-700 shadow-sm whitespace-nowrap"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGuarantorBooking(b);
                                  setShowGuarantorModal(true);
                                }}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                                style={{
                                  backgroundColor: '#f5f3ff',
                                  color: colors.backgroundTertiary,
                                  border: '1px solid #ddd6fe',
                                  fontWeight: 600,
                                }}
                              >
                                👥 {b.guarantorDetails?.name || b.guarantor?.name ? `Guarantor: ${b.guarantorDetails?.name || b.guarantor?.name}` : 'Guarantor'}
                              </button>
                              <button
                                onClick={() => setCompletingBooking(b)}
                                disabled={loadingId === b.id}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg text-white transition-all bg-green-600 hover:bg-green-700 disabled:opacity-50 shadow-sm whitespace-nowrap"
                              >
                                Mark Complete
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                disabled={loadingId === b.id}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg text-white transition-all bg-red-600 hover:bg-red-700 disabled:opacity-50 shadow-sm whitespace-nowrap"
                              >
                                Cancel Booking
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg text-white transition-all bg-gray-600 hover:bg-gray-700 shadow-sm whitespace-nowrap"
                              >
                                View Details & Payment
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGuarantorBooking(b);
                                  setShowGuarantorModal(true);
                                }}
                                className="py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                                style={{
                                  backgroundColor: '#f5f3ff',
                                  color: colors.backgroundTertiary,
                                  border: '1px solid #ddd6fe',
                                  fontWeight: 600,
                                }}
                              >
                                👥 {b.guarantorDetails?.name || b.guarantor?.name ? `Guarantor: ${b.guarantorDetails?.name || b.guarantor?.name}` : 'Guarantor'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailsModal
          open={!!selectedBooking}
          booking={selectedBooking}
          cars={cars}
          onClose={() => setSelectedBooking(null)}
        />
      )}
      {completingBooking && (
        <CompleteBookingModal
          open={Boolean(completingBooking)}
          booking={completingBooking}
          onClose={() => setCompletingBooking(null)}
          onConfirm={(updatedData) => updateBookingInContext(completingBooking.id, updatedData)}
        />
      )}

      {showGuarantorModal && guarantorBooking && (
        <BookingGuarantorModal
          isOpen={showGuarantorModal}
          onClose={() => {
            setShowGuarantorModal(false);
            setGuarantorBooking(null);
          }}
          booking={guarantorBooking}
          bookingType="inward"
          onGuarantorUpdated={({ bookingId, guarantorId, removed }) => {
            if (updateBookingInContext) {
              updateBookingInContext(guarantorBooking.id, {
                guarantor: removed ? null : guarantorId,
                guarantorDetails: removed ? null : { name: guarantorId },
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default FleetBookingsPage;
