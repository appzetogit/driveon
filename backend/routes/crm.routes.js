import express from 'express';
import {
    getEnquiries,
    createEnquiry,
    updateEnquiry,
    getEnquiryDetails,
    getTasks,
    createTask,
    updateTask,
    getActiveBookings,
    getUpcomingBookings,
    getCRMAnalytics,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    getTeamPresence,
    getAttendance,
    markAttendance,
    getPayroll,
    createPayroll,
    updatePayrollStatus,
    getAdvances,
    createAdvance,
    addRepayment,
    getPerformanceReviews,
    createPerformanceReview,
    deletePerformanceReview,
    getStaffWorkTasks,
    createStaffWorkTask,
    updateStaffWorkTask,
    getAllCarsSimple,
    getCarOwnersSimple,
    getCarDocuments,
    uploadCarDocument,
    createFastBooking,
    reportAccident,
    getAccidentCases,
    updateAccidentCase,
    getAccidentSummary,
    getActiveBookingsDetails,
    getPaymentStatus,
    getProfitabilityAnalysis,
    getGarages,
    createGarage,
    updateGarage,
    deleteGarage,
    createCarExpense,
    getActiveRepairs,
    getRepairLogs,
    createRepairJob,
    updateRepairJob,
    deleteRepairJob,
    getInventory,
    createInventoryItem,
    onboardVendor,
    updateVendor,
    deleteVendor,
    getVendorDirectory,
    getVendorSettlements,
    getVendorHistory,
    getFleetUtilization,
    getVendorLedger,
    updateVendorCarSettlement,
    recordVendorPayment,
    getCarTripDetails,
    getIncomeOverview,
    getExpenseTracking,
    getPendingPayments,
    settleInvoice,
    getPLOverview,
    getCashFlow,
    getDailyOperationsReport,
    getMonthlyPerformance,
    getAnnualReport,
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
    getExpenses,
    createExpense,
    deleteExpense,
    getCities,
    createCity,
    updateCity,
    deleteCity,
    getDashboardAlerts,
    getStaffPayroll,
    createSalaryPaymentOrder,
    verifySalaryPayment,
    getAttendanceSettings,
    updateAttendanceSettings,
    getEnquiryAssignments,
    bulkAssignEnquiries,
    getMonthlyCalculatedPayroll,
    recordManualSalaryPayment,
    getHolidays,
    markHoliday,
    deleteHoliday,
    getEmployeeSupportSettings,
    updateEmployeeSupportSettings
} from '../controllers/crm.controller.js';
import { getPolicyByKey, updatePolicy } from '../controllers/policy.controller.js';
// import { protect, admin } from '../middleware/auth.middleware.js'; // Assuming you have auth middleware

const router = express.Router();

// Middleware to handle file uploads using app.locals.upload
const handleFileUpload = (fieldName, isMultiple = false) => (req, res, next) => {
    const upload = req.app.locals.upload;
    if (!upload) return next();

    if (isMultiple) {
        upload.array(fieldName, 10)(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    } else {
        upload.single(fieldName)(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    }
};

// Middleware to handle staff file fields (avatar and aadharCard)
const handleStaffUploads = (req, res, next) => {
    const upload = req.app.locals.upload;
    if (!upload) return next();

    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'aadharCard', maxCount: 1 }
    ])(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
};

// Enquiries Routes
router.route('/enquiries')
    .get(getEnquiries)
    .post(createEnquiry);

// NOTE: /assignments and /bulk-assign MUST come before /:id
router.get('/enquiries/assignments', getEnquiryAssignments);
router.post('/enquiries/bulk-assign', bulkAssignEnquiries);

router.route('/enquiries/:id')
    .get(getEnquiryDetails)
    .put(updateEnquiry);

// Tasks / Follow-ups Routes
router.route('/tasks')
    .get(getTasks)
    .post(createTask);

router.route('/tasks/:id')
    .put(updateTask);

// Staff Routes
router.route('/staff')
    .get(getStaff)
    .post(handleStaffUploads, createStaff);

router.route('/staff/:id')
    .put(handleStaffUploads, updateStaff)
    .delete(deleteStaff);

router.get('/staff/payroll/calculate', getMonthlyCalculatedPayroll);
router.post('/staff/salary/manual-pay', recordManualSalaryPayment);
router.get('/staff/:id/payroll', getStaffPayroll);
router.post('/staff/salary/create-order', createSalaryPaymentOrder);
router.post('/staff/salary/verify', verifySalaryPayment);

// Roles Routes
router.route('/roles')
    .get(getRoles)
    .post(createRole);

router.route('/roles/:id')
    .put(updateRole)
    .delete(deleteRole);

// Attendance Routes
router.get('/team-presence', getTeamPresence);
router.route('/attendance')
    .get(getAttendance)
    .post(markAttendance);

router.route('/attendance/settings')
    .get(getAttendanceSettings)
    .put(updateAttendanceSettings);

router.route('/attendance/holidays')
    .get(getHolidays)
    .post(markHoliday);

router.route('/attendance/holidays/:date')
    .delete(deleteHoliday);

// Payroll Routes
router.route('/payroll')
    .get(getPayroll)
    .post(createPayroll);

router.route('/payroll/:id')
    .put(updatePayrollStatus);

// Advance & Loan Routes
router.route('/advances')
    .get(getAdvances)
    .post(createAdvance);

router.route('/advances/:id/repay')
    .post(addRepayment);

// Performance Routes
router.route('/performance')
    .get(getPerformanceReviews)
    .post(createPerformanceReview);

router.route('/performance/:id')
    .delete(deletePerformanceReview);

// Staff Work Task Routes
router.route('/staff-tasks')
    .get(getStaffWorkTasks)
    .post(createStaffWorkTask);

router.route('/staff-tasks/:id')
    .put(updateStaffWorkTask);

// Car Document Routes
router.route('/car-documents')
    .get(getCarDocuments)
    .post(handleFileUpload('file'), uploadCarDocument);

router.get('/cars-simple', getAllCarsSimple);
router.get('/car-owners', getCarOwnersSimple);

// Fast Booking Route
router.post('/fast-booking', createFastBooking);

// Accident Routes
router.route('/accidents')
    .get(getAccidentCases)
    .post(handleFileUpload('evidence', true), reportAccident);

router.route('/accidents/:id')
    .put(updateAccidentCase);

// Reports & Analytics Routes
router.get('/reports/accident-summary', getAccidentSummary);
router.get('/reports/profitability', getProfitabilityAnalysis);

// Bookings Detailed (CRM View)
router.get('/bookings/active-details', getActiveBookingsDetails);

// Finance Routes
router.get('/finance/payments', getPaymentStatus);

// Garage & Expense Routes
router.route('/garages')
    .get(getGarages)
    .post(handleFileUpload('logo'), createGarage);

router.route('/garages/:id')
    .put(updateGarage)
    .delete(deleteGarage);

router.post('/car-expenses', createCarExpense);

// Repair Job Routes
router.get('/repairs/active', getActiveRepairs);
router.get('/repairs/logs', getRepairLogs);
router.post('/repairs', createRepairJob);
router.put('/repairs/:id', updateRepairJob);
router.delete('/repairs/:id', deleteRepairJob);

// Inventory Routes
router.route('/inventory')
    .get(getInventory)
    .post(createInventoryItem);

// Vendor Routes
router.route('/vendors')
    .post(handleFileUpload('profileImage'), onboardVendor)
    .get(getVendorDirectory);

// Vendor Ledger & Payment routes MUST come before /:id to avoid conflicts
router.get('/vendors/settlements', getVendorSettlements);
router.get('/vendors/history', getVendorHistory);
router.get('/vendors/utilization', getFleetUtilization);

router.route('/vendors/:id')
    .put(handleFileUpload('profileImage'), updateVendor)
    .delete(deleteVendor);

router.get('/vendors/:id/ledger', getVendorLedger);
router.get('/vendors/:vendorId/cars/outward/:carId/trips', getCarTripDetails);
router.patch('/vendors/:vendorId/cars/:carType/:carId/settlement', updateVendorCarSettlement);
router.post('/vendors/:id/payments', recordVendorPayment);

// Financial Routes
router.get('/finance/income-overview', getIncomeOverview);
router.get('/finance/expenses', getExpenseTracking);
router.get('/finance/pending-payments', getPendingPayments);
router.put('/finance/invoices/:id/settle', settleInvoice);
router.get('/finance/pl-overview', getPLOverview);
router.get('/finance/cash-flow', getCashFlow);

// Reporting Routes
router.get('/reports/daily-operations', getDailyOperationsReport);
router.get('/reports/monthly-performance', getMonthlyPerformance);
router.get('/reports/annual-review', getAnnualReport);

// Expense Categories
router.route('/finance/categories')
    .get(getExpenseCategories)
    .post(createExpenseCategory);
router.route('/finance/categories/:id')
    .put(updateExpenseCategory)
    .delete(deleteExpenseCategory);

// Administrative Expenses
router.route('/expenses')
    .get(getExpenses)
    .post(createExpense);
router.delete('/expenses/:id', deleteExpense);

// Settings - Cities & Locations
router.route('/settings/cities')
    .get(getCities)
    .post(createCity);
router.route('/settings/cities/:id')
    .put(updateCity)
    .delete(deleteCity);

// Settings - Employee Support Contact Details
router.route('/settings/employee-support')
    .get(getEmployeeSupportSettings)
    .put(updateEmployeeSupportSettings);

// Dashboard - Smart Command Center
router.get('/dashboard/alerts', getDashboardAlerts);

// Bookings Routes
router.get('/bookings/active', getActiveBookings);
router.get('/bookings/upcoming', getUpcomingBookings);

// Analytics Route
router.get('/analytics', getCRMAnalytics);

// App Policies Routes
router.route('/policies/:key')
    .get(getPolicyByKey)
    .put(updatePolicy);

export default router;
