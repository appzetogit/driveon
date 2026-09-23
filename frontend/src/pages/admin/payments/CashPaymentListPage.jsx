import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';
import api from '../../../services/api';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';

const CashPaymentListPage = () => {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filters state
  const [filters, setFilters] = useState({
    bookingType: 'all', // all, Normal, Inward, Outward
    stage: 'all',       // all, Advance Payment, Remaining Payment, Full Payment
    dateRange: 'all',   // all, today, yesterday, week, month, custom
  });

  // Reset current page when any filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, startDate, endDate]);

  // Format currency helper (exact Indian Rupees)
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return '₹' + new Intl.NumberFormat('en-IN').format(num);
  };

  // Fetch and combine data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cashEntries = [];

        // 1. Fetch normal bookings
        let normalBookings = [];
        try {
          const normalRes = await adminService.getAllBookings({ page: 1, limit: 1000 });
          if (normalRes.success && normalRes.data?.bookings) {
            normalBookings = normalRes.data.bookings;
          }
        } catch (err) {
          console.error('Error fetching normal bookings for cash:', err);
        }

        // Process normal bookings cash payments
        normalBookings.forEach((booking) => {
          if (booking.transactions && Array.isArray(booking.transactions)) {
            const cashTxns = booking.transactions.filter(t => t.paymentMethod?.toLowerCase() === 'cash');
            booking.transactions.forEach((transaction) => {
              if (transaction.paymentMethod && transaction.paymentMethod.toLowerCase() === 'cash') {
                // Determine payment stage
                let stage = 'Full Payment';
                if (booking.paymentOption === 'advance') {
                  const advanceAmount = booking.pricing?.advancePayment || 0;
                  if (Math.abs(transaction.amount - advanceAmount) < 2) {
                    stage = 'Advance Payment';
                  } else {
                    stage = 'Remaining Payment';
                  }
                }

                // Check other cash transaction collector
                let otherCollector = '';
                let otherStage = '';
                if (stage === 'Remaining Payment') {
                  const otherTx = cashTxns.find(t => t._id?.toString() !== transaction._id?.toString());
                  if (otherTx) {
                    otherCollector = otherTx.receivedBy || 'DriveOn Admin';
                    otherStage = 'Advance';
                  }
                }

                cashEntries.push({
                  id: transaction._id?.toString() || transaction.transactionId || `${booking.bookingId}_${transaction.amount}`,
                  bookingId: booking.bookingId || booking._id?.toString(),
                  customerName: booking.user?.name || 'Customer',
                  customerPhone: booking.user?.phone || 'N/A',
                  bookingType: 'Normal',
                  amount: transaction.amount || 0,
                  stage: stage,
                  receivedBy: transaction.receivedBy || 'DriveOn Admin',
                  otherCollector: otherCollector,
                  otherStage: otherStage,
                  date: transaction.paymentDate || transaction.createdAt || booking.createdAt || booking.bookingDate || new Date().toISOString()
                });
              }
            });
          }
        });

        // 2. Fetch fleet bookings
        let fleetBookings = [];
        try {
          const fleetRes = await api.get('/fleet/outward-bookings');
          if (fleetRes.data?.success && Array.isArray(fleetRes.data.data)) {
            fleetBookings = fleetRes.data.data;
          }
        } catch (err) {
          console.error('Error fetching fleet bookings for cash:', err);
        }

        // Process fleet bookings cash payments
        fleetBookings.forEach((b) => {
          const carTypeLabel = b.carType === 'inward' ? 'Inward' : 'Outward';

          // Advance Payment
          const isAdvanceCash = b.advancePaymentMode?.toLowerCase() === 'cash' ||
            (!b.advancePaymentMode && b.paymentMode?.toLowerCase() === 'cash');
          const isRemainingCash = b.remainingPaymentMode?.toLowerCase() === 'cash';
          const remainingAmount = Number(b.paidAmount || 0) - Number(b.advanceAmount || 0);

          const advCollector = b.advanceCashCollector || b.cashCollector || 'Staff';
          const remCollector = b.remainingCashCollector || b.cashCollector || 'Staff';

          if (isAdvanceCash && b.advanceAmount > 0) {
            cashEntries.push({
              id: `${b.id}_advance`,
              bookingId: b.id,
              customerName: b.customerName || 'Customer',
              customerPhone: b.customerPhone || 'N/A',
              bookingType: carTypeLabel,
              amount: b.advanceAmount,
              stage: 'Advance Payment',
              receivedBy: advCollector,
              otherCollector: '',
              otherStage: '',
              date: b.createdAt || new Date().toISOString()
            });
          }

          // Remaining Payment
          if (isRemainingCash && remainingAmount > 0) {
            cashEntries.push({
              id: `${b.id}_remaining`,
              bookingId: b.id,
              customerName: b.customerName || 'Customer',
              customerPhone: b.customerPhone || 'N/A',
              bookingType: carTypeLabel,
              amount: remainingAmount,
              stage: 'Remaining Payment',
              receivedBy: remCollector,
              otherCollector: (isAdvanceCash && b.advanceAmount > 0) ? advCollector : '',
              otherStage: 'Advance',
              date: b.updatedAt || new Date().toISOString()
            });
          }

          // Fallback generic Cash booking
          const hasAddedAny = (isAdvanceCash && b.advanceAmount > 0) || (isRemainingCash && remainingAmount > 0);
          if (!hasAddedAny && b.paymentMode?.toLowerCase() === 'cash' && b.paidAmount > 0) {
            cashEntries.push({
              id: `${b.id}_full`,
              bookingId: b.id,
              customerName: b.customerName || 'Customer',
              customerPhone: b.customerPhone || 'N/A',
              bookingType: carTypeLabel,
              amount: b.paidAmount,
              stage: 'Full Payment',
              receivedBy: b.cashCollector || 'Staff',
              otherCollector: '',
              otherStage: '',
              date: b.createdAt || new Date().toISOString()
            });
          }
        });

        // Sort combined list by date descending
        cashEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(cashEntries);
      } catch (error) {
        console.error('Error fetching cash payments:', error);
        toastUtils.error('Failed to load cash payments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter & Search Logic
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const keywords = query.split(/\s+/).filter(Boolean);
        const matchesAllKeywords = keywords.every((keyword) => {
          const bookingId = (entry.bookingId || '').toLowerCase();
          const customerName = (entry.customerName || '').toLowerCase();
          const customerPhone = (entry.customerPhone || '').toLowerCase();
          const receivedBy = (entry.receivedBy || '').toLowerCase();

          return (
            bookingId.includes(keyword) ||
            customerName.includes(keyword) ||
            customerPhone.includes(keyword) ||
            receivedBy.includes(keyword)
          );
        });

        if (!matchesAllKeywords) return false;
      }

      // 2. Booking Type Filter
      if (filters.bookingType !== 'all' && entry.bookingType !== filters.bookingType) {
        return false;
      }

      // 3. Stage Filter
      if (filters.stage !== 'all' && entry.stage !== filters.stage) {
        return false;
      }

      // 4. Date Range Filter
      if (filters.dateRange !== 'all') {
        const entryDate = new Date(entry.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (entryDate < today || entryDate >= tomorrow) return false;
        } else if (filters.dateRange === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          if (entryDate < yesterday || entryDate >= today) return false;
        } else if (filters.dateRange === 'week') {
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          if (entryDate < oneWeekAgo) return false;
        } else if (filters.dateRange === 'month') {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
          if (entryDate < oneMonthAgo) return false;
        } else if (filters.dateRange === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (entryDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (entryDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [entries, searchQuery, filters, startDate, endDate]);

  // Statistics calculation
  const stats = useMemo(() => {
    return filteredEntries.reduce(
      (acc, curr) => {
        acc.total += curr.amount;
        if (curr.bookingType === 'Normal') acc.normal += curr.amount;
        if (curr.bookingType === 'Inward') acc.inward += curr.amount;
        if (curr.bookingType === 'Outward') acc.outward += curr.amount;
        return acc;
      },
      { total: 0, normal: 0, inward: 0, outward: 0 }
    );
  }, [filteredEntries]);

  // Collector statistics calculation
  const collectorStats = useMemo(() => {
    const statsMap = {};
    filteredEntries.forEach((entry) => {
      const collector = entry.receivedBy || 'Staff';
      statsMap[collector] = (statsMap[collector] || 0) + entry.amount;
    });
    return Object.entries(statsMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredEntries]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEntries.length / 15);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * 15;
    return filteredEntries.slice(start, start + 15);
  }, [filteredEntries, currentPage]);

  // Export to PDF Function
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      if (filteredEntries.length === 0) {
        toastUtils.error('No records to export');
        return;
      }

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
      doc.text('CASH PAYMENTS REPORT', pageW / 2, 12, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW / 2, 18, { align: 'center' });
      
      const filterParts = [];
      if (filters.bookingType !== 'all') filterParts.push(`Type: ${filters.bookingType}`);
      if (filters.stage !== 'all') filterParts.push(`Stage: ${filters.stage}`);
      if (filters.dateRange !== 'all') {
        if (filters.dateRange === 'custom') {
          filterParts.push(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`);
        } else {
          filterParts.push(`Period: ${filters.dateRange}`);
        }
      }
      const filterLabel = filterParts.length > 0 ? filterParts.join(' | ') : 'All Cash Payments';
      doc.text(`Filter: ${filterLabel}`, pageW / 2, 23, { align: 'center' });

      // ── Summary Cards ──────────────────────────────────────
      const cardData = [
        { label: 'Total Cash', value: `Rs. ${(stats.total || 0).toLocaleString('en-IN')}`, color: themeColor },
        { label: 'Normal Bookings', value: `Rs. ${(stats.normal || 0).toLocaleString('en-IN')}`, color: [147, 51, 234] }, // purple-600
        { label: 'Inward Fleet', value: `Rs. ${(stats.inward || 0).toLocaleString('en-IN')}`, color: [22, 163, 74] },   // green-600
        { label: 'Outward Fleet', value: `Rs. ${(stats.outward || 0).toLocaleString('en-IN')}`, color: [37, 99, 235] },  // blue-600
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
        'S.No', 'Date & Time', 'Booking ID', 'Customer Name', 'Customer Phone',
        'Booking Type', 'Payment Stage', 'Cash Collector', 'Amount'
      ];
      const body = filteredEntries.map((p, i) => {
        let collectorText = p.receivedBy;
        if (p.otherCollector) {
          collectorText += `\n(${p.otherStage}: ${p.otherCollector})`;
        }
        return [
          i + 1,
          new Date(p.date).toLocaleString('en-IN'),
          p.bookingId || '-',
          p.customerName || '-',
          p.customerPhone || '-',
          p.bookingType || '-',
          p.stage || '-',
          collectorText,
          `Rs. ${(p.amount || 0).toLocaleString('en-IN')}`
        ];
      });

      autoTable(doc, {
        startY: 52,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: themeColor, fontStyle: 'bold', halign: 'left' },
        columnStyles: {
          8: { halign: 'right' } // Right align Amount column
        },
        styles: { fontSize: 8.5, cellPadding: 2.5 }
      });

      doc.save(`Cash_Payments_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toastUtils.success('PDF Report exported successfully!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toastUtils.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Inward':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'Outward':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'Normal':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        
        {/* Header Title Grid */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl font-black mb-1"
                style={{ color: colors.backgroundTertiary }}
              >
                Cash Payments List
              </h1>
              <p className="text-xs md:text-sm text-gray-600 font-medium">
                Overview of cash collections across Normal, Inward, and Outward bookings
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-white font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm text-xs"
              style={{
                backgroundColor: colors.backgroundTertiary,
                opacity: isExporting ? 0.75 : 1,
                cursor: isExporting ? 'not-allowed' : 'pointer',
              }}
            >
              {isExporting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Premium Dashboard Metrics Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-[#1C205C] bg-white shadow-sm hover:shadow transition-shadow">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Cash Collected</span>
            <div className="text-xl md:text-2xl font-black text-[#1C205C] mt-1">
              {formatCurrency(stats.total)}
            </div>
          </Card>

          <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-purple-600 bg-white shadow-sm hover:shadow transition-shadow">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Normal Bookings</span>
            <div className="text-xl md:text-2xl font-black text-purple-700 mt-1">
              {formatCurrency(stats.normal)}
            </div>
          </Card>

          <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-green-600 bg-white shadow-sm hover:shadow transition-shadow">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Inward Fleet Bookings</span>
            <div className="text-xl md:text-2xl font-black text-green-700 mt-1">
              {formatCurrency(stats.inward)}
            </div>
          </Card>

          <Card className="p-3.5 flex flex-col justify-between border-l-4 border-l-blue-600 bg-white shadow-sm hover:shadow transition-shadow">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Outward Fleet Bookings</span>
            <div className="text-xl md:text-2xl font-black text-blue-700 mt-1">
              {formatCurrency(stats.outward)}
            </div>
          </Card>
        </div>

        {/* Cash Collection by Collector stats cards */}
        <div className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 px-1">Cash Collection by Collector</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {collectorStats.map((col, index) => (
              <Card key={index} className="p-3 flex flex-col justify-between border-l-4 border-l-teal-600 bg-white shadow-sm hover:shadow transition-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 truncate">{col.name}</span>
                <div className="text-lg font-black text-[#1C205C] mt-0.5">
                  {formatCurrency(col.amount)}
                </div>
              </Card>
            ))}
            {collectorStats.length === 0 && (
              <div className="col-span-full p-4 text-center text-xs font-semibold text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                No collections found.
              </div>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <Card className="p-4 mb-6 bg-white shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-end gap-4">
            
            {/* Search Input Container */}
            <div className="flex-1 min-w-[260px] max-w-md">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Search Records</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search ID, customer, collector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#1C205C] transition-all bg-[#fcfcfc] text-xs h-[38px] font-semibold"
                />
              </div>
            </div>

            {/* Filters Container */}
            <div className="flex flex-wrap md:flex-nowrap items-end gap-3 flex-1">
              <AdminCustomSelect
                label="Booking Type"
                value={filters.bookingType}
                onChange={(val) => setFilters({ ...filters, bookingType: val })}
                options={[
                  { value: 'all', label: 'All Booking Types' },
                  { value: 'Normal', label: 'Normal Booking' },
                  { value: 'Inward', label: 'Inward Booking' },
                  { value: 'Outward', label: 'Outward Booking' }
                ]}
              />

              <AdminCustomSelect
                label="Payment Stage"
                value={filters.stage}
                onChange={(val) => setFilters({ ...filters, stage: val })}
                options={[
                  { value: 'all', label: 'All Payment Stages' },
                  { value: 'Advance Payment', label: 'Advance Payment' },
                  { value: 'Remaining Payment', label: 'Remaining Payment' },
                  { value: 'Full Payment', label: 'Full Payment' }
                ]}
              />

              <AdminCustomSelect
                label="Date Range"
                value={filters.dateRange}
                onChange={(val) => setFilters({ ...filters, dateRange: val })}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'custom', label: 'Custom Date Range' }
                ]}
              />

              {filters.dateRange === 'custom' && (
                <div className="flex items-center gap-2 flex-shrink-0 animate-fade-in">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#1C205C] bg-[#fcfcfc] text-xs font-semibold h-[38px] w-[150px] cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#1C205C] bg-[#fcfcfc] text-xs font-semibold h-[38px] w-[150px] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500 font-medium px-1">
          <span>
            Showing <span className="font-bold text-gray-800">{Math.min(filteredEntries.length, (currentPage - 1) * 15 + 1)}</span> to{' '}
            <span className="font-bold text-gray-800">{Math.min(currentPage * 15, filteredEntries.length)}</span> of{' '}
            <span className="font-bold text-gray-800">{filteredEntries.length}</span> transactions
          </span>
        </div>

        {/* Transactions Table / List */}
        {filteredEntries.length === 0 ? (
          <Card className="p-8 text-center bg-white shadow-sm">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.5 7.5h7M8.5 10.5h6M8.5 7.5c4 0 6 2 6 4.5 0 3-3 4.5-6 4.5h2l4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold text-sm">No cash transactions found matching your filters.</p>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Type</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Stage</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Cash Collector</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                        {new Date(entry.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#1C205C]">
                        {entry.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{entry.customerName}</div>
                        <div className="text-xs text-gray-500">{entry.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeClass(entry.bookingType)}`}>
                          {entry.bookingType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold">
                        {entry.stage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-700">{entry.receivedBy}</div>
                        {entry.otherCollector && (
                          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            {entry.otherStage}: {entry.otherCollector}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-[#1C205C]">
                        {formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block lg:hidden divide-y divide-gray-100">
              {paginatedEntries.map((entry) => (
                <div key={entry.id} className="p-5 space-y-3 hover:bg-gray-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-400 font-medium block">
                        {new Date(entry.date).toLocaleString()}
                      </span>
                      <span className="font-black text-sm text-[#1C205C] mt-1 block">
                        #{entry.bookingId}
                      </span>
                    </div>
                    <span className="font-black text-base text-[#1C205C]">
                      {formatCurrency(entry.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-gray-50">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Customer</span>
                      <span className="font-semibold text-gray-900 block">{entry.customerName}</span>
                      <span className="text-gray-500 block">{entry.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Cash Collector</span>
                      <span className="font-bold text-gray-800 block">{entry.receivedBy}</span>
                      {entry.otherCollector && (
                        <span className="text-[9px] text-gray-500 font-semibold block mt-0.5">
                          {entry.otherStage}: {entry.otherCollector}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${getBadgeClass(entry.bookingType)}`}>
                      {entry.bookingType}
                    </span>
                    <span className="text-gray-600 font-semibold bg-gray-50 px-2 py-0.5 rounded">
                      {entry.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
                <span className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-800">{(currentPage - 1) * 15 + 1}</span> to{' '}
                  <span className="font-bold text-gray-800">
                    {Math.min(currentPage * 15, filteredEntries.length)}
                  </span>{' '}
                  of <span className="font-bold text-gray-800">{filteredEntries.length}</span> records
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M17 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>

                  {/* Page numbers list */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 text-xs font-bold rounded-lg transition-all border ${
                            currentPage === pageNum
                              ? 'bg-[#1C205C] border-[#1C205C] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return <span key={pageNum} className="text-gray-400 px-1 text-xs">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M7 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashPaymentListPage;
