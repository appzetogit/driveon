import { useMemo, useState, useEffect } from "react";
import { colors } from "../../../module/theme/colors";
import Card from "../../../components/common/Card";
import adminService from "../../../services/admin.service";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatMoney = (amount) => {
  const number = Number(amount);
  if (!Number.isFinite(number)) return "₹0";
  return number.toLocaleString("en-IN", { style: "currency", currency: "INR" });
};

const formatPaymentStatus = (status) => {
  if (!status) return "N/A";
  if (status === "partial") return "Advance Done";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusMeta = (status) => {
  switch (status) {
    case "running":
      return { label: "Running", bg: "#E8F5E9", fg: colors.success, dot: colors.success };
    case "booked":
      return { label: "Booked", bg: "#FFF3E0", fg: colors.warning, dot: colors.warning };
    case "completed":
      return { label: "Completed", bg: "#F3F4F6", fg: colors.textSecondary, dot: colors.textSecondary };
    case "cancelled":
      return { label: "Cancelled", bg: "#FFEBEE", fg: colors.error, dot: colors.error };
    default:
      return { label: status || "N/A", bg: "#F3F4F6", fg: colors.textSecondary, dot: colors.textSecondary };
  }
};

const OnlineCarsPage = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        // Fetch all bookings
        const response = await adminService.getAllBookings({ limit: 500 });
        if (response.success) {
          setBookingsData(response.data?.bookings || []);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const onlineCars = useMemo(() => {
    // Filter out unpaid/abandoned checkouts (cancelled bookings with no paid amount or failed payment status)
    const validBookings = bookingsData.filter((b) => {
      if (b.status === "unpaid") return false;
      if (b.status === "cancelled" && (b.paidAmount === 0 || b.paymentStatus === "failed")) return false;
      return true;
    });

    return validBookings.map((b) => {
      let mappedStatus = "completed";
      if (b.tripStatus === "in_progress" || ["started", "picked_up", "ongoing"].includes(b.tripStatus) || b.status === "active") {
        mappedStatus = "running";
      } else if (b.status === "confirmed" && b.tripStatus === "not_started") {
        mappedStatus = "booked";
      } else if (b.status === "cancelled" || b.tripStatus === "cancelled") {
        mappedStatus = "cancelled";
      } else if (b.status === "pending") {
        mappedStatus = "booked";
      }

      return {
        id: b.bookingId || b._id,
        isFleet: false,
        car: {
          id: b.car?._id || "N/A",
          name: `${b.car?.brand || ""} ${b.car?.model || ""}`.trim() || "N/A",
          numberPlate: b.car?.registrationNumber || "N/A",
          city: b.car?.location?.city || "N/A",
          fuel: b.car?.fuelType || "N/A",
          transmission: b.car?.transmission || "N/A",
          seats: b.car?.seatingCapacity || 5,
        },
        booking: {
          bookingId: b.bookingId || b._id,
          status: mappedStatus,
          user: {
            name: b.user?.name || "N/A",
            email: b.user?.email || "N/A",
            phone: b.user?.phone || "N/A",
          },
          tripStart: {
            dateTime: b.tripStart?.date,
            location: b.tripStart?.location || "N/A",
          },
          tripEnd: {
            dateTime: b.tripEnd?.date,
            location: b.tripEnd?.location || "N/A",
          },
          pricing: {
            pricePerDay: b.pricing?.basePrice || 0,
            days: b.totalDays || 1,
            discount: b.pricing?.discount || 0,
            extraCharges: b.pricing?.addOnServicesTotal || 0,
            totalAmount: b.pricing?.totalPrice || b.pricing?.finalPrice || 0,
            paidAmount: b.paidAmount || 0,
            remainingAmount: b.remainingAmount || 0,
          },
          paymentStatus: b.paymentStatus || "N/A",
        },
      };
    });
  }, [bookingsData]);

  const openDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Online Booking Cars
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            All online-booked cars (fleet excluded), with current booking status.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: colors.backgroundLight }}>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Car
                </th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Booking ID
                </th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Status
                </th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  User
                </th>
                <th className="text-center text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Trip
                </th>
                <th className="text-left text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Amount
                </th>
                <th className="text-right text-xs font-semibold px-4 py-3" style={{ color: colors.textSecondary }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm font-medium animate-pulse" colSpan={7} style={{ color: colors.primary }}>
                    Fetching online cars...
                  </td>
                </tr>
              ) : onlineCars.map((item) => {
                const statusMeta = getStatusMeta(item?.booking?.status);
                return (
                  <tr
                    key={item.id}
                    className="border-t"
                    style={{ borderTopColor: colors.borderMedium }}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: colors.textPrimary }}>
                        {item?.car?.name || "N/A"}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {item?.car?.numberPlate || "N/A"} • {item?.car?.city || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium" style={{ color: colors.textPrimary }}>
                        {item?.booking?.bookingId || "N/A"}
                      </div>
                      <div className="text-xs mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-gray-500">Payment:</span>
                        {item?.booking?.paymentStatus === 'partial' || item?.booking?.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                            {formatPaymentStatus(item?.booking?.paymentStatus)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {formatPaymentStatus(item?.booking?.paymentStatus)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: statusMeta.bg, color: statusMeta.fg }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.dot }} />
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium" style={{ color: colors.textPrimary }}>
                        {item?.booking?.user?.name || "N/A"}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {item?.booking?.user?.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5 text-center">
                        <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {formatDateTime(item?.booking?.tripStart?.dateTime)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 my-0.5">
                          to
                        </div>
                        <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {formatDateTime(item?.booking?.tripEnd?.dateTime)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold" style={{ color: colors.textPrimary }}>
                        {formatMoney(item?.booking?.pricing?.totalAmount)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {item?.booking?.pricing?.days || 0} day(s)
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => openDetails(item)}
                        className="px-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
                        style={{
                          color: colors.backgroundTertiary,
                          borderColor: colors.borderMedium,
                          backgroundColor: colors.backgroundSecondary,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.backgroundLight;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.backgroundSecondary;
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {(!loading && onlineCars.length === 0) && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm" colSpan={7} style={{ color: colors.textSecondary }}>
                    No online booked cars found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showDetails && selectedItem && (
        <BookingDetailsModal item={selectedItem} onClose={closeDetails} />
      )}
    </div>
  );
};

const InfoRow = ({ label, value, isLast = false }) => {
  return (
    <div
      className={`py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-6 ${isLast ? "" : "border-b"}`}
      style={!isLast ? { borderBottomColor: colors.borderMedium } : undefined}
    >
      <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
        {label}
      </div>
      <div className="text-sm sm:text-right break-words" style={{ color: colors.textPrimary }}>
        {value}
      </div>
    </div>
  );
};

const BookingDetailsModal = ({ item, onClose }) => {
  const statusMeta = getStatusMeta(item?.booking?.status);
  const pricing = item?.booking?.pricing || {};
  const baseAmount = (Number(pricing.pricePerDay) || 0) * (Number(pricing.days) || 0);
  const discount = Number(pricing.discount) || 0;
  const extraCharges = Number(pricing.extraCharges) || 0;
  const totalAmount = Number(pricing.totalAmount) || Math.max(0, baseAmount - discount + extraCharges);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border"
        style={{ borderColor: colors.borderMedium }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between gap-4"
          style={{ borderBottomColor: colors.borderMedium }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold truncate" style={{ color: colors.textPrimary }}>
                {item?.booking?.bookingId || "N/A"}
              </h2>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: statusMeta.bg, color: statusMeta.fg }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.dot }} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-sm mt-1 truncate" style={{ color: colors.textSecondary }}>
              {item?.car?.name || "N/A"} • {item?.car?.numberPlate || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.backgroundLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close"
          >
            <svg className="w-6 h-6" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Car Information
              </h3>
              <div>
                <InfoRow label="Car" value={item?.car?.name || "N/A"} />
                <InfoRow label="Number Plate" value={item?.car?.numberPlate || "N/A"} />
                <InfoRow label="City" value={item?.car?.city || "N/A"} />
                <InfoRow label="Fuel" value={item?.car?.fuel || "N/A"} />
                <InfoRow label="Transmission" value={item?.car?.transmission || "N/A"} />
                <InfoRow label="Seats" value={item?.car?.seats ?? "N/A"} isLast />
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Booking & User
              </h3>
              <div>
                <InfoRow label="User" value={item?.booking?.user?.name || "N/A"} />
                <InfoRow label="Email" value={item?.booking?.user?.email || "N/A"} />
                <InfoRow label="Phone" value={item?.booking?.user?.phone || "N/A"} />
                <InfoRow 
                   label="Payment Status" 
                   value={
                     item?.booking?.paymentStatus === 'partial' || item?.booking?.paymentStatus === 'paid' ? (
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                         {formatPaymentStatus(item?.booking?.paymentStatus)}
                       </span>
                     ) : (
                       <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                         {formatPaymentStatus(item?.booking?.paymentStatus)}
                       </span>
                     )
                   } 
                   isLast 
                 />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Trip Details
              </h3>
              <div>
                <InfoRow
                  label="Trip Start"
                  value={`${formatDateTime(item?.booking?.tripStart?.dateTime)} • ${item?.booking?.tripStart?.location || "N/A"}`}
                />
                <InfoRow
                  label="Trip End"
                  value={`${formatDateTime(item?.booking?.tripEnd?.dateTime)} • ${item?.booking?.tripEnd?.location || "N/A"}`}
                />
                <InfoRow label="Duration" value={`${pricing?.days || 0} day(s)`} isLast />
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
                Pricing Breakdown
              </h3>
              <div>
                <InfoRow label="Price per day" value={formatMoney(pricing?.pricePerDay)} />
                <InfoRow label="Days" value={pricing?.days || 0} />
                <InfoRow label="Discount" value={formatMoney(discount)} />
                <InfoRow label="Extra Charges" value={formatMoney(extraCharges)} />
                <div
                  className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between gap-6"
                  style={{ backgroundColor: colors.backgroundLight }}
                >
                  <div className="text-base font-bold" style={{ color: colors.textPrimary }}>
                    Total Amount
                  </div>
                  <div className="text-base font-bold" style={{ color: colors.textPrimary }}>
                    {formatMoney(totalAmount)}
                  </div>
                </div>
                {(pricing?.paidAmount > 0 || pricing?.remainingAmount > 0) && (
                  <div className="mt-3 space-y-2 px-1">
                    {pricing?.remainingAmount <= 0 && pricing?.paidAmount >= totalAmount ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold" style={{ color: colors.success }}>Payment Status</div>
                        <div className="text-sm font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">Fully Paid</div>
                      </div>
                    ) : (
                      <>
                        {pricing?.paidAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>Advance Paid</div>
                            <div className="text-sm font-bold" style={{ color: colors.success }}>{formatMoney(pricing.paidAmount)}</div>
                          </div>
                        )}
                        {pricing?.remainingAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>Remaining Amount</div>
                            <div className="text-sm font-bold text-red-500">{formatMoney(pricing.remainingAmount)}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{
                color: colors.textPrimary,
                borderColor: colors.borderMedium,
                backgroundColor: colors.backgroundSecondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.backgroundLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.backgroundSecondary;
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCarsPage;
