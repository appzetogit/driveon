import OutwardCar from '../models/OutwardCar.js';
import OutwardBooking from '../models/OutwardBooking.js';
import Vendor from '../models/Vendor.js';
import Car from '../models/Car.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { uploadImage, isConfigured } from '../services/cloudinary.service.js';
import quickekycService from '../services/quickekyc.service.js';
import { createAdminNotification } from './notification.controller.js';

// Initialize Razorpay instance if keys are available
const getRazorpayInstance = () => {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return null;
};

// Get all Outward Cars
export const getOutwardCars = async (req, res) => {
    try {
        const cars = await OutwardCar.find().sort({ createdAt: -1 });

        // Calculate bookings and revenue stats dynamically
        const carIds = cars.map(c => c.originalOutputId).filter(Boolean);
        const outwardBookingAggregation = await OutwardBooking.aggregate([
            { $match: { carId: { $in: carIds }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$carId',
                    count: { $sum: 1 },
                    revenue: {
                        $sum: { $ifNull: ['$paidAmount', 0] }
                    }
                }
            }
        ]);

        const bookingStatsMap = {};
        outwardBookingAggregation.forEach(stat => {
            if (stat._id) {
                bookingStatsMap[stat._id.toString()] = {
                    count: stat.count,
                    revenue: stat.revenue
                };
            }
        });

        // Also fetch bookings from the standard Booking collection for replicated Cars
        const standardCars = await Car.find({ outwardCarId: { $in: carIds } });
        const standardCarMap = {}; // standardCar._id.toString() -> outwardCarId
        const standardCarIds = [];
        standardCars.forEach(sc => {
            standardCarMap[sc._id.toString()] = sc.outwardCarId;
            standardCarIds.push(sc._id);
        });

        if (standardCarIds.length > 0) {
            // Standard Booking collection (shadow car inward bookings)
            const standardBookingAggregation = await mongoose.model('Booking').aggregate([
                {
                    $match: {
                        car: { $in: standardCarIds },
                        status: { $nin: ['cancelled', 'rejected'] }
                    }
                },
                {
                    $group: {
                        _id: '$car',
                        count: { $sum: 1 },
                        revenue: {
                            $sum: { $ifNull: ['$paidAmount', 0] }
                        }
                    }
                }
            ]);

            standardBookingAggregation.forEach(stat => {
                if (stat._id) {
                    const outwardCarId = standardCarMap[stat._id.toString()];
                    if (outwardCarId) {
                        if (!bookingStatsMap[outwardCarId]) {
                            bookingStatsMap[outwardCarId] = { count: 0, revenue: 0 };
                        }
                        bookingStatsMap[outwardCarId].count += stat.count;
                        bookingStatsMap[outwardCarId].revenue += stat.revenue;
                    }
                }
            });

            // OutwardBooking collection keyed by shadow car _id (fleet bookings stored with shadowCar._id as carId)
            const shadowCarIdStrings = standardCarIds.map(id => id.toString());
            const shadowOutwardBookingAggregation = await OutwardBooking.aggregate([
                {
                    $match: {
                        carId: { $in: shadowCarIdStrings },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: '$carId',
                        count: { $sum: 1 },
                        revenue: {
                            $sum: { $ifNull: ['$paidAmount', 0] }
                        }
                    }
                }
            ]);

            shadowOutwardBookingAggregation.forEach(stat => {
                if (stat._id) {
                    const outwardCarId = standardCarMap[stat._id];
                    if (outwardCarId) {
                        if (!bookingStatsMap[outwardCarId]) {
                            bookingStatsMap[outwardCarId] = { count: 0, revenue: 0 };
                        }
                        bookingStatsMap[outwardCarId].count += stat.count;
                        bookingStatsMap[outwardCarId].revenue += stat.revenue;
                    }
                }
            });
        }

        // Map backend format back to frontend expected structure
        const formattedCars = cars.map(car => {
            const stats = bookingStatsMap[car.originalOutputId] || { count: 0, revenue: 0 };
            return {
                id: car.originalOutputId,
                name: car.name,
                brand: car.brand,
                model: car.model,
                pricePerDay: car.pricePerDay,
                agreementPricePerDay: car.agreementPricePerDay || 0,
                agreementPricePerMonth: car.agreementPricePerMonth || 0,
                vendorAgreementType: car.vendorAgreementType || 'daily',
                location: car.location,
                type: car.type,
                ownerName: car.ownerName,
                ownerPhone: car.ownerPhone,
                totalBookings: stats.count,
                totalRevenue: stats.revenue,
                image: car.image || '',
                rating: car.rating || 5,
                carNumber: car.carNumber || car.registrationNumber || '',
                features: car.features || []
            };
        });

        res.status(200).json({ success: true, data: formattedCars });
    } catch (error) {
        console.error('getOutwardCars error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch outward cars' });
    }
};

// Helper to replicate OutwardCar to standard Car collection for user side visibility and booking
const syncToStandardCar = async (outwardCar) => {
    try {
        let shadowCar = await Car.findOne({ outwardCarId: outwardCar.originalOutputId });

        // Resolve an existing admin or user as owner to satisfy the required Car.owner validation
        const adminUser = await mongoose.model('User').findOne({ role: 'admin' }) || await mongoose.model('User').findOne({});
        const ownerId = adminUser ? adminUser._id : new mongoose.Types.ObjectId('60d5ec0f1f1d2c001f8e29a5');

        let isCarInRepair = false;
        if (shadowCar) {
            const RepairJob = mongoose.model('RepairJob');
            const activeRepair = await RepairJob.findOne({ car: shadowCar._id, status: { $nin: ['Completed', 'Cancelled'] } });
            if (activeRepair) {
                isCarInRepair = true;
            }
        }

        const carData = {
            owner: ownerId,
            brand: outwardCar.brand || 'External',
            model: outwardCar.model || 'Vehicle',
            year: 2024,
            color: 'N/A',
            registrationNumber: outwardCar.carNumber || outwardCar.registrationNumber || `OUT-${outwardCar.originalOutputId.slice(-6).toUpperCase()}`,
            carType: 'suv', // default valid enum
            fuelType: 'petrol', // default valid enum
            transmission: 'automatic', // default valid enum
            seatingCapacity: 5,
            pricePerDay: outwardCar.pricePerDay || 1000,
            pricePerWeek: (outwardCar.pricePerDay || 1000) * 7,
            pricePerMonth: (outwardCar.pricePerDay || 1000) * 30,
            securityDeposit: 0,
            description: `This verified premium outward car is owned by ${outwardCar.ownerName} and managed by DriveOn partners.`,
            isAvailable: isCarInRepair ? false : true,
            status: 'active',
            images: outwardCar.image ? [{ url: outwardCar.image, isPrimary: true }] : [],
            location: {
                city: outwardCar.location || 'Indore',
                state: 'Madhya Pradesh',
                address: outwardCar.location || 'Indore'
            },
            ownerInfo: {
                name: outwardCar.ownerName,
                email: 'partner@driveon.com',
                phone: outwardCar.ownerPhone
            },
            ownerName: outwardCar.ownerName,
            source: 'outward',
            outwardCarId: outwardCar.originalOutputId,
            features: outwardCar.features || []
        };

        if (shadowCar) {
            Object.assign(shadowCar, carData);
            await shadowCar.save();
        } else {
            await Car.create(carData);
        }
    } catch (err) {
        console.error('Error in syncToStandardCar helper:', err);
    }
};

const deleteShadowCar = async (originalOutputId) => {
    try {
        await Car.findOneAndDelete({ outwardCarId: originalOutputId });
    } catch (err) {
        console.error('Error in deleteShadowCar helper:', err);
    }
};

// Create Outward Car
export const createOutwardCar = async (req, res) => {
    try {
        const carData = req.body;
        // Verify if vendor exists or bind it
        let vendorId = null;
        if (carData.ownerName) {
            const vendor = await Vendor.findOne({ name: carData.ownerName });
            if (vendor) vendorId = vendor._id;
        }

        // Upload image to Cloudinary if base64 provided
        let imageSecure = '';
        if (carData.image) {
            imageSecure = await uploadToCloudinaryIfBase64(carData.image, 'outward-cars');
        }

        const newCar = await OutwardCar.create({
            originalOutputId: carData.id, // ID generated by frontend
            name: carData.name,
            brand: carData.brand,
            model: carData.model,
            pricePerDay: carData.pricePerDay,
            agreementPricePerDay: carData.agreementPricePerDay || 0,
            agreementPricePerMonth: carData.agreementPricePerMonth || 0,
            vendorAgreementType: carData.vendorAgreementType || 'daily',
            location: carData.location,
            type: carData.type,
            ownerName: carData.ownerName,
            ownerPhone: carData.ownerPhone,
            image: imageSecure,
            rating: carData.rating || 5,
            carNumber: carData.carNumber || carData.registrationNumber || '',
            registrationNumber: carData.carNumber || carData.registrationNumber || '',
            features: carData.features || [],
            vendorId: vendorId
        });

        // Replicate to standard Car model for user side visibility
        await syncToStandardCar(newCar);

        res.status(201).json({ success: true, data: newCar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create outward car' });
    }
};

// Update Outward Car
export const updateOutwardCar = async (req, res) => {
    try {
        const { id } = req.params; // originalOutputId
        const carData = req.body;

        let vendorId = null;
        if (carData.ownerName) {
            const vendor = await Vendor.findOne({ name: carData.ownerName });
            if (vendor) vendorId = vendor._id;
        }

        let updateFields = {
            name: carData.name,
            brand: carData.brand,
            model: carData.model,
            pricePerDay: carData.pricePerDay,
            agreementPricePerDay: carData.agreementPricePerDay || 0,
            agreementPricePerMonth: carData.agreementPricePerMonth || 0,
            vendorAgreementType: carData.vendorAgreementType || 'daily',
            location: carData.location,
            ownerName: carData.ownerName,
            ownerPhone: carData.ownerPhone,
            carNumber: carData.carNumber || carData.registrationNumber || '',
            registrationNumber: carData.carNumber || carData.registrationNumber || '',
            rating: carData.rating || 5,
            features: carData.features || [],
            vendorId: vendorId
        };

        if (carData.image) {
            const imageSecure = await uploadToCloudinaryIfBase64(carData.image, 'outward-cars');
            updateFields.image = imageSecure;
        }

        const car = await OutwardCar.findOneAndUpdate(
            { originalOutputId: id },
            updateFields,
            { new: true }
        );

        if (!car) {
            return res.status(404).json({ success: false, message: 'Outward car not found' });
        }

        // Replicate update to standard Car model for user side visibility
        await syncToStandardCar(car);

        res.status(200).json({ success: true, data: car });
    } catch (error) {
        console.error('updateOutwardCar error:', error);
        res.status(500).json({ success: false, message: 'Failed to update outward car' });
    }
};

// Delete Outward Car
export const deleteOutwardCar = async (req, res) => {
    try {
        const { id } = req.params; // originalOutputId
        const car = await OutwardCar.findOneAndDelete({ originalOutputId: id });
        if (!car) {
            return res.status(404).json({ success: false, message: 'Outward car not found' });
        }
        // Delete shadow car from standard Car model
        await deleteShadowCar(id);

        res.status(200).json({ success: true, message: 'Outward car deleted successfully' });
    } catch (error) {
        console.error('deleteOutwardCar error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete outward car' });
    }
};

// Get all Outward Bookings
export const getOutwardBookings = async (req, res) => {
    try {
        const bookings = await OutwardBooking.find().sort({ createdAt: -1 });
        
        // Map backend to frontend expected structure
        const formattedBookings = bookings.map(b => ({
            id: b.originalBookingId,
            carId: b.carId,
            carName: b.carName,
            carType: b.carType,
            carOwnerName: b.carOwnerName,
            customerName: b.customerName,
            customerPhone: b.customerPhone || '',
            customerEmail: b.customerEmail || '',
            customerImage: b.customerImage,
            licenseImage: b.licenseImage,
            aadhaarImage: b.aadhaarImage,
            fromDate: b.fromDate,
            toDate: b.toDate,
            startTime: b.startTime || '',
            endTime: b.endTime || '',
            totalPrice: b.totalPrice,
            advanceAmount: b.advanceAmount || 0,
            paymentMode: b.paymentMode,
            advancePaymentMode: b.advancePaymentMode,
            remainingPaymentMode: b.remainingPaymentMode,
            paymentStatus: b.paymentStatus,
            paidAmount: b.paidAmount,
            discount: b.discount || 0,
            transactionId: b.transactionId,
            aadhaarNumber: b.aadhaarNumber || '',
            aadhaarVerified: b.aadhaarVerified || false,
            licenseNumber: b.licenseNumber || '',
            licenseVerified: b.licenseVerified || false,
            panNumber: b.panNumber || '',
            panVerified: b.panVerified || false,
            deposit: b.deposit || 0,
            cashCollector: b.cashCollector || '',
            advanceCashCollector: b.advanceCashCollector || '',
            remainingCashCollector: b.remainingCashCollector || '',
            status: b.status || 'active',
            createdAt: b.createdAt
        }));

        res.status(200).json({ success: true, data: formattedBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch outward bookings' });
    }
};

// Helper function to upload base64 images to Cloudinary if configured
const uploadToCloudinaryIfBase64 = async (imageStr, folderName) => {
    if (!imageStr) return '';
    // If it's already a Cloudinary or HTTP URL, return as is
    if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
        return imageStr;
    }
    // If it's a base64 image string
    if (imageStr.startsWith('data:image/')) {
        try {
            if (isConfigured()) {
                const uploadResult = await uploadImage(imageStr, {
                    folder: `driveon/fleet/${folderName}`,
                    width: 800,
                    height: 800,
                    crop: 'limit'
                });
                return uploadResult.secure_url;
            }
        } catch (error) {
            console.error(`Failed to upload ${folderName} to Cloudinary:`, error);
            // Fallback to base64 if upload fails
            return imageStr;
        }
    }
    return imageStr;
};

// Create Outward Booking
export const createOutwardBooking = async (req, res) => {
    try {
        let bookingData = { ...req.body };

        // Upload images to Cloudinary
        const customerImageSecure = await uploadToCloudinaryIfBase64(bookingData.customerImage, 'customer-photos');
        const licenseImageSecure = await uploadToCloudinaryIfBase64(bookingData.licenseImage, 'licenses');
        const aadhaarImageSecure = await uploadToCloudinaryIfBase64(bookingData.aadhaarImage, 'aadhaars');

        const newBooking = await OutwardBooking.create({
            originalBookingId: bookingData.id,
            carId: bookingData.carId,
            carName: bookingData.carName,
            carType: bookingData.carType,
            carOwnerName: bookingData.carOwnerName,
            customerName: bookingData.customerName,
            customerPhone: bookingData.customerPhone || '',
            customerEmail: bookingData.customerEmail || '',
            customerImage: customerImageSecure,
            licenseImage: licenseImageSecure,
            aadhaarImage: aadhaarImageSecure,
            fromDate: bookingData.fromDate,
            toDate: bookingData.toDate,
            startTime: bookingData.startTime || '',
            endTime: bookingData.endTime || '',
            totalPrice: bookingData.totalPrice,
            advanceAmount: bookingData.advanceAmount || 0,
            advancePaymentMode: bookingData.advancePaymentMode || bookingData.paymentMode || 'Cash',
            paymentMode: bookingData.paymentMode || 'Cash',
            paymentStatus: bookingData.paymentStatus || 'pending',
            paidAmount: bookingData.paidAmount || 0,
            discount: bookingData.discount || 0,
            transactionId: bookingData.transactionId || '',
            aadhaarNumber: bookingData.aadhaarNumber || '',
            aadhaarVerified: bookingData.aadhaarVerified || false,
            licenseNumber: bookingData.licenseNumber || '',
            licenseVerified: bookingData.licenseVerified || false,
            panNumber: bookingData.panNumber || '',
            panVerified: bookingData.panVerified || false,
            deposit: bookingData.deposit || 0,
            cashCollector: bookingData.cashCollector || '',
            advanceCashCollector: bookingData.cashCollector || '',
            status: bookingData.status || 'active'
        });

        // Notify admins about new outward booking
        try {
            await createAdminNotification({
                title: 'New Outward Booking',
                message: `A new outward booking (${newBooking.originalBookingId || newBooking._id}) has been created for ${newBooking.customerName || 'Customer'} on car ${newBooking.carName}.`,
                type: 'info',
                relatedId: newBooking._id,
                relatedModel: 'Booking'
            });
        } catch (err) {
            console.error('Error sending admin notification for new outward booking:', err);
        }

        // Format backend to frontend expected structure
        const formattedSaved = {
            id: newBooking.originalBookingId,
            carId: newBooking.carId,
            carName: newBooking.carName,
            carType: newBooking.carType,
            carOwnerName: newBooking.carOwnerName,
            customerName: newBooking.customerName,
            customerPhone: newBooking.customerPhone || '',
            customerEmail: newBooking.customerEmail || '',
            customerImage: newBooking.customerImage,
            licenseImage: newBooking.licenseImage,
            aadhaarImage: newBooking.aadhaarImage,
            fromDate: newBooking.fromDate,
            toDate: newBooking.toDate,
            startTime: newBooking.startTime,
            endTime: newBooking.endTime,
            totalPrice: newBooking.totalPrice,
            advanceAmount: newBooking.advanceAmount || 0,
            advancePaymentMode: newBooking.advancePaymentMode,
            remainingPaymentMode: newBooking.remainingPaymentMode,
            paymentMode: newBooking.paymentMode,
            paymentStatus: newBooking.paymentStatus,
            paidAmount: newBooking.paidAmount,
            discount: newBooking.discount,
            transactionId: newBooking.transactionId,
            aadhaarNumber: newBooking.aadhaarNumber,
            aadhaarVerified: newBooking.aadhaarVerified,
            licenseNumber: newBooking.licenseNumber,
            licenseVerified: newBooking.licenseVerified,
            panNumber: newBooking.panNumber,
            panVerified: newBooking.panVerified,
            deposit: newBooking.deposit || 0,
            cashCollector: newBooking.cashCollector || '',
            advanceCashCollector: newBooking.advanceCashCollector || '',
            remainingCashCollector: newBooking.remainingCashCollector || '',
            status: newBooking.status,
            createdAt: newBooking.createdAt
        };

        res.status(201).json({ success: true, data: formattedSaved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to create outward booking' });
    }
};

// Create Razorpay Checkout Order for Outward Booking
export const createFleetRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const razorpay = getRazorpayInstance();
        
        if (!razorpay) {
            return res.status(500).json({ success: false, message: 'Razorpay keys not configured' });
        }

        const amountInRupees = parseInt(amount) || 0;
        const amountInPaise = amountInRupees * 100;

        // Razorpay max per transaction is ₹5,00,000 (50,000,000 paise)
        const RAZORPAY_MAX_PAISE = 5000000 * 100; // ₹50,00,000 in paise (50 lakh)
        const RAZORPAY_PRACTICAL_MAX = 500000; // ₹5,00,000 practical limit

        if (amountInRupees <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount. Please enter a valid booking amount.' });
        }

        if (amountInRupees > RAZORPAY_PRACTICAL_MAX) {
            return res.status(400).json({ 
                success: false, 
                message: `Amount ₹${amountInRupees.toLocaleString('en-IN')} exceeds Razorpay's per-transaction limit of ₹5,00,000. Please use Cash payment mode for this high-value booking.`,
                code: 'AMOUNT_EXCEEDS_LIMIT'
            });
        }

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `fleet_rcpt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Fleet Razorpay order creation failed', error);
        // Pass through actual Razorpay error description to frontend
        const razorpayMsg = error?.error?.description || error?.message || 'Failed to create razorpay order';
        res.status(500).json({ success: false, message: razorpayMsg });
    }
};

// Verify Razorpay Signature
export const verifyFleetRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Verification failed', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

// --- Fleet QuickEKYC Verification controllers ---

// Generate Aadhaar OTP
export const generateFleetAadhaarOTP = async (req, res) => {
    try {
        const { aadhaarNo } = req.body;

        if (!aadhaarNo || aadhaarNo.length !== 12) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 12-digit Aadhaar number'
            });
        }

        const result = await quickekycService.generateAadhaarOTP(aadhaarNo);

        if (result.status === 'success' || result.data?.request_id) {
            const requestId = result.data?.request_id || result.request_id;
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully to Aadhaar-linked mobile number',
                data: { requestId }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.message || 'Failed to generate OTP',
                error: result
            });
        }
    } catch (error) {
        console.error('Generate Fleet Aadhaar OTP Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while generating Aadhaar OTP'
        });
    }
};

// Verify Aadhaar OTP
export const verifyFleetAadhaarOTP = async (req, res) => {
    try {
        const { otp, requestId } = req.body;

        if (!otp || !requestId) {
            return res.status(400).json({
                success: false,
                message: 'OTP and Request ID are required'
            });
        }

        const result = await quickekycService.submitAadhaarOTP(requestId, otp);

        if (result.status === 'success' || result.data?.status === 'VALID') {
            return res.status(200).json({
                success: true,
                message: 'Aadhaar verified successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.message || 'Aadhaar verification failed',
                error: result
            });
        }
    } catch (error) {
        console.error('Verify Fleet Aadhaar OTP Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while verifying Aadhaar OTP'
        });
    }
};

// Verify Driving License
export const verifyFleetDL = async (req, res) => {
    try {
        const { dlNo, dob, expiryDate } = req.body;
        const dateVal = expiryDate || dob;
        
        if (!dlNo || !dateVal) {
            return res.status(400).json({
                success: false,
                message: 'Valid DL number and Date of Birth are required'
            });
        }

        const dlRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}-[0-9]{4}-[0-9]{7}$/;
        if (!dlRegex.test(dlNo.trim().toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter driving license in correct format: e.g. MP41N-2021-0130258'
            });
        }
        
        const cleanDlNo = dlNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Parse the date (which is in dd/mm/yyyy format)
        let formattedDob = dateVal;
        let alternateDob = dateVal;

        if (dateVal && dateVal.includes('/')) {
            const parts = dateVal.split('/');
            if (parts.length === 3) {
                // parts[0] is DD, parts[1] is MM, parts[2] is YYYY
                formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
                alternateDob = `${parts[0]}-${parts[1]}-${parts[2]}`; // DD-MM-YYYY
            }
        } else if (dateVal && dateVal.includes('-')) {
            const parts = dateVal.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    formattedDob = dateVal;
                    alternateDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
                } else {
                    // DD-MM-YYYY
                    formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
                    alternateDob = dateVal;
                }
            }
        }

        console.log(`📡 Fleet Attempting DL Verification: ${cleanDlNo} with Date of Birth: ${formattedDob}`);
        
        try {
            let result = await quickekycService.verifyDL(cleanDlNo, formattedDob);
            
            if (result.status === 'error' && result.message?.toLowerCase().includes('date of birth')) {
                console.log(`🔄 Fleet Retrying with alternate date format: ${alternateDob}`);
                result = await quickekycService.verifyDL(cleanDlNo, alternateDob);
            }

            if (result.status === 'success' || result.data?.status === 'VALID') {
                return res.status(200).json({
                    success: true,
                    message: 'Driving License verified successfully',
                    data: result.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message || 'DL Verification failed',
                    error: result
                });
            }
        } catch (apiError) {
            console.error('QuickEKYC API Exception in Fleet:', apiError);
            
            if (apiError.message?.toLowerCase().includes('date of birth')) {
                try {
                    const lastResult = await quickekycService.verifyDL(cleanDlNo, alternateDob);
                    if (lastResult.status === 'success') {
                        return res.status(200).json({ success: true, message: 'Verified on retry', data: lastResult.data });
                    }
                } catch (e) {}
            }

            return res.status(400).json({
                success: false,
                message: apiError.message || 'API Error during DL verification',
                error: apiError
            });
        }
    } catch (error) {
        console.error('DL Fleet Controller Error:', error);
        res.status(500).json({ success: false, message: 'Server error during DL verification' });
    }
};

// Verify PAN Card
export const verifyFleetPAN = async (req, res) => {
    try {
        const { panNo } = req.body;
        
        const cleanPanNo = panNo ? panNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

        if (!cleanPanNo || cleanPanNo.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'A valid 10-digit PAN number is required'
            });
        }

        console.log(`📡 Fleet Attempting PAN Verification: ${cleanPanNo}`);
        
        const result = await quickekycService.verifyPAN(cleanPanNo);

        if (result.status === 'success' || result.data?.status === 'VALID') {
            return res.status(200).json({
                success: true,
                message: 'PAN Card verified successfully',
                data: result.data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: result.message || 'PAN Verification failed',
                error: result
            });
        }
    } catch (error) {
        console.error('PAN Fleet Controller Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during PAN verification' });
    }
};

// Cancel Booking
export const cancelOutwardBooking = async (req, res) => {
    try {
        const { id } = req.params;
        let success = false;
        let updatedData = null;

        // 1. Cancel OutwardBooking if it exists in OutwardBooking collection
        const outwardBooking = await OutwardBooking.findOneAndUpdate(
            { originalBookingId: id },
            { status: 'cancelled' },
            { new: true }
        );
        if (outwardBooking) {
            success = true;
            updatedData = outwardBooking;
        }

        // 2. Cancel standard Booking if it matches this id/bookingId
        const BookingModel = mongoose.model('Booking');
        let standardBooking = null;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            standardBooking = await BookingModel.findById(id);
        }
        if (!standardBooking) {
            standardBooking = await BookingModel.findOne({ bookingId: id });
        }

        if (standardBooking) {
            standardBooking.status = 'cancelled';
            standardBooking.cancelledBy = 'admin';
            standardBooking.cancelledAt = new Date();
            standardBooking.cancellationReason = 'Cancelled via Fleet portal';
            standardBooking.isTrackingActive = false;
            standardBooking.tripStatus = 'cancelled';

            // Cancel any pending transactions
            if (standardBooking.transactions && standardBooking.transactions.length > 0) {
                standardBooking.transactions.forEach(txn => {
                    if (txn.status === 'pending') {
                        txn.status = 'cancelled';
                    }
                });
            }

            // Update payment status
            if (standardBooking.paymentStatus === 'pending') {
                standardBooking.paymentStatus = 'failed';
            }

            // Reverse guarantor points and refund used booking points
            try {
                const { reverseGuarantorPoints, refundUsedBookingPoints } = await import('../utils/guarantorPoints.js');
                await reverseGuarantorPoints(standardBooking._id.toString(), 'Cancelled via Fleet portal');
                await refundUsedBookingPoints(standardBooking);
            } catch (pointsError) {
                console.error('Error reversing guarantor points/refunding booking points during fleet cancellation:', pointsError);
            }

            await standardBooking.save();
            success = true;
            if (!updatedData) {
                updatedData = standardBooking;
            }

            // Send push notifications
            try {
                const { sendPushNotification } = await import('../services/firebase.service.js');
                const bIdentifier = standardBooking.bookingId || standardBooking._id;
                const payload = {
                    notification: {
                        title: "Booking Cancelled",
                        body: "Booking Cancelled. Refund initiated.",
                    },
                    data: {
                        bookingId: bIdentifier.toString(),
                        status: 'cancelled',
                        type: 'booking_update',
                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                };
                sendPushNotification(standardBooking.user, payload, false);
                sendPushNotification(standardBooking.user, payload, true);
            } catch (notifyError) {
                console.error('Error sending push notification during fleet cancellation:', notifyError);
            }
        }

        if (!success) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: updatedData });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }
};

// Complete Booking
export const completeOutwardBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount, paymentMode, paymentStatus, transactionId, cashCollector } = req.body;
        const booking = await OutwardBooking.findOne({ originalBookingId: id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        booking.status = 'completed';
        
        if (paidAmount !== undefined) {
            booking.paidAmount = Number(paidAmount);
        } else {
            booking.paidAmount = booking.totalPrice;
        }

        if (paymentMode) {
            booking.remainingPaymentMode = paymentMode;
            // Append payment mode if it differs
            if (booking.paymentMode && booking.paymentMode !== paymentMode && !booking.paymentMode.includes(paymentMode)) {
                booking.paymentMode = `${booking.paymentMode} & ${paymentMode}`;
            } else {
                booking.paymentMode = paymentMode;
            }
        }
        
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        } else {
            booking.paymentStatus = booking.paidAmount >= booking.totalPrice ? 'paid' : 'partial';
        }

        if (transactionId) {
            booking.transactionId = transactionId;
        }

        if (cashCollector) {
            booking.cashCollector = cashCollector;
            booking.remainingCashCollector = cashCollector;
        }

        await booking.save();
        res.status(200).json({ success: true, message: 'Booking marked as completed', data: booking });
    } catch (error) {
        console.error('Complete booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete booking' });
    }
};

// Mark booking fully paid
export const payOutwardBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await OutwardBooking.findOne({ originalBookingId: id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        booking.paymentStatus = 'paid';
        booking.paidAmount = booking.totalPrice;
        await booking.save();
        res.status(200).json({ success: true, message: 'Payment recorded successfully', data: booking });
    } catch (error) {
        console.error('Pay booking error:', error);
        res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
};
