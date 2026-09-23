// Razorpay service for DriveOn frontend
class RazorpayService {
  constructor() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_S3IcSS1NbymL6D';
    this.apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';

    // Log API URL for debugging
    console.log('🔧 RazorpayService initialized:', {
      apiUrl: this.apiUrl,
      razorpayKey: this.razorpayKey ? `${this.razorpayKey.substring(0, 8)}...` : 'NOT SET',
      env: import.meta.env.MODE || 'unknown'
    });

    if (!this.razorpayKey) {
      console.error('⚠️  RAZORPAY_KEY_ID not configured in environment variables');
    }
  }

  static getInstance() {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Detect if running in APK/WebView context
   */
  isAPKContext() {
    const hasCordova = window.cordova !== undefined;
    const hasCapacitor = window.Capacitor !== undefined;
    const hasFlutterWebView = window.flutter_inappwebview !== undefined;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    const isWebView = /wv|WebView/i.test(userAgent);
    const isFlutterUserAgent = userAgent.includes('Flutter');
    const isInIframe = window.self !== window.top;

    return hasCordova || hasCapacitor || hasFlutterWebView || isWebView || isFlutterUserAgent || isInIframe;
  }

  /**
   * Load Razorpay script dynamically
   */
  async loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        console.log('✅ Razorpay already loaded');
        resolve();
        return;
      }

      const isAPK = this.isAPKContext();
      console.log('📱 Running in APK context:', isAPK);

      const targetElement = document.head || document.getElementsByTagName('head')[0] || document.body || document.documentElement;

      if (!targetElement) {
        console.error('❌ No target element found for script injection');
        reject(new Error('Cannot inject Razorpay script - no DOM element available'));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        console.error('❌ Razorpay script load timeout');
        if (targetElement.contains(script)) {
          targetElement.removeChild(script);
        }
        reject(new Error('Razorpay script loading timeout - please check your internet connection'));
      }, isAPK ? 12000 : 8000);

      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ Razorpay script loaded successfully');

        const checkRazorpay = (attempt = 0) => {
          if (window.Razorpay) {
            console.log('✅ Razorpay object available');
            resolve();
          } else if (attempt < 20) {
            const delay = attempt === 0 ? 50 : 100;
            setTimeout(() => checkRazorpay(attempt + 1), delay);
          } else {
            console.error('❌ window.Razorpay not available after script load');
            reject(new Error('Razorpay object not available'));
          }
        };

        checkRazorpay(0);
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to load Razorpay script:', error);
        if (targetElement.contains(script)) {
          targetElement.removeChild(script);
        }
        reject(new Error('Failed to load Razorpay script. Please check your internet connection.'));
      };

      try {
        targetElement.appendChild(script);
        console.log('📜 Razorpay script element added to DOM');
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Failed to append script:', error);
        reject(new Error('Failed to inject Razorpay script'));
      }
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(amount, receipt, notes = {}) {
    try {
      console.log('🔍 Creating Razorpay order with data:', { amount, receipt, notes });

      if (!notes.bookingId) {
        throw new Error('Booking ID is required to create payment order');
      }

      // Use axios instance from api.js for consistent base URL handling
      const { default: api } = await import('./api.js');

      console.log('📦 Request payload:', {
        bookingId: notes.bookingId,
        amount: parseFloat(amount),
      });

      const response = await api.post('/payments/razorpay/create-order', {
        bookingId: notes.bookingId,
        amount: parseFloat(amount),
      });

      console.log('📦 Create order response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }

      // Backend returns: { success: true, data: { orderId, amount, currency, receipt, transactionId, bookingId } }
      const orderData = response.data.data;
      return {
        orderId: orderData.orderId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        transactionId: orderData.transactionId,
        bookingId: orderData.bookingId,
      };
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to payment server. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData) {
    try {
      console.log('🔍 Verifying Razorpay payment with data:', paymentData);

      // Use axios instance from api.js for consistent base URL handling
      const { default: api } = await import('./api.js');

      const response = await api.post('/payments/razorpay/verify', paymentData);

      console.log('📦 Verification response:', response.data);

      if (!response.data.success) {
        console.log('❌ Verification failed:', response.data.message);
        throw new Error(response.data.message || 'Payment verification failed');
      }

      console.log('✅ Verification successful:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);

      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || `Payment verification failed: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Unable to connect to payment server. Please check your internet connection.');
      } else {
        // Something else happened
        throw error;
      }
    }
  }

  /**
   * Process booking payment
   */
  async processBookingPayment(paymentData) {
    try {
      console.log('🚀 Processing booking payment with data:', {
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
      });

      // Detect APK/iframe context
      const isAPK = this.isAPKContext();
      const isInIframe = window.self !== window.top;
      const useRedirectMode = isAPK || isInIframe;

      console.log('🔍 Payment context detection:', {
        isAPK,
        isInIframe,
        useRedirectMode,
      });

      // Load Razorpay script
      await this.loadRazorpayScript();

      // Create order
      console.log('💳 Creating payment order...');
      const order = await this.createOrder(
        paymentData.amount,
        `booking_${paymentData.bookingId}_${Date.now()}`,
        {
          bookingId: paymentData.bookingId,
        }
      );
      console.log('✅ Payment order created:', order.orderId || order.id);

      // Build callback URL for redirect mode (WebView/APK)
      let apiBase = this.apiUrl;
      if (apiBase.startsWith('/')) {
        apiBase = window.location.origin + apiBase;
      }
      const callbackUrl = useRedirectMode
        ? `${apiBase}/payments/razorpay/callback`
        : undefined;

      // Store payment info in localStorage for WebView callback handling
      if (useRedirectMode) {
        try {
          localStorage.setItem('pending_payment', JSON.stringify({
            type: 'booking',
            orderId: order.orderId || order.id,
            bookingId: paymentData.bookingId,
            amount: paymentData.amount,
            callbackUrl: callbackUrl,
            timestamp: Date.now()
          }));
          console.log('💾 Stored payment info in localStorage for callback handling');
        } catch (e) {
          console.warn('⚠️ Could not store payment info:', e);
        }
      }

      // Razorpay options
      const isTestMode = this.razorpayKey && this.razorpayKey.includes('test');

      const options = {
        key: this.razorpayKey,
        amount: order.amount, // Amount is already in paise from backend
        currency: order.currency || 'INR',
        name: 'DriveOn',
        description: paymentData.description || 'Car booking payment',
        order_id: order.orderId || order.id,
        prefill: {
          name: paymentData.name || '',
          email: paymentData.email || '',
          contact: '+91' + (paymentData.phone || '').replace(/[^0-9]/g, '').slice(-10),
        },
        notes: {
          payment_type: 'booking_payment',
          booking_id: paymentData.bookingId,
          transaction_id: order.transactionId,
          razorpay_order_id: order.orderId,
          order_id: order.orderId
        },
        theme: {
          color: '#3B82F6',
        },
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true
        },
        webview_intent: true,
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent"],
                  },
                ],
              },
              banks: {
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.banks"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        ...(useRedirectMode && {
          redirect: true,
          callback_url: callbackUrl,
        }),
        handler: async (response) => {
          try {
            console.log('🎯 Razorpay payment handler called with response:', JSON.stringify(response, null, 2));

            // Support both web and mobile APK formats
            const razorpay_order_id = response.razorpay_order_id || response.orderId || response.order_id || order.orderId || order.id;
            const razorpay_payment_id = response.razorpay_payment_id || response.paymentId || response.payment_id;
            const razorpay_signature = response.razorpay_signature || response.signature;

            console.log('🔍 Extracted payment data:', {
              razorpay_order_id,
              razorpay_payment_id,
              has_signature: !!razorpay_signature,
            });

            // Validate required fields
            if (!razorpay_payment_id) {
              console.error('❌ Missing required payment_id');
              throw new Error('Payment response missing required field: payment_id');
            }

            if (!razorpay_order_id) {
              console.error('❌ Missing order_id');
              throw new Error('Payment response missing required field: order_id');
            }

            // Verify payment
            const verificationData = {
              razorpay_order_id: razorpay_order_id,
              razorpay_payment_id: razorpay_payment_id,
              razorpay_signature: razorpay_signature && razorpay_signature.trim().length > 0 ? razorpay_signature.trim() : undefined,
              orderId: razorpay_order_id,
              paymentId: razorpay_payment_id,
              signature: razorpay_signature && razorpay_signature.trim().length > 0 ? razorpay_signature.trim() : undefined,
              bookingId: paymentData.bookingId,
              source: isAPK ? 'mobile_apk' : 'web'
            };

            console.log('📤 Verification data being sent:', verificationData);

            const verificationResult = await this.verifyPayment(verificationData);
            console.log('✅✅✅ BOOKING PAYMENT VERIFICATION SUCCESS ✅✅✅');

            // Call success callback
            if (paymentData.onSuccess) {
              paymentData.onSuccess(verificationResult);
            }
          } catch (error) {
            console.error('❌ Error in payment handler:', error);

            let errorMessage = 'Payment verification failed';
            if (error.message.includes('timeout')) {
              errorMessage = 'Payment verification is taking longer than expected. Your payment was successful, but verification is still processing.';
            } else if (error.message.includes('Missing')) {
              errorMessage = 'Invalid payment response received. Please try again.';
            } else if (error.message) {
              errorMessage = error.message;
            }

            if (paymentData.onError) {
              paymentData.onError(new Error(errorMessage));
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed by user');
            if (paymentData.onError) {
              paymentData.onError(new Error('PAYMENT_CANCELLED'));
            }
          },
          backdropclose: false,
          escape: false,
          animation: false
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300
      };

      // Open Razorpay checkout
      console.log('🔄 Opening Razorpay checkout for booking payment...');

      if (!window.Razorpay) {
        console.error('❌ window.Razorpay not available');
        throw new Error('Razorpay object not available. Please check your internet connection.');
      }

      const razorpay = new window.Razorpay(options);
      console.log('✅ Razorpay instance created successfully');

      // Add error handlers
      razorpay.on('payment.failed', function (response) {
        console.error('❌ Razorpay payment.failed event triggered:', JSON.stringify(response, null, 2));
        const errorDescription = response.error?.description || response.error?.reason || 'Payment failed';
        if (paymentData.onError) {
          paymentData.onError(new Error(errorDescription));
        }
      });

      razorpay.open();
      console.log('✅ Razorpay checkout opened successfully');

    } catch (error) {
      console.error('❌ Error processing booking payment:', error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const networkError = new Error('Unable to connect to payment server. Please check your internet connection and try again.');
        if (paymentData.onError) {
          paymentData.onError(networkError);
        }
      } else if (paymentData.onError) {
        paymentData.onError(error);
      }
    }
  }
  /**
   * Create Salary Order
   */
  async createSalaryOrder(data) {
    // Use axios instance from api.js
    const { default: api } = await import('./api.js');

    // Ensure amount is number
    const payload = {
      ...data,
      amount: parseFloat(data.amount)
    };

    const response = await api.post('/crm/staff/salary/create-order', payload);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create salary order');
    }

    return response.data.data;
  }

  /**
   * Verify Salary Payment
   */
  async verifySalaryPayment(paymentData) {
    const { default: api } = await import('./api.js');
    const response = await api.post('/crm/staff/salary/verify', paymentData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Verification failed');
    }
    return response.data;
  }

  /**
   * Process Salary Payment
   */
  async processSalaryPayment(paymentData) {
    try {
      console.log('Processing salary payment:', paymentData);

      // Detect APK/iframe context
      const isAPK = this.isAPKContext();
      const isInIframe = window.self !== window.top;
      const useRedirectMode = isAPK || isInIframe;

      await this.loadRazorpayScript();

      const order = await this.createSalaryOrder({
        staffId: paymentData.staffId,
        amount: paymentData.amount,
        month: paymentData.month,
        year: paymentData.year,
        description: paymentData.description
      });

      // Build callback URL for redirect mode
      let apiBase = this.apiUrl;
      if (apiBase.startsWith('/')) {
        apiBase = window.location.origin + apiBase;
      }
      const callbackUrl = useRedirectMode
        ? `${apiBase}/payments/razorpay/callback?source=crm_salary`
        : undefined;

      const options = {
        key: this.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'DriveOn CRM',
        description: 'Staff Salary Payment',
        order_id: order.orderId,
        prefill: {
          name: paymentData.name || '',
          contact: '+91' + (paymentData.phone || '').replace(/[^0-9]/g, '').slice(-10),
          email: paymentData.email || ''
        },
        theme: { color: '#3B82F6' },
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true
        },
        webview_intent: true,
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent"],
                  },
                ],
              },
              banks: {
                name: "Other Payment Methods",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: ["block.upi", "block.banks"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        ...(useRedirectMode && {
          redirect: true,
          callback_url: callbackUrl,
        }),
        handler: async (response) => {
          try {
            console.log('Payment success, verifying...');
            await this.verifySalaryPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              staffId: paymentData.staffId,
              amount: paymentData.amount,
              baseSalary: paymentData.baseSalary,
              deductions: paymentData.deductions,
              month: paymentData.month,
              year: paymentData.year,
              transaction_id: order.transactionId
            });
            if (paymentData.onSuccess) paymentData.onSuccess(response);
          } catch (e) {
            console.error('Verification error:', e);
            if (paymentData.onError) paymentData.onError(e);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            if (paymentData.onError) paymentData.onError(new Error('Payment Cancelled'));
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Process salary payment error:', error);
      if (paymentData.onError) paymentData.onError(error);
    }
  }
}

// Create singleton instance
const razorpayService = RazorpayService.getInstance();

export default razorpayService;

