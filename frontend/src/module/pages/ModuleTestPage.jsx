// main

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import BottomNavbar from "../components/layout/BottomNavbar";
import { colors } from "../theme/colors";
import FilterDropdown from "../components/common/FilterDropdown";
import ReturningCarBanner from "../components/common/ReturningCarBanner";
import { useAppSelector } from "../../hooks/redux";
import { carService } from "../../services/car.service";
import { couponService } from "../../services/coupon.service";
import { bannerService } from "../../services/banner.service";
import { useLocation } from "../../hooks/useLocation";
import { useFavorites } from '../../context/FavoritesContext';

// Use existing car images from assets
import carImg1 from "../../assets/car_banImg1.jpg";
import carImg2 from "../../assets/car_banImg2.jpg";
import carImg3 from "../../assets/car_banImg3.jpg";
import carImg4 from "../../assets/car_banImg4.jpg";
import carImg5 from "../../assets/car_banImg5.jpg";
import carImg6 from "../../assets/car_img6-removebg-preview.png";
import nearbyImg1 from "../../assets/car_img8.png";
import nearbyImg2 from "../../assets/car_img4-removebg-preview.png";
import nearbyImg3 from "../../assets/car_img5-removebg-preview.png";
import bannerCar1 from "../../assets/car_img1-removebg-preview.png";
import bannerCar2 from "../../assets/car_img4-removebg-preview.png";
import bannerCar3 from "../../assets/car_img5-removebg-preview.png";
import bannerCar4 from "../../assets/car_img6-removebg-preview.png";
import logo1 from "../../assets/car_logo1_PNG1.png";
import logo2 from "../../assets/car_logo2_PNG.png";
import logo3 from "../../assets/car_logo3_PNG.png";
import logo4 from "../../assets/car_logo4_PNG.png";
import logo5 from "../../assets/car_logo5_PNG.png";
import logo6 from "../../assets/car_logo6_PNG.png";
import logo7 from "../../assets/car_logo7_PNG.png";
import logo8 from "../../assets/car_logo8_PNG.png";
import logo9 from "../../assets/car_logo9_PNG.png";
import logo10 from "../../assets/car_logo10_PNG.png";
import logo11 from "../../assets/car_logo11_PNG.png";
import logo13 from "../../assets/car_logo13_PNG.png";
import logo14 from "../../assets/car_logo14_PNG.png";
import logo15 from "../../assets/car_logo15.png";
import logo16 from "../../assets/car_logo16.png";

/**
 * ModuleTestPage
 * Standalone page that visually matches the reference mobile screen.
 * Purely UI/layout – no business logic changed.
 */
const ModuleTestPage = () => {
  const navigate = useNavigate();

  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Get user's current live location (throttled to avoid frequent updates)
  const { currentLocation, coordinates } = useLocation(
    true,
    isAuthenticated,
    user?._id || user?.id
  );

  // Dynamic data states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [nearbyCars, setNearbyCars] = useState([]);
  const [bestCars, setBestCars] = useState([]);
  const [totalCarsCount, setTotalCarsCount] = useState(0);
  const [featuredCar, setFeaturedCar] = useState(null);
  const [activeBanners, setActiveBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Banner Scroll Logic
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerScrollRef = useRef(null);
  const isBannerAutoScrollingRef = useRef(false);
  const isBannerPausedRef = useRef(false);
  const bannerPauseTimeoutRef = useRef(null);

  // Dynamic Banner State
  const [bannerCars, setBannerCars] = useState([]);

  // Fetch dynamic coupon banners
  useEffect(() => {
    const fetchCouponBanners = async () => {
      try {
        const response = await couponService.getCarSpecificCoupons();
        if (response.success && response.data?.coupons && response.data.coupons.length > 0) {
          const activeCoupons = response.data.coupons.filter(c => c.cars && c.cars.length > 0);

          if (activeCoupons.length > 0) {
            const dynamicBanners = activeCoupons.map(coupon => {
              const car = coupon.cars[0];
              let carImage = bannerCar1; // Fallback

              if (car.images && car.images.length > 0) {
                const img = car.images.find(i => i.isPrimary) || car.images[0];
                const imgUrl = typeof img === 'string' ? img : (img.url || img.path);
                if (imgUrl) {
                  carImage = imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_API_BASE_URL || ""}${imgUrl}`;
                }
              }

              return {
                image: carImage,
                alt: car.model || "Car",
                title: coupon.code, // Coupon Code as Title
                subtitle: coupon.description || "Special Discount Available",
                buttonText: "Book Now",
                carId: car._id || car.id || null
              };
            });

            setBannerCars(dynamicBanners);
          } else {
            // Revert to static if no active coupons with cars found
            setBannerCars([
              {
                image: bannerCar1,
                alt: "Toyota Innova",
                title: "20% Off Your First Ride!",
                subtitle: "Experience Seamless Car Rentals.",
                buttonText: "Discover More"
              }
            ]);
          }
        } else {
          // No coupons at all, revert to static
          setBannerCars([
            {
              image: bannerCar1,
              alt: "Toyota Innova",
              title: "20% Off Your First Ride!",
              subtitle: "Experience Seamless Car Rentals.",
              buttonText: "Discover More"
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch coupon banners", error);
        // Fallback on error
        setBannerCars([
          {
            image: bannerCar1,
            alt: "Toyota Innova",
            title: "20% Off Your First Ride!",
            subtitle: "Experience Seamless Car Rentals.",
            buttonText: "Discover More"
          }
        ]);
      }
    };

    fetchCouponBanners();
  }, []);

  // Banner scroll handling
  useEffect(() => {
    const handleScroll = () => {
      const container = bannerScrollRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);

      if (newIndex >= 0 && newIndex < bannerCars.length) {
        setCurrentBannerIndex(newIndex);
      }

      // Pause on manual scroll
      if (!isBannerAutoScrollingRef.current) {
        isBannerPausedRef.current = true;
        if (bannerPauseTimeoutRef.current) clearTimeout(bannerPauseTimeoutRef.current);
        bannerPauseTimeoutRef.current = setTimeout(() => {
          isBannerPausedRef.current = false;
        }, 5000);
      }
    };

    const container = bannerScrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [bannerCars.length]);

  // Banner auto-scroll
  useEffect(() => {
    if (bannerCars.length <= 1) return;

    const interval = setInterval(() => {
      if (isBannerPausedRef.current) return;

      const container = bannerScrollRef.current;
      if (!container) return;

      const nextIndex = (currentBannerIndex + 1) % bannerCars.length;
      const cardWidth = container.clientWidth;

      isBannerAutoScrollingRef.current = true;
      container.scrollTo({
        left: nextIndex * cardWidth,
        behavior: "smooth"
      });

      setTimeout(() => {
        isBannerAutoScrollingRef.current = false;
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentBannerIndex, bannerCars.length]);

  const goToBannerIndex = (index) => {
    const container = bannerScrollRef.current;
    if (!container) return;

    isBannerPausedRef.current = true;
    if (bannerPauseTimeoutRef.current) clearTimeout(bannerPauseTimeoutRef.current);

    isBannerAutoScrollingRef.current = true;
    const cardWidth = container.clientWidth;
    container.scrollTo({
      left: index * cardWidth,
      behavior: "smooth"
    });

    setTimeout(() => {
      isBannerAutoScrollingRef.current = false;
    }, 500);

    bannerPauseTimeoutRef.current = setTimeout(() => {
      isBannerPausedRef.current = false;
    }, 5000);
  };

  // Filter options state for FilterDropdown
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    fuelTypes: [],
    transmissions: [],
    colors: [],
    carTypes: [],
    features: [],
    seats: [],
    ratings: [],
    locations: [],
  });

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState({
    brand: "",
    model: "",
    seats: "",
    fuelType: "",
    transmission: "",
    color: "",
    priceRange: { min: "", max: "" },
    rating: "",
    location: "",
    carType: "",
    features: [],
    availableFrom: "",
    availableTo: "",
  });

  // Store all cars for filtering
  const [allCars, setAllCars] = useState([]);

  // Brand logos map for dynamic brands - expanded mapping
  const brandLogos = {
    // Luxury brands
    Ferrari: logo10,
    Lamborghini: logo5,
    BMW: logo11,
    Audi: logo10,
    Mercedes: logo11,
    Porsche: logo5,
    // Electric/Modern
    Tesla: logo4,
    // Japanese brands
    Toyota: logo2,
    Honda: logo8,
    Nissan: logo11,
    Mazda: logo4,
    Subaru: logo5,
    // Korean brands
    Hyundai: logo6,
    Kia: logo1,
    // Indian brands
    Maruti: logo2,
    "Maruti Suzuki": logo2,
    Tata: logo4,
    Mahindra: logo5,
    // Other popular brands
    Ford: logo4,
    Chevrolet: logo5,
    Volkswagen: logo6,
    Volvo: logo7,
    Skoda: logo8,
    // Common model names that might come as brands
    "Swift Dzire": logo2,
    Swift: logo2,
    Dzire: logo2,
    XUV500: logo5,
    XUV: logo5,
    "Alto 800": logo2,
    Alto: logo2,
  };

  // Fallback brand logos array for unknown brands
  const fallbackBrandLogos = [
    logo1,
    logo2,
    logo3,
    logo4,
    logo5,
    logo6,
    logo7,
    logo8,
    logo9,
    logo10,
    logo11,
    logo13,
    logo14,
    logo15,
    logo16,
  ];

  // Category images map
  const categoryImages = {
    Sports: carImg1,
    Electric: carImg2,
    Legends: carImg3,
    Classic: carImg4,
    Coupe: carImg5,
    SUV: carImg1,
    Sedan: carImg2,
    Hatchback: carImg3,
  };

  // Fallback images for cars
  const fallbackCarImages = [
    carImg1,
    nearbyImg1,
    nearbyImg2,
    nearbyImg3,
    carImg6,
    carImg4,
    carImg5,
  ];

  // Transform car data
  const transformCarData = (car, index = 0) => {
    let carImage = fallbackCarImages[index % fallbackCarImages.length];

    if (car.images && car.images.length > 0) {
      const primaryImage = car.images.find((img) => img.isPrimary);
      if (primaryImage) {
        const imgUrl =
          typeof primaryImage === "string"
            ? primaryImage
            : primaryImage.url || primaryImage.path || primaryImage;
        if (typeof imgUrl === "string") {
          carImage = imgUrl.startsWith("http")
            ? imgUrl
            : `${import.meta.env.VITE_API_BASE_URL || ""}${imgUrl}`;
        }
      } else if (car.images[0]) {
        const imgUrl =
          typeof car.images[0] === "string"
            ? car.images[0]
            : car.images[0].url || car.images[0].path || car.images[0];
        if (typeof imgUrl === "string") {
          carImage = imgUrl.startsWith("http")
            ? imgUrl
            : `${import.meta.env.VITE_API_BASE_URL || ""}${imgUrl}`;
        }
      }
    } else if (car.image) {
      const imgUrl =
        typeof car.image === "string"
          ? car.image
          : car.image.url || car.image.path || car.image;
      if (typeof imgUrl === "string") {
        carImage = imgUrl.startsWith("http")
          ? imgUrl
          : `${import.meta.env.VITE_API_BASE_URL || ""}${imgUrl}`;
      }
    }

    // Normalize fuel type
    const fuelType = car.fuelType || "";
    const normalizedFuelType =
      fuelType.toLowerCase() === "petrol"
        ? "Petrol"
        : fuelType.toLowerCase() === "diesel"
          ? "Diesel"
          : fuelType.toLowerCase() === "electric"
            ? "Electric"
            : fuelType.toLowerCase() === "hybrid"
              ? "Hybrid"
              : fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase();

    // Normalize transmission
    const transmission = car.transmission || "";
    const normalizedTransmission =
      transmission.toLowerCase() === "automatic"
        ? "Automatic"
        : transmission.toLowerCase() === "manual"
          ? "Manual"
          : transmission.toLowerCase() === "cvt"
            ? "CVT"
            : transmission.charAt(0).toUpperCase() +
            transmission.slice(1).toLowerCase();

    return {
      id: car._id || car.id,
      name: `${car.brand} ${car.model}`,
      brand: car.brand || "",
      model: car.model || "",
      rating: car.averageRating ? car.averageRating.toFixed(1) : "5.0",
      location:
        car.location?.city ||
        car.location?.address ||
        car.location ||
        "Location",
      seats: `${car.seatingCapacity || car.seats || 4} Seats`,
      seatingCapacity: car.seatingCapacity || car.seats || 4,
      price: `Rs. ${car.pricePerDay || 0}/Day`,
      image: carImage,
      pricePerDay: car.pricePerDay || 0,
      // Filter-related properties
      fuelType: normalizedFuelType,
      transmission: normalizedTransmission,
      color: car.color || "",
      carType: car.carType || car.bodyType || "",
      features: car.features || [],
    };
  };

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('hour');
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [calendarTarget, setCalendarTarget] = useState("pickup");
  const [timeTarget, setTimeTarget] = useState("pickup");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [activeFilter, setActiveFilter] = useState("$200–$1,000 / day");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [animatingStates, setAnimatingStates] = useState({});
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);

  const handleBookingSearch = () => {
    let queryParams = new URLSearchParams();

    // Pass existing search value if any
    const trimmed = searchValue.trim();
    if (trimmed) {
      queryParams.append('q', trimmed);
    }

    if (pickupDate && dropoffDate) {
      const convertTo24Hour = (timeStr) => {
        if (!timeStr) return "";
        const parts = timeStr.trim().split(' ');
        if (parts.length !== 2) return timeStr; // Assume already 24h or invalid
        const [time, period] = parts;
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      // Save to localStorage for BookNowPage to pick up
      try {
        const bookingDates = {
          pickupDate: pickupDate,
          pickupTime: convertTo24Hour(pickupTime),
          dropDate: dropoffDate,
          dropTime: convertTo24Hour(dropoffTime)
        };
        localStorage.setItem('selectedBookingDates', JSON.stringify(bookingDates));
      } catch (e) {
        console.error("Failed to save booking dates", e);
      }

      const getISOString = (dateStr, timeStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        let hours = 10;
        let minutes = 30; // Default time
        if (timeStr) {
          const parts = timeStr.trim().split(' ');
          if (parts.length === 2) {
            const [time, period] = parts;
            const [h, m] = time.split(':').map(Number);
            hours = h;
            minutes = m;
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
          }
        }
        return new Date(year, month - 1, day, hours, minutes).toISOString();
      };

      try {
        queryParams.append('availabilityStart', getISOString(pickupDate, pickupTime));
        queryParams.append('availabilityEnd', getISOString(dropoffDate, dropoffTime));
      } catch (e) {
        console.error("Invalid date format", e);
      }
    }

    navigate(`/search?${queryParams.toString()}`);
  };

  const performSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/search");
    }
  };

  // Navigate to search with optional filter query params when pills are tapped
  const handleFilterNavigate = (label) => {
    setActiveFilter(label);
    if (label === "$200–$1,000 / day") {
      navigate(`/search?minPrice=200&maxPrice=1000`);
      return;
    }
    if (label === "Brand") {
      navigate(`/search?filter=brand`);
      return;
    }
    if (label === "Body") {
      navigate(`/search?filter=body`);
      return;
    }
    if (label === "More") {
      navigate(`/search?filter=more`);
      return;
    }
    navigate("/search");
  };

  // Fetch dynamic data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch categories (car types) with counts
        const carTypesResponse = await carService.getTopCarTypes({ limit: 10 });
        if (carTypesResponse.success && carTypesResponse.data?.carTypes) {
          const carTypes = carTypesResponse.data.carTypes.map(
            (type, index) => ({
              id: index + 1,
              label: type.name || type.carType || type,
              carType: type.carType || type.name?.toLowerCase() || type?.toLowerCase() || '',
              count: type.count || 0,
              image:
                categoryImages[type.name || type.carType || type] ||
                categoryImages.Sports,
            })
          );
          setCategories(carTypes);
        }

        // Set static premium fleet brands as requested
        const premiumFleetData = [
          { id: 1, name: "Toyota", logo: logo2 },
          { id: 2, name: "Ferrari", logo: logo4 },
          { id: 3, name: "Ford", logo: logo3 },
          { id: 4, name: "Lamborghini", logo: logo5 },
          { id: 5, name: "Kia", logo: logo1 },
          { id: 6, name: "Skoda", logo: logo7 },
          { id: 7, name: "Honda", logo: logo8 },
          { id: 8, name: "Jaguar", logo: logo9 },
          { id: 9, name: "Audi", logo: logo10 },
          { id: 10, name: "Nissan", logo: logo11 },
        ];
        
        // Add count property to match structure
        const formattedBrands = premiumFleetData.map(brand => ({
          ...brand,
          count: '10+' // Placeholder count
        }));
        
        setBrands(formattedBrands);

        // Fetch nearby cars (using user's coordinates if available)
        const nearbyParams = {
          limit: 3,
        };
        if (coordinates && coordinates.lat && coordinates.lng) {
          nearbyParams.latitude = coordinates.lat;
          nearbyParams.longitude = coordinates.lng;
        }
        const nearbyResponse = await carService.getNearbyCars(nearbyParams);
        if (nearbyResponse.success && nearbyResponse.data?.cars) {
          const nearbyCarsData = nearbyResponse.data.cars
            .slice(0, 3)
            .map((car, index) => transformCarData(car, index));
          setNearbyCars(nearbyCarsData);
        }

        // Fetch best cars (latest/featured cars)
        const bestCarsResponse = await carService.getCars({
          isFeatured: true,
          status: "active",
          isAvailable: true,
          limit: 100,
        });
        if (bestCarsResponse.success && bestCarsResponse.data?.cars) {
          const bestCarsData = bestCarsResponse.data.cars
            .map((car, index) => transformCarData(car, index));
          setBestCars(bestCarsData);

          // Set featured car (first one)
          if (bestCarsResponse.data.cars.length > 0) {
            setFeaturedCar(transformCarData(bestCarsResponse.data.cars[0], 0));
          }
        }

        // Fetch active banners
        try {
          const bannersResponse = await bannerService.getActiveBanners();
          if (bannersResponse.success && bannersResponse.data?.banners) {
            setActiveBanners(bannersResponse.data.banners);
          }
        } catch (bannerErr) {
          console.error("Error fetching active banners in mobile page:", bannerErr);
        }

        // Fetch all cars to extract filter options
        const allCarsResponse = await carService.getCars({
          limit: 100, // Get more cars to extract filter options
          status: "active",
          isAvailable: true,
        });

        if (allCarsResponse.success && allCarsResponse.data?.pagination) {
          setTotalCarsCount(allCarsResponse.data.pagination.total || 0);
        }

        // Extract filter options from all cars and store cars for filtering
        if (allCarsResponse.success && allCarsResponse.data?.cars) {
          const cars = allCarsResponse.data.cars;

          // Store all cars for filtering
          const transformedAllCars = cars.map((car, index) =>
            transformCarData(car, index)
          );
          setAllCars(transformedAllCars);

          // Extract unique brands
          const uniqueBrands = Array.from(
            new Set(cars.map((car) => car.brand).filter(Boolean))
          ).sort();

          // Extract unique fuel types
          const uniqueFuelTypes = Array.from(
            new Set(
              cars
                .map((car) => {
                  const fuel = car.fuelType || "";
                  if (fuel.toLowerCase() === "petrol") return "Petrol";
                  if (fuel.toLowerCase() === "diesel") return "Diesel";
                  if (fuel.toLowerCase() === "electric") return "Electric";
                  if (fuel.toLowerCase() === "hybrid") return "Hybrid";
                  return (
                    fuel.charAt(0).toUpperCase() + fuel.slice(1).toLowerCase()
                  );
                })
                .filter(Boolean)
            )
          ).sort();

          // Extract unique transmissions
          const uniqueTransmissions = Array.from(
            new Set(
              cars
                .map((car) => {
                  const trans = car.transmission || "";
                  if (trans.toLowerCase() === "automatic") return "Automatic";
                  if (trans.toLowerCase() === "manual") return "Manual";
                  if (trans.toLowerCase() === "cvt") return "CVT";
                  return (
                    trans.charAt(0).toUpperCase() + trans.slice(1).toLowerCase()
                  );
                })
                .filter(Boolean)
            )
          ).sort();

          // Extract unique colors
          const uniqueColors = Array.from(
            new Set(
              cars
                .map((car) => {
                  const color = car.color || "";
                  return (
                    color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
                  );
                })
                .filter(Boolean)
            )
          ).sort();

          // Extract unique car types
          const uniqueCarTypes = Array.from(
            new Set(
              cars
                .map((car) => {
                  const type = car.carType || car.bodyType || "";
                  return (
                    type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
                  );
                })
                .filter(Boolean)
            )
          ).sort();

          // Extract all unique features
          const allFeatures = cars
            .flatMap((car) => car.features || [])
            .filter(Boolean);
          const uniqueFeatures = Array.from(new Set(allFeatures)).sort();

          // Extract unique seat counts
          const uniqueSeats = Array.from(
            new Set(
              cars
                .map((car) => car.seatingCapacity || car.seats)
                .filter(Boolean)
            )
          )
            .map((seats) => String(seats))
            .sort((a, b) => parseInt(a) - parseInt(b));

          // Helper to capitalize city names
          const capitalizeCity = (city) => {
            if (!city) return '';
            return city
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .trim();
          };

          // Extract unique locations case-insensitively
          const uniqueLocationsMap = new Map();
          cars.forEach((car) => {
            const loc =
              car.location?.city ||
              car.location?.address ||
              car.location ||
              "";
            if (loc.trim()) {
              const normalized = capitalizeCity(loc);
              const key = normalized.toLowerCase();
              if (!uniqueLocationsMap.has(key)) {
                uniqueLocationsMap.set(key, normalized);
              }
            }
          });
          const uniqueLocations = Array.from(uniqueLocationsMap.values()).sort();


          // Extract unique ratings and create rating options
          const allRatings = cars
            .map((car) => {
              const rating = car.averageRating || car.rating || 0;
              return parseFloat(rating) || 0;
            })
            .filter((rating) => rating > 0);

          // Create rating filter options based on available ratings
          const ratingOptions = [];
          if (allRatings.length > 0) {
            const maxRating = Math.max(...allRatings);
            const minRating = Math.min(...allRatings);
            if (maxRating >= 4.0) ratingOptions.push("4.0+");
            if (maxRating >= 4.5) ratingOptions.push("4.5+");
            if (maxRating >= 5.0) ratingOptions.push("5.0");
          }

          // Set filter options
          setFilterOptions({
            brands: uniqueBrands,
            fuelTypes: uniqueFuelTypes,
            transmissions: uniqueTransmissions,
            colors: uniqueColors,
            carTypes: uniqueCarTypes,
            features: uniqueFeatures,
            seats: uniqueSeats,
            ratings: ratingOptions,
            locations: uniqueLocations,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Keep default/empty data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [coordinates]);

  // Auto focus input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTimeDisplay = () => {
    let hour = parseInt(selectedHour);
    if (selectedPeriod === "PM" && hour !== 12) hour += 12;
    if (selectedPeriod === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${selectedMinute}`;
  };

  // ... (Header update happens in second chunk below or same tool call if possible?)
  // Tool supports multiple chunks? Yes but `replace_file_content` is single chunk? No, `replace_file_content` is SINGLE contiguous block.
  // `multi_replace_file_content` is needed for non-contiguous.

  // I will use `replace_file_content` for `formatTimeDisplay` first, then another for the Header JSX.
  // Actually, I can use `multi_replace_file_content`.

  // Let's use `multi_replace_file_content` to do both in one go.

  // Handler for when filters are applied
  const handleApplyFilters = (filters) => {
    console.log("Applied Filters:", filters);
    setAppliedFilters(filters);
    setIsFilterOpen(false);
  };

  // Apply filters to any car list
  const filterCars = useCallback(
    (list) => {
      let filtered = [...list];

      // Filter by brand
      if (appliedFilters.brand) {
        filtered = filtered.filter(
          (car) => car.brand?.toLowerCase() === appliedFilters.brand.toLowerCase()
        );
      }

      // Filter by model
      if (appliedFilters.model) {
        const modelQuery = appliedFilters.model.toLowerCase().trim();
        filtered = filtered.filter(
          (car) =>
            car.model?.toLowerCase().includes(modelQuery) ||
            car.name?.toLowerCase().includes(modelQuery)
        );
      }

      // Filter by fuel type
      if (appliedFilters.fuelType) {
        filtered = filtered.filter((car) => {
          const carFuelType = car.fuelType || "";
          return carFuelType.toLowerCase() === appliedFilters.fuelType.toLowerCase();
        });
      }

      // Filter by transmission
      if (appliedFilters.transmission) {
        filtered = filtered.filter((car) => {
          const carTransmission = car.transmission || "";
          return (
            carTransmission.toLowerCase() === appliedFilters.transmission.toLowerCase()
          );
        });
      }

      // Filter by car type
      if (appliedFilters.carType) {
        filtered = filtered.filter((car) => {
          const carType = car.carType || "";
          return carType.toLowerCase() === appliedFilters.carType.toLowerCase();
        });
      }

      // Filter by color
      if (appliedFilters.color) {
        filtered = filtered.filter((car) => {
          const carColor = car.color || "";
          return carColor.toLowerCase() === appliedFilters.color.toLowerCase();
        });
      }

      // Filter by seats
      if (appliedFilters.seats) {
        filtered = filtered.filter((car) => {
          const carSeats = String(
            (car.seats ?? car.seatingCapacity ?? car.seatingCapacity) || ""
          );
          return carSeats === appliedFilters.seats;
        });
      }

      // Filter by features (all selected features must be present)
      if (appliedFilters.features && appliedFilters.features.length > 0) {
        filtered = filtered.filter((car) => {
          const carFeatures = car.features || [];
          return appliedFilters.features.every((feature) =>
            carFeatures.some(
              (carFeature) => carFeature.toLowerCase() === feature.toLowerCase()
            )
          );
        });
      }

      // Filter by price range
      if (appliedFilters.priceRange.min || appliedFilters.priceRange.max) {
        filtered = filtered.filter((car) => {
          const carPrice = parseFloat(
            car.price?.replace(/[^0-9.]/g, "") || car.pricePerDay || 0
          );
          const minPrice = parseFloat(appliedFilters.priceRange.min) || 0;
          const maxPrice = parseFloat(appliedFilters.priceRange.max) || Infinity;
          return carPrice >= minPrice && carPrice <= maxPrice;
        });
      }

      // Filter by rating
      if (appliedFilters.rating) {
        filtered = filtered.filter((car) => {
          const carRating = parseFloat(car.rating) || 0;
          const minRating = parseFloat(appliedFilters.rating.replace("+", "")) || 0;
          return carRating >= minRating;
        });
      }

      // Filter by location
      if (appliedFilters.location) {
        filtered = filtered.filter((car) => {
          return car.location
            ?.toLowerCase()
            .includes(appliedFilters.location.toLowerCase());
        });
      }

      return filtered;
    },
    [appliedFilters]
  );

  const filteredCars = useMemo(() => filterCars(allCars), [allCars, filterCars]);
  const filteredBestCars = useMemo(
    () => filterCars(bestCars),
    [bestCars, filterCars]
  );
  const filteredNearbyCars = useMemo(
    () => filterCars(nearbyCars),
    [nearbyCars, filterCars]
  );
  const activeFeaturedCar = useMemo(
    () => filteredBestCars[0] || filteredCars[0] || featuredCar,
    [filteredBestCars, filteredCars, featuredCar]
  );

  // Tap brand pills at the top to set brand filter immediately
  const handleQuickBrandFilter = (brandName) => {
    setAppliedFilters((prev) => ({
      ...prev,
      brand: brandName || "",
    }));
    // Also close filters if open and refresh featured car selection
    setIsFilterOpen(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col max-md:h-screen max-md:overflow-hidden"
      style={{ backgroundColor: colors.backgroundTertiary }}
    >
      {/* TOP COMPACT HEADER - matches reference */}
      <div
        className="px-4 pt-6 pb-6 space-y-3 md:rounded-b-[32px] md:shadow-lg relative z-20 max-md:sticky max-md:top-0 max-md:flex-shrink-0"
        style={{ background: colors.gradientHeader || "linear-gradient(180deg, #1C205C 0%, #0D102D 100%)" }}
      >
        {/* Logo and Location in same row */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <img
            alt="DriveOn Logo"
            src="/driveonlogo.png"
            className="h-9 w-auto object-contain"
          />
          {/* Location pill */}
          <button
            type="button"
            className="flex items-center justify-between rounded-full px-3 py-1 text-[10px] flex-shrink-0"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(4px)",
              color: colors.textWhite,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              maxWidth: isLocationExpanded ? "75%" : "auto",
              transition: "all 0.3s ease"
            }}
            onClick={() => setIsLocationExpanded(!isLocationExpanded)}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white text-[9px] flex-shrink-0"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <span className={`leading-tight ${isLocationExpanded ? "text-left break-words whitespace-normal" : "truncate max-w-[120px]"}`}>
                {currentLocation || "Getting location..."}
              </span>
            </span>
            <svg
              className={`w-3 h-3 text-gray-300 flex-shrink-0 ml-1.5 transition-transform duration-200 ${isLocationExpanded ? "rotate-180" : ""}`}
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
        </div>

        {/* Date/Time Search Bar - Premium Glassmorphism */}

        <motion.div
          className="w-full relative z-20 hidden md:block"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {!isSearchActive ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSearchActive(true)}
              className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/20 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm font-medium">Search your dream car...</span>
              </div>
            </motion.button>
          ) : (
            <motion.div
              className="w-full bg-white rounded-2xl p-2 flex items-center gap-2 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search brand, model..."
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 text-sm font-medium focus:outline-none px-2"
                onChange={(e) => handleSearch(e.target.value)}
              />
              <button
                onClick={() => {
                  setIsSearchActive(false);
                  handleSearch('');
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* CONTENT */}
      <main
        className="flex-1 pb-0 max-md:flex max-md:flex-col max-md:overflow-hidden"
        style={{ backgroundColor: colors.backgroundTertiary }}
      >
        {/* Floating white card container like reference */}
        <motion.div
          className="mt-3 rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 pt-4 pb-28 space-y-4 max-md:flex-1 max-md:overflow-y-auto max-md:mt-0 max-md:rounded-t-3xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* MOBILE PREMIUM BOOKING CARD */}
          <motion.div
            className="md:hidden -mt-3 mb-6 px-1 relative z-30"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: {
                  duration: 0.5,
                  delay: 0.1,
                  staggerChildren: 0.15
                }
              }
            }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-5 shadow-[0_20px_40px_-5px_rgba(28,32,92,0.15)] border border-white/50 relative overflow-hidden">
              {/* Decorative background blur */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

              <div className="flex flex-col gap-4 relative z-10">
                {/* Pickup Section */}
                <motion.div
                  className="flex flex-col cursor-pointer group"
                  onClick={() => { setCalendarTarget('pickup'); setIsCalendarOpen(true); }}
                  whileTap={{ scale: 0.98 }}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <label className="text-[11px] font-bold text-gray-500 mb-2 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5 text-[#1C205C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Pickup Details
                  </label>
                  <div className="w-full bg-gray-50 group-hover:bg-blue-50/50 rounded-2xl px-4 py-3 border border-transparent group-hover:border-blue-200 transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1C205C]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold block ${pickupDate ? 'text-[#1C205C]' : 'text-gray-400'}`}>
                        {pickupDate
                          ? new Date(pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Select Date"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                        {pickupTime || "Select Time"}
                      </span>
                    </div>
                    <div className="ml-auto text-blue-900/40 transform group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </motion.div>

                {/* Return Section */}
                <motion.div
                  className="flex flex-col cursor-pointer group"
                  onClick={() => { setCalendarTarget('dropoff'); setIsCalendarOpen(true); }}
                  whileTap={{ scale: 0.98 }}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                >
                  <label className="text-[11px] font-bold text-gray-500 mb-2 ml-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5 text-[#1C205C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Return Details
                  </label>
                  <div className="w-full bg-gray-50 group-hover:bg-blue-50/50 rounded-2xl px-4 py-3 border border-transparent group-hover:border-blue-200 transition-all duration-300 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1C205C]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold block ${dropoffDate ? 'text-[#1C205C]' : 'text-gray-400'}`}>
                        {dropoffDate
                          ? new Date(dropoffDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Select Date"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                        {dropoffTime || "Select Time"}
                      </span>
                    </div>
                    <div className="ml-auto text-blue-900/40 transform group-hover:translate-x-1 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(28, 32, 92, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="w-full mt-5 py-3.5 bg-gradient-to-r from-[#1C205C] to-[#2a3085] text-white rounded-2xl font-bold text-sm shadow-[0_10px_20px_-5px_rgba(28,32,92,0.3)] flex items-center justify-center gap-2 group transition-all relative overflow-hidden"
                onClick={handleBookingSearch}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                <span>Find Details</span>
                <div className="bg-white/20 rounded-full p-1 group-hover:translate-x-1 transition-transform duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
              </motion.button>
            </div>
          </motion.div>


          {/* CATEGORY IMAGE CARDS */}
          <motion.div
            className="bg-white rounded-3xl px-3 pt-3 pb-4 shadow-lg border border-gray-100 hidden md:block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={`skel-cat-${index}`} className="flex-shrink-0 w-24">
                    <div className="w-24 h-20 rounded-xl mb-2 bg-gray-200 animate-pulse shadow-sm"></div>
                    <div className="flex flex-col items-start gap-1">
                      <div className="w-16 h-3 bg-gray-200 animate-pulse rounded"></div>
                      <div className="w-10 h-2 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                ))
                : categories.map((cat, index) => (
                  <motion.button
                    key={cat.id}
                    type="button"
                    className="flex-shrink-0 w-24"
                    onClick={() => {
                      // Navigate to category page
                      // Use carType if available, otherwise convert label to lowercase
                      const categoryName = cat.carType
                        ? cat.carType.toLowerCase()
                        : (cat.label || '').toLowerCase().replace(/\s+/g, '-');
                      navigate(`/category/${categoryName}`);
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-24 h-20 rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-md">
                      <img
                        src={cat.image}
                        alt={cat.label}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-gray-900">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {cat.count} cars
                      </span>
                    </div>
                  </motion.button>
                ))}
            </div>
          </motion.div>

          {/* TOP BRANDS SECTION */}
          <motion.div
            className="mb-6 px-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4 pr-1">
              <h2 className="text-xl font-bold text-[#1C205C]">Our Premium Fleet</h2>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 tracking-wider uppercase border border-gray-200/50">
                World Class
              </span>
            </div>

            <div className="relative overflow-hidden w-full -mx-1 px-1">
              {/* Fade masks */}
              <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

              <div className={`flex gap-4 py-2 ${isLoading ? "overflow-hidden" : "brands-scroll"}`}>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={`skel-brand-${index}`} className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse border border-gray-100"></div>
                      <div className="w-12 h-3 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  ))
                  : brands.concat(brands).map((brand, index) => (
                    <div
                      key={`${brand.id}-${index}`}
                      className="flex flex-col items-center gap-2 shrink-0 group"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center p-4 transition-all duration-300">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain filter grayscale contrast-125 opacity-70 transition-all duration-300"
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 transition-colors">
                        {brand.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <style>{`
              .brands-scroll {
                animation: scrollBrands 40s linear infinite;
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
              @keyframes shimmer {
                100% {
                  transform: translateX(100%);
                }
              }
            `}</style>
          </motion.div>

          {/* BANNER SECTION - Mobile Only (Reused Component) */}
          <div className="block md:hidden mt-2 px-1">
            <ReturningCarBanner />
          </div>

          {/* BEST CARS GRID */}
          {/* BEST CARS GRID */}
          {/* BEST CARS GRID */}
          <motion.div
            className="mt-4 px-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Best Cars</h2>
            </div>

            {/* Car Cards Slide 1 (Top Slider) - Alternating index % 2 === 0 */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0 mb-4">
              {isLoading
                ? Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={`skel-best-top-${index}`}
                    className="w-[170px] min-w-[170px] flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                  >
                    <div className="w-full h-28 md:h-40 bg-gray-200 animate-pulse" />
                    <div className="p-2 md:p-3">
                      <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded mb-2" />
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-3 bg-gray-200 animate-pulse rounded" />
                        <div className="w-12 h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="w-12 h-3 bg-gray-200 animate-pulse rounded" />
                        <div className="w-16 h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))
                : (filteredBestCars.length ? filteredBestCars : bestCars)
                    .filter((_, idx) => idx % 2 === 0)
                    .map((car, index) => (
                  <motion.div
                    key={car.id}
                    className="w-[170px] min-w-[170px] flex-shrink-0 rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                    onClick={() => navigate(`/car-details/${car.id}`)}
                  >
                    <div
                      className="relative w-full h-28 md:h-40 flex items-center justify-center rounded-t-xl overflow-hidden"
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      <motion.img
                        alt={car.name}
                        src={car.image}
                        className="w-full h-full object-contain z-10"
                        style={{ opacity: 1 }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.25, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.35, rotate: 2 }}
                      />
                      <button
                        className="absolute -top-1 left-1.5 md:-top-1 md:left-3 z-10 md:w-10 md:h-10 md:rounded-full md:bg-white md:bg-opacity-80 md:flex md:items-center md:justify-center touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          const wasFav = toggleFavorite(car);
                          if (wasFav) {
                            setAnimatingStates((prev) => ({
                              ...prev,
                              [car.id]: true,
                            }));
                            setTimeout(() => {
                              setAnimatingStates((prev) => ({
                                ...prev,
                                [car.id]: false,
                              }));
                            }, 800);
                          }
                        }}
                      >
                        <div className="like-button-container" style={{ width: '24px', height: '24px' }}>
                          <div className="sparkles-container">
                            {[...Array(8)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`sparkle-burst ${animatingStates[car.id] ? 'active' : ''}`} 
                                style={{ '--angle': `${i * 45}deg` }} 
                              />
                            ))}
                          </div>

                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-200 ${
                              isFavorite(car.id) 
                                ? "text-red-500 heart-icon liked" 
                                : "text-white md:text-gray-700 heart-icon"
                            }`}
                            fill={isFavorite(car.id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            style={{ overflow: 'visible' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                    <div className="p-2 md:p-3 lg:p-4">
                      <h3 className="text-xs md:text-sm lg:text-base font-bold text-black mb-1 md:mb-1.5">
                        {car.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1 md:mb-1.5">
                        <span className="text-xs md:text-sm font-semibold text-black">
                          {car.rating}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 md:w-4 md:h-4"
                          fill="#FF6B35"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                        <svg
                          className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
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
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {car.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 md:mt-2">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                            />
                          </svg>
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.seats}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              }
            </div>

            {/* Car Cards Slide 2 (Bottom Slider) - Alternating index % 2 === 1 */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0 mb-6">
              {isLoading
                ? Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={`skel-best-bottom-${index}`}
                    className="w-[170px] min-w-[170px] flex-shrink-0 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                  >
                    <div className="w-full h-28 md:h-40 bg-gray-200 animate-pulse" />
                    <div className="p-2 md:p-3">
                      <div className="w-3/4 h-4 bg-gray-200 animate-pulse rounded mb-2" />
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-3 bg-gray-200 animate-pulse rounded" />
                        <div className="w-12 h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="w-12 h-3 bg-gray-200 animate-pulse rounded" />
                        <div className="w-16 h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))
                : (filteredBestCars.length ? filteredBestCars : bestCars)
                    .filter((_, idx) => idx % 2 === 1)
                    .map((car, index) => (
                  <motion.div
                    key={car.id}
                    className="w-[170px] min-w-[170px] flex-shrink-0 rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                    onClick={() => navigate(`/car-details/${car.id}`)}
                  >
                    <div
                      className="relative w-full h-28 md:h-40 flex items-center justify-center rounded-t-xl overflow-hidden"
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      <motion.img
                        alt={car.name}
                        src={car.image}
                        className="w-full h-full object-contain z-10"
                        style={{ opacity: 1 }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.25, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.35, rotate: 2 }}
                      />
                      <button
                        className="absolute -top-1 left-1.5 md:-top-1 md:left-3 z-10 md:w-10 md:h-10 md:rounded-full md:bg-white md:bg-opacity-80 md:flex md:items-center md:justify-center touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          const wasFav = toggleFavorite(car);
                          if (wasFav) {
                            setAnimatingStates((prev) => ({
                              ...prev,
                              [car.id]: true,
                            }));
                            setTimeout(() => {
                              setAnimatingStates((prev) => ({
                                ...prev,
                                [car.id]: false,
                              }));
                            }, 800);
                          }
                        }}
                      >
                        <div className="like-button-container" style={{ width: '24px', height: '24px' }}>
                          <div className="sparkles-container">
                            {[...Array(8)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`sparkle-burst ${animatingStates[car.id] ? 'active' : ''}`} 
                                style={{ '--angle': `${i * 45}deg` }} 
                              />
                            ))}
                          </div>

                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-200 ${
                              isFavorite(car.id) 
                                ? "text-red-500 heart-icon liked" 
                                : "text-white md:text-gray-700 heart-icon"
                            }`}
                            fill={isFavorite(car.id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            style={{ overflow: 'visible' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                    <div className="p-2 md:p-3 lg:p-4">
                      <h3 className="text-xs md:text-sm lg:text-base font-bold text-black mb-1 md:mb-1.5">
                        {car.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1 md:mb-1.5">
                        <span className="text-xs md:text-sm font-semibold text-black">
                          {car.rating}
                        </span>
                        <svg
                          className="w-3.5 h-3.5 md:w-4 md:h-4"
                          fill="#FF6B35"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                        <svg
                          className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
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
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {car.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5 md:mt-2">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                            />
                          </svg>
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.seats}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              }
            </div>
          </motion.div>



          {/* FEATURED CAR CARD replaced with Advertising Banners */}
          {(isLoading || (activeBanners && activeBanners.length > 0)) && (
            <motion.div
              className="px-1 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {isLoading ? (
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <div className="w-full h-48 bg-gray-200 animate-pulse" />
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  <Swiper
                    modules={[Pagination, Autoplay]}
                    spaceBetween={0}
                    slidesPerView={1}
                    pagination={activeBanners.length > 1 ? {
                      clickable: true,
                    } : false}
                    autoplay={activeBanners.length > 1 ? {
                      delay: 4500,
                      disableOnInteraction: false,
                    } : false}
                    speed={500}
                    loop={activeBanners.length > 1}
                    className="w-full h-48"
                  >
                    {activeBanners.map((banner, index) => {
                      const targetCarId = banner.linkedCar?._id || banner.linkedCar;
                      return (
                        <SwiperSlide key={banner._id || index} className="!w-full">
                          <div
                            className={`w-full h-full relative ${targetCarId ? 'cursor-pointer' : ''}`}
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
                </div>
              )}
            </motion.div>
          )}




          {/* NEARBY CARS SECTION (horizontal cards) */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Nearby Cars</h2>
              <motion.button
                type="button"
                className="text-sm text-gray-600 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/search")}
              >
                View All
              </motion.button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0">
              {(filteredNearbyCars.length ? filteredNearbyCars : nearbyCars).map((car, index) => (
                <motion.div
                  key={car.id}
                  className="w-[170px] min-w-[170px] flex-shrink-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <motion.div
                    className="w-full rounded-xl overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                    onClick={() => navigate(`/car-details/${car.id}`)}
                  >
                    <div
                      className="relative w-full h-28 flex items-center justify-center rounded-t-xl overflow-hidden"
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      <motion.img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-contain z-10"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.25, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.35, rotate: 2 }}
                      />
                      <button
                        className="absolute -top-1 left-1.5 md:-top-1 md:left-3 z-10 md:w-10 md:h-10 md:rounded-full md:bg-white md:bg-opacity-80 md:flex md:items-center md:justify-center touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          const wasFav = toggleFavorite(car);
                          if (wasFav) {
                            setAnimatingStates((prev) => ({
                              ...prev,
                              [car.id]: true,
                            }));
                            setTimeout(() => {
                              setAnimatingStates((prev) => ({
                                ...prev,
                                [car.id]: false,
                              }));
                            }, 800);
                          }
                        }}
                      >
                        <div className="like-button-container" style={{ width: '24px', height: '24px' }}>
                          <div className="sparkles-container">
                            {[...Array(8)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`sparkle-burst ${animatingStates[car.id] ? 'active' : ''}`} 
                                style={{ '--angle': `${i * 45}deg` }} 
                              />
                            ))}
                          </div>
                          
                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-200 ${
                              isFavorite(car.id) 
                                ? "text-red-500 heart-icon liked" 
                                : "text-white md:text-gray-700 heart-icon"
                            }`}
                            fill={isFavorite(car.id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            style={{ overflow: 'visible' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                    <div className="p-2 md:p-3">
                      <h3 className="text-xs md:text-sm font-bold text-black mb-1">
                        {car.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs md:text-sm font-semibold text-black">
                          {car.rating}
                        </span>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="#FF6B35"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 mb-1.5">
                        <svg
                          className="w-3 h-3 text-gray-500"
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
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {car.location}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                            />
                          </svg>
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.seats}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {car.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* BOTTOM NAVIGATION (reuse existing) */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavbar />
      </div>

      {/* UNIFIED DATE-TIME PICKER MODAL (Replaces separate Calendar & Time Modals) */}
      {/* UNIFIED DATE-TIME PICKER MODAL (Replaces separate Calendar & Time Modals) */}
      {
        isCalendarOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-[340px] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4">
                {/* Time Section */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "rgb(28, 32, 92)" }}>Time</label>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                      setTimePickerMode('hour');
                      setIsTimeOpen(true);
                    }}
                      className="w-auto px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ borderColor: "rgb(28, 32, 92)", backgroundColor: "rgb(28, 32, 92)", color: "rgb(255, 255, 255)" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span className="font-semibold text-sm">{`${selectedHour}:${selectedMinute} ${selectedPeriod}`}</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Section */}
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100" onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h4 className="text-base font-semibold" style={{ color: "rgb(28, 32, 92)" }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100" onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentMonth(newDate);
                    }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="text-center text-xs font-semibold py-1" style={{ color: "rgb(102, 102, 102)" }}>{day}</div>
                    ))}

                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = d < today;

                      const isSelected = (calendarTarget === 'pickup' && pickupDate === dateString) ||
                        (calendarTarget === 'dropoff' && dropoffDate === dateString);

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${isPast ? 'cursor-not-allowed bg-transparent text-gray-300' :
                            isSelected ? 'bg-[#1C205C] text-white shadow-md' : 'bg-transparent text-[#1C205C] hover:bg-gray-100'
                            }`}
                          onClick={() => {
                            if (calendarTarget === 'pickup') setPickupDate(dateString);
                            else setDropoffDate(dateString);
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "rgb(28, 32, 92)", backgroundColor: "rgb(255, 255, 255)", color: "rgb(28, 32, 92)" }}
                    onClick={() => setIsCalendarOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "rgb(28, 32, 92)" }}
                    onClick={() => {
                      // Confirm Time selection to state
                      const timeStr = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
                      if (calendarTarget === 'pickup') setPickupTime(timeStr);
                      else setDropoffTime(timeStr);
                      setIsCalendarOpen(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Filters popup - Using shared FilterDropdown component */}
      <FilterDropdown
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        brands={filterOptions.brands}
        fuelTypes={filterOptions.fuelTypes}
        transmissions={filterOptions.transmissions}
        colorsList={filterOptions.colors}
        carTypes={filterOptions.carTypes}
        featuresList={filterOptions.features}
        seatOptions={filterOptions.seats}
        ratingOptions={filterOptions.ratings}
        locations={filterOptions.locations}
      />

      {/* TIME PICKER OVERLAY MODAL */}
      {
        isTimeOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[130] bg-black/40"
              onClick={() => setIsTimeOpen(false)}
            />

            {/* Time Picker Modal */}
            <div
              className="fixed z-[140] shadow-2xl bg-white rounded-2xl"
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
                    {parseInt(selectedHour, 10) || 12}
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
                      onClick={() => setSelectedPeriod('AM')}
                      className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'AM' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'} border-b border-[#79747E]`}
                    >
                      AM
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('PM')}
                      className={`px-3 py-[10px] text-[13px] font-bold transition-colors ${selectedPeriod === 'PM' ? 'bg-[#EADDFF] text-[#4F378B]' : 'bg-white text-[#49454f] hover:bg-gray-100'}`}
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
                    
                    const selectedVal = timePickerMode === 'hour' ? (parseInt(selectedHour, 10) || 12) : (parseInt(selectedMinute, 10) || 0);
                    
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
                          
                          let isSelected = false;
                          if (timePickerMode === 'hour') {
                            isSelected = (parseInt(selectedHour, 10) || 12) === val;
                          } else {
                            isSelected = (parseInt(selectedMinute, 10) || 0) === val;
                          }
                          
                          return (
                            <div
                              key={val}
                              onClick={() => {
                                if (timePickerMode === 'hour') {
                                  const valHour = val === 0 ? 12 : val;
                                  setSelectedHour(String(valHour).padStart(2, '0'));
                                  setTimePickerMode('minute'); // Auto switch to minute
                                } else {
                                  setSelectedMinute(String(val).padStart(2, '0'));
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
                  <path d="M20,5H4C2.895,5,2,5.895,2,7v10c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V7C22,5.895,21.105,5,20,5z M11,8h2v2h-2V8z M11,11h2v2h-2V11z M8,8h2v2H8V8z M8,11h2v2H8V11z M5,8h2v2H5V8z M5,11h2v2H5V11z M16,16H8v-2h8V16z M14,11h2v2h-2V11z M14,8h2v2h-2V8z M17,11h2v2h-2V11z M17,8h2v2h-2V8z"/>
                </svg>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTimeOpen(false)}
                    className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTimeOpen(false)}
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
    </div >
  );
};


export default ModuleTestPage;


