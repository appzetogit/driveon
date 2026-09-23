import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../theme/colors";
import { useAppSelector } from "../../../hooks/redux";
import { bookingService } from "../../../services/booking.service";
import { userService } from "../../../services/user.service";



import carImg1 from "../../../assets/car_img1-removebg-preview.png";
import carImg4 from "../../../assets/car_img4-removebg-preview.png";
import carImg5 from "../../../assets/car_img5-removebg-preview.png";
import carImg6 from "../../../assets/car_img6-removebg-preview.png";
import carImg8 from "../../../assets/car_img8.png";

const fallbackCarImages = [carImg1, carImg6, carImg8, carImg4, carImg5];

/**
 * ReturningCarBanner Component
 * Shows cars that are returning soon from other users' bookings
 * DYNAMIC: Shows specific banner for logged-in user if their booking ends today
 */
const ReturningCarBanner = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // State for dynamic booking banner
  const [dynamicBooking, setDynamicBooking] = useState(null);
  const [isDynamicVisible, setIsDynamicVisible] = useState(false);
  const [dynamicState, setDynamicState] = useState('hidden'); // 'hidden', 'returning', 'available'
  const [remainingTimeText, setRemainingTimeText] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Default to false to show static banner immediately

  // Standard carousel state
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const mobileScrollRef = useRef(null);
  const webScrollRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  const isAutoScrollingRef = useRef(false);
  const pauseTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);

  // Dummy data (fallback)
  const defaultReturningCars = [
    {
      id: "returning1",
      name: "Toyota Innova",
      brand: "Toyota",
      model: "Innova",
      image: fallbackCarImages[0],
      price: 1200,
      location: "Mumbai",
      returningIn: "2 hours",
    }
  ];

  const [returningCars, setReturningCars] = useState(defaultReturningCars);

  // Fetch latest booking for dynamic logic
  useEffect(() => {
    const fetchLatestBooking = async () => {
      if (!isAuthenticated) {
        // setIsLoading(false);
        return;
      }

      // setIsLoading(true); // Removed to prevent flashing/unmounting of static banner
      try {
        const response = await bookingService.getBookings({
          limit: 10,
        });

        if (response.success && response.data?.bookings?.length > 0) {
          // Find the booking that ends TODAY
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const relevantBooking = response.data.bookings.find(booking => {
            // Check status manually since backend doesn't support multiple status query
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
      } finally {
        // setIsLoading(false);
      }
    };

    fetchLatestBooking();

    // Set up an interval to re-check time every minute
    const interval = setInterval(() => {
      if (dynamicBooking) {
        checkBookingStatus(dynamicBooking);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dynamicBooking?.bookingId]); // Re-run if auth or booking ID changes

  const checkBookingStatus = (booking) => {
    if (!booking || !booking.tripEnd || !booking.tripEnd.date) return;

    const endDate = new Date(booking.tripEnd.date);
    const now = new Date();

    // Reset seconds/milliseconds for cleaner comparison
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
      // Calculate remaining time
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
        console.log("🔔 Triggering Returning Soon Notification for", booking._id);
        userService.sendReturningNotification(booking._id || booking.id)
          .then(() => {
            localStorage.setItem(notifyKey, 'true');
            console.log("✅ Notification Sent");
          })
          .catch(err => console.error("❌ Notification Failed", err));
      }

      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeText = "";
      if (diffHrs > 0) timeText += `${diffHrs} hr${diffHrs > 1 ? 's' : ''} `;
      if (diffMins > 0) timeText += `${diffMins} min${diffMins > 1 ? 's' : ''}`;
      if (!timeText) timeText = "less than 1 min";

      setRemainingTimeText(timeText.trim());
    } else {
      setDynamicState('available');
      setDynamicBooking(booking); // Keep the booking data to show car details
    }
  };

  // Helper: Get image from car object
  const getCarImage = (car) => {
    if (!car) return fallbackCarImages[0];
    if (car.images && car.images.length > 0) {
      const img = car.images.find(i => i.isPrimary) || car.images[0];
      return img.url || img.path || img; // Handle string or object
    }
    return fallbackCarImages[0];
  };

  // --- Start Standard Carousel Logic (Same as before) ---
  const getScrollContainer = () => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? webScrollRef.current : mobileScrollRef.current;
    }
    return null;
  };

  useEffect(() => {
    if (returningCars.length <= 1) return;
    const handleScroll = (container) => {
      if (!container) return;
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex >= 0 && newIndex < returningCars.length) {
        setCurrentCarIndex(newIndex);
        currentIndexRef.current = newIndex;
      }
    };
    const mobileContainer = mobileScrollRef.current;
    const webContainer = webScrollRef.current;
    const mobileHandler = () => {
      handleScroll(mobileContainer);
      if (!isAutoScrollingRef.current) {
        setIsAutoScrollPaused(true);
        isPausedRef.current = true;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
          setIsAutoScrollPaused(false);
          isPausedRef.current = false;
        }, 5000); // Resume after 5 seconds
      }
    };
    const webHandler = () => {
      handleScroll(webContainer);
      if (!isAutoScrollingRef.current) {
        setIsAutoScrollPaused(true);
        isPausedRef.current = true;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
          setIsAutoScrollPaused(false);
          isPausedRef.current = false;
        }, 5000); // Resume after 5 seconds
      }
    };

    if (mobileContainer) mobileContainer.addEventListener("scroll", mobileHandler, { passive: true });
    if (webContainer) webContainer.addEventListener("scroll", webHandler, { passive: true });

    if (mobileContainer) handleScroll(mobileContainer);
    if (webContainer) handleScroll(webContainer);
    return () => {
      if (mobileContainer) mobileContainer.removeEventListener("scroll", mobileHandler);
      if (webContainer) webContainer.removeEventListener("scroll", webHandler);
    };
  }, [returningCars.length]);

  // Auto-scroll disabled per user request
  /*
  if (returningCars.length <= 1) return;
  autoScrollIntervalRef.current = setInterval(() => {
    if (isPausedRef.current) return;
    const container = getScrollContainer();
    if (!container) return;
    const currentIdx = currentIndexRef.current;
    const nextIndex = (currentIdx + 1) % returningCars.length;
    const cardWidth = container.clientWidth;
    isAutoScrollingRef.current = true;
    container.scrollTo({ left: nextIndex * cardWidth, behavior: "smooth" });
    setTimeout(() => { isAutoScrollingRef.current = false; }, 800);
  }, 3000);
  return () => {
    if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
  };
  */


  const goToIndex = (index) => {
    const container = getScrollContainer();
    if (!container) return;
    setIsAutoScrollPaused(true);
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    isAutoScrollingRef.current = true;
    const cardWidth = container.clientWidth;
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setTimeout(() => { isAutoScrollingRef.current = false; }, 600);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollPaused(false);
      isPausedRef.current = false;
    }, 10000);
  };
  // --- End Standard Carousel Logic ---

  const handleBannerClick = (car) => {
    if (car && car._id || car.id) {
      navigate(`/car-details/${car._id || car.id}`);
    }
  };



  // If dynamic state is active, prepare the banner content
  const dynamicBanner = dynamicState !== 'hidden' ? (
    <div className="w-full mb-4 md:mb-6 animate-fade-in">
      <div className="">
        {/* Mobile View - Exact replica of Static Mobile */}
        <div className="block md:hidden">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl relative"
            style={{
              background: colors.gradientHeader || "linear-gradient(180deg, #1C205C 0%, #0D102D 100%)",
              maxHeight: "280px",
              height: "auto",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-4 w-full"
            >
              {/* Left Side */}
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "#10B981" }}
                  >
                    <path d={dynamicState === 'available'
                      ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" // Checkmark
                      : "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" // Box Icon
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
                  {dynamicBooking.car?.brand} {dynamicBooking.car?.model}
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
                    Rs. {dynamicBooking.car?.pricePerDay} / day
                  </span>
                  <span className="text-xs text-white/60">•</span>
                  <span className="text-sm text-white/80 truncate">
                    {dynamicBooking.tripEnd?.location || "Location TBD"}
                  </span>
                </div>
              </div>

              {/* Right Side */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: "40%", minWidth: "120px" }}
              >
                <img
                  src={getCarImage(dynamicBooking.car)}
                  alt={dynamicBooking.car?.model}
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
            </div>
          </div>
        </div>

        {/* Web View - Exact replica of Static Web */}
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
            <div
              className="flex items-center justify-between px-6 py-2 lg:px-8 lg:py-3 w-full h-full"
            >
              {/* Left Side */}
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
                  {dynamicBooking.car?.brand} {dynamicBooking.car?.model}
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
                    Rs. {dynamicBooking.car?.pricePerDay} / day
                  </span>
                  <span className="text-white/60">•</span>
                  <span className="text-lg text-white/80">{dynamicBooking.tripEnd?.location || "Location TBD"}</span>
                </div>
              </div>

              {/* Right Side */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: "45%", minWidth: "280px" }}
              >
                <img
                  src={getCarImage(dynamicBooking.car)}
                  alt={dynamicBooking.car?.model}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Fallback to default carousel if no dynamic booking
  if (isLoading) return null; // Prevent flash of static content while loading

  return (
    <>
      {dynamicState !== 'hidden' && dynamicBooking ? dynamicBanner : null}
    </>
  );
};

export default ReturningCarBanner;
