import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import razorpayService from "../../services/razorpay.service";
import bookingService from "../../services/booking.service";
import { userService } from "../../services/user.service";
import { commonService } from "../../services/common.service";
import { couponService } from "../../services/coupon.service";
import { offerService } from "../../services/offer.service";
import api from "../../services/api";
import { useAppSelector } from "../../hooks/redux";
import toastUtils from "../../config/toast";
import CarDetailsHeader from "../components/layout/CarDetailsHeader";
import BookingConfirmationModal from "../components/common/BookingConfirmationModal";
import CustomSelect from "../components/common/CustomSelect";
import { colors } from "../theme/colors";
import { motion } from "framer-motion";

// Import car images for mock data
import carImg1 from "../../assets/car_img1-removebg-preview.png";
import carImg4 from "../../assets/car_img4-removebg-preview.png";
import carImg5 from "../../assets/car_img5-removebg-preview.png";
import carImg6 from "../../assets/car_img6-removebg-preview.png";
import carImg8 from "../../assets/car_img8.png";

/**
 * Helper function to extract numeric price from price string or number
 */
const extractPrice = (price) => {
  if (typeof price === "number") return price;
  if (typeof price === "string") {
    // Extract number from strings like "Rs. 200" or "200" or "Rs.200"
    const match = price.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  return 0;
};

/**
 * BookNowPage Component
 * Premium booking page for car rental
 * Based on document.txt requirements with premium UI design
 */
const BookNowPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => ({
    isAuthenticated: state.auth?.isAuthenticated,
    user: state.auth?.user || state.user?.user || state.user,
  }));

  // Redirect unauthenticated users immediately
  useEffect(() => {
    if (!isAuthenticated) {
      toastUtils.info("Please login to proceed with booking.");
      navigate("/login", {
        state: {
          from: {
            pathname: `/book-now/${id}`,
            state: location.state,
          }
        }
      });
    }
  }, [isAuthenticated, id, navigate, location.state]);

  const [car, setCar] = useState(null);
  const [isCarLoading, setIsCarLoading] = useState(true);

  useEffect(() => {
    const loadCar = async () => {
      // 1. Try navigation state
      if (location.state?.car) {
        const stateCar = location.state.car;
        const normalized = {
          id: stateCar.id || stateCar._id || id,
          name: stateCar.name || `${stateCar.brand || ""} ${stateCar.model || ""}`.trim(),
          brand: stateCar.brand,
          model: stateCar.model,
          image: stateCar.image || stateCar.images?.[0] || carImg1,
          images: stateCar.images || [stateCar.image || carImg1],
          price: extractPrice(stateCar.price || stateCar.pricePerDay || 0),
          pricePerDay: extractPrice(stateCar.pricePerDay || stateCar.price || 0),
          seats: stateCar.seats || 4,
          transmission: stateCar.transmission || "Automatic",
          fuelType: stateCar.fuelType || "Petrol",
          rating: stateCar.rating || stateCar.averageRating || 5.0,
          location: stateCar.location || "Location",
          registrationNumber: stateCar.registrationNumber,
        };
        setCar(normalized);
        setIsCarLoading(false);
        return;
      }

      // 2. Try sessionStorage cache
      if (typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem("driveon:selectedCar");
          if (raw) {
            const cached = JSON.parse(raw);
            const matchesRoute = cached && (cached.id === id || cached._id === id);
            if (cached && (matchesRoute || !id)) {
              const normalized = {
                id: cached.id || cached._id || id,
                name: cached.name || `${cached.brand || ""} ${cached.model || ""}`.trim(),
                brand: cached.brand,
                model: cached.model,
                image: cached.image || cached.images?.[0] || carImg1,
                images: cached.images || [cached.image || carImg1],
                price: extractPrice(cached.price || cached.pricePerDay || 0),
                pricePerDay: extractPrice(cached.pricePerDay || cached.price || 0),
                seats: cached.seats || 4,
                transmission: cached.transmission || "Automatic",
                fuelType: cached.fuelType || "Petrol",
                rating: cached.rating || cached.averageRating || 5.0,
                location: cached.location || "Location",
                registrationNumber: cached.registrationNumber,
              };
              setCar(normalized);
              setIsCarLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to parse cached car details", err);
        }
      }

      // 3. Fetch from API if id is valid ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id || "");
      if (id && isValidObjectId) {
        try {
          setIsCarLoading(true);
          const response = await api.get(`/cars/${id}`);
          if (response.data?.success && response.data?.data?.car) {
            const apiCar = response.data.data.car;
            
            // Resolve primary image
            let carImage = carImg1;
            let carImages = [];
            if (apiCar.images && Array.isArray(apiCar.images) && apiCar.images.length > 0) {
              const primary = apiCar.images.find(img => img.isPrimary);
              const matchedUrl = primary ? (primary.url || primary.path) : (apiCar.images[0]?.url || apiCar.images[0]?.path || carImg1);
              carImage = matchedUrl.startsWith('http') ? matchedUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${matchedUrl}`;
              carImages = apiCar.images.map(img => {
                const url = typeof img === 'string' ? img : (img?.url || img?.path);
                return url ? (url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL || ''}${url}`) : null;
              }).filter(Boolean);
            } else if (apiCar.primaryImage) {
              const matchedUrl = apiCar.primaryImage;
              carImage = matchedUrl.startsWith('http') ? matchedUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${matchedUrl}`;
              carImages = [carImage];
            } else if (apiCar.image) {
              const matchedUrl = apiCar.image;
              carImage = matchedUrl.startsWith('http') ? matchedUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${matchedUrl}`;
              carImages = [carImage];
            }

            const normalized = {
              id: apiCar._id || apiCar.id,
              name: `${apiCar.brand || ''} ${apiCar.model || ''}`.trim() || 'Car',
              brand: apiCar.brand,
              model: apiCar.model,
              image: carImage,
              images: carImages,
              price: apiCar.pricePerDay || 0,
              pricePerDay: apiCar.pricePerDay || 0,
              seats: apiCar.seatingCapacity || 4,
              transmission: apiCar.transmission === 'automatic' ? 'Automatic' : apiCar.transmission === 'manual' ? 'Manual' : 'Automatic',
              fuelType: apiCar.fuelType === 'electric' ? 'Electric' : apiCar.fuelType === 'diesel' ? 'Diesel' : 'Petrol',
              rating: apiCar.averageRating || 5.0,
              location: typeof apiCar.location === 'string' ? apiCar.location : apiCar.location?.city || 'Location',
              registrationNumber: apiCar.registrationNumber,
            };
            setCar(normalized);
          } else {
            setCar(null);
          }
        } catch (error) {
          console.error("Error fetching car in BookNowPage:", error);
          setCar(null);
        } finally {
          setIsCarLoading(false);
        }
      } else {
        setCar(null);
        setIsCarLoading(false);
      }
    };

    loadCar();
  }, [id, location.state]);

  // Page load animation state - animations trigger only once on mount
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations on page load
    setIsPageLoaded(true);
  }, []);

  // Form state
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("");

  // Auto-fill dates from location state (when navigating from car details or search filter)
  useEffect(() => {
    if (location.state) {
      // Check for dates from navigation state
      if (location.state.pickupDate) {
        setPickupDate(location.state.pickupDate);
      }
      if (location.state.pickupTime) {
        setPickupTime(location.state.pickupTime);
      }
      if (location.state.dropDate) {
        setDropDate(location.state.dropDate);
      }
      if (location.state.dropTime) {
        setDropTime(location.state.dropTime);
      }
    }

    // Also check localStorage for dates (in case dates were selected in filter)
    // This allows dates to persist across navigation
    try {
      const storedDates = localStorage.getItem("selectedBookingDates");
      if (storedDates) {
        const dates = JSON.parse(storedDates);
        if (dates.pickupDate && !location.state?.pickupDate) {
          setPickupDate(dates.pickupDate);
        }
        if (dates.pickupTime && !location.state?.pickupTime) {
          setPickupTime(dates.pickupTime);
        }
        if (dates.dropDate && !location.state?.dropDate) {
          setDropDate(dates.dropDate);
        }
        if (dates.dropTime && !location.state?.dropTime) {
          setDropTime(dates.dropTime);
        }
      }
    } catch (error) {
      console.error("Error reading dates from localStorage:", error);
    }
  }, [location]);
  const [paymentOption, setPaymentOption] = useState("advance"); // Only 'advance' option available
  const [specialRequests, setSpecialRequests] = useState("");
  const [advancePercentage, setAdvancePercentage] = useState(20);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await commonService.getSystemSettings();
        if (response.success && response.data.settings?.advancePaymentPercentage !== undefined) {
          setAdvancePercentage(Number(response.data.settings.advancePaymentPercentage));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [bookingPurpose, setBookingPurpose] = useState(""); // 'job', 'business', 'student'
  // Coins / Points discount
  const [availableCoins, setAvailableCoins] = useState(0);
  const [coinsApplied, setCoinsApplied] = useState(false);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [showAddons, setShowAddons] = useState(true);

  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
  });
  const [currentAddress, setCurrentAddress] = useState("");
  const [jobDetails, setJobDetails] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [studentId, setStudentId] = useState("");
  const [documentPhoto, setDocumentPhoto] = useState(null);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);

  // Fetch user profile and auto-fill personal details
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await userService.getProfile();
        const userProfile = response?.data?.user || response?.user || user;

        if (userProfile) {
          // Auto-fill personal details from user profile
          setPersonalDetails((prev) => ({
            name: userProfile.name || userProfile.fullName || prev.name || "",
            phone:
              userProfile.phone ||
              userProfile.mobile ||
              userProfile.phoneNumber ||
              prev.phone ||
              "",
            email: userProfile.email || prev.email || "",
            age: userProfile.age ? String(userProfile.age) : prev.age || "",
            gender: userProfile.gender || prev.gender || "",
          }));

          // Auto-fill current address if available
          if (userProfile.address) {
            setCurrentAddress(userProfile.address);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fallback to Redux user data if API fails
        if (user) {
          setPersonalDetails((prev) => ({
            name: user.name || user.fullName || prev.name || "",
            phone:
              user.phone || user.mobile || user.phoneNumber || prev.phone || "",
            email: user.email || prev.email || "",
            age: user.age ? String(user.age) : prev.age || "",
            gender: user.gender || prev.gender || "",
          }));
          if (user.address) {
            setCurrentAddress(user.address);
          }
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user]);
  // Dynamic add-on services from database
  const [allAddOnServices, setAllAddOnServices] = useState([]);
  const [serviceQuantities, setServiceQuantities] = useState({});
  // Legacy compat: keep addOnServices for booking submission
  const [addOnServices, setAddOnServices] = useState({});
  const [addOnServicesPrices, setAddOnServicesPrices] = useState({});
  const [customServices, setCustomServices] = useState([]);
  const [customServiceQuantities, setCustomServiceQuantities] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitWarning, setSubmitWarning] = useState("");

  // Load all add-on services dynamically from API
  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        const response = await commonService.getAddOnServices();
        if (response.success && response.data) {
          const services = response.data;
          setAllAddOnServices(services);
          // Build initial quantities map (key -> 0)
          const initQty = {};
          const initPrices = {};
          services.forEach(s => {
            initQty[s.key] = 0;
            initPrices[s.key] = s.price;
          });
          setServiceQuantities(initQty);
          setAddOnServicesPrices(initPrices);
          setAddOnServices(initQty); // keep legacy compat
        }
      } catch (error) {
        console.error('Error fetching add-on services:', error);
        // Fallback defaults
        const fallback = [
          { _id: 'driver', key: 'driver', name: 'Driver', description: 'Professional driver service', price: 500 },
          { _id: 'bodyguard', key: 'bodyguard', name: 'Bodyguard', description: 'Security personnel', price: 1000 },
          { _id: 'gunmen', key: 'gunmen', name: 'Gun men', description: 'Armed security personnel', price: 1500 },
          { _id: 'bouncer', key: 'bouncer', name: 'Bouncer', description: 'Event security personnel', price: 800 },
        ];
        setAllAddOnServices(fallback);
        const initQty = {};
        const initPrices = {};
        fallback.forEach(s => { initQty[s.key] = 0; initPrices[s.key] = s.price; });
        setServiceQuantities(initQty);
        setAddOnServicesPrices(initPrices);
        setAddOnServices(initQty);
      }
    };

    const fetchCustomServices = async () => {
      try {
        const response = await api.get('/common/addon-services/custom');
        if (response.data.success && response.data.data?.services) {
          setCustomServices(response.data.data.services);
        }
      } catch (error) {
        console.error('Error fetching custom add-on services:', error);
      }
    };

    fetchAllServices();
    fetchCustomServices();
  }, []);

  // Fetch active promotional offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await offerService.getActiveOffers();
        if (response.success && response.data) {
          setActiveOffers(response.data);
        }
      } catch (err) {
        console.error("Error fetching active offers:", err);
      }
    };
    if (isAuthenticated) {
      fetchOffers();
    }
  }, [isAuthenticated]);

  // Fetch user coins/points balance
  useEffect(() => {
    const fetchCoins = async () => {
      if (!isAuthenticated) return;
      try {
        setLoadingCoins(true);
        const response = await userService.getGuarantorPoints();
        const pointsData = response?.data || response || {};
        setAvailableCoins(Math.floor(pointsData.points || 0));
      } catch (err) {
        console.error('Error fetching coins:', err);
        setAvailableCoins(0);
      } finally {
        setLoadingCoins(false);
      }
    };
    fetchCoins();
  }, [isAuthenticated]);

  // Sync serviceQuantities -> addOnServices for booking submission
  const handleServiceQtyChange = (key, newQty) => {
    setServiceQuantities(prev => ({ ...prev, [key]: newQty }));
    setAddOnServices(prev => ({ ...prev, [key]: newQty }));
  };

  // Booking confirmation modal state (shown after successful Razorpay payment)
  const [showBookingConfirmationModal, setShowBookingConfirmationModal] =
    useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState(null);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  // Combined date-time picker modal state
  const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
  const [dateTimePickerTarget, setDateTimePickerTarget] = useState(null); // 'pickup' or 'drop'
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState("am");

  // Time picker modal state (for editing time when clicking clock icon)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState("hour");

  // Helper: Convert date string (YYYY-MM-DD) to Date object in local timezone
  // Use noon (12:00) to avoid timezone shift issues
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      // Create date at noon to avoid timezone shift issues
      return new Date(year, month, day, 12, 0, 0);
    }
    return null;
  };

  // Helper: Convert Date object to date string (YYYY-MM-DD) in local timezone
  const formatLocalDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper: format time as HH:mm (24h) from Date
  const formatLocalTime = (date) => {
    if (!date) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Helper: basic ObjectId validation
  const isValidObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(val || "");

  // Helper to format decimal values
  const formatDecimal = (value) => {
    if (value == null || isNaN(value)) return '0';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '0';
    // Show 2 decimal places, remove trailing zeros if integer
    return numValue.toFixed(2).replace(/\.?0+$/, '');
  };

  // Calculate dynamic price based on document.txt requirements
  const calculatePrice = () => {
    if (!pickupDate || !dropDate || !car) {
      return {
        basePrice: 0,
        totalDays: 0,
        totalPrice: 0,
        addOnServicesTotal: 0,
        advancePayment: 0,
        remainingPayment: 0,
        discount: 0,
        couponDiscount: 0,
        offerDiscount: 0,
        finalPrice: 0,
      };
    }

    // Parse dates in local timezone to avoid timezone shift
    const pickup = parseLocalDate(pickupDate) || new Date();
    const drop = parseLocalDate(dropDate) || new Date();
    const diffTime = Math.abs(drop - pickup);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Extract numeric price (handles both number and string formats)
    const basePrice = extractPrice(car.price || car.pricePerDay || 0);
    let totalPrice = basePrice * totalDays;

    // Disabled weekend surcharge completely
    const weekendMultiplier = 0;
    totalPrice = totalPrice * (1 + weekendMultiplier);

    // Calculate add-on services total dynamically
    const addOnServicesTotal = Object.entries(serviceQuantities).reduce((total, [key, qty]) => {
      return total + (qty * (addOnServicesPrices[key] || 0));
    }, 0);

    // Calculate custom services total
    const customServicesTotal = customServices.reduce((total, service) => {
      const qty = customServiceQuantities[service._id] || 0;
      return total + (qty * service.pricePerUnit);
    }, 0);

    // Add add-on services to total price
    totalPrice += addOnServicesTotal + customServicesTotal;

    // Apply coupon and offer discounts sequentially matching backend rules
    let calculatedCouponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        calculatedCouponDiscount = (totalPrice * (appliedCoupon.discountValue || 0)) / 100;
        if (appliedCoupon.maxDiscount && calculatedCouponDiscount > appliedCoupon.maxDiscount) {
          calculatedCouponDiscount = appliedCoupon.maxDiscount;
        }
      } else if (appliedCoupon.discountType === "fixed") {
        calculatedCouponDiscount = appliedCoupon.discountValue || 0;
      }
      calculatedCouponDiscount = Math.round(calculatedCouponDiscount * 100) / 100;
      calculatedCouponDiscount = Math.min(calculatedCouponDiscount, totalPrice);
    }

    const priceAfterCoupon = Math.max(0, totalPrice - calculatedCouponDiscount);

    let calculatedOfferDiscount = 0;
    if (appliedOffer) {
      if (appliedOffer.discountType === "percentage") {
        calculatedOfferDiscount = (priceAfterCoupon * (appliedOffer.discountValue || 0)) / 100;
      } else if (appliedOffer.discountType === "fixed") {
        calculatedOfferDiscount = appliedOffer.discountValue || 0;
      } else if (appliedOffer.discountType === "free") {
        calculatedOfferDiscount = priceAfterCoupon;
      }
      calculatedOfferDiscount = Math.round(calculatedOfferDiscount * 100) / 100;
      calculatedOfferDiscount = Math.min(calculatedOfferDiscount, priceAfterCoupon);
    }

    const discount = calculatedCouponDiscount + calculatedOfferDiscount;
    const priceAfterAllDiscounts = Math.max(0, totalPrice - discount);

    // Apply coins discount (1 coin = ₹1, applied after coupon/offer)
    const calculatedCoinsDiscount = coinsApplied ? Math.min(availableCoins, priceAfterAllDiscounts) : 0;
    const finalPrice = Math.max(0, priceAfterAllDiscounts - calculatedCoinsDiscount);

    // Payment options
    const advancePayment = finalPrice * (advancePercentage / 100); // Dynamic advance
    const remainingPayment = finalPrice - advancePayment;

    return {
      basePrice,
      totalDays,
      totalPrice,
      addOnServicesTotal,
      discount,
      couponDiscount: calculatedCouponDiscount,
      offerDiscount: calculatedOfferDiscount,
      coinsDiscount: calculatedCoinsDiscount,
      finalPrice,
      advancePayment,
      remainingPayment,
    };
  };

  const priceDetails = calculatePrice();

  // Get minimum date (today) - using local timezone
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Combined date-time picker helpers
  const openDateTimePicker = (target) => {
    setDateTimePickerTarget(target);

    // Set date
    const existingDate = target === "pickup" ? pickupDate : dropDate;
    let baseDate;
    if (existingDate) {
      baseDate = parseLocalDate(existingDate);
      if (!baseDate) baseDate = new Date();
    } else if (target === "drop" && pickupDate) {
      baseDate = parseLocalDate(pickupDate);
      if (!baseDate) baseDate = new Date();
    } else {
      baseDate = new Date();
    }
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setCalendarSelectedDate(baseDate);

    // Set time
    const existingTime = target === "pickup" ? pickupTime : dropTime;
    if (existingTime) {
      const [hour, minute] = existingTime.split(":").map(Number);
      if (hour >= 12) {
        setSelectedPeriod("pm");
        setSelectedHour(hour === 12 ? 12 : hour - 12);
      } else {
        setSelectedPeriod("am");
        setSelectedHour(hour === 0 ? 12 : hour);
      }
      setSelectedMinute(minute || 0);
    } else {
      setSelectedHour(10);
      setSelectedMinute(30);
      setSelectedPeriod("am");
    }

    setIsDateTimePickerOpen(true);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Select Date";
    // Parse date string directly to avoid timezone issues
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${String(day).padStart(2, "0")} ${monthNames[month]} ${year}`;
    }
    // Fallback for other formats
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i += 1) {
      days.push(null);
    }
    // Create dates at noon (12:00) to avoid timezone shift issues
    // This ensures the date stays the same regardless of timezone
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push(new Date(year, month, d, 12, 0, 0));
    }
    return days;
  };

  useEffect(() => {
    console.log(showBookingConfirmationModal, [showBookingConfirmationModal])
  }, [showBookingConfirmationModal])

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "Select Time";
    const [hour, minute] = timeStr.split(":").map(Number);
    const period = hour >= 12 ? "pm" : "am";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const handleDateTimePickerDone = () => {
    if (!dateTimePickerTarget) {
      setIsDateTimePickerOpen(false);
      return;
    }

    // Save date
    if (calendarSelectedDate) {
      // Use local date components instead of toISOString to avoid timezone shift
      const dateStr = formatLocalDate(calendarSelectedDate);
      if (dateTimePickerTarget === "pickup") {
        setPickupDate(dateStr);
        // Compare dates properly
        if (dropDate) {
          const dropDateObj = parseLocalDate(dropDate);
          if (dropDateObj && dropDateObj < calendarSelectedDate) {
            setDropDate("");
          }
        }
      } else if (dateTimePickerTarget === "drop") {
        setDropDate(dateStr);
      }
    }

    // Save time
    let hour24 = selectedHour;
    if (selectedPeriod === "pm" && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === "am" && selectedHour === 12) {
      hour24 = 0;
    }

    const timeStr = `${hour24.toString().padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")}`;

    if (dateTimePickerTarget === "pickup") {
      setPickupTime(timeStr);
    } else if (dateTimePickerTarget === "drop") {
      setDropTime(timeStr);
    }

    setIsDateTimePickerOpen(false);
  };

  // Handle real coupon application
  const handleApplyCoupon = async () => {
    if (!pickupDate || !dropDate) {
      toastUtils.error("Please select pickup and drop dates first");
      return;
    }

    if (!priceDetails || !priceDetails.totalPrice || isNaN(priceDetails.totalPrice) || priceDetails.totalPrice <= 0) {
      toastUtils.error("Please select a car and rental dates first to calculate booking price");
      return;
    }

    if (!couponCode.trim()) {
      toastUtils.error("Please enter a coupon code");
      return;
    }

    try {
      const response = await couponService.validateCoupon({
        code: couponCode.trim().toUpperCase(),
        amount: priceDetails.totalPrice,
        carId: car.id || car._id || id,
      });

      if (response.success && response.data) {
        setAppliedCoupon(response.data.coupon);
        toastUtils.success("Coupon applied successfully!");
      }
    } catch (err) {
      toastUtils.error(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // Handle offer application
  const handleApplyOffer = async (offerCodeToApply) => {
    if (!pickupDate || !dropDate) {
      toastUtils.error("Please select pickup and drop dates first");
      return;
    }

    if (!priceDetails || !priceDetails.totalPrice || isNaN(priceDetails.totalPrice) || priceDetails.totalPrice <= 0) {
      toastUtils.error("Please select a car and rental dates first to calculate booking price");
      return;
    }

    try {
      const response = await offerService.validateOffer({
        code: offerCodeToApply,
        amount: priceDetails.totalPrice - (priceDetails.couponDiscount || 0),
      });

      if (response.success && response.data) {
        setAppliedOffer({
          code: response.data.code,
          title: response.data.title,
          discountType: response.data.discountType,
          discountValue: response.data.discountValue,
        });
        toastUtils.success(`Offer "${response.data.title}" applied successfully!`);
      }
    } catch (err) {
      toastUtils.error(err.response?.data?.message || "Failed to apply offer");
    }
  };

  const handleRemoveOffer = () => {
    setAppliedOffer(null);
  };

  // Handle form submission with backend + Razorpay
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    setSubmitWarning("");

    // Helper: build a local Date object from date (YYYY-MM-DD) and time (HH:mm)
    const buildLocalDateTime = (dateStr, timeStr) => {
      if (!dateStr) return null;
      const base = parseLocalDate(dateStr) || new Date(dateStr);
      const [h = "0", m = "0"] = (timeStr || "00:00").split(":");
      base.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
      return base;
    };

    const now = new Date();
    now.setSeconds(0, 0);
    let startDateObj = buildLocalDateTime(pickupDate, pickupTime);
    let endDateObj = buildLocalDateTime(dropDate, dropTime);

    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      alert("Please select pickup and drop date & time");
      setSubmitWarning("Pickup and drop date/time are required.");
      return;
    }

    if (!startDateObj || !endDateObj) {
      alert("Please select valid pickup and drop date & time");
      setSubmitWarning("Invalid pickup/drop date or time.");
      return;
    }

    let adjusted = false;

    if (startDateObj < now) {
      // Auto-adjust pickup to next 30 minutes
      const adjustedStart = new Date(now.getTime() + 30 * 60 * 1000);
      startDateObj = adjustedStart;
      adjusted = true;
    }

    if (endDateObj <= startDateObj) {
      // Ensure drop is at least 2 hours after pickup
      const adjustedEnd = new Date(startDateObj.getTime() + 2 * 60 * 60 * 1000);
      endDateObj = adjustedEnd;
      adjusted = true;
    }

    if (adjusted) {
      const newPickupDate = formatLocalDate(startDateObj);
      const newPickupTime = formatLocalTime(startDateObj);
      const newDropDate = formatLocalDate(endDateObj);
      const newDropTime = formatLocalTime(endDateObj);

      setPickupDate(newPickupDate);
      setPickupTime(newPickupTime);
      setDropDate(newDropDate);
      setDropTime(newDropTime);

      alert(
        "Pickup or drop time was in the past/invalid. We've adjusted it to the next available time."
      );
    }

    if (!agreeToTerms) {
      alert("Please agree to terms and conditions");
      setSubmitWarning("You must accept Terms & Conditions to continue.");
      return;
    }

    // Ensure user is logged in before proceeding to payment
    if (!isAuthenticated) {
      alert("Please login to continue with payment");
      navigate("/login");
      return;
    }

    // Validate Additional Details section (now mandatory)
    if (!currentAddress || !currentAddress.trim()) {
      alert("Please enter your current address");
      return;
    }

    // All personal details are required
    const { name, phone, email, age, gender } = personalDetails;
    if (!name.trim() || !phone.trim() || !email.trim() || !age || !gender) {
      alert(
        "Please fill all Personal Details (Name, Phone, Email, Age, Gender)"
      );
      return;
    }
    // Validate phone number is exactly 10 digits and starts with 6-9
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Please enter a valid 10-digit Indian mobile number (starting with 6-9)");
      return;
    }

    // Parse car name to extract brand and model
    let brand = car.name;
    let model = "";
    if (car.name.includes("-")) {
      const parts = car.name.split("-");
      brand = parts[0];
      model = parts.slice(1).join(" ");
    } else if (car.name.includes(" ")) {
      const parts = car.name.split(" ");
      brand = parts[0];
      model = parts.slice(1).join(" ");
    }

    const pickupDateStr = formatLocalDate(startDateObj);
    const pickupTimeStr = formatLocalTime(startDateObj);
    const dropDateStr = formatLocalDate(endDateObj);
    const dropTimeStr = formatLocalTime(endDateObj);

    const effectiveCarId = car.id || car._id || id;
    if (!isValidObjectId(effectiveCarId)) {
      alert("This car cannot be booked right now. Please select another car.");
      setSubmitWarning(
        "This demo car cannot be booked. Please choose another car."
      );
      return;
    }

    // Build booking payload for API (use effective adjusted values)
    const bookingPayload = {
      carId: effectiveCarId,
      tripStart: {
        location: car.location || "Pickup location",
        coordinates: {},
        date: pickupDateStr,
        time: pickupTimeStr || "10:00",
      },
      tripEnd: {
        location: car.location || "Drop location",
        coordinates: {},
        date: dropDateStr,
        time: dropTimeStr || "18:00",
      },
      paymentOption: paymentOption || "advance",
      specialRequests: specialRequests || "",
      couponCode: appliedCoupon?.code || null,
      couponDiscount: priceDetails.couponDiscount,
      offerCode: appliedOffer?.code || null,
      offerDiscount: priceDetails.offerDiscount,
      pointsUsed: coinsApplied ? (priceDetails.coinsDiscount || 0) : 0,
      // Additional details for verification and reporting
      bookingPurpose: "personal",
      personalDetails: personalDetails,
      currentAddress: currentAddress || null,
      jobDetails: bookingPurpose === "job" ? jobDetails : null,
      businessDetails: bookingPurpose === "business" ? businessDetails : null,
      studentId: bookingPurpose === "student" ? studentId : null,
      documentPhoto: documentPhoto ? documentPhotoPreview : null,
      addOnServices,
    };

    const amountToPay =
      paymentOption === "advance"
        ? priceDetails.advancePayment
        : priceDetails.finalPrice;

    setIsProcessing(true);

    try {
      const bookingResponse = await bookingService.createBooking(
        bookingPayload
      );
      const booking = bookingResponse?.data?.booking || bookingResponse?.data;
      const bookingId =
        booking?._id ||
        booking?.id ||
        booking?.bookingId ||
        bookingResponse?.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID missing from server response");
      }

      await razorpayService.processBookingPayment({
        bookingId: bookingId.toString(),
        amount: amountToPay,
        description: `Car booking payment - ${brand} ${model}`.trim(),
        name: user?.name || user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || user?.mobile || user?.phoneNumber || "",
        onSuccess: () => {
          // Build a rich booking payload for the confirmation modal / PDF
          const bookingIdFormatted =
            booking?.bookingId ||
            booking?.bookingNumber ||
            `BK${bookingId.toString().slice(-6).toUpperCase()}`;
          const bookingDataForPdf = {
            // Booking core
            bookingId: bookingIdFormatted,
            _id: bookingId.toString(),
            id: bookingId.toString(),
            createdAt: booking?.createdAt || new Date().toISOString(),

            // Car information
            car: {
              id: car.id || car._id,
              _id: car.id || car._id,
              brand: brand || car.brand,
              model: model || car.model,
              name: car.name || `${brand || car.brand} ${model || car.model}`,
              image: car.image || car.images?.[0] || carImg1,
              images: car.images || (car.image ? [car.image] : [carImg1]),
              seats: car.seats || 4,
              seatingCapacity: car.seats || 4,
              transmission: car.transmission || "Automatic",
              fuelType: car.fuelType || "Petrol",
              registrationNumber: car.registrationNumber,
            },

            // Trip details
            pickupDate: pickupDateStr,
            pickupTime: pickupTimeStr,
            dropDate: dropDateStr,
            dropTime: dropTimeStr,

            // Additional details
            bookingPurpose: bookingPayload.bookingPurpose,
            personalDetails: bookingPayload.personalDetails,
            currentAddress: bookingPayload.currentAddress,
            jobDetails: bookingPayload.jobDetails,
            businessDetails: bookingPayload.businessDetails,
            studentId: bookingPayload.studentId,
            addOnServices: bookingPayload.addOnServices,
            specialRequests: bookingPayload.specialRequests,

            // Pricing details
            totalPrice: priceDetails.totalPrice,
            paidAmount: amountToPay,
            remainingAmount:
              (priceDetails.finalPrice || 0) - (amountToPay || 0),
            couponCode: bookingPayload.couponCode,
            couponDiscount: bookingPayload.couponDiscount,
            paymentOption: bookingPayload.paymentOption,
            discount: (priceDetails.discount || 0) + (priceDetails.coinsDiscount || 0),
            offerDiscount: priceDetails.offerDiscount || 0,
            pointsDiscount: priceDetails.coinsDiscount || 0,
            pointsUsed: coinsApplied ? (priceDetails.coinsDiscount || 0) : 0,

            // Add nested pricing object for the PDF generator & active/completed pages compatibility
            pricing: {
              basePrice: priceDetails.basePrice || 0,
              totalPrice: priceDetails.totalPrice || 0,
              advancePayment: priceDetails.advancePayment || 0,
              remainingPayment: priceDetails.remainingPayment || 0,
              weekendMultiplier: priceDetails.weekendMultiplier || 0,
              holidayMultiplier: priceDetails.holidayMultiplier || 0,
              timeOfDayMultiplier: priceDetails.timeOfDayMultiplier || 0,
              demandSurge: priceDetails.demandSurge || 0,
              discount: (priceDetails.discount || 0) + (priceDetails.coinsDiscount || 0),
              couponCode: bookingPayload.couponCode,
              couponDiscount: bookingPayload.couponDiscount,
              offerCode: bookingPayload.offerCode,
              offerDiscount: priceDetails.offerDiscount || 0,
              finalPrice: priceDetails.finalPrice || 0,
              addOnServicesTotal: priceDetails.addOnServicesTotal || 0,
              pointsUsed: coinsApplied ? (priceDetails.coinsDiscount || 0) : 0,
              pointsDiscount: priceDetails.coinsDiscount || 0,
            },

            // Status information
            status: booking?.status || "pending",
            paymentStatus:
              booking?.paymentStatus ||
              (paymentOption === "advance" ? "partial" : "full"),
            tripStatus: booking?.tripStatus || "pending",
          };

          setIsProcessing(false);

          // Save booking to localStorage so it shows up immediately on bookings page
          try {
            const existingBookings = JSON.parse(
              localStorage.getItem("localBookings") || "[]"
            );
            const newBooking = {
              ...bookingDataForPdf,
              // Ensure all required fields for bookings page
              id: bookingId.toString(),
              _id: bookingId.toString(),
            };
            existingBookings.unshift(newBooking); // Add to beginning
            localStorage.setItem(
              "localBookings",
              JSON.stringify(existingBookings)
            );
            console.log("✅ Booking saved to localStorage");
          } catch (error) {
            console.error("Error saving booking to localStorage:", error);
          }

          // Wait a moment for Razorpay modal to fully close, then show our confirmation modal
          setTimeout(() => {
            console.log("🎉 Showing booking confirmation modal now!");
            setConfirmedBookingId(bookingId.toString());
            setConfirmedBookingData(bookingDataForPdf);
            setShowBookingConfirmationModal(true);
          }, 500); // 500ms delay to ensure Razorpay modal is closed
        },
        onError: async (error) => {
          if (error?.message === "PAYMENT_CANCELLED") {
            console.log("ℹ️ Payment cancelled by the user.");
          } else {
            console.error("Payment error:", error);
          }
          setIsProcessing(false);

          if (bookingId) {
            console.log('🔄 Payment cancelled or failed. Cancelling backend booking:', bookingId);
            try {
              await bookingService.updateBookingStatus(bookingId.toString(), {
                status: 'cancelled',
                cancellationReason: error?.message === 'PAYMENT_CANCELLED'
                  ? 'Payment cancelled by user'
                  : `Payment failed: ${error?.message || 'Unknown error'}`
              });
              console.log('✅ Unpaid booking cancelled successfully');
            } catch (cancelError) {
              console.error('❌ Failed to cancel unpaid booking:', cancelError);
            }
          }

          if (error?.message === "PAYMENT_CANCELLED") return;
          alert(error?.message || "Payment failed. Please try again.");
        },
      });
    } catch (err) {
      console.error("Error during booking/payment:", err);
      setIsProcessing(false);

      let serverMessage = err.response?.data?.message || err.message;

      if (err.response?.data?.errors) {
        const errorStrings = err.response.data.errors.map(e => `${e.field}: ${e.message}`).join("\n");
        serverMessage = "Validation errors:\n" + errorStrings;
        console.error("Validation errors array:", err.response.data.errors);
      }

      alert(serverMessage);
      setSubmitWarning(serverMessage);
    }
  };

  if (isCarLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.backgroundTertiary || '#1C205C' }}></div>
          <p className="text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load car details.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative pb-24 md:pb-8"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Header */}
      <CarDetailsHeader />

      {/* Web container - max-width and centered on larger screens */}
      <div className="max-w-4xl mx-auto">
        {/* Car Summary Card - Premium Design */}
        <div className="px-4 md:px-6 lg:px-8 pt-3 md:pt-6 pb-2 md:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-3 shadow-lg border"
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.borderMedium,
            }}
          >
            <div className="flex items-center gap-3">
              {car.image && (
                <div className="flex-shrink-0">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50 p-1.5"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-base mb-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {car.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span
                    className="text-lg font-bold"
                    style={{ color: colors.textPrimary }}
                  >
                    Rs. {extractPrice(car.price || car.pricePerDay || 0)}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    /day
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    {car.seats} Seats
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    {car.transmission}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: colors.backgroundPrimary }}
                  >
                    {car.fuelType}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking Form */}
        <form
          onSubmit={handleSubmit}
          className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 space-y-3 md:space-y-4"
        >
          {/* Date & Time Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-3 shadow-lg"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Pickup & Drop Details
            </h2>

            {/* Pickup Date & Time */}
            <div className="mb-3">
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: colors.textPrimary }}
              >
                Pickup Date & Time
              </label>
              <button
                type="button"
                onClick={() => openDateTimePicker("pickup")}
                className="w-full px-3 py-2.5 rounded-lg border-2 text-left"
                style={{
                  borderColor:
                    pickupDate && pickupTime
                      ? colors.backgroundTertiary
                      : colors.borderMedium,
                  backgroundColor:
                    pickupDate && pickupTime
                      ? colors.backgroundPrimary
                      : colors.backgroundSecondary,
                }}
              >
                <div
                  className="font-semibold text-sm"
                  style={{ color: colors.textPrimary }}
                >
                  {pickupDate && pickupTime
                    ? `${formatDisplayDate(pickupDate)} • ${formatDisplayTime(
                      pickupTime
                    )}`
                    : "Select Pickup Date & Time"}
                </div>
              </button>
            </div>

            {/* Drop Date & Time */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: colors.textPrimary }}
              >
                Drop Date & Time
              </label>
              <button
                type="button"
                onClick={() => openDateTimePicker("drop")}
                className="w-full px-3 py-2.5 rounded-lg border-2 text-left"
                style={{
                  borderColor:
                    dropDate && dropTime
                      ? colors.backgroundTertiary
                      : colors.borderMedium,
                  backgroundColor:
                    dropDate && dropTime
                      ? colors.backgroundPrimary
                      : colors.backgroundSecondary,
                }}
              >
                <div
                  className="font-semibold text-sm"
                  style={{ color: colors.textPrimary }}
                >
                  {dropDate && dropTime
                    ? `${formatDisplayDate(dropDate)} • ${formatDisplayTime(
                      dropTime
                    )}`
                    : "Select Dropoff Date & Time"}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Additional Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.55 }}
            className="rounded-2xl p-4 shadow-lg space-y-4"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2
              className="text-base font-bold"
              style={{ color: colors.textPrimary }}
            >
              Details
            </h2>

            {/* Personal Details Fields */}
            <div
              className="space-y-3 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.backgroundTertiary}10` }}
            >
              <h4
                className="text-xs font-bold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Personal Details
              </h4>

              {/* Name */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: colors.textPrimary }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={personalDetails.name}
                  onChange={(e) =>
                    setPersonalDetails((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter your name"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: colors.textPrimary }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={personalDetails.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPersonalDetails((prev) => ({
                      ...prev,
                      phone: value,
                    }));
                  }}
                  placeholder="Enter your phone number"
                  autoComplete="off"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: colors.textPrimary }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={personalDetails.email}
                  onChange={(e) =>
                    setPersonalDetails((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Enter your email"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Age */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: colors.textPrimary }}
                >
                  Age
                </label>
                <input
                  type="number"
                  value={personalDetails.age}
                  onChange={(e) =>
                    setPersonalDetails((prev) => ({
                      ...prev,
                      age: e.target.value,
                    }))
                  }
                  placeholder="Enter your age"
                  min="18"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: colors.textPrimary }}
                >
                  Gender
                </label>
                <CustomSelect
                  value={personalDetails.gender}
                  onChange={(value) =>
                    setPersonalDetails((prev) => ({ ...prev, gender: value }))
                  }
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" },
                  ]}
                  placeholder="Select gender"
                />
              </div>
            </div>
          </motion.div>

          {/* Add-on Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.55 }}
            className="rounded-2xl p-3 shadow-lg space-y-3"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowAddons(!showAddons)}
            >
              <h2
                className="text-base font-bold"
                style={{ color: colors.textPrimary }}
              >
                Add-on Services (Optional)
              </h2>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${showAddons ? 'rotate-180' : ''}`}
                style={{ color: colors.textPrimary }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showAddons && (
              <div className="space-y-3 pt-2 mt-2 border-t" style={{ borderColor: colors.borderMedium }}>
                {allAddOnServices.map((service) => (
                  <div
                    key={service._id || service.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border-2 gap-3 sm:gap-0"
                    style={{
                      borderColor: colors.borderMedium,
                      backgroundColor: colors.backgroundSecondary,
                    }}
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${colors.backgroundTertiary}15`,
                        }}
                      >
                        <svg
                          className="w-5 h-5"
                          style={{ color: colors.backgroundTertiary }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: colors.textPrimary }}
                        >
                          {service.name}
                        </p>


                        <p
                          className="text-xs font-medium mt-0.5"
                          style={{ color: colors.backgroundTertiary }}
                        >
                          ₹{service.price} per unit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {service.singleUnitOnly ? (
                        <div className="flex items-center gap-3">
                          {(serviceQuantities[service.key] || 0) > 0 && (
                            <span
                              className="text-xs font-semibold mr-2"
                              style={{ color: colors.backgroundTertiary }}
                            >
                              ₹{service.price}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={(serviceQuantities[service.key] || 0) > 0}
                            onChange={(e) => {
                              const newQty = e.target.checked ? 1 : 0;
                              handleServiceQtyChange(service.key, newQty);
                            }}
                            className="w-5 h-5 rounded border-2 transition-all cursor-pointer"
                            style={{ borderColor: (serviceQuantities[service.key] || 0) > 0 ? colors.backgroundTertiary : colors.borderCheckbox }}
                          />
                        </div>
                      ) : (
                        <>
                          {(serviceQuantities[service.key] || 0) > 0 && (
                            <span
                              className="text-xs font-semibold mr-2"
                              style={{ color: colors.backgroundTertiary }}
                            >
                              ₹{(serviceQuantities[service.key] || 0) * service.price}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleServiceQtyChange(service.key, Math.max(0, (serviceQuantities[service.key] || 0) - 1))
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-2"
                            style={{
                              borderColor: colors.borderMedium,
                              color: colors.textPrimary,
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span
                            className="w-8 text-center text-sm font-semibold"
                            style={{ color: colors.textPrimary }}
                          >
                            {serviceQuantities[service.key] || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleServiceQtyChange(service.key, (serviceQuantities[service.key] || 0) + 1)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center border-2"
                            style={{
                              borderColor: colors.borderMedium,
                              color: colors.textPrimary,
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>



          {/* Special Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl p-3 shadow-lg"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Special Requests
            </h2>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or instructions..."
              rows="3"
              className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none resize-none text-sm"
              style={{
                borderColor: colors.borderMedium,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textPrimary,
              }}
            />
          </motion.div>



          {/* Coins Wallet */}
          {availableCoins > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="rounded-2xl p-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%)`, border: '1.5px solid #F6C90E' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#F6C90E' }}>
                    🪙
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#7C5C00' }}>
                      {loadingCoins ? 'Loading...' : `${Math.floor(availableCoins)} Coins Available`}
                    </p>
                    <p className="text-xs" style={{ color: '#A07800' }}>
                      1 Coin = ₹1 Discount
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCoinsApplied(prev => !prev)}
                  className="px-5 py-2 rounded-xl font-bold text-sm transition-all"
                  style={{
                    backgroundColor: coinsApplied ? '#EF4444' : '#F6C90E',
                    color: coinsApplied ? '#fff' : '#7C5C00',
                    boxShadow: coinsApplied ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(246,201,14,0.4)'
                  }}
                >
                  {coinsApplied ? 'Remove' : 'Use'}
                </button>
              </div>
              {coinsApplied && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#F6C90E' }}>
                  <span className="text-xs font-semibold" style={{ color: '#7C5C00' }}>Coins Discount Applied</span>
                  <span className="text-sm font-bold" style={{ color: '#16A34A' }}>-₹{priceDetails.coinsDiscount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Coupon Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-3 shadow-lg"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Coupon Code
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                style={{
                  borderColor: colors.borderMedium,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary,
                  maxWidth: "60%",
                }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-8 py-2 rounded-lg text-white font-semibold text-sm"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                Apply
              </button>
            </div>
            {appliedCoupon && (
              <div
                className="mt-2 py-2 pl-3 pr-2 rounded-lg flex items-center justify-between group"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <div className="flex flex-1 items-center justify-between">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: colors.success }}
                  >
                    {appliedCoupon.code} Applied
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: colors.success }}
                  >
                    -Rs. {priceDetails.couponDiscount.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="ml-3 p-1.5 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer flex-shrink-0"
                  title="Remove coupon"
                >
                  <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>

          {/* Offers Horizontal Carousel / Slider */}
          {activeOffers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="rounded-2xl p-4 shadow-lg overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <h2
                className="text-base font-bold mb-3"
                style={{ color: colors.textPrimary }}
              >
                Special Offers
              </h2>

              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {activeOffers.map((offer) => {
                  const isCurrentApplied = appliedOffer?.code === offer.code;
                  return (
                    <motion.div
                      key={offer._id || offer.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex-shrink-0 w-60 rounded-xl p-4 border-2 flex flex-col justify-between relative transition-all"
                      style={{
                        borderColor: isCurrentApplied ? colors.backgroundTertiary : colors.borderMedium,
                        background: isCurrentApplied
                          ? `linear-gradient(135deg, ${colors.backgroundSecondary} 0%, ${colors.backgroundLight} 100%)`
                          : colors.backgroundSecondary,
                        boxShadow: isCurrentApplied ? "0 4px 15px rgba(0, 0, 0, 0.05)" : "none",
                      }}
                    >
                      <div className="mb-4">
                        <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-1">{offer.title}</h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => isCurrentApplied ? handleRemoveOffer() : handleApplyOffer(offer.code)}
                        className="w-full py-2 rounded-lg text-xs font-bold transition-all text-center"
                        style={{
                          backgroundColor: isCurrentApplied ? "#F3E8FF" : colors.backgroundTertiary,
                          color: isCurrentApplied ? "#6B21A8" : colors.textWhite,
                        }}
                      >
                        {isCurrentApplied ? "Remove Offer" : "Apply Offer"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Price Summary */}
          {priceDetails.totalDays > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl p-4 shadow-xl"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              <h2
                className="text-base font-bold mb-3"
                style={{ color: colors.backgroundSecondary }}
              >
                Price Summary
              </h2>
              <div className="space-y-1.5 mb-3">
                <div
                  className="flex justify-between text-sm"
                  style={{ color: colors.backgroundSecondary, opacity: 0.9 }}
                >
                  <span>Base Price ({priceDetails.totalDays} days)</span>
                  <span className="font-semibold">
                    Rs. {formatDecimal(priceDetails.totalPrice - (priceDetails.addOnServicesTotal || 0))}
                  </span>
                </div>
                {priceDetails.addOnServicesTotal > 0 && (
                  <div
                    className="flex justify-between text-sm"
                    style={{ color: colors.backgroundSecondary, opacity: 0.9 }}
                  >
                    <span>Add-on Services</span>
                    <span className="font-semibold">
                      Rs. {priceDetails.addOnServicesTotal}
                    </span>
                  </div>
                )}
                {priceDetails.couponDiscount > 0 && (
                  <div
                    className="flex justify-between text-sm"
                    style={{ color: colors.backgroundSecondary, opacity: 0.9 }}
                  >
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span
                      className="font-semibold"
                      style={{ color: colors.success }}
                    >
                      -Rs. {formatDecimal(priceDetails.couponDiscount)}
                    </span>
                  </div>
                )}
                {priceDetails.offerDiscount > 0 && (
                  <div
                    className="flex justify-between text-sm"
                    style={{ color: colors.backgroundSecondary, opacity: 0.9 }}
                  >
                    <span>Offer ({appliedOffer?.title || appliedOffer?.code})</span>
                    <span
                      className="font-semibold"
                      style={{ color: colors.success }}
                    >
                      -Rs. {formatDecimal(priceDetails.offerDiscount)}
                    </span>
                  </div>
                )}
                {priceDetails.coinsDiscount > 0 && (
                  <div
                    className="flex justify-between text-sm"
                    style={{ color: colors.backgroundSecondary, opacity: 0.9 }}
                  >
                    <span>🪙 Coins Discount</span>
                    <span className="font-semibold" style={{ color: '#FACC15' }}>
                      -Rs. {formatDecimal(priceDetails.coinsDiscount)}
                    </span>
                  </div>
                )}
                <div
                  className="border-t pt-1.5 mt-1.5"
                  style={{ borderColor: colors.overlayWhiteLight }}
                >
                  <div
                    className="flex justify-between font-bold"
                    style={{ color: colors.backgroundSecondary }}
                  >
                    <span className="text-base">Total Amount</span>
                    <span className="text-base">
                      Rs. {formatDecimal(priceDetails.finalPrice)}
                    </span>
                  </div>
                </div>
                {paymentOption === "advance" && (
                  <div
                    className="mt-2 pt-2 border-t"
                    style={{ borderColor: colors.overlayWhiteLight }}
                  >
                    <div
                      className="flex justify-between mb-0.5 text-xs"
                      style={{
                        color: colors.backgroundSecondary,
                        opacity: 0.9,
                      }}
                    >
                      <span>Advance Payment ({advancePercentage}%)</span>
                      <span className="font-semibold">
                        Rs. {formatDecimal(priceDetails.advancePayment)}
                      </span>
                    </div>
                    <div
                      className="flex justify-between text-xs"
                      style={{
                        color: colors.backgroundSecondary,
                        opacity: 0.9,
                      }}
                    >
                      <span>Remaining Amount</span>
                      <span className="font-semibold">
                        Rs. {formatDecimal(priceDetails.remainingPayment)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Payment Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-3 shadow-lg"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Payment Option
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPaymentOption("advance")}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${paymentOption === "advance" ? "shadow-md" : ""
                  }`}
                style={{
                  borderColor:
                    paymentOption === "advance"
                      ? colors.backgroundTertiary
                      : colors.borderMedium,
                  backgroundColor:
                    paymentOption === "advance"
                      ? colors.backgroundPrimary
                      : colors.backgroundSecondary,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className="font-bold text-sm mb-0.5"
                      style={{ color: colors.textPrimary }}
                    >
                      {advancePercentage}% Advance Payment
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Pay {advancePercentage}% now, rest later
                    </div>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor:
                        paymentOption === "advance"
                          ? colors.backgroundTertiary
                          : colors.borderCheckbox,
                    }}
                  >
                    {paymentOption === "advance" && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      ></div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Physical Document Verification Notice */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.55 }}
            className="rounded-2xl p-4 shadow-lg"
            style={{
              backgroundColor: "#FFF3E0",
              border: "1px solid #FFE0B2",
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              {/* Warning Icon */}
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: "#FF9800" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3
                  className="text-sm font-bold mb-2"
                  style={{ color: "#333" }}
                >
                  Important: Physical Document Verification Required
                </h3>
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{ color: "#333" }}
                >
                  Your booking will only be confirmed and finalized when you
                  physically visit our office to complete document verification.
                  This step is mandatory before you can start your trip.
                </p>
                <div className="flex items-start gap-2">
                  {/* Warning Icon */}
                  <svg
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: "#FF9800" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p
                    className="text-xs leading-relaxed font-semibold"
                    style={{ color: "#FF9800" }}
                  >
                    If you fail to complete physical document verification, 30%
                    of the paid amount will be refunded and the booking will be
                    cancelled.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terms & Conditions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex items-start gap-2"
          >
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-2"
              style={{
                borderColor: agreeToTerms
                  ? colors.backgroundTertiary
                  : colors.borderCheckbox,
              }}
            />
            <div
              className="text-xs mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              I agree to the{" "}
              <Link
                to="/terms"
                className="font-semibold hover:underline cursor-pointer"
                style={{ color: colors.textPrimary }}
              >
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy-policy"
                className="font-semibold hover:underline cursor-pointer"
                style={{ color: colors.textPrimary }}
              >
                Privacy Policy
              </Link>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={
              isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5, delay: 0.7 }}
            type="submit"
            className="w-full py-3 rounded-xl text-white font-bold text-base shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.backgroundTertiary }}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Proceed to Payment"}
          </motion.button>
          {submitWarning && (
            <p className="mt-3 text-sm text-red-500 text-center">
              {submitWarning}
            </p>
          )}
        </form>
      </div>

      {/* Combined Date-Time Picker Modal */}
      {isDateTimePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsDateTimePickerOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <div className="p-4">
              {/* Time Selection Button */}
              <div className="mb-4">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Time
                </label>
                {/* Time Button - Clickable to edit time */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimePickerMode("hour");
                      setIsTimePickerOpen(true);
                    }}
                    className="w-auto px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      borderColor: colors.backgroundTertiary,
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.backgroundSecondary,
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-semibold text-sm">
                      {selectedHour.toString().padStart(2, "0")} :{" "}
                      {selectedMinute.toString().padStart(2, "0")}{" "}
                      {selectedPeriod}
                    </span>
                  </button>
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const newMonth = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() - 1,
                        1
                      );
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h4
                    className="text-base font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {calendarMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <button
                    onClick={() => {
                      const newMonth = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() + 1,
                        1
                      );
                      setCalendarMonth(newMonth);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold py-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {day}
                      </div>
                    )
                  )}
                  {getCalendarDays().map((date, idx) => {
                    if (!date) return <div key={idx}></div>;
                    // Use local date components for comparison to avoid timezone issues
                    const dateStr = formatLocalDate(date);
                    const dateYear = date.getFullYear();
                    const dateMonth = date.getMonth();
                    const dateDay = date.getDate();

                    // Check if this date is selected - compare using date components
                    let isSelected = false;
                    if (calendarSelectedDate) {
                      const selectedYear = calendarSelectedDate.getFullYear();
                      const selectedMonth = calendarSelectedDate.getMonth();
                      const selectedDay = calendarSelectedDate.getDate();
                      isSelected =
                        dateYear === selectedYear &&
                        dateMonth === selectedMonth &&
                        dateDay === selectedDay;
                    }

                    // Check if date is in the past (compare dates, not times)
                    const today = new Date();
                    const todayYear = today.getFullYear();
                    const todayMonth = today.getMonth();
                    const todayDay = today.getDate();
                    const isPast =
                      dateYear < todayYear ||
                      (dateYear === todayYear && dateMonth < todayMonth) ||
                      (dateYear === todayYear &&
                        dateMonth === todayMonth &&
                        dateDay < todayDay);
                    const isMinDate = dateStr === getMinDate();
                    const isCurrentMonth =
                      dateMonth === calendarMonth.getMonth();

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isPast && isCurrentMonth) {
                            // Ensure date is at noon to avoid timezone issues
                            const selectedDate = new Date(
                              dateYear,
                              dateMonth,
                              dateDay,
                              12,
                              0,
                              0
                            );
                            setCalendarSelectedDate(selectedDate);
                          }
                        }}
                        disabled={isPast && !isMinDate}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${isSelected
                          ? "text-white"
                          : isPast && !isMinDate
                            ? "cursor-not-allowed"
                            : !isCurrentMonth
                              ? "opacity-40"
                              : "hover:bg-gray-100"
                          }`}
                        style={{
                          backgroundColor: isSelected
                            ? colors.backgroundTertiary
                            : "transparent",
                          color: isSelected
                            ? colors.backgroundSecondary
                            : isPast && !isMinDate
                              ? colors.borderCheckbox
                              : colors.textPrimary,
                        }}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDateTimePickerOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm"
                  style={{
                    borderColor: colors.backgroundTertiary,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDateTimePickerDone}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Time Picker Modal - Opens when clicking clock icon */}
      {isTimePickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={() => setIsTimePickerOpen(false)}
          />

          {/* Time Picker Modal */}
          <div
            className="fixed z-[110] shadow-2xl bg-white rounded-2xl"
            style={{
              width: "320px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pt-4 px-6 mb-2 mt-2">
              <h3
                className="text-[10px] font-bold text-gray-500 tracking-wider mb-4 uppercase"
              >
                Select Time
              </h3>

              <div className="flex items-center justify-center gap-1">
                {/* Hour */}
                <div
                  onClick={() => setTimePickerMode('hour')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'hour' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {selectedHour}
                </div>

                <span className="text-5xl font-light text-[#1c1b1f] mx-1 pb-2">:</span>

                {/* Minute */}
                <div
                  onClick={() => setTimePickerMode('minute')}
                  className={`flex items-center justify-center w-[84px] h-[84px] rounded-lg text-5xl font-light cursor-pointer transition-colors ${timePickerMode === 'minute' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-[#e5e7eb] text-[#1c1b1f] hover:bg-gray-300'}`}
                >
                  {String(selectedMinute).padStart(2, '0')}
                </div>

                {/* AM/PM */}
                <div className="flex flex-col ml-2 border border-[#79747E] rounded-md overflow-hidden">
                  <button
                    onClick={() => setSelectedPeriod('am')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'am' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'} border-b border-[#79747E]`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('pm')}
                    className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'pm' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'}`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Clock Face */}
            <div className="px-6 py-6 flex justify-center mt-2">
              <div className="relative w-64 h-64 bg-[#e5e7eb] rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#4F378B] rounded-full absolute z-10"></div>
                {/* Draw clock numbers and hand */}
                {(() => {
                  const items = timePickerMode === 'hour'
                    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                  const radius = 104; // Radius of numbers circle
                  const cx = 128;
                  const cy = 128;

                  const selectedVal = timePickerMode === 'hour' ? selectedHour : selectedMinute;

                  // For minutes not exactly on a 5-minute mark, find closest angle
                  let angleDegrees = 0;
                  if (timePickerMode === 'hour') {
                    angleDegrees = (selectedVal % 12) * 30;
                  } else {
                    angleDegrees = selectedVal * 6;
                  }

                  const angleRad = (angleDegrees - 90) * (Math.PI / 180);
                  const handX = cx + radius * Math.cos(angleRad);
                  const handY = cy + radius * Math.sin(angleRad);

                  return (
                    <>
                      {/* Clock Hand Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        <line x1="128" y1="128" x2={handX} y2={handY} stroke="#4F378B" strokeWidth="2" />
                      </svg>
                      {/* Clock Selected Circle Background */}
                      <div
                        className="absolute w-10 h-10 bg-[#4F378B] rounded-full z-0 pointer-events-none"
                        style={{
                          left: `${handX - 20}px`,
                          top: `${handY - 20}px`,
                        }}
                      ></div>

                      {/* Clock Numbers */}
                      {items.map((val, i) => {
                        const valAngle = (i * 30 - 90) * (Math.PI / 180);
                        const x = cx + radius * Math.cos(valAngle);
                        const y = cy + radius * Math.sin(valAngle);
                        const isSelected = selectedVal === val;

                        return (
                          <div
                            key={val}
                            onClick={() => {
                              if (timePickerMode === 'hour') {
                                setSelectedHour(val === 0 ? 12 : val);
                                setTimePickerMode('minute'); // Auto switch to minute
                              } else {
                                setSelectedMinute(val);
                              }
                            }}
                            className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center rounded-full cursor-pointer text-base z-10 transition-colors ${isSelected ? 'text-white' : 'text-[#1c1b1f] hover:bg-gray-300'}`}
                            style={{ left: `${x}px`, top: `${y}px` }}
                          >
                            {timePickerMode === 'minute' ? String(val).padStart(2, '0') : val}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center px-6 pb-4 pt-2">
              {/* Keyboard Icon */}
              <svg className="w-5 h-5 text-[#49454f] cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,5H4C2.895,5,2,5.895,2,7v10c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V7C22,5.895,21.105,5,20,5z M11,8h2v2h-2V8z M11,11h2v2h-2V11z M8,8h2v2H8V8z M8,11h2v2H8V11z M5,8h2v2H5V8z M5,11h2v2H5V11z M16,16H8v-2h8V16z M14,11h2v2h-2V11z M14,8h2v2h-2V8z M17,11h2v2h-2V11z M17,8h2v2h-2V8z" />
              </svg>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingConfirmationModal && (
        <BookingConfirmationModal
          bookingId={confirmedBookingId}
          bookingData={confirmedBookingData}
          onClose={() => {
            console.log("onclose function called")
            setShowBookingConfirmationModal(false);
            setConfirmedBookingId(null);
            setConfirmedBookingData(null);
          }}
        />
      )}
    </div>
  );
};

export default BookNowPage;
