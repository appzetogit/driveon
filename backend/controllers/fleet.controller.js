import OutwardCar from '../models/OutwardCar.js';
import OutwardBooking from '../models/OutwardBooking.js';
import Vendor from '../models/Vendor.js';
import Car from '../models/Car.js';
import Setting from '../models/Setting.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { uploadImage, isConfigured } from '../services/cloudinary.service.js';
import quickekycService from '../services/quickekyc.service.js';
import { createAdminNotification } from './notification.controller.js';
import { generateOTP, sendOTP } from '../utils/otp.service.js';

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
        const bookings = await OutwardBooking.find()
            .populate('guarantor', 'name phone email guarantorId kycStatus')
            .sort({ createdAt: -1 });
        
        // Map backend to frontend expected structure
        const formattedBookings = bookings.map(b => ({
            id: b.originalBookingId,
            mongoId: b._id?.toString(),
            _id: b._id?.toString(),
            carId: b.carId,
            carName: b.carName,
            carType: b.carType,
            carOwnerName: b.carOwnerName,
            customerName: b.customerName,
            customerPhone: b.customerPhone || '',
            customerEmail: b.customerEmail || '',
            customerAddress: b.customerAddress || '',
            numberOfGuests: b.numberOfGuests || 1,
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
            depositType: b.depositType || (b.deposit > 0 ? 'money' : (b.depositItem?.itemName ? 'item' : 'none')),
            depositItem: b.depositItem || null,
            cashCollector: b.cashCollector || '',
            advanceCashCollector: b.advanceCashCollector || '',
            remainingCashCollector: b.remainingCashCollector || '',
            status: b.status || 'active',
            agreement: b.agreement || null,
            guarantor: b.guarantor || null,
            guarantorDetails: b.guarantorDetails || null,
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

        let depositItemData = null;
        if (bookingData.depositItem && typeof bookingData.depositItem === 'object') {
            const itemImageSecure = await uploadToCloudinaryIfBase64(bookingData.depositItem.itemImage, 'deposit-items');
            depositItemData = {
                itemType: bookingData.depositItem.itemType || 'Bike / Two-Wheeler',
                itemName: bookingData.depositItem.itemName || bookingData.depositItemName || '',
                itemNumber: bookingData.depositItem.itemNumber || bookingData.depositItem.number || bookingData.depositItemNumber || '',
                itemDetails: bookingData.depositItem.itemDetails || '',
                itemImage: itemImageSecure || '',
                returnStatus: bookingData.depositItem.returnStatus || 'deposited',
                returnedAt: bookingData.depositItem.returnedAt || null,
            };
        }

        let agreementData = null;
        if (bookingData.agreement && typeof bookingData.agreement === 'object') {
            agreementData = {
                agreementNumber: bookingData.agreement.agreementNumber || `AGR-INW-${Date.now().toString().slice(-6)}`,
                status: bookingData.agreement.status || 'done',
                phoneVerified: bookingData.agreement.phoneVerified || bookingData.customerPhone || '',
                verifiedAt: bookingData.agreement.verifiedAt || new Date(),
                termsAccepted: bookingData.agreement.termsAccepted !== false,
                approvedByOtp: bookingData.agreement.approvedByOtp !== false,
            };
        }

        const newBooking = await OutwardBooking.create({
            originalBookingId: bookingData.id,
            carId: bookingData.carId,
            carName: bookingData.carName,
            carType: bookingData.carType,
            carOwnerName: bookingData.carOwnerName,
            customerName: bookingData.customerName,
            customerPhone: bookingData.customerPhone || '',
            customerEmail: bookingData.customerEmail || '',
            customerAddress: bookingData.customerAddress || bookingData.address || '',
            numberOfGuests: Number(bookingData.numberOfGuests) || 1,
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
            depositType: bookingData.depositType || (bookingData.deposit > 0 ? 'money' : (depositItemData?.itemName ? 'item' : 'none')),
            depositItem: depositItemData,
            cashCollector: bookingData.cashCollector || '',
            advanceCashCollector: bookingData.cashCollector || '',
            status: bookingData.status || 'active',
            agreement: agreementData
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
            customerAddress: newBooking.customerAddress || '',
            numberOfGuests: newBooking.numberOfGuests || 1,
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
            depositType: newBooking.depositType || 'none',
            depositItem: newBooking.depositItem || null,
            cashCollector: newBooking.cashCollector || '',
            advanceCashCollector: newBooking.advanceCashCollector || '',
            remainingCashCollector: newBooking.remainingCashCollector || '',
            status: newBooking.status,
            agreement: newBooking.agreement || null,
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
        const outwardBooking = await OutwardBooking.findOne({ originalBookingId: id });
        if (outwardBooking) {
            outwardBooking.status = 'cancelled';
            if (outwardBooking.depositItem && outwardBooking.depositItem.returnStatus === 'deposited') {
                outwardBooking.depositItem.returnStatus = 'returned';
                outwardBooking.depositItem.returnedAt = new Date();
            }
            await outwardBooking.save();
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
        const { paidAmount, paymentMode, paymentStatus, transactionId, cashCollector, returnDepositItem } = req.body;
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

        // Return deposited physical item if customer deposited one
        if (booking.depositItem && (returnDepositItem === true || returnDepositItem === 'true' || booking.depositItem.itemName)) {
            booking.depositItem.returnStatus = 'returned';
            booking.depositItem.returnedAt = new Date();
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

// Store OTPs in memory for Inward Rental Agreement verification
const agreementOtpStore = new Map();

// Send OTP for Fleet Inward Rental Agreement
export const sendAgreementOTP = async (req, res) => {
    try {
        const { phone, customerName } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }
        const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
            return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
        }

        // Generate OTP
        let otp = generateOTP(cleanedPhone);
        if (!otp) otp = '123456';
        const otpStr = String(otp);

        // Store OTP with 10 min expiry
        agreementOtpStore.set(cleanedPhone, {
            otp: otpStr,
            expiresAt: Date.now() + 10 * 60 * 1000,
            customerName: customerName || 'Customer'
        });

        // Send via SMS
        try {
            await sendOTP(cleanedPhone, otpStr, 'register');
        } catch (smsErr) {
            console.warn('SMS gateway delivery note (fallback to test OTP):', smsErr.message);
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            phone: cleanedPhone,
            devOtp: otpStr
        });
    } catch (error) {
        console.error('Send Agreement OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

// Verify OTP for Fleet Inward Rental Agreement
export const verifyAgreementOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
        }
        const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
        const enteredOtp = String(otp).trim();

        const storedData = agreementOtpStore.get(cleanedPhone);
        const isMasterTestOtp = enteredOtp === '123456';
        const isStoredMatch = storedData && storedData.otp === enteredOtp && Date.now() < storedData.expiresAt;

        if (!isMasterTestOtp && !isStoredMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please try again or use 123456.'
            });
        }

        // Generate agreement number
        const agreementNumber = `AGR-INW-${Date.now().toString().slice(-6)}`;
        const verifiedAt = new Date();

        // Clear stored OTP
        agreementOtpStore.delete(cleanedPhone);

        return res.status(200).json({
            success: true,
            verified: true,
            message: 'Agreement approved & verified via mobile OTP successfully',
            agreement: {
                agreementNumber,
                status: 'verified',
                phoneVerified: cleanedPhone,
                verifiedAt,
                termsAccepted: true,
                approvedByOtp: true
            }
        });
    } catch (error) {
        console.error('Verify Agreement OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};

// Get all fleet inward agreements
export const getFleetAgreements = async (req, res) => {
    try {
        const bookings = await OutwardBooking.find({
            carType: 'inward',
            'agreement.status': { $in: ['verified', 'done'] }
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Get fleet agreements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch agreements' });
    }
};

// Default agreement template
const DEFAULT_AGREEMENT_TEMPLATE = {
    title: 'GUEST VEHICLE USE, BOOKING & BAILMENT AGREEMENT',
    companyName: 'URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON)',
    companySubtitle: 'Vehicle Rental Aggregator & Guest Bailment Agreement • Ahmedabad, Gujarat',
    companyAddress: 'Floor No.: 4, Building No./Flat No.: 429-430, Name Of Premises/Building: Patel Avenue, Road/Street: Sarkhej Gandhi Nagar Highway, Locality/Sub Locality: Bodakdev, City/Town/Village: Ahmedabad, District: Ahmedabad, State: Gujarat, PIN Code: 380054',
    companyContact: '+91 7610416911 | driveon721@gmail.com',
    customClauses: `The Platform Operator and Guest are individually a “Party” and collectively the “Parties”.

WHEREAS URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) is a vehicle rental aggregator, facilitating bookings between Guests and independent vehicle owners, Hosts and fleet operators. URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) may facilitate KYC and verification, booking, payment collection, vehicle handover/return coordination and customer support. Unless expressly stated otherwise, URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) does not own the Vehicle; ownership remains with the respective Host/vehicle owner, while the Guest receives temporary possession and use subject to this Agreement, Booking terms and Applicable Law.`,
    terms: [
        'VEHICLE AND BOOKING: The Vehicle is owned by/under the lawful control of Host, is provided to the Guest for temporary use, subject to this Agreement, the Booking terms and Applicable Law. Ownership and title in the Vehicle shall remain with the Host/registered owner. The Guest receives only temporary possession and use of the Vehicle during the Booking Period and acquires no ownership, lien or other proprietary interest in it.',
        'GUEST ELIGIBILITY AND VERIFICATION: The Guest confirms that the Guest is legally competent, holds a valid driving license for the Vehicle and has provided genuine and accurate identity and verification documents. The Guest shall provide valid KYC/identity documents, residence proof, driving licence and such other documents as reasonably required by the Platform Operator. The Guest shall immediately notify the Platform Operator if the Guest\'s driving licence becomes invalid, suspended, cancelled or revoked and shall not drive thereafter. The Platform Operator may refuse, suspend or cancel the Booking where verification is incomplete, information is false or unverifiable, or continued use presents a legal, safety or security concern.',
        'USE AND POSSESSION OF VEHICLE: Only the Guest may drive or operate the Vehicle unless another driver is expressly approved in writing by the Platform Operator/Host. The Guest shall not sell, lease, sub-let, rent, lend, transfer, assign or otherwise part with possession of the Vehicle. The Vehicle shall be used only for lawful purposes and in accordance with all applicable traffic, motor vehicle, transport and safety laws. The Guest shall bear all liability, costs, penalties, claims and expenses arising from any illegal, unlawful or criminal use of the Vehicle or any act or omission attributable to the Guest. The Guest shall not use or permit the Vehicle to be used for any offence or for transportation or possession of narcotic drugs, psychotropic substances, illegal arms or ammunition, stolen property, contraband or other prohibited material. The Guest shall not use the Vehicle for taxi, cab, ride-hailing, commercial passenger transport, sub-rental or other commercial exploitation unless expressly permitted by Applicable Law and the Booking terms. The Guest shall not use the Vehicle for racing, rallies, stunt driving, drifting, speed testing, organized motorsport, dangerous off-road activities or any other unsafe use. The Guest shall not drive under the influence of alcohol, drugs or any substance impairing safe driving. The Guest shall not take the Vehicle outside India or any restricted territory, or modify, dismantle, tune or tamper with the Vehicle or its safety, GPS or telematics systems. The Guest shall exercise reasonable care and shall not knowingly drive through flooded roads, deep water or other hazardous conditions where a reasonable driver would avoid doing so.',
        'HANDOVER AND RETURN: The Vehicle shall be handed over against an inspection/photographic record noting, where applicable, its condition, existing damage, odometer, fuel level, keys, accessories and documents. Damage or defects recorded at handover shall be treated as pre-existing. The Guest shall be responsible only for damage or loss attributable to the Guest\'s breach, negligence, wilful misconduct, prohibited use, unauthorised driver or other act or omission. The Guest shall return the Vehicle on the agreed date, time and location in substantially the same condition as received, subject to ordinary wear and tear. Damage identified upon return may be assessed using photographs, inspection records, telematics, repair estimates, invoices, insurance assessments and other relevant evidence. Late or unauthorized retention of the Vehicle may result in applicable additional charges and reasonable recovery costs.',
        'FINES, TOLLS, FUEL AND OTHER CHARGES: The Guest shall comply with all traffic laws, speed limits, parking restrictions and road regulations. All traffic fines, e-challans, parking charges, tolls, FASTag charges, statutory charges and other amounts attributable to the Guest\'s use of the Vehicle during the Booking Period shall be borne by the Guest. Where disclosed in the Booking terms, reasonable administrative charges for processing fines, tolls, statutory notices or similar matters may also be recovered from the Guest. The Guest shall return the Vehicle with the same fuel level as recorded at handover and shall bear any fuel shortfall and applicable refueling charge. Any towing, flushing, repair or replacement costs resulting from incorrect or contaminated fuel shall be borne by the Guest.',
        'ACCIDENT, THEFT AND INCIDENTS: The Guest shall immediately notify the Platform Operator and Host, wherever reasonably practicable, of any accident, theft, attempted theft, breakdown, seizure, detention, material damage, loss of keys/documents or other material incident involving the Vehicle. The Guest shall promptly notify the police, insurer, emergency service or other competent authority where required by law or circumstances and shall take reasonable steps to prevent further damage. The Guest shall fully cooperate with the Host, Platform Operator, insurer, police and other competent authorities and shall provide truthful information and documents. The Guest shall not make false statements, conceal material facts, admit liability or enter into any settlement on behalf of the Host or Platform Operator without authority, where such authority can reasonably be obtained. Booking, KYC, payment, photographs, GPS, telematics and other relevant records may be preserved and disclosed to competent authorities where required or permitted by law.',
        'DAMAGE AND FINANCIAL LIABILITY: The Guest shall be liable for reasonable and documented costs arising from damage to, loss of or recovery of the Vehicle to the extent directly attributable to the Guest\'s breach, negligence, willful misconduct, prohibited use, unauthorized driving or other act or omission. The Guest shall bear all liability, costs, penalties, claims and expenses arising from any illegal, unlawful or criminal use of the Vehicle or any act or omission attributable to the Guest. In the event of damage, accident, police seizure/impoundment, detention, abandonment or legal dispute arising from the Guest\'s use of the Vehicle, the agreed daily rental shall continue to accrue until the Vehicle is physically recovered and formally handed over to the Platform Operator/Host, subject to Applicable Law. The Guest shall not be liable for ordinary wear and tear, pre-existing defects or mechanical failure not caused by the Guest. Where damage attributable to the Guest prevents use of the Vehicle, reasonable and documented loss of use for the reasonably required repair period may be recovered, subject to Applicable Law.',
        'SECURITY DEPOSIT: The Guest shall provide a refundable Security Deposit of not less than INR 10,000/-, or such higher amount as specified at the time of Booking. Subject to Applicable Law, the Platform Operator may adjust the Security Deposit against properly established amounts payable by the Guest, including damage, fines, tolls, fuel shortfall, recovery expenses and other contractual charges. The balance shall be refunded after completion of the Booking and reconciliation of applicable charges, subject to any pending claim or statutory charge. Payment of the Security Deposit shall not limit the Guest\'s liability for amounts lawfully exceeding the deposit.',
        'GPS, TELEMATICS AND DATA: The Vehicle may be equipped with GPS, telematics, speed monitoring, keyless access, immobilisation or other technology for safety, security, trip administration, fraud prevention and vehicle recovery. The Guest shall not tamper with, disconnect, remove, shield or bypass such systems and shall bear reasonable repair or replacement costs resulting from such tampering. Personal, location and Vehicle data may be collected, processed, stored and disclosed in accordance with Applicable Law, the applicable Privacy Policy and lawful requests of competent authorities. Electronic Booking records, OTPs, digital acknowledgements, photographs, payment records, GPS/telematics records and inspection records may be relied upon as evidence of the relevant transaction, subject to Applicable Law.',
        'INDEMNITY: The Guest shall indemnify the Host and Platform Operator against reasonable and documented losses, damages, third party claims, costs and legal expenses directly arising from the Guest\'s breach of this Agreement, unlawful or prohibited use, unauthorised driving or possession, negligence, wilful misconduct, false information, failure to return the Vehicle or damage/loss for which the Guest is responsible. The Guest shall not indemnify the Platform Operator for loss arising solely from the Platform Operator\'s fraud, wilful misconduct or breach of Applicable Law.',
        'SUSPENSION, TERMINATION AND RECOVERY: The Platform Operator may suspend or terminate the Booking where the Guest provides false information, loses driving eligibility, materially breaches this Agreement, uses the Vehicle unlawfully, creates a safety/security risk or violates the Booking terms. Immediate termination may be effected in cases of unlawful use, unauthorised driving, intoxicated driving, abandonment or refusal to return the Vehicle, material tampering or prohibited commercial use. Upon expiry or termination, the Guest shall immediately stop using and return the Vehicle to the designated location. If the Guest fails to return the Vehicle, the Host and/or Platform Operator may take all lawful and reasonable steps necessary to recover the Vehicle, including approaching competent authorities.',
        'PLATFORM LIABILITY: To the maximum extent permitted by Applicable Law, the Platform Operator shall not be liable for indirect, incidental, special or consequential loss, loss of time or inconvenience arising from the Guest\'s use of the Vehicle. The Platform Operator shall not be responsible for personal belongings left in the Vehicle or mechanical defects attributable solely to the Vehicle/Host, except for liability which cannot legally be excluded. Nothing in this Agreement shall exclude or limit liability which cannot lawfully be excluded or limited.',
        'GOVERNING LAW AND DISPUTE RESOLUTION: This Agreement shall be governed by the laws of India. Any contractual dispute capable of arbitration shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, as amended. The Parties shall endeavour to mutually appoint a sole arbitrator within thirty (30) days of a written notice invoking arbitration, failing which either Party may seek appointment in accordance with law. The seat of arbitration shall be Ahmedabad, Gujarat, and the proceedings shall be conducted in English. Subject to arbitration and Applicable Law, courts having competent jurisdiction at Ahmedabad, Gujarat shall have jurisdiction in relation to proceedings arising from this Agreement.',
        'GENERAL: This Agreement, together with the Booking confirmation and applicable Platform terms/policies, constitutes the agreement between the Parties concerning the Booking. If any provision is held invalid or unenforceable, the remaining provisions shall continue to the extent permitted by Applicable Law. No failure or delay in exercising any right shall constitute a waiver. The Guest shall not assign or transfer rights or obligations under this Agreement without prior written consent. Provisions relating to payment, damage, indemnity, liability, data, records and dispute resolution shall survive expiry or termination to the extent applicable.'
    ]
};

// Get master agreement template
export const getAgreementTemplate = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'fleet_inward_agreement_template' });
        if (setting && setting.value) {
            return res.status(200).json({ success: true, data: setting.value });
        }
        return res.status(200).json({ success: true, data: DEFAULT_AGREEMENT_TEMPLATE });
    } catch (error) {
        console.error('Get agreement template error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch agreement template' });
    }
};

// Update master agreement template
export const updateAgreementTemplate = async (req, res) => {
    try {
        const templateData = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key: 'fleet_inward_agreement_template' },
            {
                key: 'fleet_inward_agreement_template',
                value: templateData,
                description: 'Master Inward Fleet Rental Agreement Template with dynamic placeholders'
            },
            { upsert: true, new: true }
        );
        res.status(200).json({
            success: true,
            message: 'Agreement template saved successfully',
            data: setting.value
        });
    } catch (error) {
        console.error('Update agreement template error:', error);
        res.status(500).json({ success: false, message: 'Failed to save agreement template' });
    }
};

