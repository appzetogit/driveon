import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import { colors } from '../../module/theme/colors';
import { useFleet } from '../context/FleetContext';
import { FLEET_CAR_TYPES } from '../constants/fleetConstants';
import InwardAgreementModal from '../components/InwardAgreementModal';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN');
  } catch {
    return String(dateStr);
  }
};

const FleetAgreementsPage = () => {
  const { bookings, cars } = useFleet();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending'
  const [selectedBookingForAgreement, setSelectedBookingForAgreement] = useState(null);

  // Inward fleet bookings only
  const inwardBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.carType === FLEET_CAR_TYPES.INWARD && !b.isRegularBooking
    );
  }, [bookings]);

  // Filtered agreements
  const filteredAgreements = useMemo(() => {
    return inwardBookings.filter((b) => {
      const matchSearch =
        !searchTerm.trim() ||
        (b.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.customerPhone || '').includes(searchTerm) ||
        (b.carName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.agreement?.agreementNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.id || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isVerified = b.agreement?.status === 'verified' || b.agreement?.status === 'done' || b.agreement?.approvedByOtp;

      let matchStatus = true;
      if (statusFilter === 'verified') {
        matchStatus = isVerified;
      } else if (statusFilter === 'pending') {
        matchStatus = !isVerified;
      }

      return matchSearch && matchStatus;
    });
  }, [inwardBookings, searchTerm, statusFilter]);

  // Statistics
  const totalAgreements = inwardBookings.length;
  const verifiedAgreements = inwardBookings.filter(
    (b) => b.agreement?.status === 'verified' || b.agreement?.status === 'done' || b.agreement?.approvedByOtp
  ).length;
  const pendingAgreements = totalAgreements - verifiedAgreements;

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            Inward Fleet Rental Agreements
          </h2>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Digital car rental agreements generated for inward vehicle bookings with customer mobile OTP verification.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/fleet/inward')}
          type="button"
          className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite }}
        >
          <span>➕</span>
          <span>Book Inward Car & Generate Agreement</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-500/10 text-blue-500">
            📜
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Inward Agreements</p>
            <p className="text-2xl font-black mt-0.5" style={{ color: colors.textPrimary }}>
              {totalAgreements}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-green-500/10 text-green-500">
            🛡️
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Verified via Mobile OTP</p>
            <p className="text-2xl font-black mt-0.5 text-green-500">
              {verifiedAgreements}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-amber-500/10 text-amber-500">
            ⏳
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Verification</p>
            <p className="text-2xl font-black mt-0.5 text-amber-500">
              {pendingAgreements}
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, phone, car, or agreement ID..."
              className="w-full rounded-xl border px-3.5 py-2 text-xs outline-none pl-9 font-medium"
              style={{
                borderColor: colors.borderMedium,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textPrimary,
              }}
            />
            <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {[
              { id: 'all', label: `All (${totalAgreements})` },
              { id: 'verified', label: `Approved OTP (${verifiedAgreements})` },
              { id: 'pending', label: `Pending (${pendingAgreements})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                style={{
                  backgroundColor:
                    statusFilter === tab.id ? colors.backgroundTertiary : colors.backgroundSecondary,
                  borderColor:
                    statusFilter === tab.id ? colors.backgroundTertiary : colors.borderMedium,
                  color: statusFilter === tab.id ? colors.textWhite : colors.textSecondary,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Agreements Table */}
      {filteredAgreements.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <span className="text-4xl block">📄</span>
          <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
            No Inward Agreements Found
          </h3>
          <p className="text-xs max-w-md mx-auto" style={{ color: colors.textSecondary }}>
            {searchTerm || statusFilter !== 'all'
              ? 'No agreements match your search or filter criteria. Try clearing the filter.'
              : 'Agreements are generated when you create bookings for Inward Fleet cars.'}
          </p>
          <button
            onClick={() => navigate('/admin/fleet/inward')}
            type="button"
            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold border"
            style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
          >
            Go to Inward Cars &rarr;
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAgreements.map((booking) => {
            const isVerified =
              booking.agreement?.status === 'verified' ||
              booking.agreement?.status === 'done' ||
              booking.agreement?.approvedByOtp;

            const agreementNum =
              booking.agreement?.agreementNumber ||
              `AGR-INW-${(booking.customerPhone || '0000').slice(-4)}-${booking.id.slice(-4)}`;

            const matchedCar = cars.find((c) => c.id === booking.carId);

            return (
              <Card
                key={booking.id}
                className="p-5 border transition-all hover:border-blue-500/40"
                style={{ borderColor: colors.borderMedium }}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {agreementNum}
                      </span>
                      {isVerified ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 flex items-center gap-1">
                          ✓ Verified & Approved via OTP
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          ⏳ Agreement Pending Verification
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        Booking ID: {booking.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px] uppercase tracking-wider font-bold">
                          Customer
                        </span>
                        <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                          {booking.customerName}
                        </span>
                        <span className="text-blue-500 font-mono block font-semibold">
                          📱 +91 {booking.customerPhone || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[11px] uppercase tracking-wider font-bold">
                          Vehicle
                        </span>
                        <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                          {booking.carName}
                        </span>
                        <span className="text-gray-400 block">
                          {matchedCar?.registrationNumber || 'Inward Fleet'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[11px] uppercase tracking-wider font-bold">
                          Rental Dates
                        </span>
                        <span className="font-semibold" style={{ color: colors.textPrimary }}>
                          {formatDate(booking.fromDate)} &rarr; {formatDate(booking.toDate)}
                        </span>
                        <span className="text-gray-400 block text-[11px]">
                          Tariff: ₹{booking.totalPrice}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[11px] uppercase tracking-wider font-bold">
                          Security Deposit
                        </span>
                        {booking.deposit > 0 ? (
                          <span className="font-bold text-purple-500 block">
                            💵 ₹{booking.deposit} (Cash)
                          </span>
                        ) : null}
                        {booking.depositItem?.itemName ? (
                          <span className="font-bold text-blue-500 block">
                            🛵 {booking.depositItem.itemName}
                            {booking.depositItem.itemNumber ? (
                              <span className="text-xs font-mono font-semibold text-gray-700 ml-1">
                                [{booking.depositItem.itemNumber}]
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                        {!booking.deposit && !booking.depositItem?.itemName && (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                    <button
                      onClick={() =>
                        setSelectedBookingForAgreement({
                          ...booking,
                          car: matchedCar || {
                            name: booking.carName,
                            pricePerDay: Math.round(Number(booking.totalPrice || 0) / 2) || 1000,
                            registrationNumber: matchedCar?.registrationNumber || '',
                          },
                        })
                      }
                      type="button"
                      className="px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
                      style={{
                        backgroundColor: colors.backgroundSecondary,
                        borderColor: colors.borderMedium,
                        color: colors.textPrimary,
                      }}
                    >
                      <span>📜</span>
                      <span>View Full Agreement</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inward Agreement Modal for View / Print */}
      {selectedBookingForAgreement && (
        <InwardAgreementModal
          open={Boolean(selectedBookingForAgreement)}
          onClose={() => setSelectedBookingForAgreement(null)}
          bookingDetails={{
            id: selectedBookingForAgreement.id || selectedBookingForAgreement.originalBookingId || selectedBookingForAgreement._id,
            bookingId: selectedBookingForAgreement.id || selectedBookingForAgreement.originalBookingId || selectedBookingForAgreement._id,
            customerName: selectedBookingForAgreement.customerName,
            customerPhone: selectedBookingForAgreement.customerPhone,
            customerEmail: selectedBookingForAgreement.customerEmail,
            customerAddress: selectedBookingForAgreement.customerAddress || selectedBookingForAgreement.address || '',
            numberOfGuests: selectedBookingForAgreement.numberOfGuests || 1,
            licenseNumber: selectedBookingForAgreement.licenseNumber,
            isDlVerified: selectedBookingForAgreement.licenseVerified || selectedBookingForAgreement.isDlVerified || false,
            panNumber: selectedBookingForAgreement.panNumber,
            isPanVerified: selectedBookingForAgreement.panVerified || selectedBookingForAgreement.isPanVerified || false,
            aadhaarNumber: selectedBookingForAgreement.aadhaarNumber,
            isAadhaarVerified: selectedBookingForAgreement.aadhaarVerified || selectedBookingForAgreement.isAadhaarVerified || false,
            car: selectedBookingForAgreement.car,
            fromDate: selectedBookingForAgreement.fromDate,
            toDate: selectedBookingForAgreement.toDate,
            startTime: selectedBookingForAgreement.startTime || '10:00 AM',
            endTime: selectedBookingForAgreement.endTime || '10:00 AM',
            numberOfDays: selectedBookingForAgreement.numberOfDays || 1,
            totalPrice: selectedBookingForAgreement.totalPrice,
            advanceAmount: selectedBookingForAgreement.advanceAmount,
            depositType: selectedBookingForAgreement.depositType,
            deposit: selectedBookingForAgreement.deposit,
            depositItem: selectedBookingForAgreement.depositItem,
            depositItemType: selectedBookingForAgreement.depositItem?.itemType || 'Bike / Motorcycle',
            depositItemName: selectedBookingForAgreement.depositItem?.itemName || '',
            depositItemNumber: selectedBookingForAgreement.depositItem?.itemNumber || selectedBookingForAgreement.depositItemNumber || '',
          }}
          existingAgreement={selectedBookingForAgreement.agreement}
          isAlreadyDone={Boolean(
            selectedBookingForAgreement.agreement?.status === 'verified' ||
            selectedBookingForAgreement.agreement?.status === 'done' ||
            selectedBookingForAgreement.agreement?.approvedByOtp
          )}
          onMarkDone={() => {
            setSelectedBookingForAgreement(null);
          }}
        />
      )}
    </div>
  );
};

export default FleetAgreementsPage;
