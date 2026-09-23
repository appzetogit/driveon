import { useEffect, useMemo, useState, useRef } from 'react';
import { colors } from '../../module/theme/colors';
import api from '../../services/api';
import { Button } from '../../components/common';
import { commonService } from '../../services/common.service';
import {
  getDaysBetween,
  getDaysBetweenWithTime,
  isValidDateRange,
  rangesOverlapInclusive,
} from '../utils/fleetDateUtils';

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const BookingModal = ({ open, onClose, car, existingBookings, onConfirm }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [customerImage, setCustomerImage] = useState(null);
  const [customerImagePreview, setCustomerImagePreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [activeCameraField, setActiveCameraField] = useState(null);
  // Payment fields — simplified
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'razorpay'
  const [paymentType, setPaymentType] = useState('advance'); // 'advance' | 'full'
  const [deposit, setDeposit] = useState('');
  const [cashCollectors, setCashCollectors] = useState([]);
  const [cashCollector, setCashCollector] = useState('');
  const [advancePercentage, setAdvancePercentage] = useState(20); // Dynamic from settings
  const settingsPercentageRef = useRef(20);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // KYC states
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarRequestId, setAadhaarRequestId] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseDob, setLicenseDob] = useState('');
  const [isDlVerified, setIsDlVerified] = useState(false);
  const [isKycLoading, setIsKycLoading] = useState(false);

  // PAN states
  const [panNumber, setPanNumber] = useState('');
  const [isPanVerified, setIsPanVerified] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Scroll lock when modal open ──────────────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveCameraField(null);
    setShowCamera(false);
  };

  const startCamera = async (field = 'customer') => {
    setError('');
    setActiveCameraField(field);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 50);
    } catch (err) {
      setError('Could not access camera. Please check permissions or select a file instead.');
      setActiveCameraField(null);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    if (activeCameraField === 'customer') { setCustomerImagePreview(dataUrl); setCustomerImage(dataUrl); }
    stopCamera();
  };

  const onPickCustomerImage = async (file) => {
    setError('');
    if (!file) { setCustomerImage(null); setCustomerImagePreview(''); return; }
    try {
      const url = await fileToDataUrl(file);
      setCustomerImage(file); setCustomerImagePreview(String(url || ''));
    } catch (e) { setCustomerImage(null); setCustomerImagePreview(''); setError(e?.message || 'Failed to load image'); }
  };

  // PAN image upload removed

  // DL image upload removed

  // Aadhaar image upload removed

  // KYC functions
  const sendAadhaarOtp = async () => {
    setError('');
    if (!aadhaarNumber || aadhaarNumber.length !== 12) { setError('Please enter a valid 12-digit Aadhaar number'); return; }
    setIsKycLoading(true);
    try {
      const response = await api.post('/fleet/kyc/aadhaar/generate-otp', { aadhaarNo: aadhaarNumber });
      if (response.data.success) { setAadhaarRequestId(response.data.data.requestId); setAadhaarOtpSent(true); }
      else setError(response.data.message || 'Failed to send Aadhaar OTP');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send Aadhaar OTP. Please try again.'); }
    finally { setIsKycLoading(false); }
  };

  const verifyAadhaarOtp = async () => {
    setError('');
    setIsKycLoading(true);
    try {
      const response = await api.post('/fleet/kyc/aadhaar/verify-otp', { requestId: aadhaarRequestId, otp: aadhaarOtp });
      if (response.data.success) setIsAadhaarVerified(true);
      else setError(response.data.message || 'Aadhaar OTP verification failed');
    } catch (err) { setError(err.response?.data?.message || 'Aadhaar verification failed. Please try again.'); }
    finally { setIsKycLoading(false); }
  };

  const verifyDlKyc = async () => {
    setError('');
    const cleanLicenseNumber = licenseNumber.trim();
    if (!cleanLicenseNumber) { setError('Please enter a valid Driving License number'); return; }

    const dlRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}-[0-9]{4}-[0-9]{7}$/;
    if (!dlRegex.test(cleanLicenseNumber)) {
      setError('Please enter driving license in correct format: e.g. MP41N-2021-0522258');
      alert('Invalid data');
      return;
    }

    if (!licenseDob) { setError('Please enter Date of Birth'); return; }
    const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})$/;
    if (!dateRegex.test(licenseDob)) {
      setError('Please select a valid date of birth');
      alert('Invalid data');
      return;
    }

    setIsKycLoading(true);
    try {
      const response = await api.post('/fleet/kyc/dl/verify', { dlNo: cleanLicenseNumber, dob: licenseDob, expiryDate: licenseDob });
      if (response.data.success) setIsDlVerified(true);
      else {
        setError(response.data.message || 'Driving License verification failed. Please check details.');
        alert('Invalid data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'DL verification failed. Please check the number and Date of Birth.');
      alert('Invalid data');
    } finally {
      setIsKycLoading(false);
    }
  };

  const verifyPanKyc = async () => {
    setError('');
    if (!panNumber.trim() || panNumber.trim().length !== 10) {
      setError('Please enter a valid 10-digit PAN number');
      return;
    }
    setIsKycLoading(true);
    try {
      const response = await api.post('/fleet/kyc/pan/verify', { panNo: panNumber });
      if (response.data.success) {
        setIsPanVerified(true);
      } else {
        setError(response.data.message || 'PAN verification failed. Please check details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'PAN verification failed. Please check the number.');
    } finally {
      setIsKycLoading(false);
    }
  };

  // Reset on open
  useEffect(() => {
    if (!open) { stopCamera(); return; }

    // Auto-fill current date/time defaults
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setFromDate(todayStr);
    setToDate(tomorrowStr);
    setStartTime(timeStr);
    setEndTime(timeStr);
    setCustomerImage(null);
    setCustomerImagePreview('');
    setPaymentMode('cash');
    setPaymentType('advance');
    setSubmitting(false);
    setError('');
    setAadhaarNumber('');
    setAadhaarOtp('');
    setAadhaarOtpSent(false);
    setAadhaarRequestId('');
    setIsAadhaarVerified(false);
    setLicenseNumber('');
    setLicenseDob('');
    setIsDlVerified(false);
    setIsKycLoading(false);
    setActiveCameraField(null);
    setPanNumber('');
    setIsPanVerified(false);
    setDeposit('');
    setCashCollector('');
    setAdvancePercentage(settingsPercentageRef.current); // Reset to system setting value
  }, [open, car?.id]);

  useEffect(() => {
    if (open) {
      const fetchSettings = async () => {
        try {
          const res = await commonService.getSystemSettings();
          if (res.success && res.data?.settings) {
            const settingsObj = res.data.settings;
            if (settingsObj.advancePaymentPercentage !== undefined) {
              const pctVal = Number(settingsObj.advancePaymentPercentage);
              settingsPercentageRef.current = pctVal;
              setAdvancePercentage(pctVal);
            }
            if (settingsObj.cashCollectors) {
              setCashCollectors(settingsObj.cashCollectors);
            }
          }
        } catch (err) {
          console.error('Failed to fetch system settings:', err);
        }
      };
      fetchSettings();
    }
  }, [open]);

  // Computed values
  const numberOfDays = useMemo(() => getDaysBetweenWithTime(fromDate, startTime, toDate, endTime), [fromDate, startTime, toDate, endTime]);
  const totalPrice = useMemo(() => (!car ? 0 : numberOfDays * Number(car.pricePerDay || 0)), [car, numberOfDays]);
  const advanceAmount = useMemo(() => Math.round((advancePercentage / 100) * totalPrice), [totalPrice, advancePercentage]);
  const amountToPay = paymentType === 'full' ? totalPrice : advanceAmount;

  const hasOverlap = useMemo(() => {
    if (!fromDate || !toDate) return false;
    if (!isValidDateRange(fromDate, toDate)) return false;
    return (existingBookings || []).some((b) => rangesOverlapInclusive(fromDate, toDate, b.fromDate, b.toDate));
  }, [existingBookings, fromDate, toDate]);

  const canSubmit = useMemo(() => {
    if (!car) return false;
    if (!customerName.trim()) return false;
    if (!customerPhone.trim()) return false;
    if (!customerImagePreview) return false;
    if (!isDlVerified) return false; // Driving license must be verified
    if (panNumber.trim() && !isPanVerified) return false; // If PAN is entered, it must be verified
    if (!fromDate || !toDate) return false;
    if (!startTime || !endTime) return false;
    if (!isValidDateRange(fromDate, toDate)) return false;
    if (hasOverlap) return false;
    if (paymentMode === 'cash' && !cashCollector) return false;
    return true;
  }, [car, customerName, customerPhone, customerImagePreview, fromDate, toDate, startTime, endTime, isDlVerified, isPanVerified, panNumber, hasOverlap, paymentMode, cashCollector]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

  const handleConfirm = async () => {
    setError('');
    if (!customerName.trim()) { setError('Please enter customer name'); return; }
    if (!customerPhone.trim()) { setError('Please enter customer phone number'); return; }
    if (!customerImagePreview) { setError('Please upload a customer photo'); return; }
    if (!fromDate || !toDate || !isValidDateRange(fromDate, toDate)) { setError('Please select a valid date range'); return; }
    if (!startTime || !endTime) { setError('Please select start and end times'); return; }
    if (!isDlVerified) { setError('Please verify Driving License via QuickEKYC before booking'); return; }
    if (panNumber.trim() && !isPanVerified) { setError('Please verify PAN Card via QuickEKYC before booking'); return; }
    // Aadhaar is optional — no verification required
    if (hasOverlap) { setError('Car is already booked for these dates'); return; }
    if (paymentMode === 'cash' && !cashCollector) { setError('Please select who collected the cash'); return; }

    setSubmitting(true);
    try {
      const bookingPayload = {
        id: `fleet_book_${Date.now()}`,
        carId: car.id,
        carName: car.name,
        carType: car.type,
        carOwnerName: car.ownerName || '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerImage: customerImagePreview,
        panNumber: panNumber.trim().toUpperCase(),
        panVerified: isPanVerified,
        fromDate,
        toDate,
        startTime,
        endTime,
        totalPrice,
        advanceAmount: paymentType === 'full' ? totalPrice : advanceAmount,
        advancePaymentMode: paymentMode === 'razorpay' ? 'Razorpay / Online' : 'Cash',
        paymentMode: paymentMode === 'razorpay' ? 'Razorpay / Online' : 'Cash',
        paymentStatus: 'pending',
        paidAmount: 0,
        aadhaarNumber: aadhaarNumber.trim(),
        aadhaarVerified: isAadhaarVerified,
        licenseNumber: licenseNumber.trim(),
        licenseVerified: isDlVerified,
        deposit: car.type === 'inward' ? (Number(deposit) || 0) : 0,
        cashCollector: paymentMode === 'cash' ? cashCollector : '',
      };

      if (paymentMode === 'razorpay') {
        // ── Online payment flow ──
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) throw new Error('Could not load Razorpay. Please check your internet connection.');

        const orderResponse = await api.post('/fleet/razorpay/create-order', { amount: amountToPay });
        if (!orderResponse.data.success) throw new Error(orderResponse.data.message || 'Failed to initialize payment');

        const order = orderResponse.data.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_S3IcSS1NbymL6D',
          amount: order.amount,
          currency: 'INR',
          name: 'DriveOn Fleet',
          description: `${paymentType === 'advance' ? 'Advance' : 'Full'} Payment: ${car.name}`,
          order_id: order.id,
          method: { upi: true, netbanking: true, card: true, wallet: true },
          webview_intent: true,
          handler: async function (response) {
            try {
              const verifyRes = await api.post('/fleet/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes.data.success) {
                bookingPayload.paymentStatus = paymentType === 'full' ? 'paid' : 'partial';
                bookingPayload.paidAmount = amountToPay;
                bookingPayload.transactionId = response.razorpay_payment_id;
                await onConfirm(bookingPayload);
                onClose();
              } else {
                setError('Payment verification failed. Please contact admin.');
              }
            } catch (err) {
              setError('Error verifying payment.');
            } finally {
              setSubmitting(false);
            }
          },
          prefill: { name: customerName, contact: customerPhone, email: customerEmail },
          theme: { color: '#3B82F6' },
          modal: {
            ondismiss: () => setSubmitting(false),
            backdropclose: false,
            escape: false,
            animation: true,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (res) => {
          setError(res.error?.description || 'Payment failed. Please try again.');
          setSubmitting(false);
        });
        rzp.open();

      } else {
        // ── Cash flow ──
        bookingPayload.paidAmount = amountToPay;
        bookingPayload.paymentStatus = paymentType === 'full' ? 'paid' : 'partial';
        await onConfirm(bookingPayload);
        onClose();
      }
    } catch (e) {
      setError(e?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (!open || !car) return null;

  const inputStyle = { borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary, color: colors.textPrimary };
  const labelStyle = { color: colors.textPrimary };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl border flex flex-col"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
          maxHeight: '92vh',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0" style={{ borderBottomColor: colors.borderMedium }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Book Car</h2>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {car.name} • ₹{car.pricePerDay}/day • {car.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border flex-shrink-0"
              style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">

          {/* ── Customer Info ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
              Customer Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Customer Name <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none text-sm"
                style={inputStyle}
                placeholder="Enter customer name"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Phone Number <span style={{ color: colors.accentRed }}>*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full rounded-lg border px-3 py-2 outline-none text-sm"
                  style={inputStyle}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none text-sm"
                  style={inputStyle}
                  placeholder="customer@email.com"
                />
              </div>
            </div>
          </div>

          {/* ── Customer Photo ── */}
          <div className="border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <label className="block text-sm font-bold uppercase tracking-wide mb-3" style={labelStyle}>
              Customer Photo <span style={{ color: colors.accentRed }}>*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-32 h-32 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100 flex-shrink-0" style={{ borderColor: colors.borderMedium }}>
                {showCamera && activeCameraField === 'customer' ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : customerImagePreview ? (
                  <img src={customerImagePreview} alt="Customer" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">No Photo</span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2 w-full">
                {showCamera && activeCameraField === 'customer' ? (
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} type="button" className="flex-1 py-2 px-3 text-sm font-semibold rounded-lg" style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite }}>Snap Photo</Button>
                    <Button onClick={stopCamera} type="button" className="py-2 px-3 text-sm font-semibold rounded-lg" style={{ backgroundColor: colors.backgroundLight, color: colors.textPrimary }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => startCamera('customer')} type="button" className="flex items-center gap-1 py-2 px-3 text-sm font-semibold rounded-lg border" style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Capture
                    </Button>
                    <label className="cursor-pointer flex items-center gap-1 py-2 px-3 text-sm font-semibold rounded-lg border" style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => onPickCustomerImage(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>From Date & Time <span style={{ color: colors.accentRed }}>*</span></label>
              <div className="flex gap-2">
                <input type="date" lang="en-IN" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 min-w-0 rounded-lg border px-3 py-2 outline-none text-sm" style={inputStyle} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-36 rounded-lg border px-3 py-2 outline-none text-sm" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>To Date & Time <span style={{ color: colors.accentRed }}>*</span></label>
              <div className="flex gap-2">
                <input type="date" lang="en-IN" value={toDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 min-w-0 rounded-lg border px-3 py-2 outline-none text-sm" style={inputStyle} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-36 rounded-lg border px-3 py-2 outline-none text-sm" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* ── Driving License ── */}
          <div className="border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold uppercase tracking-wide" style={labelStyle}>
                Driving License <span style={{ color: colors.accentRed }}>*</span>
              </label>
              {isDlVerified ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">✓ Verified</span>
              ) : (
                <span className="text-xs text-orange-400 font-medium">Required</span>
              )}
            </div>

            {isDlVerified ? (
              <div className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/5 text-xs text-green-400 flex items-center gap-2">
                <span>✓</span><span>Driving License verified — {licenseNumber}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>DL Number</label>
                    <input
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                      style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
                      placeholder="e.g. MP41N-2026-0186258"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Date of Birth</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={licenseDob ? formatDateToDisplay(licenseDob) : ''}
                        placeholder="DD/MM/YYYY"
                        className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none cursor-pointer"
                        style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: colors.textSecondary }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        value={licenseDob || ''}
                        onChange={(e) => setLicenseDob(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={verifyDlKyc}
                  disabled={isKycLoading || !licenseNumber.trim() || !licenseDob}
                  type="button"
                  className="w-full py-1.5 text-xs font-semibold rounded-lg"
                  style={{
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.textWhite,
                    opacity: isKycLoading || !licenseNumber.trim() || !licenseDob ? 0.6 : 1
                  }}
                >
                  {isKycLoading ? 'Verifying...' : 'Verify License'}
                </Button>
              </div>
            )}
          </div>

          {/* ── PAN Card (Optional) ── */}
          <div className="border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold uppercase tracking-wide" style={labelStyle}>
                PAN Card
              </label>
              {isPanVerified ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">✓ Verified</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${colors.info}20`, color: colors.info }}>Optional</span>
              )}
            </div>
            {isPanVerified ? (
              <div className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/5 text-xs text-green-400 flex items-center gap-2">
                <span>✓</span><span>PAN verified — {panNumber}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none font-mono tracking-widest"
                    style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                  <Button
                    onClick={verifyPanKyc}
                    disabled={isKycLoading || panNumber.trim().length !== 10}
                    type="button"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg"
                    style={{
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.textWhite,
                      opacity: isKycLoading || panNumber.trim().length !== 10 ? 0.6 : 1
                    }}
                  >
                    {isKycLoading ? 'Verifying...' : 'Verify PAN'}
                  </Button>
                </div>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>
              </div>
            )}
          </div>

          {/* ── Aadhaar (Optional) ── */}
          <div className="border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold uppercase tracking-wide" style={labelStyle}>
                Aadhaar Card
              </label>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${colors.info}20`, color: colors.info }}>Optional</span>
            </div>

            {isAadhaarVerified ? (
              <div className="p-2.5 rounded-lg border border-green-500/30 bg-green-500/5 text-xs text-green-400 flex items-center gap-2">
                <span>✓</span><span>Aadhaar verified — XXXX-XXXX-{aadhaarNumber.slice(-4)}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    disabled={aadhaarOtpSent}
                    className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none font-mono tracking-widest"
                    style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, opacity: aadhaarOtpSent ? 0.6 : 1 }}
                    placeholder="12-digit Aadhaar number"
                  />
                  {!aadhaarOtpSent && (
                    <Button
                      onClick={sendAadhaarOtp}
                      disabled={isKycLoading || aadhaarNumber.length !== 12}
                      type="button"
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg"
                      style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite, opacity: isKycLoading || aadhaarNumber.length !== 12 ? 0.6 : 1 }}
                    >
                      Send OTP
                    </Button>
                  )}
                </div>
                {aadhaarOtpSent && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-400">Enter 6-digit OTP sent to Aadhaar mobile</label>
                    <div className="flex gap-2">
                      <input
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                        style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
                        placeholder="6-digit OTP"
                      />
                      <Button
                        onClick={verifyAadhaarOtp}
                        disabled={isKycLoading || aadhaarOtp.length !== 6}
                        type="button"
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg"
                        style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite, opacity: isKycLoading || aadhaarOtp.length !== 6 ? 0.6 : 1 }}
                      >
                        Verify OTP
                      </Button>
                    </div>
                    <button type="button" onClick={() => { setAadhaarOtpSent(false); setAadhaarOtp(''); }} className="text-xs hover:underline" style={{ color: colors.textSecondary }}>
                      Change Aadhaar Number
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Security Deposit (Inward Only) ── */}
          {car.type === 'inward' && (
            <div className="border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
              <label className="block text-sm font-bold uppercase tracking-wide mb-2" style={labelStyle}>
                Security Deposit (Record Only)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none text-sm font-semibold"
                style={inputStyle}
                placeholder="Enter deposit amount in ₹ (e.g. 5000)"
                min={0}
              />
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>This is for record-keeping to track the security deposit kept with the admin.</p>
            </div>
          )}

          {/* ── Booking Summary ── */}
          <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>Booking Summary</h3>
            <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
              <span>Days (inclusive)</span>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>{numberOfDays || 0}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
              <span>Price per day</span>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>₹{car.pricePerDay}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
              <span>Total Rental Price</span>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>₹{totalPrice}</span>
            </div>
            <div className="border-t pt-2" style={{ borderTopColor: colors.borderLight }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>Advance Required ({advancePercentage}%)</span>
                <span className="text-lg font-extrabold" style={{ color: colors.backgroundTertiary }}>₹{advanceAmount}</span>
              </div>
            </div>
          </div>

          {/* ── Payment Options ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Payment Options</h3>

            {/* Advance or Full */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'advance', label: 'Advance Payment', desc: `₹${advanceAmount} (${advancePercentage}%)`, icon: '💰' },
                { value: 'full', label: 'Full Payment', desc: `₹${totalPrice}`, icon: '✅' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentType(opt.value)}
                  className="flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: paymentType === opt.value ? colors.backgroundTertiary : colors.borderMedium,
                    backgroundColor: paymentType === opt.value ? `${colors.backgroundTertiary}15` : colors.backgroundPrimary,
                  }}
                >
                  <span className="text-xl mb-1">{opt.icon}</span>
                  <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>{opt.label}</span>
                  <span className="text-xs mt-0.5 font-semibold" style={{ color: colors.backgroundTertiary }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Online or Cash */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'razorpay', label: 'Online', desc: 'Pay via Razorpay', icon: '🌐' },
                { value: 'cash', label: 'Cash', desc: 'Pay at counter', icon: '💵' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMode(opt.value)}
                  className="flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left"
                  style={{
                    borderColor: paymentMode === opt.value ? colors.success : colors.borderMedium,
                    backgroundColor: paymentMode === opt.value ? `${colors.success}15` : colors.backgroundPrimary,
                  }}
                >
                  <span className="text-xl mb-1">{opt.icon}</span>
                  <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>{opt.label}</span>
                  <span className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Cash Collector Dropdown (Only when cash is selected) */}
            {paymentMode === 'cash' && (
              <div className="space-y-1.5 p-4 rounded-xl border animate-fade-in" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
                <label className="block text-xs font-bold uppercase tracking-wider" style={labelStyle}>
                  Select Cash Collector <span style={{ color: colors.accentRed }}>*</span>
                </label>
                <select
                  value={cashCollector}
                  onChange={(e) => setCashCollector(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none text-sm font-bold cursor-pointer"
                  style={inputStyle}
                  required
                >
                  <option value="" style={{ backgroundColor: colors.backgroundSecondary }}>-- Select Collector Name --</option>
                  {cashCollectors.map((collectorName, i) => (
                    <option key={i} value={collectorName} style={{ backgroundColor: colors.backgroundSecondary }}>
                      {collectorName}
                    </option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Choose the admin or staff member who is physically collecting the cash.</p>
              </div>
            )}

            {/* Amount to collect info box */}
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{
                backgroundColor: paymentMode === 'cash' ? '#FFF8E1' : '#E8F5E9',
                border: `1px solid ${paymentMode === 'cash' ? '#FFD54F' : '#81C784'}`,
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: paymentMode === 'cash' ? '#E65100' : '#2E7D32' }}>
                  {paymentMode === 'cash' ? '💵 Collect Cash' : '🌐 Razorpay Payment'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: paymentMode === 'cash' ? '#BF360C' : '#1B5E20' }}>
                  {paymentType === 'advance'
                    ? `Advance: ₹${advanceAmount} | Balance: ₹${totalPrice - advanceAmount} (collected later)`
                    : `Full amount: ₹${totalPrice}`}
                </p>
              </div>
              <span className="text-2xl font-black" style={{ color: paymentMode === 'cash' ? '#E65100' : '#2E7D32' }}>
                ₹{amountToPay}
              </span>
            </div>
          </div>

          {/* Validation errors */}
          {!isValidDateRange(fromDate, toDate) && fromDate && toDate && (
            <p className="text-sm" style={{ color: colors.accentRed }}>To Date must be at least 1 day after From Date (minimum 24 hours).</p>
          )}
          {hasOverlap && (
            <p className="text-sm" style={{ color: colors.accentRed }}>This car is already booked for the selected dates.</p>
          )}
          {error && (
            <p className="text-sm" style={{ color: colors.accentRed }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex-shrink-0 flex justify-end gap-3" style={{ borderTopColor: colors.borderMedium }}>
          <Button onClick={onClose} className="px-5 py-2.5 rounded-xl" style={{ backgroundColor: colors.backgroundLight, color: colors.textPrimary }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit || submitting}
            className="px-5 py-2.5 rounded-xl font-bold"
            style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite, opacity: !canSubmit || submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Processing...' : paymentMode === 'razorpay' ? `Pay ₹${amountToPay} & Confirm` : `Confirm Booking`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
