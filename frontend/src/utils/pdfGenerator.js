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

  let yPosition = 18;

  // Company Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DRIVE ON', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Premium Car Rental Services', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Title: BOOKING RECEIPT
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('BOOKING RECEIPT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

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
  const footerY = pageHeight - 28;

  // Thin separator for footer
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  // Company Name
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DRIVE ON', pageWidth / 2, footerY, { align: 'center' });

  // Address Details
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Anjaneya Techno Park, First Floor, No. 147, HAL Old Airport Road,', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text('ISRO Colony, Kodihalli, Bangalore, Karnataka 560008', pageWidth / 2, footerY + 7.5, { align: 'center' });

  // Safety/Mandatory Warning
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(220, 38, 38); // Warning Red

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
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(28, 32, 92);
  doc.text('DriveOn - Bookings Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 28, { align: 'center' });

  // Stats Summary
  if (stats) {
    doc.setFontSize(11);
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
  });

  doc.save(`DriveOn_Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
