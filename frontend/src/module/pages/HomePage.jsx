import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Keyboard, Mousewheel, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Header from "../components/layout/Header";
import BottomNavbar from "../components/layout/BottomNavbar";
import BrandCard from "../components/common/BrandCard";
import CarCard from "../components/common/CarCard";
import BannerAd from "../../components/common/BannerAd";

import CouponCarBanner from "../components/common/CouponCarBanner";
import ReturningCarBanner from "../components/common/ReturningCarBanner";
import { colors } from "../theme/colors";
import { useAppSelector } from "../../hooks/redux";
import { carService } from "../../services/car.service";
import { commonService } from "../../services/common.service";
import { bannerService } from "../../services/banner.service";

// Import car images
import carImg1 from "../../assets/car_img1-removebg-preview.png";
import carImg4 from "../../assets/car_img4-removebg-preview.png";
import carImg5 from "../../assets/car_img5-removebg-preview.png";
import carImg6 from "../../assets/car_img6-removebg-preview.png";
import carImg8 from "../../assets/car_img8.png";

// Brand logos for fallback mapping
import logoToyota from "../../assets/car_logo2_PNG.png";
import logoHyundai from "../../assets/car_logo6_PNG.png";
import logoKia from "../../assets/car_logo1_PNG1.png";
import logoLandRover from "../../assets/car_logo15.png";
import logoBMW from "../../assets/car_logo11_PNG.png";
import logoAudi from "../../assets/car_logo10_PNG.png";
import logoSuzuki from "../../assets/car_logo2_PNG.png";
import logoMahindra from "../../assets/car_logo9_PNG.png";
import logoVolvo from "../../assets/car_logo7_PNG.png";
import logoSkoda from "../../assets/car_logo8_PNG.png";
import logoJaguar from "../../assets/car_logo14_PNG.png";
// External logos for brands missing local assets
const logoHonda =
  "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda-logo.png";
const logoNissan =
  "https://upload.wikimedia.org/wikipedia/commons/3/3e/Nissan_logo.png";

// Import web banner image (kept static by requirement)
import web_banImg2 from "../../assets/web_banImg2.png";

// Import hero car images
import heroCar1 from "../../assets/hero/images-removebg-preview.png";
import heroCar2 from "../../assets/hero/images-removebg-preview(1).png";
import heroCar3 from "../../assets/hero/images-removebg-preview(2).png";
import driveonLogo from "../../assets/driveon-logo.png";

// Import mobile view image
import mobileViewImg1 from "../../assets/mobile_viewImg1.png";
import mobileViewImg2 from "../../assets/mobile_viewImg2.png";
import downloadRemoveBgPreview from "../../assets/download-removebg-preview.png";

/**
 * HomePage Component - Exact match to design
 * Mobile-first design with exact layout from image
 */
const HomePage = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  // const [headerHeight, setHeaderHeight] = useState(100); // Removed to use CSS var for performance
  const [showCouponBanner, setShowCouponBanner] = useState(false);

  // Swiper refs for programmatic control
  const mobileBannerSwiperRef = useRef(null);
  const bannerCarouselSwiperRef = useRef(null);
  const heroBannerSwiperRef = useRef(null);

  // Get authentication state
  const { isAuthenticated, isInitializing } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Helper to read from localStorage safely
  const getCachedData = (key, fallback) => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const cachedBestCars = getCachedData('driveon_best_cars', []);
  const cachedNearbyCars = getCachedData('driveon_nearby_cars', []);
  const cachedBrands = getCachedData('driveon_brands', []);
  const cachedFaqs = getCachedData('driveon_faqs', []);
  const cachedFeaturedCar = getCachedData('driveon_featured_car', null);
  const cachedPromoBanner = getCachedData('driveon_promo_banner', { title: "", subtitle: "" });
  const cachedBannerOverlay = getCachedData('driveon_banner_overlay', { title: "", subtitle: "" });
  const cachedActiveBanners = getCachedData('driveon_active_banners', []);

  // Cars state - fetched from API
  const [bestCars, setBestCars] = useState(cachedBestCars);
  const [nearbyCars, setNearbyCars] = useState(cachedNearbyCars);
  const [carsLoading, setCarsLoading] = useState(cachedBestCars.length === 0);

  // Dynamic data states
  const [brands, setBrands] = useState(cachedBrands);
  const [heroBanners, setHeroBanners] = useState([
    {
      gradient: "linear-gradient(135deg, #f8f8f8, #d0d4d7)",
      title: "Easy Rentals,",
      subtitle: "Anywhere You Go.",
      cta: "Find Perfect Car To DriveOn",
    }
  ]);
  const [faqs, setFaqs] = useState(cachedFaqs);
  const [dataLoading, setDataLoading] = useState(cachedBrands.length === 0);

  // Featured car for AVAILABLE section
  const [featuredCar, setFeaturedCar] = useState(cachedFeaturedCar);

  // Active Banners state
  const [activeBanners, setActiveBanners] = useState(cachedActiveBanners);

  // Promotional banner data
  const [promotionalBanner, setPromotionalBanner] = useState(cachedPromoBanner);

  // Banner overlay text
  const [bannerOverlay, setBannerOverlay] = useState(cachedBannerOverlay);

  // Date picker states
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);
  const [calendarTarget, setCalendarTarget] = useState(null); // 'pickup' | 'dropoff'
  const [timePickerTarget, setTimePickerTarget] = useState(null); // 'pickup' | 'dropoff'
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('am');
  const [timePickerMode, setTimePickerMode] = useState('hour'); // 'hour' or 'minute'
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const heroCars = [
    {
      id: 1,
      name: "Land Rover Defender",
      image: heroCar1,
    },
    {
      id: 2,
      name: "Bentley Bentayga",
      image: heroCar2,
    },
    {
      id: 3,
      name: "Porsche 911 Turbo",
      image: heroCar3,
    },
  ];

  // Calendar helper functions
  const openCalendar = (target) => {
    setCalendarTarget(target);
    const currentDate = target === "pickup" ? pickupDate : dropoffDate;
    if (currentDate) {
      const date = new Date(currentDate);
      setCalendarSelectedDate(date);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setCalendarSelectedDate(null);
      setCalendarMonth(new Date());
    }
    setIsCalendarOpen(true);
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handleDateSelect = (date) => {
    setCalendarSelectedDate(date);
    // Format date as YYYY-MM-DD using local timezone to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    if (calendarTarget === "pickup") {
      setPickupDate(dateStr);
      if (dropoffDate && new Date(dropoffDate) < date) {
        setDropoffDate("");
      }
    } else {
      setDropoffDate(dateStr);
    }

    // Save dates to localStorage for auto-fill in car details page
    try {
      const dates = {
        pickupDate: calendarTarget === "pickup" ? dateStr : pickupDate,
        pickupTime: pickupTime,
        dropDate: calendarTarget === "dropoff" ? dateStr : dropoffDate,
        dropTime: dropoffTime,
      };
      localStorage.setItem('selectedBookingDates', JSON.stringify(dates));
    } catch (error) {
      console.error('Error saving dates to localStorage:', error);
    }

    setIsCalendarOpen(false);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "dd/mm/yyyy";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeDisplay = (timeString) => {
    if (!timeString) return "hh:mm";
    return timeString;
  };

  const openTimePicker = (target) => {
    setTimePickerTarget(target);
    const currentTime = target === "pickup" ? pickupTime : dropoffTime;
    if (currentTime) {
      const [time, period] = currentTime.split(' ');
      if (time) {
        const [hour, minute] = time.split(':');
        setSelectedHour(parseInt(hour) || 10);
        setSelectedMinute(parseInt(minute) || 30);
        setSelectedPeriod(period || 'am');
      }
    }
    setIsTimePickerOpen(true);
  };

  const handleTimeSelect = () => {
    const formattedTime = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`;
    // Convert to 24-hour format for storage (HH:mm)
    let hour24 = selectedHour;
    if (selectedPeriod === 'pm' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'am' && selectedHour === 12) {
      hour24 = 0;
    }
    const time24Format = `${String(hour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;

    if (timePickerTarget === "pickup") {
      setPickupTime(formattedTime);
    } else if (timePickerTarget === "dropoff") {
      setDropoffTime(formattedTime);
    }

    // Save dates to localStorage for auto-fill in car details page
    try {
      // Get current times in 24-hour format
      let currentPickupTime24 = '';
      let currentDropoffTime24 = '';

      if (timePickerTarget === "pickup") {
        currentPickupTime24 = time24Format;
        // Convert existing dropoff time if available
        if (dropoffTime) {
          const [time, period] = dropoffTime.split(' ');
          if (time && period) {
            const [hour, minute] = time.split(':');
            let hour24 = parseInt(hour);
            if (period === 'pm' && hour24 !== 12) {
              hour24 = hour24 + 12;
            } else if (period === 'am' && hour24 === 12) {
              hour24 = 0;
            }
            currentDropoffTime24 = `${String(hour24).padStart(2, '0')}:${minute}`;
          }
        }
      } else {
        currentDropoffTime24 = time24Format;
        // Convert existing pickup time if available
        if (pickupTime) {
          const [time, period] = pickupTime.split(' ');
          if (time && period) {
            const [hour, minute] = time.split(':');
            let hour24 = parseInt(hour);
            if (period === 'pm' && hour24 !== 12) {
              hour24 = hour24 + 12;
            } else if (period === 'am' && hour24 === 12) {
              hour24 = 0;
            }
            currentPickupTime24 = `${String(hour24).padStart(2, '0')}:${minute}`;
          }
        }
      }

      const dates = {
        pickupDate: pickupDate,
        pickupTime: currentPickupTime24,
        dropDate: dropoffDate,
        dropTime: currentDropoffTime24,
      };
      localStorage.setItem('selectedBookingDates', JSON.stringify(dates));
    } catch (error) {
      console.error('Error saving dates to localStorage:', error);
    }

    setIsTimePickerOpen(false);
  };

  // Static hero car image - always use the Audi image (as requested)
  const heroImage = web_banImg2;

  const getLogoUrl = (logo) => {
    if (!logo || typeof logo !== "string") return logo || "";
    if (logo.startsWith("http") || logo.startsWith("data:")) return logo;
    // If it's an imported asset (starts with /assets or /src hashed path), return as-is
    if (logo.startsWith("/")) return logo;
    const base = import.meta.env.VITE_API_BASE_URL || "";
    return `${base}${logo.startsWith("/") ? "" : "/"}${logo}`;
  };

  const brandLogoMap = {
    toyota: logoToyota,
    hyundai: logoHyundai,
    kia: logoKia,
    "land rover": logoLandRover,
    landrover: logoLandRover,
    bmw: logoBMW,
    audi: logoAudi,
    suzuki: logoSuzuki,
    maruti: logoSuzuki,
    "maruti suzuki": logoSuzuki,
    mahindra: logoMahindra,
    volvo: logoVolvo,
    skoda: logoSkoda,
    jaguar: logoJaguar,
    honda: logoHonda,
    nissan: logoNissan,
    "swift": logoSuzuki,
    "swift dzire": logoSuzuki,
    "alto": logoSuzuki,
    "alto 800": logoSuzuki,
    "xuv500": logoMahindra,
    xuv: logoMahindra,
  };

  // Determine best-fit logo when API doesn't supply one or gives a model name
  const resolveBrandLogo = (name = "") => {
    const normalized = name.toLowerCase().trim();
    if (!normalized) return "";

    if (brandLogoMap[normalized]) return brandLogoMap[normalized];

    const includeMap = [
      {
        keywords: ["suzuki", "maruti", "swift", "dzire", "desire", "dezire", "alto", "baleno", "wagon", "celerio", "ertiga"],
        logo: logoSuzuki,
      },
      { keywords: ["hyundai", "creta", "i20", "grand i10", "venue", "verna"], logo: logoHyundai },
      { keywords: ["toyota", "innova", "fortuner", "glanza", "hycross", "hyryder"], logo: logoToyota },
      { keywords: ["mahindra", "xuv", "bolero", "scorpio", "thar"], logo: logoMahindra },
      { keywords: ["kia", "seltos", "sonet", "carens"], logo: logoKia },
      { keywords: ["land rover", "range rover", "landrover"], logo: logoLandRover },
      { keywords: ["bmw"], logo: logoBMW },
      { keywords: ["audi"], logo: logoAudi },
      { keywords: ["volvo"], logo: logoVolvo },
      { keywords: ["skoda"], logo: logoSkoda },
      { keywords: ["jaguar"], logo: logoJaguar },
      { keywords: ["honda"], logo: logoHonda },
      { keywords: ["nissan"], logo: logoNissan },
    ];

    for (const { keywords, logo } of includeMap) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        return logo;
      }
    }

    return "";
  };

  // Fetch brands, hero banners, and FAQs from API
  // Data fetching logic moved to unified effect at the bottom to prevent double-rendering


  // Auto-rotate hero banner - Disabled as per requirement to keep static "Easy Rentals" banner
  // useEffect(() => {
  //   if (!heroBanners.length) return;

  //   const interval = setInterval(() => {
  //     setCurrentHeroIndex((prevIndex) =>
  //       prevIndex + 1 < heroBanners.length ? prevIndex + 1 : 0
  //     );
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [heroBanners]);

  const currentHero = heroBanners[currentHeroIndex] || {};
  const heroTitle = currentHero.title || "";
  const heroSubtitle = currentHero.subtitle || "";
  const heroCta = currentHero.cta || "";
  const heroGradient = currentHero.gradient || colors.gradientPrimary;

  // Fallback car images
  const fallbackCarImages = [carImg1, carImg6, carImg8, carImg4, carImg5];

  // Transform API car data to CarCard format
  const transformCarData = (car, index = 0) => {
    if (!car) return null;

    // Extract all images from images array (same as admin side)
    let carImages = [];
    let carImage = fallbackCarImages[index % fallbackCarImages.length];

    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      // Extract all image URLs (same as admin side)
      carImages = car.images
        .map(img => {
          if (typeof img === 'string') return img;
          return img?.url || img?.path || null;
        })
        .filter(Boolean);

      // Remove duplicates
      carImages = [...new Set(carImages)];

      // Find primary image first, otherwise use first image
      const primaryImage = car.images.find(img => img.isPrimary);
      carImage = primaryImage ? (primaryImage.url || primaryImage.path || primaryImage) : (carImages[0] || carImage);
    } else if (car.primaryImage) {
      carImage = car.primaryImage;
      carImages = [car.primaryImage];
    } else {
      carImages = [carImage];
    }

    // Return all images (same as admin side)
    return {
      id: car._id || car.id,
      name: `${car.brand} ${car.model}`,
      brand: car.brand,
      model: car.model,
      image: carImage,
      images: carImages, // All images array (same as admin side)
      rating: car.averageRating ? car.averageRating.toFixed(1) : "5.0",
      location: car.location?.city || car.location?.address || "Location TBD",
      seats: car.seatingCapacity || car.seats || 5,
      price: car.pricePerDay || 0,
      pricePerDay: car.pricePerDay || 0,
    };
  };

  // Fetch data with background updates
  useEffect(() => {
    // 1. Fetch Brands
    const fetchBrands = async () => {
      try {
        const response = await carService.getTopBrands({ limit: 10 });
        const apiBrands = (response.success && response.data?.brands ? response.data.brands : [])
          .map((brand, idx) => {
            const name = (brand.name || brand.brand || brand.model || "").trim();
            const fallbackLogo = resolveBrandLogo(name);
            const rawLogo = brand.logo || brand.brandLogo || brand.logoUrl || brand.image || fallbackLogo || "";
            const mappedLogo = getLogoUrl(rawLogo);
            return {
              id: brand._id || brand.id || name || idx,
              name,
              logo: mappedLogo || fallbackLogo,
              fallbackLogo,
            };
          })
          .filter((b) => b.name);

        setBrands(apiBrands);
        localStorage.setItem('driveon_brands', JSON.stringify(apiBrands));
      } catch (e) {
        console.error('Error processing brands:', e);
      } finally {
        setDataLoading(false);
      }
    };

    // 2. Fetch FAQs
    const fetchFaqs = async () => {
      try {
        const response = await commonService.getFAQs();
        if (response.success && response.data?.faqs?.length > 0) {
          setFaqs(response.data.faqs);
          localStorage.setItem('driveon_faqs', JSON.stringify(response.data.faqs));
        }
      } catch (e) {
        console.error('Error fetching FAQs:', e);
      }
    };

    // 3. Fetch Featured Car
    const fetchFeatured = async () => {
      try {
        const response = await carService.getCars({ limit: 1, isFeatured: true, status: 'active', isAvailable: true });
        let car = null;
        if (response.success && response.data?.cars?.length > 0) {
          car = response.data.cars[0];
        } else {
          // Fallback
          const fallbackResponse = await carService.getCars({ limit: 1, status: 'active', isAvailable: true });
          if (fallbackResponse.success && fallbackResponse.data?.cars?.length > 0) {
            car = fallbackResponse.data.cars[0];
          }
        }
        if (car) {
          const transformed = transformCarData(car, 0);
          setFeaturedCar(transformed);
          localStorage.setItem('driveon_featured_car', JSON.stringify(transformed));
        }
      } catch (e) {
        console.error('Error fetching featured car:', e);
      }
    };

    // Fetch Active Banners
    const fetchActiveBanners = async () => {
      try {
        const response = await bannerService.getActiveBanners();
        if (response.success && response.data?.banners) {
          setActiveBanners(response.data.banners);
          localStorage.setItem('driveon_active_banners', JSON.stringify(response.data.banners));
        }
      } catch (e) {
        console.error('Error fetching active banners:', e);
      }
    };

    // 4. Fetch Promotional Banner
    const fetchPromoBanner = async () => {
      try {
        const response = await commonService.getPromotionalBanner();
        if (response.success && response.data) {
          const promoData = {
            title: response.data.title || "",
            subtitle: response.data.subtitle || "",
          };
          setPromotionalBanner(promoData);
          localStorage.setItem('driveon_promo_banner', JSON.stringify(promoData));
        }
      } catch (e) {
        console.error('Error fetching promotional banner:', e);
      }
    };

    // 5. Fetch Banner Overlay
    const fetchBannerOverlayData = async () => {
      try {
        const response = await commonService.getBannerOverlay();
        if (response.success && response.data) {
          const overlayData = {
            title: response.data.title || "",
            subtitle: response.data.subtitle || "",
          };
          setBannerOverlay(overlayData);
          localStorage.setItem('driveon_banner_overlay', JSON.stringify(overlayData));
        }
      } catch (e) {
        console.error('Error fetching banner overlay:', e);
      }
    };

    // 6. Fetch Latest/Best/Nearby Cars
    const fetchLatestCars = async () => {
      try {
        const [bestResponse, nearbyResponse] = await Promise.all([
          carService.getCars({ isFeatured: true, status: 'active', isAvailable: true, limit: 100 }),
          carService.getCars({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc', status: 'active', isAvailable: true })
        ]);

        let bestCarsData = [];
        if (bestResponse.success && bestResponse.data?.cars) {
          bestCarsData = bestResponse.data.cars.map((car, index) => transformCarData(car, index));
        }

        let nearbyCarsData = [];
        if (nearbyResponse.success && nearbyResponse.data?.cars) {
          const bestCarIds = new Set(bestCarsData.map(c => c.id));
          nearbyCarsData = nearbyResponse.data.cars
            .filter(car => !bestCarIds.has(car._id || car.id))
            .slice(0, 5)
            .map((car, index) => transformCarData(car, index + bestCarsData.length));
        }

        setBestCars(bestCarsData);
        setNearbyCars(nearbyCarsData);

        localStorage.setItem('driveon_best_cars', JSON.stringify(bestCarsData));
        localStorage.setItem('driveon_nearby_cars', JSON.stringify(nearbyCarsData));
      } catch (e) {
        console.error('Error fetching latest cars:', e);
      } finally {
        setCarsLoading(false);
      }
    };

    // Run all fetches in parallel
    fetchBrands();
    fetchFaqs();
    fetchFeatured();
    fetchActiveBanners();
    fetchPromoBanner();
    fetchBannerOverlayData();
    fetchLatestCars();
  }, []);

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Header - Only visible on mobile - Sticky at top */}
      <div className="md:hidden">
        <Header />
      </div>

      {/* Web Header hidden on desktop per user request */}


      {/* Web Hero Section - Only visible on web (Screen-fit 100vh) */}
      <div
        className="hidden md:flex flex-col justify-between relative w-full h-screen min-h-screen overflow-hidden"
        style={{
          background: heroGradient,
        }}
      >
        {/* Top Header Row with Logo */}
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 pt-6 lg:pt-8 pb-2 z-20">
          <Link to="/" className="inline-block transition-transform duration-300 hover:scale-105">
            <img
              src={driveonLogo}
              alt="DriveOn Logo"
              className="h-12 md:h-14 lg:h-16 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        {/* Center Content Container */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 xl:px-12 relative flex-1 flex items-center justify-between w-full gap-8 lg:gap-12 xl:gap-16 z-10">
          {/* Left Side - Text Content & Actions */}
          <div className="hero-content flex-1 max-w-[50%] z-10 py-4">
            {/* Premium Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C205C]/8 border border-[#1C205C]/15 mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-[#1C205C]">
                Premium Self-Drive Rentals
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-extrabold mb-3 leading-[1.12] tracking-tight transition-all duration-700 ease-in-out text-[#1C205C]"
            >
              Easy Rentals,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1C205C] via-[#2A3590] to-[#0284c7]">
                Anywhere You Go.
              </span>
            </h1>

            {/* Tagline / Subtitle */}
            <p className="text-base lg:text-lg text-gray-600 max-w-lg mb-6 leading-relaxed">
              Book verified, immaculate cars for every journey. Fast digital KYC, doorstep delivery, and 24/7 roadside assistance.
            </p>

          </div>

        {/* Right Side - Auto-sliding Cars with Showroom Lighting */}
        <div className="flex-1 flex items-center justify-center h-full relative min-w-0">
          {/* Ambient Background Spotlight Effect */}
          <div className="absolute w-[500px] h-[320px] bg-gradient-to-tr from-blue-300/20 via-indigo-200/25 to-transparent rounded-full blur-3xl pointer-events-none" />

          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            speed={800}
            loop={true}
            className="w-full max-w-[880px] flex items-center justify-center z-10"
          >
            {heroCars.map((car) => (
              <SwiperSlide key={car.id} className="flex items-center justify-center">
                <div className="w-full flex items-center justify-center p-2 relative">
                  <img
                    src={car.image}
                    alt={car.name}
                    loading="eager"
                    className="w-full max-w-[820px] h-auto max-h-[460px] object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.18)] transition-transform duration-700 ease-out hover:scale-105"
                    draggable={false}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Bottom spacing to ensure exact 100vh fit without cutting */}
      <div className="pb-8"></div>
    </div>

      {/* Main Content - Web responsive container */ }
  <div
    className="px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 relative z-10 md:pt-0"
    style={{
      paddingTop: `calc(0.5rem + var(--mobile-header-height, 100px))`,
    }}
  >
    {/* Web container - max-width and centered on larger screens */}
    <div className="max-w-7xl mx-auto">



      {/* Returning Car Banner - Active on Mobile */}
      <div className="mb-3 md:mb-6 block md:hidden">
        <ReturningCarBanner />
      </div>

      {/* Promotional Banner Carousel - Moved below per user request */}
      <div className="mb-6 relative block md:hidden">
        {bestCars.length > 0 && promotionalBanner.title && (
          <Swiper
            modules={[Pagination, Keyboard, Mousewheel, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            onSwiper={(swiper) => {
              mobileBannerSwiperRef.current = swiper;
            }}
            pagination={{
              el: ".mobile-banner-pagination-bottom",
              clickable: true,
              bulletClass: "swiper-pagination-bullet-custom",
              bulletActiveClass: "swiper-pagination-bullet-active-custom",
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            keyboard={{ enabled: true }}
            mousewheel={{ forceToAxis: true, sensitivity: 1 }}
            speed={500}
            loop={true}
            className="w-full rounded-2xl md:rounded-3xl overflow-hidden"
            style={{ background: colors.backgroundDark }}
          >
            {bestCars.map((slide, index) => (
              <SwiperSlide key={slide.id || index} className="!w-full">
                <div className="min-w-full flex items-center justify-between px-4 md:px-6 lg:px-8 h-36 md:h-48 lg:h-56">
                  {/* Left Side - Text Content */}
                  <div className="flex-shrink-0 w-1/3 z-10">
                    <h2 className="text-sm md:text-base lg:text-lg font-bold mb-1 text-white whitespace-nowrap">
                      {promotionalBanner.title}
                    </h2>
                    <p className="text-xs md:text-xs lg:text-sm mb-2 md:mb-3 text-white">
                      {promotionalBanner.subtitle}
                    </p>
                  </div>

                  {/* Right Side - Car Image */}
                  <div className="flex-1 flex items-center justify-end h-full relative">
                    <img
                      src={slide.image}
                      alt={`Car ${slide.id || index + 1}`}
                      className="h-full max-h-full w-auto object-contain"
                      style={{
                        maxWidth: "100%",
                        objectFit: "contain",
                        transform: "translateX(15px)",
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Pagination Dots - Outside Banner */}
        <div className="mobile-banner-pagination-bottom flex justify-center items-center gap-2 mt-4"></div>
      </div>
      {/* Brands Section - Hidden on web view */}
      {brands.length > 0 && (
        <div className="mb-6 md:mb-8 lg:mb-12 xl:mb-16 md:-mt-24 md:hidden">
          <h2 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-black mb-3 md:mb-4 lg:mb-5 xl:mb-6">
            Brands
          </h2>
          <div className="relative overflow-hidden w-full">
            <div className="flex gap-7 md:gap-8 lg:gap-12 xl:gap-16 brands-scroll">
              {/* First set of brands */}
              {brands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  logo={brand.logo}
                  name={brand.name}
                  fallbackLogo={brand.fallbackLogo}
                />
              ))}
              {/* Duplicate set for seamless loop */}
              {brands.map((brand) => (
                <BrandCard
                  key={`duplicate-${brand.id}`}
                  logo={brand.logo}
                  name={brand.name}
                  fallbackLogo={brand.fallbackLogo}
                />
              ))}
            </div>
          </div>
          <style>{`
            .brands-scroll {
              animation: scrollBrands 30s linear infinite;
              display: flex;
              width: fit-content;
            }
            @keyframes scrollBrands {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .brands-scroll:hover {
              animation-play-state: paused;
            }
            @keyframes fadeInUp {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .hero {
              transition: background 500ms ease;
            }
            .hero-content {
              max-width: 100%;
            }
            @media (min-width: 768px) {
              .hero-content {
                max-width: 50%;
              }
            }
            @media (min-width: 1024px) {
              .hero-content {
                max-width: 45%;
              }
            }
            @media (min-width: 1280px) {
              .hero-content {
                max-width: 42%;
              }
            }
            @media (min-width: 1536px) {
              .hero-content {
                max-width: 40%;
              }
            }
          `}</style>
        </div>
      )}

      {/* Dynamic Coupon Banner - Moved out of Best Cars section */}
      <div className="block md:hidden mb-4">
        <CouponCarBanner />
      </div>

      {/* Best Cars Section */}
      <div className="relative">
        {/* Mobile View - White Card Header - Best Cars + Available + View All */}
        <div
          className="px-4 md:px-6 lg:px-8 py-3 md:py-4 -mx-4 md:mx-0 mb-0 md:hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            marginBottom: "0",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black">
              Best Cars
            </h2>
          </div>
        </div>

        {/* Mobile View - White Rounded Container */}
        <div
          className="rounded-b-3xl p-4 md:p-6 lg:p-8 -mx-4 md:mx-0 overflow-y-auto md:shadow-lg md:hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            boxShadow: `0 2px 8px ${colors.shadowLight}`,
            borderTopLeftRadius: "0",
            borderTopRightRadius: "0",
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
            minHeight: "calc(100vh - 240px)",
            paddingTop: "8px",
            paddingBottom: "100px",
            marginBottom: "-80px",
          }}
        >
          {/* Car Cards Slide 1 (Top Slider) - Alternating index % 2 === 0 */}
          <div className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto scrollbar-hide -mx-0 mb-4">
            {bestCars.filter((_, idx) => idx % 2 === 0).map((car, idx) => (
              <div
                key={car.id}
                className="w-[170px] min-w-[170px] flex-shrink-0"
              >
                <CarCard car={car} index={idx * 2} />
              </div>
            ))}
          </div>

          {/* Car Cards Slide 2 (Bottom Slider) - Alternating index % 2 === 1 */}
          <div className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto scrollbar-hide -mx-0 mb-6">
            {bestCars.filter((_, idx) => idx % 2 === 1).map((car, idx) => (
              <div
                key={car.id}
                className="w-[170px] min-w-[170px] flex-shrink-0"
              >
                <CarCard car={car} index={idx * 2 + 1} />
              </div>
            ))}
          </div>

          {/* Banner Section - Between Best Cars and Nearby - Mobile Only */}
          {activeBanners && activeBanners.length > 0 && (
            <div className="mb-6">
              {/* Banner Card - Clickable */}
              <div
                className="relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Swiper
                  modules={[Pagination, Keyboard, Mousewheel, Autoplay]}
                  spaceBetween={0}
                  slidesPerView={1}
                  pagination={activeBanners.length > 1 ? {
                    el: ".banner-carousel-pagination",
                    clickable: true,
                    renderBullet: (index, className) => {
                      return `<span class="${className}" style="width: 8px; height: 1.5px; background: rgba(255,255,255,0.5); border-radius: 2px; margin: 0 2px; display: inline-block; transition: all 0.3s;"></span>`;
                    },
                  } : false}
                  autoplay={activeBanners.length > 1 ? {
                    delay: 4500,
                    disableOnInteraction: false,
                  } : false}
                  keyboard={{ enabled: true }}
                  mousewheel={{ forceToAxis: true, sensitivity: 1 }}
                  speed={500}
                  loop={activeBanners.length > 1}
                  className="w-full h-40 md:h-44 lg:h-48"
                  onSlideChange={(swiper) => {
                    if (activeBanners.length > 1) {
                      const paginationEl = document.querySelector(
                        ".banner-carousel-pagination"
                      );
                      if (paginationEl) {
                        const bullets = paginationEl.querySelectorAll(
                          ".swiper-pagination-bullet"
                        );
                        bullets.forEach((bullet, idx) => {
                          if (idx === swiper.realIndex) {
                            bullet.style.width = "24px";
                            bullet.style.background = "white";
                          } else {
                            bullet.style.width = "8px";
                            bullet.style.background = "rgba(255,255,255,0.5)";
                          }
                        });
                      }
                    }
                  }}
                >
                  {activeBanners.map((banner, index) => {
                    const targetCarId = banner.linkedCar?._id || banner.linkedCar;
                    return (
                      <SwiperSlide key={banner._id || index} className="!w-full">
                        <div
                          className="w-full h-full relative"
                          onClick={() => {
                            if (targetCarId) {
                              navigate(`/car-details/${targetCarId}`);
                            }
                          }}
                        >
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>

                {/* Long Dots Indicator - Only show if multiple images */}
                {activeBanners.length > 1 && (
                  <div className="banner-carousel-pagination absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20"></div>
                )}
              </div>
            </div>
          )}



          {/* Nearby Section - Mobile Only */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-black">
                Nearby
              </h2>
              <button
                className="text-sm text-gray-500 font-medium"
                onClick={() => navigate("/search")}
              >
                View All
              </button>
            </div>

            {/* Nearby Car Card - Horizontal scrollable */}
            <div className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto scrollbar-hide -mx-0">
              {nearbyCars.map((car, index) => (
                <div
                  key={car.id}
                  className="w-[170px] min-w-[170px] flex-shrink-0"
                >
                  <CarCard car={car} index={bestCars.length + index} />
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Web View - Best Cars & Nearby Sections hidden per user request */}
      </div>
    </div>
  </div>

  {/* Calendar Popup */ }
  {
    isCalendarOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={() => setIsCalendarOpen(false)}
        />

        {/* Calendar Modal */}
        <div
          className="fixed z-[110] rounded-xl shadow-2xl border p-4"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.borderForm,
            width: "320px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {calendarTarget === "pickup" ? "Pick-up Date" : "Drop-off Date"}
            </h3>
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
              style={{ color: colors.textPrimary }}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1
                  )
                )
              }
              className="p-1.5 rounded-lg hover:bg-gray-100"
              style={{ color: colors.textPrimary }}
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
              className="text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {calendarMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h4>
            <button
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1
                  )
                )
              }
              className="p-1.5 rounded-lg hover:bg-gray-100"
              style={{ color: colors.textPrimary }}
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

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-1"
                style={{ color: colors.textSecondary }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, idx) => {
              if (!date) return <div key={idx}></div>;
              // Format date as YYYY-MM-DD using local timezone to avoid timezone issues
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              // Check if this date is selected based on the target (pickup or dropoff)
              const currentSelectedDate = calendarTarget === "pickup" ? pickupDate : dropoffDate;
              const isSelected = currentSelectedDate && dateStr === currentSelectedDate;
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
              const isCurrentMonth =
                date.getMonth() === calendarMonth.getMonth();
              const minDate =
                calendarTarget === "dropoff" && pickupDate
                  ? new Date(pickupDate)
                  : new Date(new Date().setHours(0, 0, 0, 0));
              const isDisabled = date < minDate;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    !isDisabled && isCurrentMonth && handleDateSelect(date)
                  }
                  disabled={isDisabled && !isSelected}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${isSelected
                    ? "text-white"
                    : isDisabled
                      ? "cursor-not-allowed opacity-40"
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
                      : isDisabled
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
      </>
    )
  }

  {/* Time Picker Popup */ }
  {
    isTimePickerOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsTimePickerOpen(false)}
        />

        {/* Time Picker Modal */}
        <div
          className="fixed z-[110] shadow-2xl bg-white rounded-md"
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
                onClick={handleTimeSelect}
                className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  {/* Web View Sections - Why Choose DriveOn, FAQ, Download App, Footer - Only visible on web */ }
  <div className="hidden md:block w-full">
    {/* Why Choose DriveOn Section - Web View Only */}
    <section className="pt-20 pb-16 md:pt-28 md:pb-20 lg:pt-36 lg:pb-24 mt-8" style={{ backgroundColor: colors.backgroundSecondary }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="text-center mb-8 md:mb-10 lg:mb-12">
          <h2
            className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-2 md:mb-3 lg:mb-4"
            style={{ color: colors.textPrimary }}
          >
            Why Choose DriveOn?
          </h2>
          <p
            className="text-sm md:text-base lg:text-lg xl:text-xl max-w-2xl mx-auto px-2"
            style={{ color: colors.textSecondary }}
          >
            Experience seamless car rental with our trusted platform
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6 lg:gap-8">
          {[
            {
              icon: (
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              ),
              title: "Verified KYC",
              description:
                "Secure DigiLocker integration for verified identity",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
              title: "Live Tracking",
              description:
                "Real-time GPS tracking for safety and security",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              title: "Flexible Payment",
              description:
                "Pay full or 20% advance - choose what works for you",
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              ),
              title: "Referral Rewards",
              description:
                "Earn points and discounts with our referral program",
            },
          ].map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="group relative rounded-2xl p-6 md:p-7 lg:p-8 text-center transition-all duration-300 ease-in-out cursor-default"
              style={{
                backgroundColor: colors.backgroundPrimary,
                boxShadow: `0 2px 8px ${colors.shadowLight}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${colors.shadowLight}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadowLight}`;
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] rounded-xl mb-4 md:mb-5 lg:mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${colors.backgroundTertiary}20`,
                    color: colors.backgroundTertiary,
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 transition-colors duration-300"
                  style={{ color: colors.textPrimary }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm md:text-base leading-relaxed transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* BannerAd Section - Our Trusted Partners */}
    <BannerAd />

    {/* FAQ Section - Hidden on web view */}
    {faqs.length > 0 && (
      <div
        className="w-full pt-4 md:pt-6 lg:pt-8 xl:pt-10 pb-12 md:pb-16 lg:pb-20 xl:pb-24 md:hidden"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-center mb-6 md:mb-8 lg:mb-10 xl:mb-12"
            style={{ color: colors.textPrimary }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    backgroundColor: colors.backgroundPrimary,
                    border: `1px solid ${isOpen ? colors.textPrimary : colors.borderLight
                      }`,
                    boxShadow: isOpen
                      ? `0 4px 6px ${colors.shadowLight}`
                      : "none",
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 md:p-5 lg:p-6 text-left focus:outline-none transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: isOpen
                        ? colors.backgroundPrimary
                        : "transparent",
                    }}
                  >
                    <h3
                      className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold pr-4 flex-1"
                      style={{ color: colors.textPrimary }}
                    >
                      {faq.question}
                    </h3>
                    <svg
                      className={`w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""
                        }`}
                      style={{ color: colors.textPrimary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="px-4 md:px-5 lg:px-6 pb-4 md:pb-5 lg:pb-6 pt-0">
                      <p
                        className="text-xs md:text-sm lg:text-base leading-relaxed pt-2"
                        style={{ color: colors.textSecondary }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* Download App Section */}
    <div
      className="w-full py-8 md:py-12 lg:py-16 xl:py-20 2xl:py-24"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 lg:gap-12 xl:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <h2
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-3 md:mb-4 lg:mb-5"
              style={{ color: colors.textPrimary }}
            >
              Download Our App
            </h2>
            <p
              className="text-sm md:text-base lg:text-lg xl:text-xl mb-4 md:mb-5 lg:mb-6"
              style={{ color: colors.textSecondary }}
            >
              Get the best car rental experience on the go. Book, manage,
              and track your rentals with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <img
                src={downloadRemoveBgPreview}
                alt="Download App"
                className="max-w-full h-auto object-contain"
                style={{ maxHeight: "120px" }}
              />
            </div>
          </div>
          {/* Mobile View Image - Visible on all screen sizes */}
          <div className="flex flex-1 justify-center lg:justify-end items-center mt-6 lg:mt-0">
            <img
              src={mobileViewImg2}
              alt="Mobile App Preview"
              className="max-w-full h-auto object-contain"
              style={{ maxHeight: "600px" }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Footer Section removed per user request */}

  </div>

  {/* Bottom Navbar - Overlay on top of container - Hidden on web */ }
  <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
    <BottomNavbar />
  </div>
    </div >
  );
};

export default HomePage;
