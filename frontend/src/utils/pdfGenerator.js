import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF for booking details (Premium Single Page Design)
 * @param {Object} bookingData - Complete booking data including user, car, and booking details
 */
export const generateBookingPDF = (bookingData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin; // 180mm
  const colWidth = 85; // 85mm each column
  const rightColX = margin + colWidth + 10; // 15 + 85 + 10 = 110mm

  // Company Colors
  const primaryColor = [28, 32, 92]; // Dark deep navy (#1C205C)
  const accentColor = [59, 130, 246]; // Modern blue accent
  const lightGray = [248, 250, 252]; // Sleek gray bg
  const borderGray = [226, 232, 240]; // Light slate borders
  const darkGray = [71, 85, 105]; // Slate text color

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return 'N/A';
    return `Rs. ${numAmount.toLocaleString('en-IN')}`;
  };

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Helper function to add key-value pair cleanly
  const addKeyValue = (key, value, x, y, width) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text(`${key}:`, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42); // slate-900
    const valueX = x + 32;
    const valueWidth = width - 32;
    const valText = String(value || 'N/A');
    const valueLines = doc.splitTextToSize(valText, valueWidth);
    doc.text(valueLines, valueX, y);

    return Math.max(1, valueLines.length) * 4;
  };

  // Helper function to add styled headers for sections
  const addCompactSectionHeader = (title, x, y, width) => {
    // Fill small banner
    doc.setFillColor(...primaryColor);
    doc.roundedRect(x, y - 5, width, 7, 1, 1, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, x + 4, y);
    doc.setTextColor(0, 0, 0);

    return y + 7;
  };

  // ========== HEADER SECTION ==========
  // Top border banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let yPosition = 16;

  // Company Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DRIVE ON', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // Tagline
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Premium Car Rental Services', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5.5;

  // Title: PAYMENT INVOICE & BOOKING RECEIPT
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PAYMENT INVOICE & BOOKING RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4.5;

  // Powered By Subtitle
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Payment Invoice powered by URBAN MOBILITY RENTALS PRIVATE LIMITED', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 7;

  // Booking ID & Generation Info Box
  const infoBoxY = yPosition;
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, infoBoxY - 4, contentWidth, 10, 1.5, 1.5, 'F');

  // Booking ID (Left aligned in box)
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text(`Booking ID: ${bookingData.bookingId || 'N/A'}`, margin + 6, infoBoxY + 2.5);

  // Receipt Date (Right aligned in box)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  const formatDateTime = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };
  const genDate = bookingData.createdAt
    ? formatDateTime(new Date(bookingData.createdAt))
    : formatDateTime(new Date());
  doc.text(`Generated on: ${genDate}`, pageWidth - margin - 6, infoBoxY + 2.5, { align: 'right' });

  yPosition += 14;

  // ========== ROW 1: USER & CAR INFO (Side-by-Side) ==========
  const row1Y = yPosition;

  // --- COLUMN 1: USER INFORMATION ---
  let leftY = addCompactSectionHeader('USER INFORMATION', margin, row1Y, colWidth);
  const user = bookingData.user || {};
  const personal = bookingData.personalDetails || {};

  const userName = personal.name || user.name || user.fullName || 'N/A';
  const userEmail = personal.email || user.email || 'N/A';
  const userPhone = personal.phone || user.phone || 'N/A';
  const userAge = personal.age || user.age || 'N/A';
  const userGender = personal.gender || user.gender || 'N/A';
  const userAddress = bookingData.currentAddress || user.address || 'N/A';

  leftY += addKeyValue('Name', userName, margin, leftY, colWidth);
  leftY += addKeyValue('Email', userEmail, margin, leftY, colWidth);
  leftY += addKeyValue('Phone', userPhone ? `+91 ${userPhone}` : 'N/A', margin, leftY, colWidth);
  leftY += addKeyValue('Age', String(userAge), margin, leftY, colWidth);
  leftY += addKeyValue('Gender', typeof userGender === 'string' && userGender ? userGender.charAt(0).toUpperCase() + userGender.slice(1) : 'N/A', margin, leftY, colWidth);
  leftY += addKeyValue('Address', userAddress, margin, leftY, colWidth);

  // --- COLUMN 2: CAR INFORMATION ---
  let rightY = addCompactSectionHeader('CAR INFORMATION', rightColX, row1Y, colWidth);
  const car = bookingData.car || {};
  const carBrandModel = car.brand ? `${car.brand} ${car.model}` : (bookingData.carName || 'N/A');
  const carSeats = car.seats || car.seatingCapacity || 5;
  const carTransmission = car.transmission || 'Automatic';
  const carFuelType = car.fuelType || 'Petrol';
  const carRegNumber = car.registrationNumber || 'N/A';

  rightY += addKeyValue('Car Model', carBrandModel, rightColX, rightY, colWidth);
  rightY += addKeyValue('Seats', `${carSeats} Seats`, rightColX, rightY, colWidth);
  rightY += addKeyValue('Transmission', carTransmission, rightColX, rightY, colWidth);
  rightY += addKeyValue('Fuel Type', carFuelType, rightColX, rightY, colWidth);
  if (carRegNumber !== 'N/A') {
    rightY += addKeyValue('Registration', carRegNumber, rightColX, rightY, colWidth);
  }

  // Set yPosition below the taller column
  yPosition = Math.max(leftY, rightY) + 4;

  // Subtle separator line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 9;

  // ========== ROW 2: BOOKING & ADDITIONAL DETAILS (Side-by-Side) ==========
  const row2Y = yPosition;

  // Payment Option formatting for Booking Details column
  let paymentOptionText = bookingData.paymentOption || 'N/A';
  if (bookingData.paymentOption === 'advance' || bookingData.advanceAmount > 0) {
    let percentage = 20; // Default to 20% fallback (since system settings default is 20%)
    if (bookingData.pricing && bookingData.pricing.totalPrice > 0 && (bookingData.pricing.advancePayment > 0 || bookingData.pricing.advanceAmount > 0)) {
      percentage = Math.round(((bookingData.pricing.advancePayment || bookingData.pricing.advanceAmount) / bookingData.pricing.totalPrice) * 100);
    } else if (bookingData.totalPrice > 0 && (bookingData.paidAmount || bookingData.advancePayment || bookingData.advanceAmount)) {
      const paid = bookingData.paidAmount || bookingData.advancePayment || bookingData.advanceAmount;
      percentage = Math.round((paid / bookingData.totalPrice) * 100);
    }
    paymentOptionText = `${percentage}% Advance`;
  } else if (bookingData.paymentOption === 'full') {
    paymentOptionText = 'Full Payment';
  }

  // --- COLUMN 1: BOOKING DETAILS ---
  leftY = addCompactSectionHeader('BOOKING DETAILS', margin, row2Y, colWidth);
  const pickupDateStr = bookingData.pickupDate || bookingData.tripStart?.date;
  const dropDateStr = bookingData.dropDate || bookingData.tripEnd?.date;
  const pickupTimeStr = bookingData.pickupTime || bookingData.tripStart?.time || '10:00';
  const dropTimeStr = bookingData.dropTime || bookingData.tripEnd?.time || '10:00';

  leftY += addKeyValue('Pickup Date', formatDate(pickupDateStr), margin, leftY, colWidth);
  leftY += addKeyValue('Pickup Time', pickupTimeStr, margin, leftY, colWidth);
  leftY += addKeyValue('Drop Date', formatDate(dropDateStr), margin, leftY, colWidth);
  leftY += addKeyValue('Drop Time', dropTimeStr, margin, leftY, colWidth);

  // Total Days Calculation
  let daysVal = bookingData.days || bookingData.totalDays || 1;
  if (pickupDateStr && dropDateStr) {
    try {
      const p = new Date(pickupDateStr);
      const d = new Date(dropDateStr);
      const diff = Math.abs(d - p);
      daysVal = Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
    } catch { }
  }
  leftY += addKeyValue('Total Days', `${daysVal} Day${daysVal > 1 ? 's' : ''}`, margin, leftY, colWidth);

  // Transaction ID
  let transactionIdText = 'N/A';
  if (bookingData.transactions && bookingData.transactions.length > 0) {
    const successfulTxn = bookingData.transactions.find(t => t.status === 'success');
    if (successfulTxn && successfulTxn.transactionId) {
      transactionIdText = successfulTxn.transactionId;
    } else {
      const firstValidTxn = bookingData.transactions.find(t => t.transactionId);
      if (firstValidTxn) {
        transactionIdText = firstValidTxn.transactionId;
      }
    }
  } else if (bookingData.transactionId) {
    transactionIdText = bookingData.transactionId;
  }
  leftY += addKeyValue('Transaction ID', transactionIdText, margin, leftY, colWidth);

  // --- COLUMN 2: ADDITIONAL DETAILS ---
  rightY = row2Y;
  const addOns = bookingData.addOnServices || {};
  const addOnItems = [];
  if (addOns.driver > 0) addOnItems.push(`Driver(${addOns.driver})`);
  if (addOns.bodyguard > 0) addOnItems.push(`Bodyguard(${addOns.bodyguard})`);
  if (addOns.gunmen > 0) addOnItems.push(`Gunmen(${addOns.gunmen})`);
  if (addOns.bouncer > 0) addOnItems.push(`Bouncer(${addOns.bouncer})`);
  const hasAddOns = addOnItems.length > 0;
  const hasSpecialRequests = !!bookingData.specialRequests;

  if (hasSpecialRequests || hasAddOns) {
    rightY = addCompactSectionHeader('ADDITIONAL DETAILS', rightColX, row2Y, colWidth);
    if (hasSpecialRequests) {
      rightY += addKeyValue('Special Req.', bookingData.specialRequests, rightColX, rightY, colWidth);
    }
    if (hasAddOns) {
      rightY += addKeyValue('Add-ons', addOnItems.join(', '), rightColX, rightY, colWidth);
    }
  }


  yPosition = Math.max(leftY, rightY) + 6;

  // ========== PRICING DETAILS (Horizontal Breakdown Block) ==========
  const pricingBoxY = yPosition;
  const pricingBoxHeight = 24;
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, pricingBoxY - 5, contentWidth, pricingBoxHeight, 2, 2, 'F');

  // Pricing Box Header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PRICING BREAKDOWN', margin + 5, pricingBoxY);

  // Pricing Divider Line
  doc.setDrawColor(...borderGray);
  doc.line(margin + 5, pricingBoxY + 2, margin + contentWidth - 5, pricingBoxY + 2);

  // Render side-by-side grid
  const cellWidth = contentWidth / 5;
  const yVal = pricingBoxY + 9;

  const totalDiscount = bookingData.pricing?.discount || bookingData.discount || 0;
  const subtotal = bookingData.pricing?.totalPrice || bookingData.totalPrice || 0;
  const finalPrice = subtotal - totalDiscount;

  // Column 1: Subtotal
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Subtotal', margin + 5, yVal);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(formatCurrency(subtotal), margin + 5, yVal + 5);

  // Column 2: Total Discount
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Total Discount', margin + cellWidth + 5, yVal);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green
  doc.text(formatCurrency(totalDiscount), margin + cellWidth + 5, yVal + 5);

  // Column 3: Final Price
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Final Price', margin + 2 * cellWidth + 5, yVal);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(formatCurrency(finalPrice), margin + 2 * cellWidth + 5, yVal + 5);

  // Column 4: Paid Amount
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Paid Amount', margin + 3 * cellWidth + 5, yVal);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor); // Blue
  doc.text(formatCurrency(bookingData.paidAmount || bookingData.advancePayment), margin + 3 * cellWidth + 5, yVal + 5);

  // Column 5: Remaining Amount
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Remaining Amount', margin + 4 * cellWidth + 5, yVal);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(formatCurrency(bookingData.remainingAmount), margin + 4 * cellWidth + 5, yVal + 5);

  // ========== DISCOUNTS & PROMOTIONS APPLIED ==========
  const offerDiscount = bookingData.pricing?.offerDiscount || bookingData.offerDiscount || 0;
  const pointsDiscount = bookingData.pricing?.pointsDiscount || 0;
  const couponDiscount = Math.max(0, totalDiscount - offerDiscount - pointsDiscount);
  const couponCode = bookingData.pricing?.couponCode || bookingData.couponCode;
  const offerCode = bookingData.pricing?.offerCode || bookingData.offerCode;

  const hasDiscounts = couponDiscount > 0 || offerDiscount > 0 || pointsDiscount > 0;

  if (hasDiscounts) {
    yPosition = pricingBoxY + pricingBoxHeight + 5;
    const discountLines = (couponDiscount > 0 ? 1 : 0) + (offerDiscount > 0 ? 1 : 0) + (pointsDiscount > 0 ? 1 : 0);
    const discountBoxHeight = 10 + (discountLines * 5.5);

    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPosition - 5, contentWidth, discountBoxHeight, 2, 2, 'F');

    // Header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DISCOUNTS & PROMOTIONS APPLIED', margin + 5, yPosition);

    // Divider Line
    doc.setDrawColor(...borderGray);
    doc.line(margin + 5, yPosition + 2, margin + contentWidth - 5, yPosition + 2);

    let discountY = yPosition + 8;
    const successColor = [22, 163, 74]; // green-600
    const goldColor = [161, 98, 7]; // gold/amber (#A16207)

    if (couponDiscount > 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Coupon Discount:', margin + 5, discountY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text(`-${formatCurrency(couponDiscount)}`, margin + contentWidth - 5, discountY, { align: 'right' });
      discountY += 5.5;
    }

    if (offerDiscount > 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Offer Discount:', margin + 5, discountY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...successColor);
      doc.text(`-${formatCurrency(offerDiscount)}`, margin + contentWidth - 5, discountY, { align: 'right' });
      discountY += 5.5;
    }

    if (pointsDiscount > 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Coins Discount:', margin + 5, discountY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...goldColor);
      doc.text(`-${formatCurrency(pointsDiscount)}`, margin + contentWidth - 5, discountY, { align: 'right' });
    }
  }

  // ========== FOOTER SECTION ==========
  const footerY = pageHeight - 24;

  // Thin separator for footer
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  // Powered by legal entity
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Payment Invoice powered by URBAN MOBILITY RENTALS PRIVATE LIMITED', pageWidth / 2, footerY, { align: 'center' });

  // Address & Support Details
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('DRIVE ON Car Rental Services  |  Support: support@driveon.com  |  Official Computer-Generated Receipt', pageWidth / 2, footerY + 4.5, { align: 'center' });

  // Strict 1-Page receipt naming
  const fileName = `Booking_${bookingData.bookingId || 'Receipt'}.pdf`;
  doc.save(fileName);
};

/**
 * Generate PDF for all bookings data (tabular format)
 * @param {Array} bookings - Array of booking objects
 * @param {Object} stats - Global stats for the header
 */
export const generateAllBookingsPDF = (bookings, stats) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for tabular data
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(28, 32, 92);
  doc.text('DriveOn - Bookings Report', pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 32, 92);
  doc.text('Powered by URBAN MOBILITY RENTALS PRIVATE LIMITED', pageWidth / 2, 23, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 29, { align: 'center' });

  // Stats Summary
  if (stats) {
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Bookings: ${stats.total || 0}   |   Confirmed: ${stats.confirmed || 0}   |   Completed: ${stats.completed || 0}   |   Revenue: Rs. ${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, 14, 40);
  }

  // Table Data
  const tableColumn = ["Booking ID", "User Name", "Car", "Status", "Payment", "Start Date", "Total Amount"];
  const tableRows = [];

  bookings.forEach(booking => {
    const rowData = [
      booking.bookingId || 'N/A',
      booking.userName || 'N/A',
      booking.carName || 'N/A',
      (booking.status || 'N/A').toUpperCase(),
      (booking.paymentStatus || 'N/A').toUpperCase(),
      booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN') : 'N/A',
      `Rs. ${(booking.totalAmount || 0).toLocaleString('en-IN')}`
    ];
    tableRows.push(rowData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: stats ? 45 : 35,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [28, 32, 92], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: () => {
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text('Report powered by URBAN MOBILITY RENTALS PRIVATE LIMITED  |  DriveOn Fleet Management', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
  });

  doc.save(`DriveOn_Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Helper to draw a crisp vector checkmark in jsPDF (avoids Unicode font issues with standard fonts)
 */
const drawVectorCheckmark = (doc, x, y, size = 3.5, color = [255, 255, 255], lineWidth = 0.7) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.line(x, y + size * 0.55, x + size * 0.42, y + size);
  doc.line(x + size * 0.42, y + size, x + size, y + size * 0.1);
};

/**
 * Generate PDF for Inward Fleet Vehicle Rental Agreement (Instant Vector High-Res 2-Page Contract)
 */
export const generateInwardAgreementPDF = ({
  bookingDetails = {},
  agreementId = '',
  verifiedAgreement = null,
  template = {},
}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin; // 182mm

  // Theme Colors
  const primaryNavy = [28, 32, 92]; // #1C205C
  const accentBlue = [37, 99, 235]; // #2563EB
  const successGreen = [22, 163, 74]; // #16A34A
  const darkText = [15, 23, 42]; // #0F172A
  const slateGray = [71, 85, 105]; // #475569
  const lightBg = [248, 250, 252]; // #F8FAFC
  const borderGray = [226, 232, 240]; // #E2E8F0

  const {
    customerName = '',
    customerPhone = '',
    customerEmail = '',
    licenseNumber = '',
    panNumber = '',
    aadhaarNumber = '',
    car = {},
    fromDate = '',
    toDate = '',
    startTime = '10:00 AM',
    endTime = '10:00 AM',
    numberOfDays = 1,
    totalPrice = 0,
    advanceAmount = 0,
    deposit = 0,
    depositItemType = '',
    depositItemName = '',
  } = bookingDetails;

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (String(dateStr).includes('/')) return dateStr;
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(dateStr);
  };

  const defaultTerms = [
    'Inspection & Handover: Hirer confirms physical inspection of vehicle condition, fuel gauge, and existing scratches before taking delivery.',
    'Authorized Driver: The vehicle shall only be driven by the Hirer holding a valid, verified Driving License. Sub-leasing, lending, or commercial ride-hailing is strictly prohibited.',
    'Traffic & Criminal Compliance: Hirer shall strictly adhere to speed limits (max 100 km/h), seatbelt laws, and zero alcohol/drugs. Any traffic challans, fines, or toll fees incurred during the tenure are exclusively the Hirer\'s liability.',
    'Accident & Damage Liability: In case of accidental damage or mechanical abuse, the Hirer is liable to indemnify repair costs and downtime charges beyond standard insurance deductibles.',
    'Return Condition: The vehicle must be returned on the agreed date/time. Late returns without prior intimation may incur penalty rates of Rs. 300/hour.',
    'Security Deposit & Collateral: Security deposit and vehicle collateral held will be refunded/returned after safe car return without damages.'
  ];

  const termsList = Array.isArray(template?.terms) && template.terms.length > 0 ? template.terms : defaultTerms;

  const interpolate = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    const result = text
      .replace(/{{customer_name}}/gi, customerName || 'Customer')
      .replace(/{{customer_phone}}/gi, customerPhone || 'N/A')
      .replace(/{{customer_email}}/gi, customerEmail || 'N/A')
      .replace(/{{license_number}}/gi, licenseNumber || 'Verified')
      .replace(/{{pan_number}}/gi, panNumber || aadhaarNumber || 'Verified')
      .replace(/{{car_name}}/gi, car?.name || 'Vehicle')
      .replace(/{{car_number}}/gi, car?.registrationNumber || car?.carNumber || 'Assigned on Delivery')
      .replace(/{{from_date}}/gi, formatDateDisplay(fromDate))
      .replace(/{{to_date}}/gi, formatDateDisplay(toDate))
      .replace(/{{duration}}/gi, `${numberOfDays || 0} Day(s)`)
      .replace(/{{daily_rate}}/gi, `Rs. ${car?.pricePerDay || 0}`)
      .replace(/{{total_price}}/gi, `Rs. ${totalPrice || 0}`)
      .replace(/{{advance_amount}}/gi, `Rs. ${advanceAmount || 0}`)
      .replace(/{{security_deposit}}/gi, `Rs. ${deposit || 0}`)
      .replace(/{{deposit_item}}/gi, `${depositItemName || 'Vehicle'} (${depositItemType || 'Bike/Scooter'})`);
    return result.replace(/₹/g, 'Rs. ').replace(/[\u20B9]/g, 'Rs. ');
  };

  const verifiedPhone = verifiedAgreement?.phoneVerified || customerPhone || 'N/A';
  const verifiedTime = verifiedAgreement?.verifiedAt
    ? new Date(verifiedAgreement.verifiedAt).toLocaleString('en-IN')
    : new Date().toLocaleString('en-IN');

  // ==========================================
  // PAGE 1: PARTICULARS, VEHICLE & VERIFICATION
  // ==========================================

  // Top Navy Decorative Bar
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let y = 13;

  // Header Title
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentBlue);
  doc.text(template?.companyName || 'URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON)', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(template?.title || 'DRIVEON SELF-DRIVE VEHICLE RENTAL AGREEMENT', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...slateGray);
  doc.text(template?.companySubtitle || 'Fleet Inward Vehicle Custody & Rental Contract • Regulated under Motor Vehicles Act, 1988', pageWidth / 2, y, { align: 'center' });

  y += 6;

  // Reference & Verification Status Badge Bar
  const refBoxY = y;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, refBoxY, contentWidth, 8.5, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, refBoxY, contentWidth, 8.5, 1.5, 1.5, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`Agreement Ref: ${agreementId || 'AGR-INW-001'}`, margin + 4, refBoxY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, margin + 55, refBoxY + 5.5);

  // Status Badge on the right: DIGITALLY APPROVED VIA OTP
  const topBadgeW = 58;
  const topBadgeH = 6;
  const topBadgeX = pageWidth - margin - topBadgeW - 2;
  const topBadgeY = refBoxY + 1.25;

  doc.setFillColor(220, 252, 231); // emerald-100
  doc.setDrawColor(...successGreen);
  doc.setLineWidth(0.4);
  doc.roundedRect(topBadgeX, topBadgeY, topBadgeW, topBadgeH, 3, 3, 'FD');

  // Vector checkmark inside badge
  drawVectorCheckmark(doc, topBadgeX + 3.2, topBadgeY + 1.2, 3.2, successGreen, 0.65);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('DIGITALLY APPROVED VIA OTP', topBadgeX + 8.5, topBadgeY + 4.3);

  y += 13.5;

  // Parties Cards (Side by Side)
  const colW = (contentWidth - 6) / 2;
  const leftX = margin;
  const rightX = margin + colW + 6;
  const partyCardH = 36;

  // --- Left Card: First Party ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(leftX, y, colW, partyCardH, 1.5, 1.5, 'FD');

  doc.setFillColor(238, 242, 255);
  doc.roundedRect(leftX, y, colW, 6.5, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentBlue);
  doc.text('FIRST PARTY (OWNER / ADMIN)', leftX + 4, y + 4.5);

  let py = y + 11;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Urban Mobility Rentals Pvt Ltd (DriveOn)', leftX + 4, py);
  py += 4.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('Fleet Operations & Custody Hub, Indore (M.P.)', leftX + 4, py);
  py += 4.5;
  doc.text('Contact: +91 99939 11855  |  support@driveon.in', leftX + 4, py);
  py += 4.5;
  doc.text('GSTIN / Reg: Operational Fleet Custody Portal', leftX + 4, py);

  // --- Right Card: Second Party ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightX, y, colW, partyCardH, 1.5, 1.5, 'FD');

  doc.setFillColor(243, 232, 255);
  doc.roundedRect(rightX, y, colW, 6.5, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(126, 34, 206);
  doc.text('SECOND PARTY (HIRER / CUSTOMER)', rightX + 4, y + 4.5);

  py = y + 11;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(customerName || 'N/A', rightX + 4, py);
  py += 4.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Mobile: +91 ${customerPhone || 'N/A'}`, rightX + 4, py);
  py += 4.5;
  doc.text(`Email: ${customerEmail || 'N/A'}`, rightX + 4, py);
  py += 4.5;
  doc.text(`DL: ${licenseNumber || 'Verified'}  |  ID/PAN: ${panNumber || aadhaarNumber || 'Verified'}`, rightX + 4, py);

  y += partyCardH + 5;

  // Vehicle & Rental Tenure Table (autoTable)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'VEHICLE & RENTAL TENURE DETAILS', colSpan: 4, styles: { halign: 'left', fillColor: primaryNavy, textColor: 255, fontStyle: 'bold', fontSize: 8.5 } }
    ]],
    body: [
      [
        { content: 'Vehicle Model:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: car?.name || 'N/A', styles: { fontStyle: 'bold', textColor: darkText } },
        { content: 'Vehicle Reg. No.:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: car?.registrationNumber || car?.carNumber || 'Assigned on Delivery', styles: { fontStyle: 'bold', textColor: primaryNavy } },
      ],
      [
        { content: 'Rental From:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `${formatDateDisplay(fromDate)} (${startTime || '10:00 AM'})`, styles: { textColor: darkText } },
        { content: 'Rental To:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `${formatDateDisplay(toDate)} (${endTime || '10:00 AM'})`, styles: { textColor: darkText } },
      ],
      [
        { content: 'Total Duration:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `${numberOfDays || 1} Day(s)`, styles: { fontStyle: 'bold', textColor: accentBlue } },
        { content: 'Daily Rate:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `Rs. ${Number(car?.pricePerDay || 0).toLocaleString('en-IN')} / Day`, styles: { textColor: darkText } },
      ],
      [
        { content: 'Total Rental Tariff:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `Rs. ${Number(totalPrice || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: primaryNavy, fontSize: 9 } },
        { content: 'Advance Paid:', styles: { fontStyle: 'bold', textColor: slateGray } },
        { content: `Rs. ${Number(advanceAmount || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: successGreen, fontSize: 9 } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 7.8, cellPadding: 2.2, lineColor: borderGray, lineWidth: 0.2 },
    headStyles: { cellPadding: 2.5 },
  });

  y = doc.lastAutoTable.finalY + 5;

  // Security Deposit & Collateral Box
  const depBoxH = 28;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(margin, y, contentWidth, depBoxH, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentBlue);
  doc.text('SECURITY DEPOSIT & PHYSICAL COLLATERAL CLAUSE', margin + 4, y + 5);

  let depY = y + 10;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);

  const depositText = Number(deposit || 0) > 0
    ? `• Monetary Cash Deposit: Rs. ${Number(deposit).toLocaleString('en-IN')} deposited with First Party. Fully refundable upon vehicle return in undamaged condition.`
    : '• Monetary Cash Deposit: Nil / Zero cash deposit required for this booking.';
  doc.text(depositText, margin + 4, depY);

  depY += 5;
  const collateralText = depositItemName
    ? `• Physical Collateral Pledged: Hirer has pledged personal two-wheeler "${depositItemName}" (${depositItemType || 'Bike/Scooter'}) in custody of First Party until return.`
    : '• Physical Collateral Held: No physical vehicle collateral pledged for this booking.';
  doc.text(collateralText, margin + 4, depY);

  depY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...slateGray);
  doc.text('• Release Terms: Collateral vehicle & security deposits are returned immediately post safe vehicle check-in.', margin + 4, depY);

  y += depBoxH + 5;

  // Digital OTP Verification Seal Box (PROMINENT & HIGH-VISIBILITY)
  const sealH = 32;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(...successGreen);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, sealH, 2, 2, 'FD');

  // Green Circle Icon with Vector Checkmark on Left
  const iconCenterX = margin + 8.5;
  const iconCenterY = y + 8.5;
  doc.setFillColor(...successGreen);
  doc.circle(iconCenterX, iconCenterY, 4.5, 'F');
  drawVectorCheckmark(doc, iconCenterX - 2.2, iconCenterY - 2.5, 4.2, [255, 255, 255], 0.75);

  // Large Bold Title: DIGITALLY APPROVED VIA OTP
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('DIGITALLY APPROVED VIA OTP', margin + 16, y + 9.5);

  // Badge on the right: VERIFIED & BINDING
  const sealBadgeW = 46;
  const sealBadgeH = 7.5;
  const sealBadgeX = pageWidth - margin - sealBadgeW - 4;
  const sealBadgeY = y + 4.8;

  doc.setFillColor(...successGreen);
  doc.roundedRect(sealBadgeX, sealBadgeY, sealBadgeW, sealBadgeH, 1.5, 1.5, 'F');
  drawVectorCheckmark(doc, sealBadgeX + 3.2, sealBadgeY + 1.8, 3.5, [255, 255, 255], 0.75);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED & BINDING', sealBadgeX + 8.5, sealBadgeY + 5.2);

  // Separator line inside seal box
  doc.setDrawColor(187, 247, 208); // green-200
  doc.setLineWidth(0.3);
  doc.line(margin + 4, y + 15, pageWidth - margin - 4, y + 15);

  // Details inside seal box
  let sealTextY = y + 19.5;
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text(`Approved by Customer Mobile: +91 ${verifiedPhone}`, margin + 5, sealTextY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Timestamp: ${verifiedTime}   |   Ref ID: ${agreementId || 'AGR-INW-001'}`, margin + 85, sealTextY);

  sealTextY += 5;
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...slateGray);
  doc.text('Legal Binding: Digital agreement consent executed and verified under Section 10A of the Information Technology Act, 2000.', margin + 5, sealTextY);

  // Page 1 Footer
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('Page 1 of 2  •  DriveOn Fleet Operations  •  Confidential Rental Agreement', pageWidth / 2, pageHeight - 7, { align: 'center' });

  // ==========================================
  // PAGE 2: TERMS & CONDITIONS & SIGNATURES
  // ==========================================
  doc.addPage();

  // Top Navy Decorative Bar
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Page 2 Mini Running Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`DRIVEON RENTAL AGREEMENT  •  REF: ${agreementId || 'AGR-INW-001'}`, margin, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Customer: ${customerName} (+91 ${customerPhone})`, pageWidth - margin, 11, { align: 'right' });

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, 13.5, pageWidth - margin, 13.5);

  y = 18;

  // Terms Section Header
  doc.setFillColor(...primaryNavy);
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STANDARD TERMS, UNDERTAKINGS & OBLIGATIONS', margin + 4, y + 4.8);

  y += 11;

  // Render all terms with wrapped text
  termsList.forEach((term, index) => {
    let rawTerm = interpolate(term);
    rawTerm = rawTerm.replace(/₹/g, 'Rs. ').replace(/[\u20B9]/g, 'Rs. ');
    const colonIndex = rawTerm.indexOf(':');
    let title = '';
    let body = rawTerm;

    if (colonIndex !== -1) {
      title = rawTerm.substring(0, colonIndex + 1).trim();
      body = rawTerm.substring(colonIndex + 1).trim();
    } else {
      title = `Clause ${index + 1}:`;
      body = rawTerm.trim();
    }

    // Term Title in Bold Navy
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(`${index + 1}.  ${title}`, margin, y);
    y += 3.8;

    // Term Body cleanly indented and sized to contentWidth - 6
    doc.setFontSize(7.4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    const bodyLines = doc.splitTextToSize(body, contentWidth - 6);
    bodyLines.forEach((line) => {
      doc.text(line, margin + 4, y);
      y += 3.6;
    });

    y += 2.2;
  });

  // Custom Clauses (if present)
  if (template?.customClauses) {
    y += 2;
    let customText = interpolate(template.customClauses);
    customText = customText.replace(/₹/g, 'Rs. ').replace(/[\u20B9]/g, 'Rs. ');
    const customLines = doc.splitTextToSize(customText, contentWidth - 8);
    const customBoxH = 8 + (customLines.length * 3.8);

    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(margin, y, contentWidth, customBoxH, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('SPECIAL CONDITIONS & NOTES:', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    let cy = y + 8.5;
    customLines.forEach((cline) => {
      doc.text(cline, margin + 4, cy);
      cy += 3.8;
    });

    y += customBoxH + 4;
  }

  // Formal Signatures Block
  y = Math.max(y + 4, pageHeight - 56);

  const sigColW = (contentWidth - 8) / 2;
  const sigBoxH = 38;

  // --- First Party Signature ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, sigColW, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text('FIRST PARTY (OWNER / ADMIN)', margin + 4, y + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text('For Urban Mobility Rentals Private Limited', margin + 4, y + 10);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, y + 27, margin + sigColW - 4, y + 27);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Authorized Signatory & Official Stamp', margin + 4, y + 32);
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, margin + sigColW - 4, y + 32, { align: 'right' });

  // --- Second Party Signature ---
  const sigRightX = margin + sigColW + 8;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(sigRightX, y, sigColW, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(126, 34, 206);
  doc.text('SECOND PARTY (HIRER / CUSTOMER)', sigRightX + 4, y + 5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateGray);
  doc.text(`Hirer: ${customerName || 'Customer'}`, sigRightX + 4, y + 9.5);

  // Digital Sign Stamp Box
  const stampBoxY = y + 12.5;
  const stampBoxH = 15;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...successGreen);
  doc.setLineWidth(0.4);
  doc.roundedRect(sigRightX + 4, stampBoxY, sigColW - 8, stampBoxH, 1, 1, 'FD');

  // Vector checkmark
  drawVectorCheckmark(doc, sigRightX + 7, stampBoxY + 2.5, 3.2, successGreen, 0.65);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...successGreen);
  doc.text('DIGITALLY APPROVED VIA OTP', sigRightX + 12, stampBoxY + 5);

  // Mini Badge: VERIFIED & BINDING
  const miniBadgeW = 34;
  const miniBadgeX = sigRightX + sigColW - 8 - miniBadgeW - 2;
  doc.setFillColor(...successGreen);
  doc.roundedRect(miniBadgeX, stampBoxY + 2, miniBadgeW, 4.5, 1, 1, 'F');
  drawVectorCheckmark(doc, miniBadgeX + 2, stampBoxY + 2.8, 2.5, [255, 255, 255], 0.55);
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED & BINDING', miniBadgeX + 6, stampBoxY + 5.2);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  const otpTime = verifiedAgreement?.verifiedAt ? new Date(verifiedAgreement.verifiedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  doc.text(`Verified: +91 ${verifiedPhone}  |  ${otpTime}`, sigRightX + 7, stampBoxY + 10);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...slateGray);
  doc.text('Authenticated via Mobile OTP • Electronic Consent', sigRightX + 7, stampBoxY + 13.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Hirer Digital Signature & Acceptance', sigRightX + 4, y + 33.5);

  // Regulatory Footnote
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...slateGray);
  doc.text('This electronic agreement is valid and legally enforceable in India under the Information Technology Act, 2000 and the Indian Contract Act, 1872.', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // Page 2 Footer
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.text('Page 2 of 2  •  DriveOn Fleet Operations  •  Confidential Rental Agreement', pageWidth / 2, pageHeight - 7, { align: 'center' });

  // Save the PDF directly
  const safeRef = (agreementId || 'Agreement').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCustomer = (customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`DriveOn_Rental_Agreement_${safeRef}_${safeCustomer}.pdf`);
};

