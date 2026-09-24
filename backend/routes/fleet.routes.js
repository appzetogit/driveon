import express from 'express';
import {
    getOutwardCars,
    createOutwardCar,
    updateOutwardCar,
    deleteOutwardCar,
    getOutwardBookings,
    createOutwardBooking,
    createFleetRazorpayOrder,
    verifyFleetRazorpayPayment,
    generateFleetAadhaarOTP,
    verifyFleetAadhaarOTP,
    verifyFleetDL,
    verifyFleetPAN,
    cancelOutwardBooking,
    completeOutwardBooking,
    payOutwardBooking,
    sendAgreementOTP,
    verifyAgreementOTP,
    getFleetAgreements,
    getAgreementTemplate,
    updateAgreementTemplate
} from '../controllers/fleet.controller.js';

const router = express.Router();

router.route('/outward-cars')
    .get(getOutwardCars)
    .post(createOutwardCar);

router.route('/outward-cars/:id')
    .put(updateOutwardCar)
    .delete(deleteOutwardCar);

router.route('/outward-bookings')
    .get(getOutwardBookings)
    .post(createOutwardBooking);

router.post('/razorpay/create-order', createFleetRazorpayOrder);
router.post('/razorpay/verify', verifyFleetRazorpayPayment);

// QuickEKYC optional verification endpoints for fleet bookings
router.post('/kyc/aadhaar/generate-otp', generateFleetAadhaarOTP);
router.post('/kyc/aadhaar/verify-otp', verifyFleetAadhaarOTP);
router.post('/kyc/dl/verify', verifyFleetDL);
router.post('/kyc/pan/verify', verifyFleetPAN);

// Inward Rental Agreement verification endpoints
router.post('/agreement/send-otp', sendAgreementOTP);
router.post('/agreement/verify-otp', verifyAgreementOTP);
router.get('/agreements', getFleetAgreements);
router.get('/agreement-template', getAgreementTemplate);
router.put('/agreement-template', updateAgreementTemplate);

// Booking state changes
router.post('/outward-bookings/:id/cancel', cancelOutwardBooking);
router.post('/outward-bookings/:id/complete', completeOutwardBooking);
router.post('/outward-bookings/:id/pay', payOutwardBooking);

export default router;
