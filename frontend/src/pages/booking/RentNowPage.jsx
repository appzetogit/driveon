import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import { carService } from '../../services/car.service';
import { couponService } from '../../services/coupon.service';
import { commonService } from '../../services/common.service';
import toastUtils from '../../config/toast';

/**
 * RentNowPage Component
 * Booking page that opens when "Rent Now" is clicked from car details page
 * Based on document.txt booking flow requirements
 * Responsive for both mobile and web views
 */
const RentNowPage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [paymentOption, setPaymentOption] = useState('advance'); // Only 'advance' option available
  const [specialRequests, setSpecialRequests] = useState('');
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Custom calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null); // 'pickup' | 'drop'
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);

  // Custom time picker modal state
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('hour');
  const [timePickerTarget, setTimePickerTarget] = useState(null); // 'pickup' | 'drop'
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('am'); // 'am' | 'pm'

  // Fetch car details from backend
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!carId) {
        setError('Car ID is required');
        setLoading(false);
        return;
      }

      // Check if it's a mock car ID (like "car1", "car2", etc.)
      // If it is, use mock data directly without API call
      if (carId.startsWith('car')) {
        const carNumber = parseInt(carId.replace(/\D/g, '')) || 1;
        
        // Create mock car data based on car number
        const mockCarData = {
          id: carId,
          brand: ['Toyota', 'Honda', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Ford'][(carNumber - 1) % 7] || 'Car',
          model: ['Camry', 'City', 'Swift', 'i20', 'Nexon', 'XUV700', 'EcoSport'][(carNumber - 1) % 7] || 'Model',
          variant: '',
          year: new Date().getFullYear(),
          price: [3500, 3200, 1800, 2800, 2600, 2750, 3000][(carNumber - 1) % 7] || 2500,
          images: null,
          seats: 5,
          transmission: 'Manual',
          fuelType: 'Petrol',
          color: 'White',
          carType: 'Sedan',
          rating: [4.7, 4.8, 4.4, 4.3, 4.9, 4.6, 4.5][(carNumber - 1) % 7] || 4.5,
          location: 'Mumbai, Maharashtra',
          ownerName: 'DriveOn Premium',
          ownerRating: 4.5,
          description: 'Premium car available for rent.',
          features: ['Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging', 'Leather Seats'],
        };
        
        setCar(mockCarData);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await carService.getCarDetails(carId);
        
        if (response.success && response.data?.car) {
          const carData = response.data.car;
          
          // Format car data for display
          let images = [];
          if (carData.images && Array.isArray(carData.images)) {
            images = carData.images.map(img => {
              if (typeof img === 'string') return img;
              return img.url || img.path || null;
            }).filter(img => img);
          } else if (carData.primaryImage) {
            images = [carData.primaryImage];
          }
          
          const formattedCar = {
            id: carData._id || carData.id,
            brand: carData.brand || '',
            model: carData.model || '',
            variant: carData.variant || carData.model || '',
            year: carData.year || new Date().getFullYear(),
            price: carData.pricePerDay || 0,
            images: images.length > 0 ? images[0] : null,
            seats: carData.seatingCapacity || 5,
            transmission: carData.transmission === 'automatic' ? 'Automatic' : carData.transmission === 'manual' ? 'Manual' : carData.transmission || 'Manual',
            fuelType: carData.fuelType === 'petrol' ? 'Petrol' : carData.fuelType === 'diesel' ? 'Diesel' : carData.fuelType === 'electric' ? 'Electric' : carData.fuelType === 'hybrid' ? 'Hybrid' : carData.fuelType || 'Petrol',
            color: carData.color || 'N/A',
            carType: carData.carType || 'Sedan',
            rating: carData.averageRating || 0,
            location: (() => {
              if (typeof carData.location === 'string') {
                return carData.location;
              } else if (carData.location && typeof carData.location === 'object') {
                const parts = [];
                if (carData.location.city) parts.push(carData.location.city);
                if (carData.location.state) parts.push(carData.location.state);
                return parts.length > 0 ? parts.join(', ') : (carData.location.address || 'N/A');
              }
              return carData.city || 'N/A';
            })(),
            ownerName: carData.owner?.name || 'DriveOn Premium',
            ownerRating: carData.owner?.rating || 4.5,
            description: carData.description || 'Premium car available for rent.',
            features: carData.features || ['Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Charging', 'Leather Seats'],
          };
          
          setCar(formattedCar);
        } else {
          setError('Car not found');
          // Don't show toast for now since backend might not be ready
        }
      } catch (error) {
        console.error('Error fetching car details:', error);
        // For real car IDs that fail, show error but don't show toast (backend might not be ready)
        setError('Failed to load car details. Please try browsing cars.');
        // Don't show toast to avoid annoying errors when backend is not ready
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId]);

  // Calculate dynamic price based on document.txt requirements
  const calculatePrice = () => {
    if (!pickupDate || !dropDate || !car) return { basePrice: 0, totalDays: 0, totalPrice: 0, advancePayment: 0, remainingPayment: 0, discount: 0, finalPrice: 0 };

    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);
    const diffTime = Math.abs(drop - pickup);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const basePrice = car.price || 0;
    let totalPrice = basePrice * totalDays;

    // Apply coupon discount if available
    const discount = couponDiscount || 0;
    const finalPrice = Math.max(0, totalPrice - discount);

    // Advance payment calculated on final price after discount
    const advancePayment = Math.round(finalPrice * (advancePercentage / 100));
    const remainingPayment = finalPrice - advancePayment;

    return {
      basePrice,
      totalDays,
      totalPrice: Math.round(totalPrice),
      discount: Math.round(discount),
      finalPrice: Math.round(finalPrice),
      advancePayment,
      remainingPayment: Math.round(remainingPayment),
    };
  };

  const priceDetails = calculatePrice();

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helpers for custom calendar
  const openCalendar = (target) => {
    setCalendarTarget(target);
    const existing =
      target === 'pickup'
        ? pickupDate
        : target === 'drop'
        ? dropDate
        : '';
    let baseDate;
    if (existing) {
      baseDate = new Date(existing);
    } else if (target === 'drop' && pickupDate) {
      baseDate = new Date(pickupDate);
    } else {
      baseDate = new Date();
    }
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setCalendarSelectedDate(baseDate);
    setIsCalendarOpen(true);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i += 1) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleCalendarDone = () => {
    if (!calendarSelectedDate || !calendarTarget) {
      setIsCalendarOpen(false);
      return;
    }
    const iso = calendarSelectedDate.toISOString().split('T')[0];
    if (calendarTarget === 'pickup') {
      setPickupDate(iso);
      // if drop date is before pickup, reset it
      if (dropDate && new Date(dropDate) < calendarSelectedDate) {
        setDropDate('');
      }
    } else if (calendarTarget === 'drop') {
      setDropDate(iso);
    }
    setIsCalendarOpen(false);
  };

  // Helpers for custom time picker
  const openTimePicker = (target) => {
    setTimePickerTarget(target);
    const existing =
      target === 'pickup'
        ? pickupTime
        : target === 'drop'
        ? dropTime
        : '';
    
    if (existing) {
      // Parse existing time (HH:MM format)
      const [hour, minute] = existing.split(':').map(Number);
      if (hour >= 12) {
        setSelectedPeriod('pm');
        setSelectedHour(hour === 12 ? 12 : hour - 12);
      } else {
        setSelectedPeriod('am');
        setSelectedHour(hour === 0 ? 12 : hour);
      }
      setSelectedMinute(minute || 0);
    } else {
      setSelectedHour(10);
      setSelectedMinute(30);
      setSelectedPeriod('am');
    }
    setTimePickerMode('hour');
    setIsTimePickerOpen(true);
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':').map(Number);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')} : ${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimePickerDone = () => {
    if (!timePickerTarget) {
      setIsTimePickerOpen(false);
      return;
    }
    
    // Convert to 24-hour format
    let hour24 = selectedHour;
    if (selectedPeriod === 'pm' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'am' && selectedHour === 12) {
      hour24 = 0;
    }
    
    const timeStr = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    
    if (timePickerTarget === 'pickup') {
      setPickupTime(timeStr);
    } else if (timePickerTarget === 'drop') {
      setDropTime(timeStr);
    }
    setIsTimePickerOpen(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toastUtils.error('Please enter a coupon code');
      return;
    }

    if (!car || !car.price) {
      toastUtils.error('Car information not available');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      
      // Calculate total amount (base price per day * number of days)
      // For now, we'll use a simple calculation - you may need to adjust based on your pricing logic
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const dropDateTime = new Date(`${dropDate}T${dropTime}`);
      const days = Math.ceil((dropDateTime - pickupDateTime) / (1000 * 60 * 60 * 24)) || 1;
      const totalAmount = car.price * days;

      const response = await couponService.validateCoupon({
        code: couponCode.trim(),
        amount: totalAmount,
        carId: car._id || car.id,
      });

      if (response.success && response.data) {
        setAppliedCoupon({
          code: response.data.coupon.code,
          discountType: response.data.coupon.discountType,
          discountValue: response.data.coupon.discountValue,
        });
        setCouponDiscount(response.data.discount);
        toastUtils.success(`Coupon "${response.data.coupon.code}" applied successfully!`);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toastUtils.error(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!pickupDate || !dropDate || !pickupTime || !dropTime) {
      toastUtils.error('Please select pickup and drop date & time');
      return;
    }

    if (!agreeToTerms) {
      toastUtils.error('Please agree to terms and conditions');
      return;
    }


    // Navigate to payment page with booking data
    navigate(`/booking/${carId}/payment`, {
      state: {
        car,
        pickupDate,
        pickupTime,
        dropDate,
        dropTime,
        paymentOption,
        specialRequests,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount || 0,
        priceDetails,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
          <p className="text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Car not found'}</p>
          <button
            onClick={() => navigate('/cars')}
            className="px-6 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: theme.colors.primary }}
          >
            Browse Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="text-white relative overflow-hidden sticky top-0 z-40 shadow-lg rounded-b-3xl" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
        </div>
        <div className="relative px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 touch-target hover:bg-white/15 rounded-xl transition-all active:scale-95"
                aria-label="Go back"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Book Your Car</h1>
              <div className="w-10"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Car Summary Card */}
      <div className="px-4 pt-4 pb-3">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-lg border border-gray-100">
            {car.images && (
              <div className="flex-shrink-0">
                <img 
                  src={car.images} 
                  alt={`${car.brand} ${car.model}`} 
                  className="w-24 h-24 object-contain rounded-xl bg-gray-50 p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate mb-0.5" style={{ color: theme.colors.textPrimary }}>
                {car.brand} {car.model}
              </h3>
              {car.variant && (
                <p className="text-xs text-gray-500 truncate mb-2">{car.variant}</p>
              )}
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                  ₹{car.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500">/day</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-600">
                <span className="px-2 py-0.5 bg-gray-100 rounded-md">{car.seats} Seats</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-md">{car.transmission}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-md">{car.fuelType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {/* Date & Time Selection */}
            <div className="bg-white rounded-2xl p-5 space-y-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                <h2 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                  Select Date & Time
                </h2>
              </div>
          
              {/* Pickup Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block" style={{ color: theme.colors.textSecondary }}>
                  Pickup Date & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openCalendar('pickup')}
                    className="px-4 py-3 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all flex items-center justify-between text-left"
                    style={{ 
                      borderColor: theme.colors.borderDefault,
                      color: pickupDate ? theme.colors.textPrimary : '#9ca3af',
                    }}
                  >
                    <span>{pickupDate ? formatDisplayDate(pickupDate) : 'Pickup Date'}</span>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => openTimePicker('pickup')}
                    className="px-4 py-3 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all flex items-center justify-between text-left"
                    style={{ 
                      borderColor: theme.colors.borderDefault,
                      color: pickupTime ? theme.colors.textPrimary : '#9ca3af',
                    }}
                  >
                    <span>{pickupTime ? formatDisplayTime(pickupTime) : 'Pickup Time'}</span>
                    <svg
                      className="w-4 h-4 text-gray-500"
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
                  </button>
                </div>
              </div>

              {/* Drop Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block" style={{ color: theme.colors.textSecondary }}>
                  Drop Date & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openCalendar('drop')}
                    className="px-4 py-3 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all flex items-center justify-between text-left"
                    style={{ 
                      borderColor: theme.colors.borderDefault,
                      color: dropDate ? theme.colors.textPrimary : '#9ca3af',
                    }}
                  >
                    <span>{dropDate ? formatDisplayDate(dropDate) : 'Drop Date'}</span>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => openTimePicker('drop')}
                    className="px-4 py-3 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all flex items-center justify-between text-left"
                    style={{ 
                      borderColor: theme.colors.borderDefault,
                      color: dropTime ? theme.colors.textPrimary : '#9ca3af',
                    }}
                  >
                    <span>{dropTime ? formatDisplayTime(dropTime) : 'Drop Time'}</span>
                    <svg
                      className="w-4 h-4 text-gray-500"
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
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Option */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                <h2 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                  Payment Option
                </h2>
              </div>
              <div className="p-4 rounded-xl border-2" style={{ borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}08` }}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: theme.colors.primary }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-base block" style={{ color: theme.colors.textPrimary }}>{advancePercentage}% Advance Payment</span>
                    <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Pay {advancePercentage}% now, rest later in office</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                <h2 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                  Apply Coupon
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Have a promo code? Apply it here to get discount on your advance payment.
              </p>
              {appliedCoupon && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <p className="text-xs text-green-800">
                    <span className="font-semibold">{appliedCoupon.code}</span> applied! 
                    {couponDiscount > 0 && (
                      <span> You'll save ₹{couponDiscount}</span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponDiscount(0);
                      setCouponCode('');
                    }}
                    className="ml-2 p-1 hover:bg-green-100 rounded-full transition-colors"
                    aria-label="Remove coupon"
                  >
                    <svg
                      className="w-4 h-4 text-green-700"
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
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    // Reset applied coupon when user types
                    if (appliedCoupon) {
                      setAppliedCoupon(null);
                      setCouponDiscount(0);
                    }
                  }}
                  placeholder="Enter coupon code"
                  disabled={!!appliedCoupon}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: appliedCoupon ? theme.colors.primary : theme.colors.borderDefault,
                    color: theme.colors.textPrimary,
                  }}
                  onFocus={(e) => {
                    if (!appliedCoupon) {
                      e.target.style.borderColor = theme.colors.primary;
                      e.target.style.backgroundColor = 'white';
                      e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!appliedCoupon) {
                      e.target.style.borderColor = theme.colors.borderDefault;
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="text-sm font-semibold mb-3 block" style={{ color: theme.colors.textSecondary }}>
                Special Requests <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 text-sm focus:outline-none transition-all resize-none"
                style={{ 
                  borderColor: theme.colors.borderDefault,
                  color: theme.colors.textPrimary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.primary;
                  e.target.style.backgroundColor = 'white';
                  e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.borderDefault;
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Any special requests or notes..."
              />
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded flex-shrink-0 transition-all"
                  style={{ accentColor: theme.colors.primary }}
                  required
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I agree to the <Link to="/terms" className="font-semibold hover:underline text-purple-600" onClick={(e) => e.stopPropagation()}>terms and conditions</Link>, <Link to="/privacy-policy" className="font-semibold hover:underline text-purple-600" onClick={(e) => e.stopPropagation()}>privacy policy</Link>, and rental agreement. I understand that I am responsible for the vehicle during the rental period and will allow live tracking during the trip. <span className="text-red-500 font-semibold">*</span>
                </span>
              </label>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-lg border-2" style={{ borderColor: theme.colors.primary + '30' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                <h2 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                  Price Breakdown
                </h2>
              </div>
              {priceDetails.totalDays > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm" style={{ color: theme.colors.textSecondary }}>
                    <span>Base Price ({priceDetails.totalDays} {priceDetails.totalDays === 1 ? 'day' : 'days'})</span>
                    <span className="font-semibold">₹{(priceDetails.basePrice * priceDetails.totalDays).toLocaleString('en-IN')}</span>
                  </div>
                  {priceDetails.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon Discount</span>
                      <span className="font-semibold">-₹{priceDetails.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-3 border-t-2 text-lg" style={{ color: theme.colors.primary, borderColor: theme.colors.borderLight }}>
                    <span>Total Amount</span>
                    <span>₹{priceDetails.finalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-3 border-t text-base" style={{ color: theme.colors.textPrimary, borderColor: theme.colors.borderLight }}>
                     <span>Advance Payment ({advancePercentage}%)</span>
                     <span>₹{priceDetails.advancePayment.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1" style={{ color: theme.colors.textSecondary }}>
                    <span>Remaining Amount</span>
                    <span>₹{priceDetails.remainingPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Select dates to see price breakdown</p>
                </div>
              )}
            </div>

            {/* Car Features */}
            {car.features && car.features.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                  <h2 className="font-bold text-lg" style={{ color: theme.colors.textPrimary }}>
                    Car Features
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {car.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Calendar Modal - Mobile friendly */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40" onClick={() => setIsCalendarOpen(false)}>
          <div className="w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {calendarTarget === 'pickup' ? 'Pickup Date' : 'Drop Date'}
              </span>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Month header */}
            <div className="px-4 pt-2 pb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                  )
                }
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                  )
                }
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Week days */}
            <div className="px-4 pt-1 grid grid-cols-7 text-center text-[11px] text-gray-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Days grid */}
            <div className="px-3 pb-3 pt-1 grid grid-cols-7 gap-1.5 text-sm">
              {getCalendarDays().map((date, idx) => {
                if (!date) return <div key={idx} />;

                const isSelected =
                  calendarSelectedDate &&
                  date.toDateString() === calendarSelectedDate.toDateString();

                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();

                const minDate = new Date(getMinDate());
                const isDisabled =
                  (calendarTarget === 'pickup' && date < minDate) ||
                  (calendarTarget === 'drop' &&
                    (date < minDate || (pickupDate && date < new Date(pickupDate))));

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setCalendarSelectedDate(date)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs md:text-sm ${
                      isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    } ${isToday && !isSelected ? 'border border-gray-300' : ''}`}
                    style={
                      isSelected
                        ? { backgroundColor: theme.colors.primary }
                        : undefined
                    }
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCalendarDone}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker Modal - Mobile friendly */}
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
                {timePickerTarget === 'pickup' ? 'Select Pickup Time' : 'Select Drop Time'}
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
                <path d="M20,5H4C2.895,5,2,5.895,2,7v10c0,1.105,0.895,2,2,2h16c1.105,0,2-0.895,2-2V7C22,5.895,21.105,5,20,5z M11,8h2v2h-2V8z M11,11h2v2h-2V11z M8,8h2v2H8V8z M8,11h2v2H8V11z M5,8h2v2H5V8z M5,11h2v2H5V11z M16,16H8v-2h8V16z M14,11h2v2h-2V11z M14,8h2v2h-2V8z M17,11h2v2h-2V11z M17,8h2v2h-2V8z"/>
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
                  onClick={handleTimePickerDone}
                  className="font-bold text-sm text-[#4F378B] hover:bg-[#EADDFF]/50 px-4 py-2 rounded-3xl tracking-wide"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submit Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 z-50 shadow-2xl backdrop-blur-lg bg-white/95 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  ₹{priceDetails.totalDays > 0 ? priceDetails.advancePayment.toLocaleString('en-IN') : (car?.price || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-500">
                  {priceDetails.totalDays > 0 ? 'Advance Payment' : '/day'}
                </span>
              </div>
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!agreeToTerms}
              className="px-8 py-4 rounded-2xl font-bold text-base shadow-lg touch-target active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                backgroundColor: agreeToTerms ? theme.colors.primary : '#cbd5e1',
                color: '#ffffff',
                boxShadow: agreeToTerms ? `0 4px 20px ${theme.colors.primary}40` : 'none',
              }}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentNowPage;

