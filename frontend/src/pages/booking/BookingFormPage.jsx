import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2-removebg-preview.png';
import carImg3 from '../../assets/car_img3-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg7 from '../../assets/car_img7-removebg-preview.png';
import toastUtils from '../../config/toast';
import { commonService } from '../../services/common.service';

/**
 * BookingFormPage Component
 * Booking form page - Mobile-optimized with all booking fields
 * Based on document.txt booking flow requirements
 */
const BookingFormPage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  // Form state
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropDate, setDropDate] = useState('');
  const [dropTime, setDropTime] = useState('');
  const [paymentOption, setPaymentOption] = useState('full'); // 'full' or 'advance'
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
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

  // Custom calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null); // 'pickup' | 'drop'
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(null);

  // Mock car data
  const carsData = {
    '1': { id: '1', brand: 'Tesla', model: 'Model X', price: 180, image: carImg1 },
    '2': { id: '2', brand: 'Mercedes-Benz', model: 'S-Class', price: 220, image: carImg2 },
    '3': { id: '3', brand: 'BMW', model: '7 Series', price: 200, image: carImg3 },
    '4': { id: '4', brand: 'Audi', model: 'A8 L', price: 210, image: carImg4 },
    '5': { id: '5', brand: 'Jaguar', model: 'XF', price: 175, image: carImg5 },
    '6': { id: '6', brand: 'Lexus', model: 'LS 500', price: 195, image: carImg6 },
    '7': { id: '7', brand: 'Porsche', model: 'Panamera', price: 250, image: carImg7 },
  };

  const car = carsData[carId];

  // Calculate dynamic price
  const calculatePrice = () => {
    if (!pickupDate || !dropDate) return { basePrice: 0, totalDays: 0, totalPrice: 0 };

    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);
    const diffTime = Math.abs(drop - pickup);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const basePrice = car?.price || 0;
    let totalPrice = basePrice * totalDays;


    const advanceVal = totalPrice * (advancePercentage / 100);
    return {
      basePrice,
      totalDays,
      totalPrice: Math.round(totalPrice),
      advancePayment: Math.round(advanceVal),
      remainingPayment: Math.round(totalPrice - advanceVal),
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
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
        location,
        specialRequests,
        guarantorName,
        guarantorPhone,
        guarantorEmail,
        hasGuarantor,
        priceDetails,
      },
    });
  };

  useEffect(() => {
    if (!car) {
      navigate('/cars');
    }
  }, [car, navigate]);

  if (!car) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-white relative">
      {/* Header */}
      <header className="text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 md:p-2 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Book Car</h1>
              <div className="w-8 md:w-12"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Car Summary Card */}
      <div className="px-4 pt-4 pb-2 md:pt-6 md:pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-5 flex items-center gap-3 md:gap-4 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
            <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
            <div className="flex-1">
              <h3 className="font-bold text-base md:text-lg" style={{ color: theme.colors.textPrimary }}>{car.brand} {car.model}</h3>
              <p className="text-sm md:text-base" style={{ color: theme.colors.textSecondary }}>Rs. {car.price} /day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="px-4 py-4 md:py-6 space-y-4 md:space-y-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-5">
              {/* Date & Time Selection */}
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 space-y-4 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
                <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4" style={{ color: theme.colors.primary }}>Select Date & Time</h2>
          
                {/* Pickup Date & Time */}
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium" style={{ color: theme.colors.textSecondary }}>Pickup Date & Time</label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => openCalendar('pickup')}
                      className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors"
                      style={{
                        borderColor: theme.colors.borderDefault,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      <span className={pickupDate ? '' : 'text-gray-400'}>
                        {pickupDate ? formatDisplayDate(pickupDate) : 'Pickup Date'}
                      </span>
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
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors"
                      style={{ 
                        borderColor: theme.colors.borderDefault,
                        color: theme.colors.textPrimary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                      required
                    />
                  </div>
                </div>

                {/* Drop Date & Time */}
                <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium" style={{ color: theme.colors.textSecondary }}>Drop Date & Time</label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <button
                      type="button"
                      onClick={() => openCalendar('drop')}
                      className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors"
                      style={{
                        borderColor: theme.colors.borderDefault,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      <span className={dropDate ? '' : 'text-gray-400'}>
                        {dropDate ? formatDisplayDate(dropDate) : 'Drop Date'}
                      </span>
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
                    <input
                      type="time"
                      value={dropTime}
                      onChange={(e) => setDropTime(e.target.value)}
                      className="px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors"
                      style={{ 
                        borderColor: theme.colors.borderDefault,
                        color: theme.colors.textPrimary,
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Option */}
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
                <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4" style={{ color: theme.colors.primary }}>Payment Option</h2>
                <div className="space-y-2 md:space-y-3">
                  <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer border-2 transition-all hover:bg-gray-50" style={{ borderColor: paymentOption === 'full' ? theme.colors.primary : theme.colors.borderLight }}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="full"
                      checked={paymentOption === 'full'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className="w-4 h-4 md:w-5 md:h-5"
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm md:text-base" style={{ color: theme.colors.textPrimary }}>Full Payment</span>
                      <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>Pay complete amount upfront</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer border-2 transition-all hover:bg-gray-50" style={{ borderColor: paymentOption === 'advance' ? theme.colors.primary : theme.colors.borderLight }}>
                    <input
                      type="radio"
                      name="paymentOption"
                      value="advance"
                      checked={paymentOption === 'advance'}
                      onChange={(e) => setPaymentOption(e.target.value)}
                      className="w-4 h-4 md:w-5 md:h-5"
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm md:text-base" style={{ color: theme.colors.textPrimary }}>{advancePercentage}% Advance Payment</span>
                      <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>Pay {advancePercentage}% now, rest later in office</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 md:space-y-5">

              {/* Price Breakdown */}
              {priceDetails.totalDays > 0 && (
                <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
                  <h2 className="font-semibold text-base md:text-lg mb-3 md:mb-4" style={{ color: theme.colors.primary }}>Price Breakdown</h2>
                  <div className="space-y-2 md:space-y-3 text-sm md:text-base">
                    <div className="flex justify-between" style={{ color: theme.colors.textSecondary }}>
                      <span>Base Price ({priceDetails.totalDays} {priceDetails.totalDays === 1 ? 'day' : 'days'})</span>
                      <span className="font-medium">Rs. {priceDetails.basePrice * priceDetails.totalDays}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 md:pt-3 border-t text-base md:text-lg" style={{ color: theme.colors.primary, borderColor: theme.colors.borderLight }}>
                      <span>Total Amount</span>
                      <span>Rs. {priceDetails.totalPrice}</span>
                    </div>
                    {paymentOption === 'advance' && (
                      <>
                        <div className="flex justify-between font-semibold pt-2 md:pt-3 border-t text-base md:text-lg" style={{ color: theme.colors.primary, borderColor: theme.colors.borderLight }}>
                          <span>Advance Payment ({advancePercentage}%)</span>
                          <span>Rs. {priceDetails.advancePayment}</span>
                        </div>
                        <div className="flex justify-between text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                          <span>Remaining Amount</span>
                          <span>Rs. {priceDetails.remainingPayment}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}


              {/* Special Requests */}
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
                <label className="text-sm md:text-base font-medium mb-2 md:mb-3 block" style={{ color: theme.colors.textSecondary }}>Special Requests (Optional)</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white border text-sm md:text-base focus:outline-none transition-colors resize-none"
                  style={{ 
                    borderColor: theme.colors.borderDefault,
                    color: theme.colors.textPrimary,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Terms & Conditions */}
              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow border" style={{ borderColor: theme.colors.borderLight }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 md:w-5 md:h-5 mt-0.5 rounded"
                    style={{ accentColor: theme.colors.primary }}
                    required
                  />
                  <span className="text-sm md:text-base" style={{ color: theme.colors.textSecondary }}>
                    I agree to the <Link to="/terms" className="font-semibold hover:underline text-purple-600" onClick={(e) => e.stopPropagation()}>terms and conditions</Link>, <Link to="/privacy-policy" className="font-semibold hover:underline text-purple-600" onClick={(e) => e.stopPropagation()}>privacy policy</Link>, and rental agreement. I understand that I am responsible for the vehicle during the rental period. <span className="text-red-500 font-semibold">*</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-white/20 px-4 md:px-6 py-4 md:py-5 z-50 shadow-2xl" style={{ backgroundColor: theme.colors.primary }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between max-w-md md:max-w-none md:justify-center md:gap-6 mx-auto">
              <div className="flex flex-col">
                <span className="text-lg md:text-2xl font-bold text-white">
                  Rs. {paymentOption === 'advance' ? priceDetails.advancePayment : priceDetails.totalPrice}
                </span>
                <span className="text-xs md:text-sm text-white/80">
                  {paymentOption === 'advance' ? 'Advance Payment' : 'Total Amount'}
                </span>
              </div>
              <button
                type="submit"
                disabled={!agreeToTerms}
                className="px-8 md:px-10 py-3.5 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-base shadow-xl touch-target active:scale-95 transition-transform hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: '#ffffff',
                  color: theme.colors.primary,
                  boxShadow: '0 4px 14px 0 rgba(255, 255, 255, 0.3)',
                }}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Calendar Modal - Mobile friendly */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden">
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
                        ? 'bg-primary text-white'
                        : 'text-gray-800 hover:bg-gray-100'
                    } ${isToday && !isSelected ? 'border border-primary/40' : ''}`}
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
    </div>
  );
};

export default BookingFormPage;

