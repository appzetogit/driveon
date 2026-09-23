import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import razorpayService from "../../services/razorpay.service";
import { colors } from "../theme/colors";
import { motion } from "framer-motion";

/**
 * PaymentCallbackPage Component
 * Handles the redirect callback from Razorpay payment flow (WebView/APK/Mobile)
 * Verifies payment signature and redirects the user with premium visual transitions
 */
const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("verifying"); // "verifying", "success", "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(4);

  // Extract payment details from search params
  const orderId = searchParams.get("razorpay_order_id") || searchParams.get("order_id");
  const paymentId = searchParams.get("razorpay_payment_id") || searchParams.get("payment_id");
  const signature = searchParams.get("razorpay_signature") || searchParams.get("signature");

  useEffect(() => {
    const verifyTransaction = async () => {
      // 1. Check if we have the necessary parameters
      if (!orderId || !paymentId) {
        console.error("❌ Missing callback parameters:", { orderId, paymentId });
        setStatus("error");
        setErrorMessage("Invalid payment credentials returned. Missing transaction/order details.");
        return;
      }

      console.log("📡 PaymentCallbackPage - Initiating verification with:", {
        orderId,
        paymentId,
        hasSignature: !!signature,
      });

      try {
        // 2. Perform verification on the backend via razorpayService
        await razorpayService.verifyPayment({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature || undefined,
          orderId,
          paymentId,
          signature: signature || undefined,
          source: "mobile_apk_redirect"
        });

        console.log("✅ Payment verified successfully!");
        setStatus("success");
      } catch (error) {
        console.error("❌ Payment verification failed:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify your payment status. Please contact support.");
      }
    };

    // Small timeout to let transitions run smoothly
    const timer = setTimeout(() => {
      verifyTransaction();
    }, 1200);

    return () => clearTimeout(timer);
  }, [orderId, paymentId, signature]);

  // Handle auto-redirect countdown
  useEffect(() => {
    if (status !== "success") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/bookings", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, navigate]);

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{ 
        backgroundColor: colors.backgroundPrimary,
        fontFamily: "'Outfit', 'Inter', sans-serif" 
      }}
    >
      {/* Background Decorative Blobs */}
      <div 
        className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full filter blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: colors.backgroundTertiary }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full filter blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: colors.accent || '#25b8d7' }}
      />

      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl border relative z-10 text-center backdrop-blur-xl"
        style={{ 
          backgroundColor: `${colors.backgroundSecondary}F0`,
          borderColor: `${colors.borderLight}20`,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
        }}
      >
        {/* Render Verifying State */}
        {status === "verifying" && (
          <div className="flex flex-col items-center py-6">
            <div className="relative w-24 h-24 mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full rounded-full border-4 border-t-transparent"
                style={{ borderColor: `${colors.backgroundTertiary}40`, borderTopColor: colors.backgroundTertiary }}
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute inset-2 rounded-full border-4 border-b-transparent"
                style={{ borderColor: `${colors.accent || '#25b8d7'}30`, borderBottomColor: colors.accent || '#25b8d7' }}
              />
            </div>
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-black mb-3"
              style={{ color: colors.textPrimary }}
            >
              Verifying Payment
            </motion.h2>
            <p 
              className="text-sm font-medium leading-relaxed max-w-xs"
              style={{ color: colors.textSecondary }}
            >
              Please do not refresh this page or close the app. We are finalizing your booking secure connection...
            </p>
          </div>
        )}

        {/* Render Success State */}
        {status === "success" && (
          <div className="flex flex-col items-center py-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.1, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/20"
              style={{ backgroundColor: `${colors.success || '#4caf50'}15` }}
            >
              <svg 
                className="w-12 h-12" 
                style={{ color: colors.success || '#4caf50' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
              >
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black mb-3"
              style={{ color: colors.textPrimary }}
            >
              Payment Successful!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium mb-8 max-w-xs leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              Your booking has been registered successfully. We are redirecting you to your bookings dashboard.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-4"
            >
              <button
                onClick={() => navigate("/bookings", { replace: true })}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] hover:brightness-105"
                style={{ 
                  backgroundColor: colors.backgroundTertiary,
                  boxShadow: `0 10px 20px -5px ${colors.backgroundTertiary}50`
                }}
              >
                Go to Bookings Now
              </button>
              
              <div 
                className="text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: colors.textTertiary }}
              >
                Auto redirecting in <span className="font-extrabold" style={{ color: colors.backgroundTertiary }}>{countdown}</span> seconds
              </div>
            </motion.div>
          </div>
        )}

        {/* Render Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center py-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.1, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-red-500/20"
              style={{ backgroundColor: `${colors.error || '#f44336'}15` }}
            >
              <svg 
                className="w-12 h-12" 
                style={{ color: colors.error || '#f44336' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={3}
              >
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-black mb-3"
              style={{ color: colors.textPrimary }}
            >
              Payment Verification Failed
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium mb-8 max-w-xs leading-relaxed"
              style={{ color: colors.error || '#f44336' }}
            >
              {errorMessage}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full space-y-3"
            >
              <button
                onClick={() => navigate("/bookings", { replace: true })}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] hover:brightness-105"
                style={{ 
                  backgroundColor: colors.backgroundTertiary,
                }}
              >
                Check My Bookings
              </button>
              
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full py-4 rounded-2xl font-extrabold text-sm border transition-all active:scale-[0.98]"
                style={{ 
                  backgroundColor: "transparent",
                  color: colors.textPrimary,
                  borderColor: colors.borderLight,
                }}
              >
                Return to Home
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentCallbackPage;
