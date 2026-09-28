import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../theme/colors";
import { useAppSelector } from "../../../hooks/redux";
import { bookingService } from "../../../services/booking.service";
import { userService } from "../../../services/user.service";

/**
 * ReturningCarBanner Component
 * DYNAMIC: Shows specific banner for logged-in user if their active booking ends today
 * Fully live - no mock data
 */
const ReturningCarBanner = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // State for dynamic booking banner
  const [dynamicBooking, setDynamicBooking] = useState(null);
  const [dynamicState, setDynamicState] = useState('hidden'); // 'hidden', 'returning', 'available'
  const [remainingTimeText, setRemainingTimeText] = useState('');

  const checkBookingStatus = (booking) => {
    if (!booking || !booking.tripEnd || !booking.tripEnd.date) return;

    const endDate = new Date(booking.tripEnd.date);
    const now = new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingEndDay = new Date(endDate);
    bookingEndDay.setHours(0, 0, 0, 0);

    // Condition 1: Banner only visible if booking end date is TODAY
    const isToday = today.getTime() === bookingEndDay.getTime();

    if (!isToday) {
      setDynamicState('hidden');
      return;
    }

    // Condition 2: Check time
    // If Now < EndTime -> Dynamic "Returning Soon"
    // If Now >= EndTime -> Static "Available Now"
    if (now < endDate) {
      const diffMs = endDate - now;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

      // Only show if 2 hours or less remaining
      if (diffMs > 2 * 60 * 60 * 1000) {
        setDynamicState('hidden');
        return;
      }

      setDynamicState('returning');
      setDynamicBooking(booking);

      // Trigger Push Notification Logic
      const notifyKey = `notified_returning_${booking._id || booking.id}`;
      const hasNotified = localStorage.getItem(notifyKey);

      if (!hasNotified) {
        userService.sendReturningNotification(booking._id || booking.id)
          .then(() => {
            localStorage.setItem(notifyKey, 'true');
          })
          .catch(err => console.error("Notification Failed", err));
      }

      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeText = "";
      if (diffHrs > 0) timeText += `${diffHrs} hr${diffHrs > 1 ? 's' : ''} `;
      if (diffMins > 0) timeText += `${diffMins} min${diffMins > 1 ? 's' : ''}`;
      if (!timeText) timeText = "less than 1 min";

      setRemainingTimeText(timeText.trim());
    } else {
      setDynamicState('available');
      setDynamicBooking(booking);
    }
  };

  // Fetch latest booking for dynamic logic
  useEffect(() => {
    const fetchLatestBooking = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await bookingService.getBookings({ limit: 10 });

        if (response.success && response.data?.bookings?.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const relevantBooking = response.data.bookings.find(booking => {
            if (!['active', 'confirmed', 'completed'].includes(booking.status)) return false;
            if (!booking.tripEnd || !booking.tripEnd.date) return false;
            const endDate = new Date(booking.tripEnd.date);
            const bookingEndDay = new Date(endDate);
            bookingEndDay.setHours(0, 0, 0, 0);
            return today.getTime() === bookingEndDay.getTime();
          });

          if (relevantBooking) {
            checkBookingStatus(relevantBooking);
          }
        }
      } catch (error) {
        console.error("Error fetching booking for banner:", error);
      }
    };

    fetchLatestBooking();

    const interval = setInterval(() => {
      if (dynamicBooking) {
        checkBookingStatus(dynamicBooking);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dynamicBooking?.bookingId]);

  // Helper: Get image from car object
  const getCarImage = (car) => {
    if (!car) return null;
    if (car.images && car.images.length > 0) {
      const img = car.images.find(i => i.isPrimary) || car.images[0];
      const url = img.url || img.path || img;
      if (typeof url === 'string') {
        return url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL || ''}${url}`;
      }
    }
    if (car.image) {
      const url = typeof car.image === 'string' ? car.image : (car.image.url || car.image.path);
      if (typeof url === 'string') {
        return url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL || ''}${url}`;
      }
    }
    return null;
  };

  if (dynamicState === 'hidden' || !dynamicBooking) {
    return null;
  }

  const car = dynamicBooking.car || {};
  const carImgUrl = getCarImage(car);

  return (
    <div className="w-full mb-4 md:mb-6 animate-fade-in">
      {/* Mobile View */}
      <div className="block md:hidden">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl relative"
          style={{
            background: colors.gradientHeader || "linear-gradient(180deg, #1C205C 0%, #0D102D 100%)",
            maxHeight: "280px",
            height: "auto",
          }}
        >
          <div className="flex items-center justify-between px-4 py-4 w-full">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-1.5">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#10B981" }}
                >
                  <path d={dynamicState === 'available'
                    ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    : "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  } />
                </svg>
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#10B981" }}
                >
                  {dynamicState === 'available' ? "Available Now" : "Returning Soon"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 truncate">
                {car.brand} {car.model}
              </h3>
              <p className="text-sm text-white/90 mb-1.5">
                {dynamicState === 'available' ? (
                  "This car is now available for booking!"
                ) : (
                  <>
                    This car is returning in{" "}
                    <span className="font-semibold">{remainingTimeText}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-sm font-semibold text-white">
                  ₹{car.pricePerDay || 0} / day
                </span>
                <span className="text-xs text-white/60">•</span>
                <span className="text-sm text-white/80 truncate">
                  {dynamicBooking.tripEnd?.location || "Location TBD"}
                </span>
              </div>
            </div>

            {carImgUrl && (
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: "40%", minWidth: "120px" }}
              >
                <img
                  src={carImgUrl}
                  alt={`${car.brand || ''} ${car.model || ''}`}
                  className="w-full h-auto object-contain"
                  draggable={false}
                  style={{
                    objectFit: "contain",
                    maxHeight: "250px",
                    width: "100%",
                    transform: "scale(1.25)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Web View */}
      <div className="hidden md:block">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl relative"
          style={{
            background: colors.gradientHeader || "linear-gradient(180deg, #1C205C 0%, #0D102D 100%)",
            maxHeight: "340px",
            height: "340px",
            overflow: "hidden",
          }}
        >
          <div className="flex items-center justify-between px-6 py-2 lg:px-8 lg:py-3 w-full h-full">
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "#10B981" }}
                >
                  <path d={dynamicState === 'available'
                    ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    : "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  } />
                </svg>
                <span
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "#10B981" }}
                >
                  {dynamicState === 'available' ? "Available Now" : "Returning Soon"}
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-1.5">
                {car.brand} {car.model}
              </h3>
              <p className="text-lg lg:text-xl text-white/90 mb-2">
                {dynamicState === 'available' ? (
                  "This car is now available for booking!"
                ) : (
                  <>
                    This car is returning in{" "}
                    <span className="font-semibold">{remainingTimeText}</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-lg lg:text-xl font-semibold text-white">
                  ₹{car.pricePerDay || 0} / day
                </span>
                <span className="text-white/60">•</span>
                <span className="text-lg text-white/80">{dynamicBooking.tripEnd?.location || "Location TBD"}</span>
              </div>
            </div>

            {carImgUrl && (
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: "45%", minWidth: "280px" }}
              >
                <img
                  src={carImgUrl}
                  alt={`${car.brand || ''} ${car.model || ''}`}
                  className="w-full h-auto object-contain"
                  draggable={false}
                  style={{
                    objectFit: "contain",
                    maxHeight: "340px",
                    width: "100%",
                    transform: "scale(1.15)",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturningCarBanner;
