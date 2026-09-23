import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import { onMessageListener } from "../../../services/firebase";


/**
 * Payment List Page
 * Admin can view, filter, and manage all payment transactions
 * No localStorage or Redux - All state managed via React hooks
 */
const PaymentListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial status from URL
  const getInitialStatus = () => {
    if (location.pathname.includes('/pending')) return 'pending';
    if (location.pathname.includes('/failed')) return 'failed';
    return 'all';
  };

  // State management
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetail, setShowPaymentDetail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: getInitialStatus(), // all, success, failed, pending, refunded
    paymentType: 'all', // all, full, partial, security_deposit
    dateRange: 'all', // all, today, week, month, custom
    startDate: '', // YYYY-MM-DD
    endDate: '', // YYYY-MM-DD
    user: 'all',
    booking: 'all',
  });

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 Payment Alert: ${payload.notification.title}`);
        console.log("Payment Notification:", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  // Fetch payments from API (extract from bookings transactions)
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);

        // Get all bookings to extract transactions
        const response = await adminService.getAllBookings({
          page: 1,
          limit: 1000, // Get all bookings to extract all transactions
        });

        if (response.success && response.data?.bookings) {
          const bookings = response.data.bookings;

          // Extract all transactions from bookings
          const allPayments = [];

          bookings.forEach((booking) => {
            if (booking.transactions && Array.isArray(booking.transactions)) {
              booking.transactions.forEach((transaction) => {
                // Skip cash payments (online or bank only)
                if (transaction.paymentMethod && transaction.paymentMethod.toLowerCase() === 'cash') {
                  return;
                }

                // Determine payment type based on booking payment option
                let paymentType = 'full';
                if (booking.paymentOption === 'advance') {
                  // Check if this is advance payment or remaining payment
                  const advanceAmount = booking.pricing?.advancePayment || 0;
                  if (transaction.amount <= advanceAmount) {
                    paymentType = 'partial';
                  } else {
                    paymentType = 'partial'; // Remaining payment
                  }
                }

                // Map payment method to display name
                const paymentMethodMap = {
                  'phonepe': 'UPI',
                  'razorpay': transaction.razorpayPaymentId ? 'Credit Card' : 'UPI',
                  'stripe': 'Credit Card',
                };

                const paymentMethod = paymentMethodMap[transaction.paymentMethod] || transaction.paymentMethod || 'UPI';

                // Map payment gateway
                const paymentGatewayMap = {
                  'phonepe': 'PhonePe',
                  'razorpay': 'Razorpay',
                  'stripe': 'Stripe',
                };

                const paymentGateway = paymentGatewayMap[transaction.paymentMethod] || 'Razorpay';

                allPayments.push({
                  id: transaction._id?.toString() || transaction.transactionId,
                  transactionId: transaction.transactionId,
                  bookingId: booking.bookingId || booking._id?.toString(),
                  bookingStatus: booking.status,
                  userId: booking.user?._id?.toString() || booking.user?.toString() || '',
                  userName: booking.user?.name || 'Unknown',
                  userEmail: booking.user?.email || '',
                  amount: transaction.amount || 0,
                  paymentType: paymentType,
                  paymentMethod: paymentMethod,
                  paymentGateway: paymentGateway,
                  status: transaction.status || 'pending',
                  timestamp: transaction.paymentDate || transaction.createdAt || booking.createdAt || new Date().toISOString(),
                  bookingDate: booking.bookingDate || booking.createdAt || new Date().toISOString(),
                  invoiceGenerated: booking.paymentStatus === 'paid' || booking.paymentStatus === 'partial',
                  refundAmount: transaction.refundAmount || 0,
                  refundDate: transaction.refundDate || null,
                  failureReason: transaction.status === 'failed' ? 'Payment failed' : null,
                });
              });
            }
          });

          // Sort by timestamp (newest first)
          allPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          setPayments(allPayments);
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to fetch payments');
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter and search payments
  useEffect(() => {
    let filtered = [...payments];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((payment) => {
        const transactionId = (payment.transactionId || '').toLowerCase();
        const bookingId = (payment.bookingId || '').toLowerCase();
        const userName = (payment.userName || '').toLowerCase();
        const userEmail = (payment.userEmail || '').toLowerCase();

        return keywords.every((keyword) =>
          transactionId.includes(keyword) ||
          bookingId.includes(keyword) ||
          userName.includes(keyword) ||
          userEmail.includes(keyword)
        );
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((payment) => payment.status === filters.status);
    }

    // Payment type filter
    if (filters.paymentType !== 'all') {
      filtered = filtered.filter((payment) => payment.paymentType === filters.paymentType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.timestamp);
        switch (filters.dateRange) {
          case 'today':
            return paymentDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return paymentDate >= monthAgo;
          case 'custom':
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            
            if (start && end) {
              return paymentDate >= start && paymentDate <= end;
            } else if (start) {
              return paymentDate >= start;
            } else if (end) {
              return paymentDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // User filter
    if (filters.user !== 'all') {
      filtered = filtered.filter((payment) => payment.userId === filters.user);
    }

    // Booking filter
    if (filters.booking !== 'all') {
      filtered = filtered.filter((payment) => payment.bookingId === filters.booking);
    }

    setFilteredPayments(filtered);
  }, [payments, searchQuery, filters]);

  // Handle payment actions
  const handleProcessRefund = (paymentId) => {
    if (window.confirm('Process refund for this transaction?')) {
      setPayments((prevList) =>
        prevList.map((payment) => {
          if (payment.id === paymentId) {
            return {
              ...payment,
              status: 'refunded',
              refundAmount: payment.amount,
              refundDate: new Date().toISOString(),
            };
          }
          return payment;
        })
      );
    }
  };

  const handleMarkAsReceived = (paymentId) => {
    setPayments((prevList) =>
      prevList.map((payment) => {
        if (payment.id === paymentId) {
          return { ...payment, status: 'success' };
        }
        return payment;
      })
    );
  };

  const handleGenerateInvoice = (paymentId) => {
    // In real app, this would generate and download invoice
    setPayments((prevList) =>
      prevList.map((payment) => {
        if (payment.id === paymentId) {
          return { ...payment, invoiceGenerated: true };
        }
        return payment;
      })
    );
    console.log(`Generating invoice for transaction: ${paymentId}`);
  };

  const handleDownloadInvoice = (payment) => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 37, 41);
      doc.text("DRIVEON", 10, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(108, 117, 125);
      doc.text("123 Business Road, Tech City", 10, 28);
      doc.text("Email: support@driveon.com", 10, 34);
      doc.text("Phone: +91 9876543210", 10, 40);

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 37, 41);
      doc.text("PAYMENT INVOICE", 105, 20, { align: "center" });

      // Invoice Info
      doc.setFontSize(10);
      doc.text(`Invoice No: INV-${payment.transactionId.substring(0, 8).toUpperCase()}`, 130, 28);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 34);
      doc.text(`Status: Paid`, 130, 40);

      // Customer Info
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 48, 200, 48);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Billed To:", 10, 58);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(payment.userName, 10, 65);
      doc.text(payment.userEmail, 10, 71);

      // Transaction Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction Details:", 130, 58);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Transaction ID: ${payment.transactionId}`, 130, 65);
      doc.text(`Booking ID: ${payment.bookingId}`, 130, 71);
      doc.text(`Payment Method: ${payment.paymentMethod}`, 130, 77);
      doc.text(`Date: ${new Date(payment.timestamp).toLocaleString()}`, 130, 83);

      doc.line(10, 90, 200, 90);

      // Amount Info
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Description", 15, 100);
      doc.text("Amount", 170, 100, { align: "right" });

      doc.setFont("helvetica", "normal");
      const paymentTypeStr = payment.paymentType === 'full' ? 'Full' : payment.paymentType === 'partial' ? 'Partial' : 'Security Deposit';
      doc.text(`${paymentTypeStr} Payment for Booking`, 15, 110);
      doc.text(`INR ${payment.amount.toLocaleString()}`, 170, 110, { align: "right" });

      doc.line(10, 120, 200, 120);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid:", 130, 130);
      doc.text(`INR ${payment.amount.toLocaleString()}`, 195, 130, { align: "right" });

      // Footer
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for your business!", 105, 150, { align: "center" });

      doc.save(`Invoice_${payment.transactionId}.pdf`);
    }).catch(err => {
      console.error("Failed to load jsPDF", err);
      toastUtils.error("Failed to generate invoice. Please try again.");
    });
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetail(true);
  };

  const handleExport = async () => {
    if (!filteredPayments.length) {
      toastUtils.error('No payment data to export');
      return;
    }
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const themeColor = [28, 32, 92]; // #1C205C

      // ── Header Banner ─────────────────────────────────────
      doc.setFillColor(...themeColor);
      doc.rect(0, 0, pageW, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DRIVEON', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Car Rental Management System', 14, 18);
      doc.text('support@driveon.com  |  +91 9876543210', 14, 23);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT TRANSACTIONS REPORT', pageW / 2, 12, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW / 2, 18, { align: 'center' });
      const filterParts = [];
      if (filters.status !== 'all') filterParts.push(`Status: ${filters.status}`);
      if (filters.paymentType !== 'all') filterParts.push(`Type: ${filters.paymentType}`);
      if (filters.dateRange !== 'all') filterParts.push(`Period: ${filters.dateRange}`);
      const filterLabel = filterParts.length > 0 ? filterParts.join(' | ') : 'All Payments';
      doc.text(`Filter: ${filterLabel}`, pageW / 2, 23, { align: 'center' });

      // ── Summary Cards ──────────────────────────────────────
      const cardData = [
        { label: 'Total', value: String(stats.total), color: themeColor },
        { label: 'Success', value: String(stats.success), color: [22, 163, 74] },
        { label: 'Failed', value: String(stats.failed), color: [220, 38, 38] },
        { label: 'Pending', value: String(stats.pending), color: [202, 138, 4] },
        { label: 'Revenue (INR)', value: `Rs.${stats.totalRevenue.toLocaleString('en-IN')}`, color: themeColor },
        { label: 'Refunded (INR)', value: `Rs.${stats.totalRefunded.toLocaleString('en-IN')}`, color: [147, 51, 234] },
      ];
      const cardW = (pageW - 28) / cardData.length;
      let cx = 14;
      cardData.forEach(({ label, value, color }) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(cx, 32, cardW - 2, 16, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(value, cx + (cardW - 2) / 2, 39, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label, cx + (cardW - 2) / 2, 44, { align: 'center' });
        cx += cardW;
      });

      // ── Transaction Table ───────────────────────────────────
      const headers = [
        'S.No', 'Transaction ID', 'Booking ID', 'Customer Name', 'Customer Email',
        'Amount (INR)', 'Payment Type', 'Method', 'Gateway', 'Status', 'Date & Time', 'Booking Status',
      ];
      const body = filteredPayments.map((p, i) => [
        i + 1,
        p.transactionId || '-',
        p.bookingId || '-',
        p.userName || '-',
        p.userEmail || '-',
        `Rs.${(p.amount || 0).toLocaleString('en-IN')}`,
        p.paymentType === 'full' ? 'Full' : p.paymentType === 'partial' ? 'Partial' : 'Security',
        p.paymentMethod || '-',
        p.paymentGateway || '-',
        p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : '-',
        p.timestamp ? new Date(p.timestamp).toLocaleString('en-IN') : '-',
        p.bookingStatus ? (p.bookingStatus.charAt(0).toUpperCase() + p.bookingStatus.slice(1)) : '-',
      ]);

      autoTable(doc, {
        startY: 52,
        head: [headers],
        body,
        theme: 'grid',
        headStyles: {
          fillColor: themeColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
        },
        bodyStyles: { fontSize: 7, halign: 'center' },
        alternateRowStyles: { fillColor: [245, 246, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 34 },
          2: { cellWidth: 22 },
          5: { halign: 'right' },
        },
        didDrawPage: () => {
          const pg = doc.internal.getCurrentPageInfo().pageNumber;
          const total = doc.internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `DriveOn Payment Report  |  Page ${pg} of ${total}`,
            pageW / 2,
            doc.internal.pageSize.getHeight() - 5,
            { align: 'center' }
          );
        },
      });

      doc.save(`DriveOn_Payment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toastUtils.success('PDF report downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toastUtils.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get payment type display name
  const getPaymentTypeName = (type) => {
    const names = {
      full: 'Full Payment',
      partial: 'Partial Payment',
      security_deposit: 'Security Deposit',
    };
    return names[type] || type;
  };

  // Get unique users
  const users = Array.from(
    new Set(
      payments.map((payment) => ({
        id: payment.userId,
        name: payment.userName,
      }))
    )
  );

  // Get unique bookings
  const bookings = Array.from(
    new Set(
      payments.map((payment) => ({
        id: payment.bookingId,
        name: payment.bookingId,
      }))
    )
  );

  // Stats calculation
  const stats = {
    total: payments.length,
    success: payments.filter((p) => p.status === 'success').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    refunded: payments.filter((p) => p.status === 'refunded').length,
    totalRevenue: payments
      .filter((p) => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0),
    totalRefunded: payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.refundAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
                Payment Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Manage all payment transactions</p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
              style={{ backgroundColor: colors.backgroundTertiary, opacity: isExporting ? 0.75 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Reports
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-green-600">{stats.success}</div>
            <div className="text-xs md:text-sm text-gray-600">Success</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-red-600">{stats.failed}</div>
            <div className="text-xs md:text-sm text-gray-600">Failed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600">Pending</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Revenue</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-purple-600">
              ₹{stats.totalRefunded.toLocaleString()}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Refunded</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by transaction ID, booking ID, user name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Status Filter */}
            <AdminCustomSelect
              label="Payment Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
                { value: 'pending', label: 'Pending' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />

            {/* Payment Type Filter */}
            <AdminCustomSelect
              label="Payment Type"
              value={filters.paymentType}
              onChange={(value) => setFilters({ ...filters, paymentType: value })}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'full', label: 'Full Payment' },
                { value: 'partial', label: 'Partial Payment' },
                { value: 'security_deposit', label: 'Security Deposit' },
              ]}
            />

            {/* Date Range Filter */}
            <AdminCustomSelect
              label="Date Range"
              value={filters.dateRange}
              onChange={(value) => setFilters({ ...filters, dateRange: value })}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />

            {/* User Filter */}
            <AdminCustomSelect
              label="User"
              value={filters.user}
              onChange={(value) => setFilters({ ...filters, user: value })}
              options={[
                { value: 'all', label: 'All Users' },
                ...users.map((user) => ({
                  value: user.id,
                  label: user.name,
                })),
              ]}
            />

            {/* Booking Filter */}
            <AdminCustomSelect
              label="Booking"
              value={filters.booking}
              onChange={(value) => setFilters({ ...filters, booking: value })}
              options={[
                { value: 'all', label: 'All Bookings' },
                ...bookings.map((booking) => ({
                  value: booking.id,
                  label: booking.name,
                })),
              ]}
            />
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Payments List */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredPayments.length}</span> of <span className="font-semibold">{payments.length}</span> transactions
          </p>
        </div>

        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {payment.transactionId} - {payment.bookingId}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {payment.userName} • {payment.userEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                      {payment.invoiceGenerated && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Invoice
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                        ₹{payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payment Type</p>
                      <p className="text-sm text-gray-900">{getPaymentTypeName(payment.paymentType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Payment Method</p>
                      <p className="text-sm text-gray-900">{payment.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Gateway</p>
                      <p className="text-sm text-gray-900">{payment.paymentGateway}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>Date: {new Date(payment.timestamp).toLocaleString()}</span>
                    {payment.status === 'failed' && payment.failureReason && (
                      <span className="text-red-600">Reason: {payment.failureReason}</span>
                    )}
                    {payment.status === 'refunded' && payment.refundAmount && (
                      <span className="text-purple-600">
                        Refunded: ₹{payment.refundAmount.toLocaleString()}
                      </span>
                    )}
                    {payment.status === 'refunded' && payment.refundDate && (
                      <span>Refund Date: {new Date(payment.refundDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-40">
                  <button
                    onClick={() => handleViewPayment(payment)}
                    className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    View Details
                  </button>

                  {payment.status === 'success' && !payment.invoiceGenerated && (
                    <button
                      onClick={() => handleGenerateInvoice(payment.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Invoice
                    </button>
                  )}

                  {payment.status === 'success' && payment.invoiceGenerated && (
                    <button
                      onClick={() => handleDownloadInvoice(payment)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Download Invoice
                    </button>
                  )}

                  {payment.status === 'success' && payment.status !== 'refunded' && payment.bookingStatus === 'cancelled' && (
                    <button
                      onClick={() => handleProcessRefund(payment.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Process Refund
                    </button>
                  )}

                  {payment.status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsReceived(payment.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Received
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No payments found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showPaymentDetail && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentDetail(false);
            setSelectedPayment(null);
          }}
          onProcessRefund={handleProcessRefund}
          onMarkAsReceived={handleMarkAsReceived}
          onGenerateInvoice={handleGenerateInvoice}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}


    </div>
  );
};

/**
 * Payment Detail Modal Component
 */
const PaymentDetailModal = ({ payment, onClose, onProcessRefund, onMarkAsReceived, onGenerateInvoice, onDownloadInvoice }) => {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{payment.transactionId}</h2>
            <p className="text-sm text-gray-600">Booking: {payment.bookingId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Transaction Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Transaction ID</label>
                <p className="text-sm text-gray-900 font-mono">{payment.transactionId}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Booking ID</label>
                <p className="text-sm text-gray-900">{payment.bookingId}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Amount</label>
                <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                  ₹{payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Type</label>
                <p className="text-sm text-gray-900">
                  {payment.paymentType === 'full' ? 'Full Payment' : payment.paymentType === 'partial' ? 'Partial Payment' : 'Security Deposit'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Method</label>
                <p className="text-sm text-gray-900">{payment.paymentMethod}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Payment Gateway</label>
                <p className="text-sm text-gray-900">{payment.paymentGateway}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900 capitalize">{payment.status}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Timestamp</label>
                <p className="text-sm text-gray-900">{new Date(payment.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{payment.userName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{payment.userEmail}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">User ID</label>
                <p className="text-sm text-gray-900">{payment.userId}</p>
              </div>
            </div>
          </div>

          {/* Failure/Refund Information */}
          {payment.status === 'failed' && payment.failureReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Failure Reason</h4>
              <p className="text-sm text-red-700">{payment.failureReason}</p>
            </div>
          )}

          {payment.status === 'refunded' && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-800 mb-2">Refund Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-purple-700">Refund Amount</label>
                  <p className="text-sm font-semibold text-purple-900">
                    ₹{payment.refundAmount?.toLocaleString() || payment.amount.toLocaleString()}
                  </p>
                </div>
                {payment.refundDate && (
                  <div>
                    <label className="text-xs font-medium text-purple-700">Refund Date</label>
                    <p className="text-sm text-purple-900">{new Date(payment.refundDate).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Invoice Generated</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${payment.invoiceGenerated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {payment.invoiceGenerated ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {payment.status === 'success' && !payment.invoiceGenerated && (
            <button
              onClick={() => {
                onGenerateInvoice(payment.id);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Invoice
            </button>
          )}
          {payment.status === 'success' && payment.invoiceGenerated && (
            <button
              onClick={() => {
                onDownloadInvoice(payment);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Download Invoice
            </button>
          )}
          {payment.status === 'success' && payment.status !== 'refunded' && payment.bookingStatus === 'cancelled' && (
            <button
              onClick={() => {
                onProcessRefund(payment.id);
                onClose();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Process Refund
            </button>
          )}
          {payment.status === 'pending' && (
            <button
              onClick={() => {
                onMarkAsReceived(payment.id);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark as Received
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Export Report Modal Component
 * Supports PDF, CSV, and Excel export of payment data
 */
const ExportReportModal = ({ payments, stats, filters, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'Professional branded PDF with summary & table',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: '#dc2626',
    },
    {
      id: 'csv',
      label: 'CSV File',
      description: 'Comma-separated values, compatible with Excel',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      color: '#16a34a',
    },
    {
      id: 'excel',
      label: 'Excel (.xlsx)',
      description: 'Native Excel spreadsheet with formatted columns',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      color: '#1d6f42',
    },
  ];

  const getFilterLabel = () => {
    const parts = [];
    if (filters.status !== 'all') parts.push(`Status: ${filters.status}`);
    if (filters.paymentType !== 'all') parts.push(`Type: ${filters.paymentType}`);
    if (filters.dateRange !== 'all') parts.push(`Period: ${filters.dateRange}`);
    return parts.length > 0 ? parts.join(' | ') : 'All Payments';
  };

  const buildRows = () =>
    payments.map((p, i) => ({
      'S.No': i + 1,
      'Transaction ID': p.transactionId || '-',
      'Booking ID': p.bookingId || '-',
      'Customer Name': p.userName || '-',
      'Customer Email': p.userEmail || '-',
      'Amount (INR)': p.amount || 0,
      'Payment Type': p.paymentType === 'full' ? 'Full Payment' : p.paymentType === 'partial' ? 'Partial Payment' : 'Security Deposit',
      'Payment Method': p.paymentMethod || '-',
      'Gateway': p.paymentGateway || '-',
      'Status': p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : '-',
      'Date & Time': p.timestamp ? new Date(p.timestamp).toLocaleString('en-IN') : '-',
      'Booking Status': p.bookingStatus ? (p.bookingStatus.charAt(0).toUpperCase() + p.bookingStatus.slice(1)) : '-',
      'Refund Amount (INR)': p.refundAmount || 0,
      'Refund Date': p.refundDate ? new Date(p.refundDate).toLocaleDateString('en-IN') : '-',
    }));

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const themeColor = [28, 32, 92]; // #1C205C

    // ── Header Banner ──────────────────────────────────────────
    doc.setFillColor(...themeColor);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DRIVEON', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Car Rental Management System', 14, 18);
    doc.text('support@driveon.com  |  +91 9876543210', 14, 23);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT TRANSACTIONS REPORT', pageW / 2, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW / 2, 18, { align: 'center' });
    doc.text(`Filter: ${getFilterLabel()}`, pageW / 2, 23, { align: 'center' });

    // ── Summary Cards ──────────────────────────────────────────
    const cardData = [
      { label: 'Total', value: stats.total, color: themeColor },
      { label: 'Success', value: stats.success, color: [22, 163, 74] },
      { label: 'Failed', value: stats.failed, color: [220, 38, 38] },
      { label: 'Pending', value: stats.pending, color: [202, 138, 4] },
      { label: 'Revenue (INR)', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: themeColor },
      { label: 'Refunded (INR)', value: `₹${stats.totalRefunded.toLocaleString('en-IN')}`, color: [147, 51, 234] },
    ];

    const cardW = (pageW - 28) / cardData.length;
    let cx = 14;
    cardData.forEach(({ label, value, color }) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(cx, 32, cardW - 2, 16, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), cx + (cardW - 2) / 2, 39, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(label, cx + (cardW - 2) / 2, 44, { align: 'center' });
      cx += cardW;
    });

    // ── Transaction Table ──────────────────────────────────────
    const rows = buildRows();
    const headers = Object.keys(rows[0] || {});
    const body = rows.map(r => headers.map(h => r[h]));

    autoTable(doc, {
      startY: 52,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: {
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
      },
      bodyStyles: { fontSize: 7, halign: 'center' },
      alternateRowStyles: { fillColor: [245, 246, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 32 },
        2: { cellWidth: 22 },
        5: { halign: 'right' },
        12: { halign: 'right' },
      },
      didDrawPage: (data) => {
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        const total = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `DriveOn Payment Report  |  Page ${pg} of ${total}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      },
    });

    doc.save(`DriveOn_Payment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportCSV = () => {
    const rows = buildRows();
    if (!rows.length) { toastUtils.error('No data to export'); return; }

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const val = String(r[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      ),
    ];

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DriveOn_Payment_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    const rows = buildRows();
    if (!rows.length) { toastUtils.error('No data to export'); return; }

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // ── Summary Sheet ──────────────────────────────────────────
    const summaryData = [
      ['DriveOn - Payment Transactions Report'],
      [`Generated: ${new Date().toLocaleString('en-IN')}`],
      [`Filter Applied: ${getFilterLabel()}`],
      [],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Transactions', stats.total],
      ['Successful', stats.success],
      ['Failed', stats.failed],
      ['Pending', stats.pending],
      ['Total Revenue (INR)', stats.totalRevenue],
      ['Total Refunded (INR)', stats.totalRefunded],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // ── Transactions Sheet ─────────────────────────────────────
    const txSheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = [
      { wch: 6 }, { wch: 32 }, { wch: 20 }, { wch: 22 }, { wch: 28 },
      { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
      { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
    ];
    txSheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

    XLSX.writeFile(wb, `DriveOn_Payment_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownload = async () => {
    if (!payments.length) {
      toastUtils.error('No data to export with current filters');
      return;
    }
    setIsExporting(true);
    try {
      if (selectedFormat === 'pdf') await handleExportPDF();
      else if (selectedFormat === 'csv') handleExportCSV();
      else await handleExportExcel();
      toastUtils.success(`Report exported as ${selectedFormat.toUpperCase()} successfully!`);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      toastUtils.error('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.25s ease' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1C205C 0%, #2d3494 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Export Payment Report</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {payments.length} transaction{payments.length !== 1 ? 's' : ''} • {getFilterLabel()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Total', value: stats.total, color: '#1C205C' },
            { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: '#16a34a' },
            { label: 'Refunded', value: `₹${stats.totalRefunded.toLocaleString('en-IN')}`, color: '#9333ea' },
          ].map(({ label, value, color }) => (
            <div key={label} className="py-3 text-center">
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Format Selection */}
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Export Format</p>
          <div className="space-y-3">
            {formatOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedFormat(opt.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: selectedFormat === opt.id ? opt.color : '#e5e7eb',
                  backgroundColor: selectedFormat === opt.id ? `${opt.color}10` : '#fafafa',
                }}
              >
                <div
                  className="flex-shrink-0 p-2 rounded-lg"
                  style={{
                    color: opt.color,
                    backgroundColor: `${opt.color}15`,
                  }}
                >
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: selectedFormat === opt.id ? opt.color : '#d1d5db' }}
                >
                  {selectedFormat === opt.id && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting || !payments.length}
            className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: isExporting || !payments.length
                ? '#9ca3af'
                : 'linear-gradient(135deg, #1C205C 0%, #2d3494 100%)',
              cursor: isExporting || !payments.length ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default PaymentListPage;


