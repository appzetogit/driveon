import { useState, useEffect } from 'react';
import { colors } from '../../module/theme/colors';
import api from '../../services/api';
import { commonService } from '../../services/common.service';

const CompleteBookingModal = ({ open, booking, onClose, onConfirm }) => {
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'razorpay'
  const [onlineMethod, setOnlineMethod] = useState('razorpay'); // 'razorpay' | 'transaction_id'
  const [transactionId, setTransactionId] = useState('');
  const [cashCollectors, setCashCollectors] = useState([]);
  const [cashCollector, setCashCollector] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCashCollector('');
      const fetchSettings = async () => {
        try {
          const res = await commonService.getSystemSettings();
          if (res.success && res.data?.settings?.cashCollectors) {
            setCashCollectors(res.data.settings.cashCollectors);
          }
        } catch (err) {
          console.error('Failed to fetch system settings:', err);
        }
      };
      fetchSettings();
    }
  }, [open]);

  if (!open || !booking) return null;

  const totalPrice = Number(booking.totalPrice || 0);
  const paidAmount = Number(booking.paidAmount || 0);
  const dueAmount = Math.max(0, totalPrice - paidAmount);

  const amountToCollect = dueAmount;

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

  const completeBooking = async (payload) => {
    try {
      const response = await api.post(`/fleet/outward-bookings/${booking.id}/complete`, payload);
      if (response.data.success) {
        const confirmPayload = { 
          status: 'completed', 
          paymentStatus: payload.paymentStatus, 
          paidAmount: payload.paidAmount,
          paymentMode: payload.paymentMode,
          remainingPaymentMode: payload.paymentMode,
        };
        if (payload.transactionId) {
          confirmPayload.transactionId = payload.transactionId;
        }
        onConfirm(confirmPayload);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete booking on server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    
    if (amountToCollect < 0) {
      setError('Amount cannot be negative');
      return;
    }

    if (paymentMode === 'razorpay' && onlineMethod === 'transaction_id' && !transactionId.trim()) {
      setError('Please enter the transaction ID');
      return;
    }

    if (paymentMode === 'cash' && !cashCollector) {
      setError('Please select who collected the cash');
      return;
    }

    setSubmitting(true);
    
    const finalPaidAmount = paidAmount + amountToCollect;
    const finalPaymentStatus = finalPaidAmount >= totalPrice ? 'paid' : 'partial';
    
    const backendPayload = {
      paidAmount: finalPaidAmount,
      paymentMode: paymentMode === 'razorpay' ? 'Razorpay / Online' : 'Cash',
      paymentStatus: finalPaymentStatus,
      cashCollector: paymentMode === 'cash' ? cashCollector : undefined,
    };
    if (paymentMode === 'razorpay' && onlineMethod === 'transaction_id' && transactionId) {
      backendPayload.transactionId = transactionId;
    }

    try {
      if (paymentMode === 'razorpay' && onlineMethod === 'razorpay' && amountToCollect > 0) {
        // Online payment flow via Razorpay Gateway
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) throw new Error('Could not load Razorpay.');

        const orderResponse = await api.post('/fleet/razorpay/create-order', { amount: amountToCollect });
        if (!orderResponse.data.success) throw new Error(orderResponse.data.message || 'Failed to initialize payment');

        const order = orderResponse.data.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_S3IcSS1NbymL6D',
          amount: order.amount,
          currency: 'INR',
          name: 'DriveOn Fleet',
          description: `Completion Payment: ${booking.carName}`,
          order_id: order.id,
          handler: async function (response) {
            try {
              const verifyRes = await api.post('/fleet/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes.data.success) {
                await completeBooking({ ...backendPayload, transactionId: response.razorpay_payment_id });
              } else {
                setError('Payment verification failed. Please contact admin.');
                setSubmitting(false);
              }
            } catch (err) {
              setError('Error verifying payment.');
              setSubmitting(false);
            }
          },
          prefill: { name: booking.customerName, contact: booking.customerPhone, email: booking.customerEmail },
          theme: { color: '#3B82F6' },
          modal: { ondismiss: () => setSubmitting(false) },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (res) => {
          setError(res.error?.description || 'Payment failed. Please try again.');
          setSubmitting(false);
        });
        rzp.open();
      } else {
        // Cash flow, Zero amount, or Manual Transaction ID
        await completeBooking(backendPayload);
      }
    } catch (e) {
      setError(e?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const isCompleteDisabled = submitting || 
    amountToCollect < 0 || 
    (paymentMode === 'razorpay' && onlineMethod === 'transaction_id' && !transactionId.trim()) ||
    (paymentMode === 'cash' && !cashCollector);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && onClose()} />

      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
        }}
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 border-b" style={{ borderBottomColor: colors.borderMedium }}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Complete Booking</h2>
            <button onClick={() => !submitting && onClose()} className="p-2 rounded-lg border" style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>Payment Summary</h3>
            <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
              <span>Total Rental Price</span>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: colors.textSecondary }}>
              <span>Previously Paid</span>
              <span className="font-semibold text-green-400">₹{paidAmount}</span>
            </div>
            <div className="border-t pt-2 mt-2" style={{ borderTopColor: colors.borderLight }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>Due Amount</span>
                <span className="text-lg font-extrabold text-orange-400">₹{dueAmount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>Payment Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'razorpay', label: 'Online', desc: 'Pay online', icon: '🌐' },
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
              <div className="mt-4 space-y-1.5 p-4 rounded-xl border animate-fade-in" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                  Select Cash Collector <span style={{ color: colors.accentRed }}>*</span>
                </label>
                <select
                  value={cashCollector}
                  onChange={(e) => setCashCollector(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none text-sm font-bold cursor-pointer"
                  style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
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

            {paymentMode === 'razorpay' && (
              <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>Online Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="onlineMethod" 
                      value="razorpay" 
                      checked={onlineMethod === 'razorpay'} 
                      onChange={() => setOnlineMethod('razorpay')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Pay via Razorpay Gateway</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="onlineMethod" 
                      value="transaction_id" 
                      checked={onlineMethod === 'transaction_id'} 
                      onChange={() => setOnlineMethod('transaction_id')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Enter Transaction ID Manually</span>
                  </label>

                  {onlineMethod === 'transaction_id' && (
                    <div className="pt-2 pl-7">
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter UTR or Txn ID"
                        className="w-full rounded-lg border px-3 py-2 outline-none text-sm font-bold"
                        style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              backgroundColor: paymentMode === 'cash' ? '#FFF8E1' : '#E8F5E9',
              border: `1px solid ${paymentMode === 'cash' ? '#FFD54F' : '#81C784'}`,
            }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: paymentMode === 'cash' ? '#E65100' : '#2E7D32' }}>
                {paymentMode === 'cash' ? '💵 Collect Cash' : '🌐 Online Payment'}
              </p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: paymentMode === 'cash' ? '#BF360C' : '#1B5E20' }}>
                Collecting full balance
              </p>
            </div>
            <span className="text-2xl font-black" style={{ color: paymentMode === 'cash' ? '#E65100' : '#2E7D32' }}>
              ₹{amountToCollect}
            </span>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderTopColor: colors.borderMedium }}>
          <button onClick={() => !submitting && onClose()} className="px-5 py-2.5 rounded-xl text-sm font-bold border" style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCompleteDisabled}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {submitting 
              ? 'Processing...' 
              : (paymentMode === 'razorpay' && onlineMethod === 'razorpay') 
                ? `Pay ₹${amountToCollect}` 
                : 'Complete & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteBookingModal;
