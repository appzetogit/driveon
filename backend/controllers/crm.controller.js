import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import Car from '../models/Car.js';
import Admin from '../models/Admin.js';
import CRMTask from '../models/CRMTask.js';
import Booking from '../models/Booking.js';
import Staff from '../models/Staff.js';
import CRMRole from '../models/CRMRole.js';
import Attendance from '../models/Attendance.js';
import Salary from '../models/Salary.js';
import AdvanceLoan from '../models/AdvanceLoan.js';
import PerformanceReview from '../models/PerformanceReview.js';
import StaffWorkTask from '../models/StaffWorkTask.js';
import CarDocument from '../models/CarDocument.js';
import AccidentCase from '../models/AccidentCase.js';
import Garage from '../models/Garage.js';
import CarExpense from '../models/CarExpense.js';
import RepairJob from '../models/RepairJob.js';
import InventoryItem from '../models/InventoryItem.js';
import Vendor from '../models/Vendor.js';
import OutwardCar from '../models/OutwardCar.js';
import VendorTransaction from '../models/VendorTransaction.js';
import VendorHistory from '../models/VendorHistory.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Expense from '../models/Expense.js';
import City from '../models/City.js';
import Setting from '../models/Setting.js';
import { uploadImage } from '../services/cloudinary.service.js';
import razorpayService from '../services/razorpay.service.js';
import { createNotification, createAdminNotification } from './notification.controller.js';
import { sendAdminNotification, sendStaffPushNotification } from '../services/firebase.service.js';

/**
 * @desc    Get All Enquiries (with filters)
 * @route   GET /api/crm/enquiries
 * @access  Admin
 */
export const getEnquiries = async (req, res) => {
    try {
        const { status, search, startDate, endDate, assignedTo } = req.query;
        let query = {};

        if (status && status !== 'Status: All' && status !== 'Show: All') {
            query.status = status;
        }

        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        if (search) {
            // Find car IDs that match the search brand or model
            const Car = mongoose.model('Car');
            const matchingCars = await Car.find({
                $or: [
                    { brand: { $regex: search, $options: 'i' } },
                    { model: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const carIds = matchingCars.map(car => car._id);

            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { carInterested: { $in: carIds } }
            ];

            // Only add regex on carInterested if search is a valid string for regex
            // This handles legacy string entries like "Alto 800 C2"
            try {
                query.$or.push({ carInterested: { $regex: search, $options: 'i' } });
            } catch (e) {
                // Ignore if regex fails
            }
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        let enquiries = await Enquiry.find(query)
            .populate('assignedTo', 'name email avatar')
            .sort({ createdAt: -1 })
            .lean();

        // Safe manual population for carInterested (handles mixture of ObjectIds and Strings)
        const carIdsToFetch = enquiries
            .filter(enq => enq.carInterested && mongoose.Types.ObjectId.isValid(enq.carInterested))
            .map(enq => enq.carInterested);

        if (carIdsToFetch.length > 0) {
            const cars = await mongoose.model('Car').find({ _id: { $in: carIdsToFetch } }).select('brand model').lean();
            const carMap = cars.reduce((acc, car) => {
                acc[car._id.toString()] = car;
                return acc;
            }, {});

            enquiries = enquiries.map(enq => {
                if (enq.carInterested && mongoose.Types.ObjectId.isValid(enq.carInterested)) {
                    const carData = carMap[enq.carInterested.toString()];
                    if (carData) {
                        enq.carInterested = carData;
                    }
                }
                return enq;
            });
        }

        res.status(200).json({
            success: true,
            count: enquiries.length,
            data: { enquiries }
        });
    } catch (error) {
        console.error('Get enquiries error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching enquiries',
            error: error.message
        });
    }
};

/**
 * @desc    Create New Enquiry
 * @route   POST /api/crm/enquiries
 * @access  Admin
 */
export const createEnquiry = async (req, res) => {
    try {
        const enquiry = await Enquiry.create(req.body);

        // Notify Staff if assigned
        if (enquiry.assignedTo) {
            await createNotification({
                recipient: enquiry.assignedTo,
                recipientModel: 'Staff',
                title: 'New Enquiry Assigned',
                message: `You have been assigned a new enquiry: ${enquiry.name}`,
                type: 'enquiry_assigned',
                relatedId: enquiry._id,
                relatedModel: 'Enquiry'
            });
        }

        res.status(201).json({
            success: true,
            data: { enquiry }
        });
    } catch (error) {
        console.error('Create enquiry error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating enquiry',
            error: error.message
        });
    }
};

/**
 * @desc    Update Enquiry
 * @route   PUT /api/crm/enquiries/:id
 * @access  Admin
 */
export const updateEnquiry = async (req, res) => {
    try {
        let enquiry = await Enquiry.findById(req.params.id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        const oldStatus = enquiry.status;
        const oldAssignedTo = enquiry.assignedTo ? enquiry.assignedTo.toString() : null;

        enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Check for conversion status change
        if (req.body.status === 'Converted' && oldStatus !== 'Converted') {
            // Notify CRM admins
            try {
                await createAdminNotification({
                    title: 'Enquiry Converted',
                    message: `Enquiry for ${enquiry.name} has been successfully converted!`,
                    type: 'success',
                    relatedId: enquiry._id,
                    relatedModel: 'Enquiry'
                });
            } catch (err) {
                console.error('Error sending admin notification for converted enquiry:', err);
            }

            // Also notify the assigned staff member if they are assigned
            if (enquiry.assignedTo) {
                try {
                    await createNotification({
                        recipient: enquiry.assignedTo,
                        recipientModel: 'Staff',
                        title: 'Enquiry Converted',
                        message: `Enquiry for ${enquiry.name} has been successfully converted!`,
                        type: 'success',
                        relatedId: enquiry._id,
                        relatedModel: 'Enquiry'
                    });
                } catch (err) {
                    console.error('Error sending staff notification for converted enquiry:', err);
                }
            }
        }

        // Check for assignment change
        if (req.body.assignedTo && req.body.assignedTo !== oldAssignedTo) {
            await createNotification({
                recipient: req.body.assignedTo,
                recipientModel: 'Staff',
                title: 'Enquiry Assigned',
                message: `An enquiry has been assigned to you: ${enquiry.name}`,
                type: 'enquiry_assigned',
                relatedId: enquiry._id,
                relatedModel: 'Enquiry'
            });
        }

        res.status(200).json({
            success: true,
            data: { enquiry }
        });
    } catch (error) {
        console.error('Update enquiry error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating enquiry',
            error: error.message
        });
    }
};

/**
 * @desc    Get Single Enquiry Details
 * @route   GET /api/crm/enquiries/:id
 * @access  Admin
 */
export const getEnquiryDetails = async (req, res) => {
    try {
        let enquiry = await Enquiry.findById(req.params.id)
            .populate('assignedTo', 'name email avatar')
            .lean();

        if (enquiry && enquiry.carInterested && mongoose.Types.ObjectId.isValid(enquiry.carInterested)) {
            const carData = await mongoose.model('Car').findById(enquiry.carInterested).select('brand model year registrationNumber color carType').lean();
            if (carData) {
                enquiry.carInterested = carData;
            }
        }

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { enquiry }
        });
    } catch (error) {
        console.error('Get enquiry details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching enquiry details',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Cars (Simple list for Dropdowns)
 * @route   GET /api/crm/cars-simple
 * @access  Admin
 */
export const getAllCarsSimple = async (req, res) => {
    try {
        const cars = await Car.find().select('brand model registrationNumber').sort({ brand: 1 });
        const formatted = cars.map(car => ({
            value: car._id,
            label: `${car.brand} ${car.model} (${car.registrationNumber})`
        }));
        res.status(200).json({ success: true, data: { cars: formatted } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getCarOwnersSimple = async (req, res) => {
    try {
        const User = mongoose.model('User');
        const OutwardCar = mongoose.model('OutwardCar');

        // 1. Fetch all outward cars to see who has added cars in outwards
        const outwardCars = await OutwardCar.find().lean();

        // Get unique owner names and phones from OutwardCar records
        const uniqueOutwardOwners = [];
        const seen = new Set();
        outwardCars.forEach(car => {
            if (car.ownerName) {
                const nameKey = car.ownerName.trim().toLowerCase();
                const phoneKey = (car.ownerPhone || '').trim();
                const compositeKey = `${nameKey}_${phoneKey}`;
                if (!seen.has(compositeKey)) {
                    seen.add(compositeKey);
                    uniqueOutwardOwners.push({
                        name: car.ownerName.trim(),
                        phone: (car.ownerPhone || '').trim()
                    });
                }
            }
        });

        // 2. Fetch all registered users with role 'owner'
        const users = await User.find({ role: 'owner', isActive: true, isDeleted: { $ne: true } })
            .select('name email phone')
            .lean();

        const ownersMap = new Map();

        // 3. Match outward owners with registered users to enrich details, or represent as a new unique owner
        uniqueOutwardOwners.forEach(outOwner => {
            const matchedUser = users.find(u => 
                (u.phone && u.phone === outOwner.phone) || 
                (u.name.toLowerCase() === outOwner.name.toLowerCase())
            );

            if (matchedUser) {
                ownersMap.set(matchedUser._id.toString(), {
                    _id: matchedUser._id.toString(),
                    name: matchedUser.name,
                    email: matchedUser.email || '',
                    phone: matchedUser.phone || outOwner.phone || ''
                });
            } else {
                const key = outOwner.name.toLowerCase();
                ownersMap.set(key, {
                    _id: key,
                    name: outOwner.name,
                    email: '',
                    phone: outOwner.phone || ''
                });
            }
        });

        const owners = Array.from(ownersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({ success: true, data: { owners } });
    } catch (error) {
        console.error('Error fetching car owners:', error);
        res.status(500).json({ success: false, message: 'Server error fetching car owners' });
    }
};


/**
 * @desc    Get All CRM Tasks
 * @route   GET /api/crm/tasks
 * @access  Admin
 */
export const getTasks = async (req, res) => {
    try {
        const { date, status } = req.query;
        let query = {};

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.dueDate = { $gte: start, $lte: end };
        }

        if (status) {
            query.status = status;
        }

        const tasks = await CRMTask.find(query)
            .populate('enquiryId', 'name phone carInterested')
            .populate('assignedTo', 'name')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: { tasks }
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching tasks',
            error: error.message
        });
    }
};

/**
 * @desc    Create New Task/Follow-up
 * @route   POST /api/crm/tasks
 * @access  Admin
 */
export const createTask = async (req, res) => {
    try {
        const task = await CRMTask.create(req.body);

        if (task.assignedTo) {
            await createNotification({
                recipient: task.assignedTo,
                recipientModel: 'Staff',
                title: 'New Task Assigned',
                message: `New Task: ${task.title || 'Untitled Task'}`,
                type: 'task_assigned',
                relatedId: task._id,
                relatedModel: 'CRMTask'
            });
        }

        res.status(201).json({
            success: true,
            data: { task }
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating task',
            error: error.message
        });
    }
};

/**
 * @desc    Update Task
 * @route   PUT /api/crm/tasks/:id
 * @access  Admin
 */
export const updateTask = async (req, res) => {
    try {
        let task = await CRMTask.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const oldAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

        const oldStatus = task.status;

        task = await CRMTask.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Notify Admins on Task Completion
        if (req.body.status === 'Done' && oldStatus !== 'Done') {
            const title = 'Task Completed ✅';
            const message = `A CRM task has been completed: ${task.title || 'Untitled'}`;
            
            // Push Notification
            await sendAdminNotification(title, message, {
                type: 'crm_task_completed',
                taskId: task._id.toString()
            });

            // Socket.IO Real-time update
            const io = req.app.get('socketio');
            if (io) {
                io.to('admins').emit('notification:new', {
                    title,
                    message,
                    type: 'success',
                    data: { taskId: task._id }
                });
            }
        }

        if (req.body.assignedTo && req.body.assignedTo !== oldAssignedTo) {
            await createNotification({
                recipient: req.body.assignedTo,
                recipientModel: 'Staff',
                title: 'Task Assigned',
                message: `Task assigned to you: ${task.title || 'Untitled Task'}`,
                type: 'task_assigned',
                relatedId: task._id,
                relatedModel: 'CRMTask'
            });
        }

        res.status(200).json({
            success: true,
            data: { task }
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating task',
            error: error.message
        });
    }
};

/**
 * @desc    Get Active Bookings for CRM Dashboard
 * @route   GET /api/crm/bookings/active
 * @access  Admin
 */
export const getActiveBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'active' })
            .populate('user', 'name phone')
            .populate('car', 'brand model registrationNumber images')
            .sort({ 'tripEnd.date': 1 });

        const formatDateStr = (dStr) => {
            if (!dStr) return '—';
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return '—';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const formatted = bookings.map(b => ({
            id: b._id,
            vehicle: `${b.car.brand} ${b.car.model}`,
            vehicleImage: b.car.images.find(img => img.isPrimary)?.url || b.car.images[0]?.url,
            regNumber: b.car.registrationNumber,
            customer: b.user.name,
            phone: b.user.phone,
            dateRange: `${formatDateStr(b.tripStart.date)} - ${formatDateStr(b.tripEnd.date)}`,
            status: 'Ongoing',
            amount: b.pricing.finalPrice
        }));

        res.status(200).json({
            success: true,
            data: { bookings: formatted }
        });
    } catch (error) {
        console.error('Get active bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching active bookings',
            error: error.message
        });
    }
};

/**
 * @desc    Get Upcoming Bookings for CRM
 * @route   GET /api/crm/bookings/upcoming
 * @access  Admin
 */
export const getUpcomingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            status: { $in: ['confirmed', 'pending'] },
            'tripStart.date': { $gte: new Date() }
        })
            .populate('user', 'name phone')
            .populate('car', 'brand model registrationNumber images')
            .sort({ 'tripStart.date': 1 });

        const formatDateStr = (dStr) => {
            if (!dStr) return '—';
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return '—';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const formatted = bookings.map(b => {
            const now = new Date();
            const start = new Date(b.tripStart.date);
            const diffMs = start - now;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            let startsIn = '';
            if (diffDays > 0) startsIn = `${diffDays} Days`;
            else if (diffHours > 0) startsIn = `${diffHours} Hours`;
            else startsIn = 'Soon';

            return {
                id: b._id,
                vehicle: `${b.car.brand} ${b.car.model}`,
                vehicleImage: b.car.images.find(img => img.isPrimary)?.url || b.car.images[0]?.url,
                regNumber: b.car.registrationNumber,
                customer: b.user.name,
                phone: b.user.phone,
                dateRange: `${formatDateStr(b.tripStart.date)} - ${formatDateStr(b.tripEnd.date)}`,
                status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
                startsIn: startsIn,
                amount: b.pricing.finalPrice
            };
        });

        res.status(200).json({
            success: true,
            data: { bookings: formatted }
        });
    } catch (error) {
        console.error('Get upcoming bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching upcoming bookings',
            error: error.message
        });
    }
};

/**
 * @desc    Get CRM Dashboard Analytics
 */
export const getCRMAnalytics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthString = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // Create the last 7 days date objects
        const dayDates = [];
        const last7DaysPromises = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            dayDates.push(d);
            last7DaysPromises.push(
                Enquiry.countDocuments({ createdAt: { $gte: d, $lt: nextD } }),
                Enquiry.countDocuments({ status: 'Converted', updatedAt: { $gte: d, $lt: nextD } })
            );
        }

        const [
            totalEnquiries,
            enquiriesConvertedToday,
            conversionsThisMonth,
            totalStaff,
            telecallersCount,
            driversCount,
            perTripDriversCount,
            monthlyDriversCount,
            accountantHRCount,
            todayAttendances,
            leaveStaffCount,
            salaries,
            expenses,
            garagesCount,
            activeRepairsCount,
            activeVendors,
            assignedTripsCount,
            leadPipelineData,
            ...last7DaysCounts
        ] = await Promise.all([
            Enquiry.countDocuments(),
            Enquiry.countDocuments({ status: 'Converted', updatedAt: { $gte: today } }),
            Enquiry.countDocuments({ status: 'Converted', updatedAt: { $gte: startOfMonth } }),
            Staff.countDocuments({ status: { $ne: 'Resigned' } }),
            Staff.countDocuments({ role: { $regex: 'telecaller', $options: 'i' }, status: { $ne: 'Resigned' } }),
            Staff.countDocuments({ role: { $regex: 'driver', $options: 'i' }, status: { $ne: 'Resigned' } }),
            Staff.countDocuments({ role: { $regex: 'driver', $options: 'i' }, salaryMethod: 'Per Trip', status: { $ne: 'Resigned' } }),
            Staff.countDocuments({ role: { $regex: 'driver', $options: 'i' }, salaryMethod: 'Monthly', status: { $ne: 'Resigned' } }),
            Staff.countDocuments({ role: { $regex: 'accountant|hr', $options: 'i' }, status: { $ne: 'Resigned' } }),
            Attendance.find({ date: today }).populate('staff'),
            Staff.countDocuments({ status: 'Leave' }),
            Salary.find({ month: monthString }),
            Expense.find({ month: monthString }),
            Garage.countDocuments(),
            RepairJob.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } }),
            Vendor.find({ status: 'Active' }),
            Booking.countDocuments({ assignedDriver: { $ne: null } }),
            Enquiry.aggregate([
                { $group: { _id: "$status", value: { $sum: 1 } } }
            ]),
            ...last7DaysPromises
        ]);

        // Query vendor cars count for active vendors
        const activeVendorIds = activeVendors.map(v => v._id);
        const vendorCarsCount = await OutwardCar.countDocuments({ vendorId: { $in: activeVendorIds } });

        // Process Attendance
        const validAttendances = todayAttendances.filter(a => a.staff && a.staff.status !== 'Resigned');
        const presentCount = validAttendances.filter(a => ['Present', 'Late'].includes(a.status)).length;
        const absentCount = validAttendances.filter(a => a.status === 'Absent').length;
        const lateCount = validAttendances.filter(a => a.status === 'Late').length;
        const halfDayCount = validAttendances.filter(a => a.status === 'Half Day').length;

        // Process Payroll & Payouts
        const activePayrollCount = totalStaff; // All non-resigned staff are on payroll
        const paidMonth = salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (s.netPay || 0), 0);
        const pendingMonth = salaries.filter(s => s.status !== 'Paid').reduce((sum, s) => sum + (s.netPay || 0), 0);

        // Process Expenses
        const spentMonth = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Format Lead Pipeline
        const leadPipeline = leadPipelineData.map(item => ({
            name: item._id || 'Unknown',
            value: item.value
        }));

        // Format Enquiry Pulse
        const enquiryPulse = [];
        for (let i = 0; i < 7; i++) {
            const d = dayDates[i];
            enquiryPulse.push({
                name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                new: last7DaysCounts[i * 2],
                converted: last7DaysCounts[i * 2 + 1]
            });
        }

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    enquiries: {
                        total: totalEnquiries,
                        convertedToday: enquiriesConvertedToday
                    },
                    conversions: {
                        month: conversionsThisMonth
                    },
                    staff: {
                        total: totalStaff,
                        telecallers: telecallersCount,
                        drivers: driversCount,
                        perTripDrivers: perTripDriversCount,
                        monthlyDrivers: monthlyDriversCount,
                        accountantHR: accountantHRCount
                    },
                    attendance: {
                        present: presentCount,
                        absent: absentCount,
                        leave: leaveStaffCount,
                        late: lateCount,
                        halfDay: halfDayCount
                    },
                    payroll: {
                        active: activePayrollCount,
                        paidMonth,
                        pendingMonth
                    },
                    expense: {
                        spentMonth
                    },
                    garage: {
                        total: garagesCount,
                        active: activeRepairsCount
                    },
                    vendor: {
                        total: activeVendors.length,
                        cars: vendorCarsCount
                    },
                    trips: {
                        assigned: assignedTripsCount
                    }
                },
                enquiryPulse,
                leadPipeline
            }
        });
    } catch (error) {
        console.error('Get CRM analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching CRM analytics',
            error: error.message
        });
    }
};


/**
 * @desc    Get All Staff
 * @route   GET /api/crm/staff
 * @access  Admin
 */
export const getStaff = async (req, res) => {
    try {
        const { search, department } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } }
            ];
        }

        if (department && department !== 'All') {
            query.department = department;
        }

        const staff = await Staff.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: staff.length,
            data: { staff }
        });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching staff',
            error: error.message
        });
    }
};

/**
 * @desc    Create Staff
 * @route   POST /api/crm/staff
 * @access  Admin
 */
export const createStaff = async (req, res) => {
    try {
        let staffData = { ...req.body };

        // Check for unique phone number
        if (staffData.phone) {
            const existingPhone = await Staff.findOne({ phone: staffData.phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: `Staff member with phone number ${staffData.phone} already exists`
                });
            }
        }

        // Check for unique email address
        if (staffData.email) {
            const existingEmail = await Staff.findOne({ email: staffData.email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: `Staff member with email ${staffData.email} already exists`
                });
            }
        }

        // Handle File Uploads via req.files (multiple fields)
        if (req.files) {
            if (req.files['avatar'] && req.files['avatar'][0]) {
                const uploadResult = await uploadImage(req.files['avatar'][0], { folder: 'crm/staff' });
                staffData.avatar = uploadResult.secure_url;
            }
            if (req.files['aadharCard'] && req.files['aadharCard'][0]) {
                const uploadResult = await uploadImage(req.files['aadharCard'][0], { folder: 'crm/staff/aadhar' });
                staffData.aadharCard = uploadResult.secure_url;
            }
        }

        // Handle Avatar Upload fallback if single file present via req.file
        if (req.file) {
            const uploadResult = await uploadImage(req.file, { folder: 'crm/staff' });
            staffData.avatar = uploadResult.secure_url;
        }

        if (staffData.password) {
            staffData.plainTextPassword = staffData.password;
        }

        // Generate employeeId if not present (Simple generation: STF- + last 4 digits of timestamp + random)
        if (!staffData.employeeId) {
            staffData.employeeId = `STF-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        }

        const staff = await Staff.create(staffData);
        res.status(201).json({
            success: true,
            data: { staff }
        });
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating staff',
            error: error.message
        });
    }
};

/**
 * @desc    Update Staff
 * @route   PUT /api/crm/staff/:id
 * @access  Admin
 */
export const updateStaff = async (req, res) => {
    try {
        let staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const updateData = { ...req.body };

        // Check for unique phone number
        if (updateData.phone && updateData.phone !== staff.phone) {
            const existingPhone = await Staff.findOne({ phone: updateData.phone, _id: { $ne: req.params.id } });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: `Staff member with phone number ${updateData.phone} already exists`
                });
            }
        }

        // Check for unique email address
        if (updateData.email && updateData.email.toLowerCase() !== staff.email?.toLowerCase()) {
            const existingEmail = await Staff.findOne({ email: updateData.email.toLowerCase(), _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: `Staff member with email ${updateData.email} already exists`
                });
            }
        }

        // Handle File Uploads via req.files (multiple fields)
        if (req.files) {
            if (req.files['avatar'] && req.files['avatar'][0]) {
                const uploadResult = await uploadImage(req.files['avatar'][0], { folder: 'crm/staff' });
                staff.avatar = uploadResult.secure_url;
            }
            if (req.files['aadharCard'] && req.files['aadharCard'][0]) {
                const uploadResult = await uploadImage(req.files['aadharCard'][0], { folder: 'crm/staff/aadhar' });
                staff.aadharCard = uploadResult.secure_url;
            }
        }

        // Handle Avatar Upload fallback if single file present via req.file
        if (req.file) {
            const uploadResult = await uploadImage(req.file, { folder: 'crm/staff' });
            staff.avatar = uploadResult.secure_url;
        }

        // Update fields
        Object.keys(updateData).forEach((key) => {
            // Skip password if it's empty string (from frontend placeholder)
            if (key === 'password') {
                if (updateData[key] && updateData[key].trim() !== '' && updateData[key] !== '********') {
                    staff[key] = updateData[key];
                    staff.plainTextPassword = updateData[key];
                }
            } else if (key !== '_id' && key !== 'employeeId' && key !== 'createdAt' && key !== 'updatedAt') {
                // Prevent updating immutable fields
                staff[key] = updateData[key];
            }
        });

        await staff.save();

        res.status(200).json({
            success: true,
            data: { staff }
        });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating staff',
            error: error.message
        });
    }
};

/**
 * @desc    Delete Staff
 * @route   DELETE /api/crm/staff/:id
 * @access  Admin
 */
export const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Staff deleted successfully'
        });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting staff',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Roles
 * @route   GET /api/crm/roles
 * @access  Admin
 */
export const getRoles = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }
        const roles = await CRMRole.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: roles.length,
            data: { roles }
        });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching roles',
            error: error.message
        });
    }
};

/**
 * @desc    Create Role
 * @route   POST /api/crm/roles
 * @access  Admin
 */
export const createRole = async (req, res) => {
    try {
        const role = await CRMRole.create(req.body);
        res.status(201).json({
            success: true,
            data: { role }
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating role',
            error: error.message
        });
    }
};

/**
 * @desc    Update Role
 * @route   PUT /api/crm/roles/:id
 * @access  Admin
 */
export const updateRole = async (req, res) => {
    try {
        const role = await CRMRole.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.status(200).json({
            success: true,
            data: { role }
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating role',
            error: error.message
        });
    }
};

/**
 * @desc    Delete Role
 * @route   DELETE /api/crm/roles/:id
 * @access  Admin
 */
export const deleteRole = async (req, res) => {
    try {
        const role = await CRMRole.findByIdAndDelete(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting role',
            error: error.message
        });
    }
};

/**
 * @desc    Get Attendance Records
 * @route   GET /api/crm/attendance
 * @access  Admin
 */
export const getAttendance = async (req, res) => {
    try {
        const { date, dateFrom, dateTo, staffId } = req.query;
        let query = {};

        if (dateFrom && dateTo) {
            // Date range query
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            query.date = { $gte: from, $lte: to };
        } else if (date) {
            // Single date - get start and end of that day
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (staffId) {
            query.staff = staffId;
        }

        console.log('📅 Attendance query:', JSON.stringify(query, null, 2));

        const records = await Attendance.find(query)
            .populate('staff', 'name role department')
            .sort({ createdAt: -1 });

        console.log(`📊 Found ${records.length} attendance records`);

        res.status(200).json({
            success: true,
            count: records.length,
            data: { records }
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching attendance',
            error: error.message
        });
    }
};

/**
 * @desc    Mark Attendance
 * @route   POST /api/crm/attendance
 * @access  Admin
 */
export const markAttendance = async (req, res) => {
    try {
        const { staffId, date, status, inTime, outTime, workHours } = req.body;
        const targetDate = new Date(date || Date.now());
        const searchDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);

        const ensure12HourFormat = (timeStr) => {
            if (!timeStr || timeStr === '-') return timeStr;
            if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
                return timeStr;
            }
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                let hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // 0 hour should be 12
                const minutesStr = minutes.toString().padStart(2, '0');
                const hoursStr = hours.toString().padStart(2, '0');
                return `${hoursStr}:${minutesStr} ${ampm}`;
            }
            return timeStr;
        };

        // Fetch existing record
        const existingRecord = await Attendance.findOne({ staff: staffId, date: searchDate });

        let finalStatus = status;
        if (!finalStatus || finalStatus === '—') {
            finalStatus = existingRecord?.status || 'Present';
        }

        let finalInTime = inTime ? ensure12HourFormat(inTime) : undefined;
        let finalOutTime = outTime ? ensure12HourFormat(outTime) : undefined;

        if (finalStatus === 'Present' || finalStatus === 'Late') {
            if (!finalInTime) {
                finalInTime = existingRecord?.inTime || (finalStatus === 'Present' ? '09:00 AM' : '10:00 AM');
            }
            if (outTime === undefined) {
                finalOutTime = undefined; // Only clear outTime if it was not provided in the request
            } else {
                finalOutTime = ensure12HourFormat(outTime);
            }
        } else if (finalStatus === 'Half Day') {
            if (!finalInTime) {
                finalInTime = existingRecord?.inTime || '09:00 AM';
            }
            if (!finalOutTime) {
                finalOutTime = existingRecord?.outTime || '01:30 PM';
            }
        } else if (finalStatus === 'Absent' || finalStatus === 'Leave') {
            finalInTime = undefined;
            finalOutTime = undefined;
        }

        let calculatedWorkHours = workHours;
        if (finalInTime && finalOutTime) {
            // Helper to parse time strings like "09:00 AM" or "14:30"
            const parseToDate = (timeStr) => {
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':');
                if (hours === '12') hours = '00';
                if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
                const d = new Date();
                d.setHours(hours);
                d.setMinutes(minutes);
                d.setSeconds(0);
                return d;
            };

            try {
                const start = parseToDate(finalInTime);
                const end = parseToDate(finalOutTime);
                if (end < start) end.setDate(end.getDate() + 1);

                const diffMs = end - start;
                const totalMins = Math.floor(diffMs / (1000 * 60));
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                calculatedWorkHours = `${h}h ${m}m`;
            } catch (e) {
                console.error("WorkHours calculation failed", e);
            }
        }

        const updateDoc = {
            $set: { status: finalStatus }
        };

        if (finalInTime) {
            updateDoc.$set.inTime = finalInTime;
        } else {
            updateDoc.$unset = updateDoc.$unset || {};
            updateDoc.$unset.inTime = "";
        }

        if (finalOutTime) {
            updateDoc.$set.outTime = finalOutTime;
        } else {
            updateDoc.$unset = updateDoc.$unset || {};
            updateDoc.$unset.outTime = "";
        }

        if (calculatedWorkHours) {
            updateDoc.$set.workHours = calculatedWorkHours;
        } else {
            updateDoc.$unset = updateDoc.$unset || {};
            updateDoc.$unset.workHours = "";
        }

        let attendance = await Attendance.findOneAndUpdate(
            { staff: staffId, date: searchDate },
            updateDoc,
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            data: { attendance }
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error marking attendance',
            error: error.message
        });
    }
};

/**
 * @desc    Get Team Presence Summary
 * @route   GET /api/crm/team-presence
 * @access  Admin/Staff
 */
export const getTeamPresence = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total Staff (Active) - excluding Resigned if applicable, but for now counting all as per schema defaults
        const totalStaff = await Staff.countDocuments({ status: { $ne: 'Resigned' } });

        // Fetch today's attendance records and populate staff to filter out orphaned/invalid records
        const todayAttendances = await Attendance.find({ date: today }).populate('staff');
        const validAttendances = todayAttendances.filter(a => a.staff && a.staff.status !== 'Resigned');

        // 2. Present Today (Present or Late)
        const presentCount = validAttendances.filter(a => ['Present', 'Late'].includes(a.status)).length;

        // 2b. Late Today
        const lateCount = validAttendances.filter(a => a.status === 'Late').length;

        // 3. On Leave (Status is 'Leave')
        // Note: Staff status might be 'Leave' regardless of daily attendance check, or we check if there is an attendance logic for leave.
        // For accurate daily checking: typically if someone is on leave, there might be an attendance record with status 'Absent' or specific 'Leave'.
        // However, given the schema has Staff status 'Leave', we'll rely on that for "On Leave" count.
        const leaveCount = await Staff.countDocuments({ status: 'Leave' });

        // 4. Absent (Only count if explicitly marked as 'Absent' in daily attendance)
        const absentCount = validAttendances.filter(a => a.status === 'Absent').length;

        // 5. Get some avatars of present staff for the UI (limit 5)
        const presentAttendances = await Attendance.find({
            date: today,
            status: { $in: ['Present', 'Late'] }
        }).select('staff').limit(5);

        const presentStaffDetails = await Staff.find({
            _id: { $in: presentAttendances.map(a => a.staff) }
        }).select('employeeId name avatar status'); // Selecting minimal fields

        // Map to format suitable for UI (2-letter initials from name for clean avatar fallback)
        const presentStaffMapped = presentStaffDetails.map(s => {
            const nameParts = s.name ? s.name.trim().split(/\s+/) : [];
            const shortName = nameParts.length >= 2 
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : (s.name ? s.name.substring(0, 2).toUpperCase() : 'ST');
            return {
                id: s._id,
                shortName,
                name: s.name,
                avatar: s.avatar
            };
        });

        res.status(200).json({
            success: true,
            data: {
                total: totalStaff,
                present: presentCount,
                late: lateCount,
                absent: absentCount,
                leave: leaveCount,
                activeStaff: presentStaffMapped
            }
        });

    } catch (error) {
        console.error('Get team presence error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching team presence',
            error: error.message
        });
    }
};

/**
 * @desc    Get Payroll Records
 * @route   GET /api/crm/payroll
 * @access  Admin
 */
export const getPayroll = async (req, res) => {
    try {
        const { month, staffId } = req.query;
        let query = {};

        if (month) {
            query.month = month;
        }

        if (staffId) {
            query.staff = staffId;
        }

        const payroll = await Salary.find(query)
            .populate('staff', 'name role department baseSalary')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payroll.length,
            data: { payroll }
        });
    } catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payroll',
            error: error.message
        });
    }
};

/**
 * @desc    Create Payroll Record
 * @route   POST /api/crm/payroll
 * @access  Admin
 */
export const createPayroll = async (req, res) => {
    try {
        const { staff, month, baseSalary, deductions, netPay, status, advanceAmount } = req.body;

        const salary = await Salary.create({
            staff,
            month,
            baseSalary,
            deductions: deductions || 0,
            netPay,
            status: status || 'Pending',
            advanceAmount: advanceAmount || 0,
            paidDate: status === 'Paid' ? new Date() : undefined
        });

        res.status(201).json({
            success: true,
            data: { salary }
        });
    } catch (error) {
        console.error('Create payroll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating payroll',
            error: error.message
        });
    }
};

/**
 * @desc    Update Salary Status / Process Payment
 * @route   PUT /api/crm/payroll/:id
 * @access  Admin
 */
export const updatePayrollStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const updateData = { status };
        if (status === 'Paid') {
            updateData.paidDate = new Date();
        }

        const salary = await Salary.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!salary) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        res.status(200).json({
            success: true,
            data: { salary }
        });
    } catch (error) {
        console.error('Update payroll error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating payroll',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Advances & Loans
 * @route   GET /api/crm/advances
 * @access  Admin
 */
export const getAdvances = async (req, res) => {
    try {
        const { status, staffId } = req.query;
        let query = {};
        if (status) query.status = status;
        if (staffId) query.staff = staffId;

        const advances = await AdvanceLoan.find(query)
            .populate('staff', 'name role department')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: advances.length,
            data: { advances }
        });
    } catch (error) {
        console.error('Get advances error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching advances',
            error: error.message
        });
    }
};

/**
 * @desc    Create New Advance
 * @route   POST /api/crm/advances
 * @access  Admin
 */
export const createAdvance = async (req, res) => {
    try {
        const advance = await AdvanceLoan.create(req.body);
        res.status(201).json({
            success: true,
            data: { advance }
        });
    } catch (error) {
        console.error('Create advance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating advance',
            error: error.message
        });
    }
};

/**
 * @desc    Add Repayment to Advance
 * @route   POST /api/crm/advances/:id/repay
 * @access  Admin
 */
export const addRepayment = async (req, res) => {
    try {
        const { amount, note } = req.body;
        const advance = await AdvanceLoan.findById(req.params.id);

        if (!advance) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        advance.repaidAmount += Number(amount);
        advance.repayments.push({ amount, note, date: new Date() });

        if (advance.repaidAmount >= advance.totalAmount) {
            advance.status = 'Closed';
        }

        await advance.save();

        res.status(200).json({
            success: true,
            data: { advance }
        });
    } catch (error) {
        console.error('Add repayment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding repayment',
            error: error.message
        });
    }
};

/**
 * @desc    Get Performance Reviews
 * @route   GET /api/crm/performance
 * @access  Admin
 */
export const getPerformanceReviews = async (req, res) => {
    try {
        const { staffId, year } = req.query;
        let query = {};
        if (staffId) query.staff = staffId;
        if (year) {
            const start = new Date(`${year}-01-01`);
            const end = new Date(`${year}-12-31`);
            query.reviewDate = { $gte: start, $lte: end };
        }

        const reviews = await PerformanceReview.find(query)
            .populate('staff', 'name role department')
            .sort({ reviewDate: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: { reviews }
        });
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching performance reviews',
            error: error.message
        });
    }
};

/**
 * @desc    Create Performance Review
 * @route   POST /api/crm/performance
 * @access  Admin
 */
export const createPerformanceReview = async (req, res) => {
    try {
        const review = await PerformanceReview.create(req.body);
        res.status(201).json({
            success: true,
            data: { review }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating performance review',
            error: error.message
        });
    }
};

/**
 * @desc    Delete Performance Review
 * @route   DELETE /api/crm/performance/:id
 * @access  Admin
 */
export const deletePerformanceReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await PerformanceReview.findByIdAndDelete(id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting review', error: error.message });
    }
};

/**
 * @desc    Get Staff Work Tasks
 * @route   GET /api/crm/staff-tasks
 * @access  Admin
 */
export const getStaffWorkTasks = async (req, res) => {
    try {
        const { assignedTo, status } = req.query;
        let query = {};
        if (assignedTo) query.assignedTo = assignedTo;
        if (status) query.status = status;

        const tasks = await StaffWorkTask.find(query)
            .populate('assignedTo', 'name role department')
            .sort({ dueDate: 1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: { tasks }
        });
    } catch (error) {
        console.error('Get staff tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching staff tasks',
            error: error.message
        });
    }
};

/**
 * @desc    Create Staff Work Task
 * @route   POST /api/crm/staff-tasks
 * @access  Admin
 */
export const createStaffWorkTask = async (req, res) => {
    try {
        const task = await StaffWorkTask.create(req.body);

        // Send notification to assigned employee
        if (task.assignedTo) {
            createNotification({
                recipient: task.assignedTo,
                recipientModel: 'Staff',
                title: '📋 New Task Assigned',
                message: `You have a new task: "${task.title}" (Priority: ${task.priority})`,
                type: 'task_assigned',
                relatedId: task._id,
                relatedModel: 'StaffWorkTask',
                sendPush: true
            }).catch(err => console.error('❌ Failed to send task assignment notification:', err));
        }

        res.status(201).json({
            success: true,
            data: { task }
        });
    } catch (error) {
        console.error('Create staff task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating staff task',
            error: error.message
        });
    }
};

/**
 * @desc    Update Staff Work Task Status
 * @route   PUT /api/crm/staff-tasks/:id
 * @access  Admin
 */
export const updateStaffWorkTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Fetch old task to check status change
        const oldTask = await StaffWorkTask.findById(id).populate('assignedTo', 'name');

        if (!oldTask) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Prevent double-completion
        if (status === 'Done' && oldTask.status === 'Done') {
            return res.status(400).json({ success: false, message: 'Task is already completed' });
        }

        const task = await StaffWorkTask.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        // Notify Admins on Staff Task Completion (only once)
        if (status === 'Done' && oldTask.status !== 'Done') {
            const staffName = oldTask.assignedTo?.name || 'An employee';
            const title = 'Employee Task Completed ✅';
            const message = `${staffName} has completed the task: ${task.title}`;

            // Push Notification (Background/Foreground)
            await sendAdminNotification(title, message, {
                type: 'staff_task_completed',
                taskId: task._id.toString()
            });

            // Socket.IO (Real-time Foreground)
            const io = req.app.get('socketio');
            if (io) {
                io.to('admins').emit('notification:new', {
                    title,
                    message,
                    type: 'success',
                    data: { taskId: task._id }
                });
            }
        }

        res.status(200).json({
            success: true,
            data: { task }
        });
    } catch (error) {
        console.error('Update staff task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating staff task',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Car Documents
 * @route   GET /api/crm/car-documents
 * @access  Admin
 */
export const getCarDocuments = async (req, res) => {
    try {
        const { carId, type, status } = req.query;
        let query = {};
        if (carId) query.car = carId;
        if (type && type !== 'All') query.type = type;
        if (status && status !== 'All') query.status = status;

        const docs = await CarDocument.find(query)
            .populate('car', 'brand model registrationNumber')
            .sort({ expiryDate: 1 });

        res.status(200).json({
            success: true,
            count: docs.length,
            data: { docs }
        });
    } catch (error) {
        console.error('Get docs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching documents',
            error: error.message
        });
    }
};

/**
 * @desc    Upload Car Document
 * @route   POST /api/crm/car-documents
 * @access  Admin
 */
export const uploadCarDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const { car, docName, type, expiryDate } = req.body;

        const uploadResult = await uploadImage(req.file, {
            folder: 'crm/car-docs',
            resource_type: 'auto' // Important for PDFs/Docs
        });

        const carDoc = await CarDocument.create({
            car,
            docName,
            type,
            expiryDate,
            documentUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            status: new Date(expiryDate) < new Date() ? 'Expired' : 'Valid'
        });

        res.status(201).json({
            success: true,
            data: { carDoc }
        });
    } catch (error) {
        console.error('Upload doc error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error uploading document',
            error: error.message
        });
    }
};

/**
 * @desc    Create Fast Booking
 * @route   POST /api/crm/fast-booking
 * @access  Admin
 */
export const createFastBooking = async (req, res) => {
    try {
        const { carId, userId, startDate, endDate, startTime, endTime } = req.body;

        // Fetch car details to get pricing
        const car = await mongoose.model('Car').findById(carId);
        if (!car) {
            return res.status(404).json({ success: false, message: 'Car not found' });
        }

        // Calculate days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const basePrice = car.pricing?.perDay || 0;
        const totalPrice = basePrice * diffDays;

        const booking = await Booking.create({
            user: userId, // Assuming user exists (Walk-in user ID)
            car: carId,
            tripStart: {
                location: 'Main Office',
                date: startDate,
                time: startTime || '10:00 AM'
            },
            tripEnd: {
                location: 'Main Office',
                date: endDate,
                time: endTime || '10:00 AM'
            },
            totalDays: diffDays,
            pricing: {
                basePrice: basePrice,
                totalPrice: totalPrice,
                finalPrice: totalPrice
            },
            paymentOption: 'full',
            paymentStatus: 'pending',
            status: 'confirmed',
            tripStatus: 'not_started'
        });

        res.status(201).json({
            success: true,
            data: { booking }
        });
    } catch (error) {
        console.error('Fast booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating fast booking',
            error: error.message
        });
    }
};

/**
 * @desc    Report New Accident
 * @route   POST /api/crm/accidents
 * @access  Admin
 */
export const reportAccident = async (req, res) => {
    try {
        let evidence = [];

        // Handle Multiple Evidence Uploads
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => uploadImage(file, { folder: 'crm/accidents' }));
            const results = await Promise.all(uploadPromises);
            evidence = results.map(res => ({
                url: res.secure_url,
                publicId: res.public_id
            }));
        }

        const accidentData = {
            ...req.body,
            evidence
        };

        const accident = await AccidentCase.create(accidentData);

        res.status(201).json({
            success: true,
            data: { accident }
        });
    } catch (error) {
        console.error('Report accident error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error reporting accident',
            error: error.message
        });
    }
};

/**
 * @desc    Get All Accident Cases
 * @route   GET /api/crm/accidents
 * @access  Admin
 */
export const getAccidentCases = async (req, res) => {
    try {
        const { status, carId, severity } = req.query;
        let query = {};

        if (status) query.status = status;
        if (carId) query.car = carId;
        if (severity && severity !== 'All') query.severity = severity;

        const cases = await AccidentCase.find(query)
            .populate('car', 'brand model registrationNumber')
            .sort({ incidentDate: -1 });

        res.status(200).json({
            success: true,
            count: cases.length,
            data: { cases }
        });
    } catch (error) {
        console.error('Get accidents error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching accident cases',
            error: error.message
        });
    }
};

/**
 * @desc    Update/Settle Accident Case
 * @route   PUT /api/crm/accidents/:id
 * @access  Admin
 */
export const updateAccidentCase = async (req, res) => {
    try {
        const { status, finalCost, recoveredAmount } = req.body;

        let updateData = { ...req.body };

        if (status === 'Settled' || status === 'Full Recovery') {
            updateData.settledAt = new Date();
        }

        const accident = await AccidentCase.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!accident) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        res.status(200).json({
            success: true,
            data: { accident }
        });
    } catch (error) {
        console.error('Update accident error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating accident case',
            error: error.message
        });
    }
};

/**
 * @desc    Get Accident Loss & Recovery Summary
 * @route   GET /api/crm/reports/accident-summary
 * @access  Admin
 */
export const getAccidentSummary = async (req, res) => {
    try {
        const stats = await AccidentCase.aggregate([
            {
                $group: {
                    _id: null,
                    totalLoss: { $sum: "$finalCost" },
                    recoveredAmount: { $sum: "$recoveredAmount" }
                }
            }
        ]);

        const result = stats[0] || { totalLoss: 0, recoveredAmount: 0 };
        const unrecoveredLoss = result.totalLoss - result.recoveredAmount;

        // Top Loss Vehicles
        const topLossVehicles = await AccidentCase.aggregate([
            {
                $group: {
                    _id: "$car",
                    totalLoss: { $sum: "$finalCost" }
                }
            },
            { $sort: { totalLoss: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "cars",
                    localField: "_id",
                    foreignField: "_id",
                    as: "carDetails"
                }
            },
            { $unwind: "$carDetails" }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalLoss: result.totalLoss,
                    recoveredAmount: result.recoveredAmount,
                    unrecoveredLoss: unrecoveredLoss,
                    recoveryPercentage: result.totalLoss > 0 ? (result.recoveredAmount / result.totalLoss * 100).toFixed(1) : 0
                },
                topLossVehicles
            }
        });
    } catch (error) {
        console.error('Accident summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Active Bookings (CRM View)
 * @route   GET /api/crm/bookings/active-details
 * @access  Admin
 */
export const getActiveBookingsDetails = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'active' })
            .populate('car', 'brand model registrationNumber images')
            .populate('user', 'name phone')
            .sort({ 'tripEnd.date': 1 });

        res.status(200).json({
            success: true,
            data: { bookings }
        });
    } catch (error) {
        console.error('Active bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Payment Collection Status
 * @route   GET /api/crm/finance/payments
 * @access  Admin
 */
export const getPaymentStatus = async (req, res) => {
    try {
        const payments = await Booking.find()
            .select('bookingId user pricing paidAmount paymentStatus createdAt')
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { payments }
        });
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Profitability Analysis per Vehicle
 * @route   GET /api/crm/reports/profitability
 * @access  Admin
 */
export const getProfitabilityAnalysis = async (req, res) => {
    try {
        // 1. Get Revenue per Car from Bookings
        const revenueData = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: "$car",
                    totalRevenue: { $sum: "$pricing.finalPrice" }
                }
            }
        ]);

        // 2. Get Expenses per Car (Fuel, Maintenance, etc.)
        const expenseData = await CarExpense.aggregate([
            {
                $group: {
                    _id: { car: "$car", type: "$type" },
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Merge logic would go here depending on how frontend wants the shape
        // For simplicity, returning raw aggregated data
        res.status(200).json({
            success: true,
            data: { revenueData, expenseData }
        });
    } catch (error) {
        console.error('Profitability error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Garage Management (CRUD)
 */
export const getGarages = async (req, res) => {
    try {
        const garages = await Garage.find().sort({ name: 1 });
        res.json({ success: true, data: { garages } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createGarage = async (req, res) => {
    try {
        let garageData = { ...req.body };
        if (req.file) {
            const uploadResult = await uploadImage(req.file, { folder: 'crm/garages' });
            garageData.logo = uploadResult.secure_url;
        }
        const garage = await Garage.create(garageData);
        res.status(201).json({ success: true, data: { garage } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateGarage = async (req, res) => {
    try {
        const garage = await Garage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: { garage } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteGarage = async (req, res) => {
    try {
        await Garage.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Garage deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Repair Jobs Management
 */
export const getActiveRepairs = async (req, res) => {
    try {
        const repairs = await RepairJob.find({ status: { $nin: ['Completed', 'Cancelled'] } })
            .populate('car', 'brand model registrationNumber')
            .populate('garage', 'name')
            .sort({ updatedAt: -1 });
        res.json({ success: true, data: { repairs } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getRepairLogs = async (req, res) => {
    try {
        const logs = await RepairJob.find({ status: 'Completed' })
            .populate('car', 'brand model registrationNumber')
            .populate('garage', 'name')
            .sort({ completedAt: -1 });
        res.json({ success: true, data: { logs } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createRepairJob = async (req, res) => {
    try {
        const repair = await RepairJob.create(req.body);
        
        // If a repair job is successfully created and its status is active (not Completed/Cancelled)
        if (repair.car && !['Completed', 'Cancelled'].includes(repair.status)) {
            await Car.findByIdAndUpdate(repair.car, { isAvailable: false });
        }

        res.status(201).json({ success: true, data: { repair } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteRepairJob = async (req, res) => {
    try {
        const repair = await RepairJob.findById(req.params.id);
        if (repair && repair.car) {
            // Make the car available again when repair job is deleted
            await Car.findByIdAndUpdate(repair.car, { isAvailable: true });
        }
        await RepairJob.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Repair job deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateRepairJob = async (req, res) => {
    try {
        let updateData = { ...req.body };

        // Handle completion logic if status is changed to Completed
        if (updateData.status === 'Completed') {
            updateData.completedAt = new Date();
            updateData.progress = 100;
        }

        const repair = await RepairJob.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('car', 'brand model registrationNumber')
            .populate('garage', 'name');

        if (repair && repair.car) {
            const carId = repair.car._id || repair.car;
            if (['Completed', 'Cancelled'].includes(repair.status)) {
                // If marked completed or cancelled, make the car available again
                await Car.findByIdAndUpdate(carId, { isAvailable: true });
            } else {
                // If it is in an active repair state, keep/make it unavailable
                await Car.findByIdAndUpdate(carId, { isAvailable: false });
            }
        }

        res.json({ success: true, data: { repair } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


/**
 * @desc    Inventory Management
 */
export const getInventory = async (req, res) => {
    try {
        const items = await InventoryItem.find().sort({ category: 1, name: 1 });
        res.json({ success: true, data: { items } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createInventoryItem = async (req, res) => {
    try {
        const item = await InventoryItem.create(req.body);
        res.status(201).json({ success: true, data: { item } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createCarExpense = async (req, res) => {
    try {
        const expense = await CarExpense.create(req.body);
        res.status(201).json({ success: true, data: { expense } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Vendor Management
 */
export const onboardVendor = async (req, res) => {
    try {
        let vendorData = { ...req.body };
        if (req.file) {
            const uploadResult = await uploadImage(req.file, { folder: 'crm/vendors' });
            vendorData.profileImage = uploadResult.secure_url;
        }
        const vendor = await Vendor.create(vendorData);

        // Log history
        await VendorHistory.create({
            vendor: vendor._id,
            action: 'Partnered',
            detail: `Joined as ${vendor.type}`,
            status: 'Verified'
        });

        res.status(201).json({ success: true, data: { vendor } });
    } catch (error) {
        console.error('Onboard vendor error:', error);
        res.status(500).json({ success: false, message: 'Server error onboarding vendor' });
    }
};

const buildOutwardCarStats = async (outwardCar, vendorId) => {
    let allBookings = [];

    // 1. Fetch manual outward bookings from fleet portal
    const outwardBookings = await mongoose.model('OutwardBooking').find({
        carId: outwardCar.originalOutputId,
        status: { $ne: 'cancelled' }
    }).lean();

    outwardBookings.forEach(b => {
        const from = new Date(b.fromDate);
        const to = new Date(b.toDate);
        const timeDiff = to.getTime() - from.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
        
        allBookings.push({
            days,
            status: b.status
        });
    });

    // 2. Fetch standard bookings made by public customers for this car's shadow car
    const shadowCar = await mongoose.model('Car').findOne({ outwardCarId: outwardCar.originalOutputId });
    if (shadowCar) {
        const regularBookings = await mongoose.model('Booking').find({
            car: shadowCar._id,
            status: { $in: ['confirmed', 'active', 'completed'] }
        }).lean();

        regularBookings.forEach(b => {
            const days = b.totalDays || 1;
            allBookings.push({
                days,
                status: b.status
            });
        });
    }

    let totalDaysBooked = 0;
    allBookings.forEach(b => {
        totalDaysBooked += b.days;
    });

    const tripsCount = allBookings.length;
    const totalRevenue = (outwardCar.pricePerDay || 0) * totalDaysBooked;

    // Vendor Cost (Vendor Due) - Only counts if the car has done at least 1 trip
    let totalVendorCost = 0;
    if (tripsCount > 0) {
        if (outwardCar.vendorSettlement?.agreedAmount) {
            totalVendorCost = outwardCar.vendorSettlement.agreedAmount;
        } else if (outwardCar.vendorAgreementType === 'monthly') {
            totalVendorCost = outwardCar.agreementPricePerMonth || 0;
        } else {
            totalVendorCost = (outwardCar.agreementPricePerDay || 0) * totalDaysBooked;
        }
    }

    const carPayments = await VendorTransaction.find({
        vendor: vendorId,
        type: 'Payout',
        status: 'Completed',
        relatedCarType: 'Outward',
        relatedCarId: String(outwardCar._id)
    }).sort({ date: -1 }).lean();
    const totalPaidForCar = carPayments.reduce((sum, txn) => sum + (txn.amount || 0), 0);

    return {
        tripsCount,
        totalRevenue,
        totalVendorCost,
        totalPaidForCar,
        remainingVendorDue: Math.max(totalVendorCost - totalPaidForCar, 0),
        excessPaidForCar: Math.max(totalPaidForCar - totalVendorCost, 0),
        paymentCount: carPayments.length,
        netProfit: totalRevenue - totalVendorCost,
        settlementConfigured: Boolean(outwardCar?.vendorSettlement?.agreedAmount)
    };
};

export const getVendorDirectory = async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 }).lean();
        
        // Find associated cars for each vendor
        const vendorsWithCars = await Promise.all(vendors.map(async (vendor) => {
            // Find in OutwardCar
            const outwardCars = await mongoose.model('OutwardCar').find({
                $or: [
                    { vendorId: vendor._id },
                    { ownerName: { $regex: new RegExp(`^${vendor.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
                ]
            }).lean();

            // Format associated cars list
            const associatedCars = await Promise.all(
                outwardCars.map(async (car) => {
                    const stats = await buildOutwardCarStats(car, vendor._id);
                    return {
                        id: car._id,
                        brand: car.brand,
                        model: car.model,
                        registrationNumber: car.registrationNumber || 'Outward',
                        pricePerDay: car.pricePerDay,
                        agreementPricePerDay: car.agreementPricePerDay || 0,
                        agreementPricePerMonth: car.agreementPricePerMonth || 0,
                        vendorAgreementType: car.vendorAgreementType || 'daily',
                        type: 'Outward',
                        image: car.image || null,
                        netProfit: stats.netProfit,
                        totalRevenue: stats.totalRevenue,
                        tripsCount: stats.tripsCount
                    };
                })
            );

            return {
                ...vendor,
                associatedCars,
                activeCarsCount: associatedCars.length
            };
        }));

        res.json({ success: true, count: vendorsWithCars.length, data: { vendors: vendorsWithCars } });
    } catch (error) {
        console.error('Error fetching vendor directory:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateVendor = async (req, res) => {
    try {
        let updateData = { ...req.body };
        if (req.file) {
            const uploadResult = await uploadImage(req.file, { folder: 'crm/vendors' });
            updateData.profileImage = uploadResult.secure_url;
        }

        const vendor = await Vendor.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, data: { vendor } });
    } catch (error) {
        console.error('Update vendor error:', error);
        res.status(500).json({ success: false, message: 'Server error updating vendor' });
    }
};

export const deleteVendor = async (req, res) => {
    try {
        await Vendor.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Vendor deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting vendor' });
    }
};

export const getVendorSettlements = async (req, res) => {
    try {
        const transactions = await VendorTransaction.find()
            .populate('vendor', 'name isVerified')
            .sort({ date: -1 });

        // Calculate stats
        const stats = await VendorTransaction.aggregate([
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const summary = {
            payouts: stats.find(s => s._id === 'Payout')?.total || 0,
            commissions: stats.find(s => s._id === 'Commission')?.total || 0,
            paidThisMonth: 0 // Logic for current month
        };

        res.json({ success: true, data: { transactions, summary } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getVendorHistory = async (req, res) => {
    try {
        const history = await VendorHistory.find()
            .populate('vendor', 'name')
            .sort({ date: -1 });
        res.json({ success: true, data: { history } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getFleetUtilization = async (req, res) => {
    try {
        // Logic to calculate utilization per vendor-owned car
        // This would involve looking up bookings per car
        const cars = await Car.find({ ownerType: 'Vendor' }).populate('owner', 'name');

        // Mocking structure for now
        const report = cars.map(car => ({
            vendor: car.owner?.name,
            vehicle: `${car.brand} ${car.model}`,
            plates: car.registrationNumber,
            trips: 0,
            revenue: 0,
            utilization: 0
        }));

        res.json({ success: true, data: { report } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Financial Overview (Income Overview Screen)
 * @route   GET /api/crm/finance/income-overview
 */
export const getIncomeOverview = async (req, res) => {
    try {
        const totalRevenue = await Transaction.aggregate([
            { $match: { type: 'Cash In' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const activeRentals = await Booking.countDocuments({ status: 'active' });

        // Weekly Revenue Trend (Last 7 days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const weeklyTrend = await Transaction.aggregate([
            { $match: { type: 'Cash In', date: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dayOfWeek: "$date" },
                    revenue: { $sum: "$amount" }
                }
            }
        ]);

        // Revenue Sources Breakdown
        const sources = await Transaction.aggregate([
            { $match: { type: 'Cash In' } },
            { $group: { _id: "$category", value: { $sum: "$amount" } } }
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue[0]?.total || 0,
                activeRentals,
                avgDailyIncome: (totalRevenue[0]?.total || 0) / 30, // simplified
                weeklyTrend,
                sources
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Expense Tracking Data
 * @route   GET /api/crm/finance/expenses
 */
export const getExpenseTracking = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            { $match: { type: 'Cash Out' } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } }
        ]);

        const totalExpenses = stats.reduce((acc, curr) => acc + curr.total, 0);

        res.json({
            success: true,
            data: {
                totalExpenses,
                breakdown: stats,
                fuelCost: stats.find(s => s._id === 'Fuel')?.total || 0,
                maintenance: stats.find(s => s._id === 'Maintenance')?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Pending Payments (Receivables & Payables)
 * @route   GET /api/crm/finance/pending-payments
 */
export const getPendingPayments = async (req, res) => {
    try {
        const pending = await Invoice.find({ status: 'Pending' }).sort({ dueDate: 1 });
        res.json({ success: true, data: { pending } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const settleInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: 'Settled' }, { new: true });

        // When settled, create a Transaction record
        await Transaction.create({
            type: invoice.type === 'Receivable' ? 'Cash In' : 'Cash Out',
            category: 'Other', // Or link to invoice category
            amount: invoice.amount,
            paymentMethod: 'UPI', // Default for now
            description: `Settlement: ${invoice.title}`,
            referenceId: invoice.referenceId
        });

        res.json({ success: true, data: { invoice } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Profit & Loss Data
 * @route   GET /api/crm/finance/pl-overview
 */
export const getPLOverview = async (req, res) => {
    try {
        const monthlyData = await Transaction.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                    revenue: { $sum: { $cond: [{ $eq: ["$type", "Cash In"] }, "$amount", 0] } },
                    expenses: { $sum: { $cond: [{ $eq: ["$type", "Cash Out"] }, "$amount", 0] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({ success: true, data: { monthlyData } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Cash Flow Trend & Transactions
 * @route   GET /api/crm/finance/cash-flow
 */
export const getCashFlow = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }).limit(20);

        const summary = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    balance: {
                        $sum: { $cond: [{ $eq: ["$type", "Cash In"] }, "$amount", { $subtract: [0, "$amount"] }] }
                    },
                    netCashFlow: {
                        $sum: { $cond: [{ $eq: ["$type", "Cash In"] }, "$amount", { $subtract: [0, "$amount"] }] } // Simplified logic
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                currentBalance: summary[0]?.balance || 0,
                netCashFlow: summary[0]?.netCashFlow || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Daily Operations Report
 * @route   GET /api/crm/reports/daily-operations
 */
export const getDailyOperationsReport = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalBookings = await Booking.countDocuments({ createdAt: { $gte: today } });

        const revenueToday = await Transaction.aggregate([
            { $match: { type: 'Cash In', date: { $gte: today } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const cancellations = await Booking.countDocuments({ status: 'cancelled', updatedAt: { $gte: today } });

        // Hourly Performance (08:00 to 20:00)
        const hourlyPerformance = await Booking.aggregate([
            { $match: { createdAt: { $gte: today } } },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalBookings,
                revenueToday: revenueToday[0]?.total || 0,
                avgTripTime: "4.5 Hrs", // Mocked as specifically requested structure
                cancellations,
                hourlyPerformance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Monthly Performance Report
 * @route   GET /api/crm/reports/monthly-performance
 */
export const getMonthlyPerformance = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Weekly Breakdown (Revenue vs Expenses)
        const weeklyBreakdown = await Transaction.aggregate([
            { $match: { date: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: {
                        week: { $floor: { $divide: [{ $subtract: ["$date", startOfMonth] }, 604800000] } },
                        type: "$type"
                    },
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Revenue Distribution by Service Type
        // Assuming categories in Transaction like 'Rental', 'Chauffeur', 'Subscription'
        const distribution = await Transaction.aggregate([
            { $match: { type: 'Cash In', date: { $gte: startOfMonth } } },
            { $group: { _id: "$category", value: { $sum: "$amount" } } }
        ]);

        res.json({
            success: true,
            data: {
                weeklyBreakdown,
                distribution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Annual Year Report
 * @route   GET /api/crm/reports/annual-review
 */
export const getAnnualReport = async (req, res) => {
    try {
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        const yearlyData = await Transaction.aggregate([
            { $match: { date: { $gte: startOfYear } } },
            {
                $group: {
                    _id: { month: { $month: "$date" } },
                    revenue: { $sum: { $cond: [{ $eq: ["$type", "Cash In"] }, "$amount", 0] } },
                    expenses: { $sum: { $cond: [{ $eq: ["$type", "Cash Out"] }, "$amount", 0] } }
                }
            },
            { $sort: { "_id.month": 1 } }
        ]);

        res.json({ success: true, data: { yearlyData } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Expense Category Management
 */
export const getExpenseCategories = async (req, res) => {
    try {
        let categories = await ExpenseCategory.find();

        // Seed default categories if none exist
        if (categories.length === 0) {
            const defaultCategories = [
                { name: 'Electricity bill', icon: 'electricity', description: 'Monthly electricity bill' },
                { name: 'Petrol/Diesel', icon: 'fuel', description: 'Fuel expenses' },
                { name: 'Water', icon: 'water', description: 'Water supplier bills' },
                { name: 'Repair', icon: 'repair', description: 'Maintenance and repairs' },
                { name: 'Rent', icon: 'rent', description: 'Office/Garage rent' },
                { name: 'Chai/Coffee', icon: 'coffee', description: 'Pantry chai/coffee expenses' },
                { name: 'Food', icon: 'food', description: 'Staff meals or client food' }
            ];
            await ExpenseCategory.insertMany(defaultCategories);
            categories = await ExpenseCategory.find();
        }

        // Populate transaction counts for each category
        const categoriesWithStats = await Promise.all(categories.map(async (cat) => {
            const count = await Transaction.countDocuments({ category: cat.name });
            const adminCount = await Expense.countDocuments({ category: cat.name });
            return {
                ...cat._doc,
                transactionCount: count + adminCount
            };
        }));

        res.json({ success: true, data: { categories: categoriesWithStats } });
    } catch (error) {
        console.error('getExpenseCategories error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createExpenseCategory = async (req, res) => {
    try {
        const category = await ExpenseCategory.create(req.body);
        res.status(201).json({ success: true, data: { category } });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteExpenseCategory = async (req, res) => {
    try {
        await ExpenseCategory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateExpenseCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await ExpenseCategory.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, data: { category } });
    } catch (error) {
        console.error('Update Category Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    City & Location Management
 */
export const getCities = async (req, res) => {
    try {
        const cities = await City.find().sort({ createdAt: -1 });
        res.json({ success: true, count: cities.length, data: { cities } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createCity = async (req, res) => {
    try {
        const city = await City.create(req.body);
        res.status(201).json({ success: true, data: { city } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateCity = async (req, res) => {
    try {
        const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: { city } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteCity = async (req, res) => {
    try {
        await City.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'City deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Smart Command Center - Dashboard Alerts
 * @route   GET /api/crm/dashboard/alerts
 */
export const getDashboardAlerts = async (req, res) => {
    try {
        // Salary Pending
        const salaryPending = await Salary.countDocuments({ status: 'Pending' });

        // Insurance Expiring (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const insuranceExpiring = await CarDocument.countDocuments({
            type: 'Insurance',
            expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
        });

        // Active Accidents
        const activeAccidents = await AccidentCase.countDocuments({ status: 'Active' });

        // Cars Idle > 5 Days
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const idleCars = await Car.countDocuments({
            status: 'Available',
            lastBookingDate: { $lte: fiveDaysAgo }
        });

        // Garage Bills Pending
        const garageBillsPending = await CarExpense.countDocuments({
            category: 'Repair',
            paymentStatus: 'Pending'
        });

        // Vendor Payments Due
        const vendorPaymentsDue = await VendorTransaction.countDocuments({
            type: 'Payout',
            status: 'Processing'
        });

        res.json({
            success: true,
            data: {
                alerts: [
                    {
                        title: 'Salary Pending',
                        description: 'Staff members awaiting payment',
                        count: salaryPending,
                        type: 'warning',
                        action: 'payroll'
                    },
                    {
                        title: 'Insurance Expiring',
                        description: 'Renew before 5th Jan',
                        count: insuranceExpiring,
                        type: 'warning',
                        action: 'documents'
                    },
                    {
                        title: 'Active Accidents',
                        description: '2 cases in recovery tracking',
                        count: activeAccidents,
                        type: 'error',
                        action: 'accidents'
                    },
                    {
                        title: 'Car Idle > 5 Days',
                        description: 'Assign them to new bookings',
                        count: idleCars,
                        type: 'info',
                        action: 'cars'
                    },
                    {
                        title: 'Garage Bill Pending',
                        description: 'Check Active Repairs',
                        count: garageBillsPending,
                        type: 'warning',
                        action: 'garage'
                    },
                    {
                        title: 'Vendor Payment Due',
                        description: `Rs. 15,000 pending for Garage A`,
                        count: vendorPaymentsDue,
                        type: 'error',
                        action: 'vendors'
                    }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Staff Monthly Payroll Details
 * @route   GET /api/crm/staff/:id/payroll
 * @access  Admin
 */
export const getStaffPayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        // Default to current month/year if not provided
        const now = new Date();
        const targetMonth = month !== undefined ? parseInt(month) : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();

        const staff = await Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        let baseSalary = staff.salary || 0;
        let completedTripsCount = 0;

        const isDriverRole = staff.role && (staff.role.toLowerCase() === 'driver' || staff.role.toLowerCase().includes('driver'));

        if (isDriverRole) {
            const startOfMonth = new Date(targetYear, targetMonth, 1);
            const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            completedTripsCount = await mongoose.model('Booking').countDocuments({
                assignedDriver: staff._id,
                $or: [
                    { status: 'completed' },
                    { tripStatus: 'completed' }
                ],
                $or: [
                    { completedAt: { $gte: startOfMonth, $lte: endOfMonth } },
                    { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
                ]
            });

            if (staff.salaryMethod === 'Per Trip') {
                baseSalary = completedTripsCount * (staff.salary || 0);
            }
        }

        // Calculate total days in the month
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // Calculate working days (set to total days in month)
        let workingDays = daysInMonth;

        // Calculations
        // Per Day Salary (Base / Days in Month) - Do not round
        const perDaySalary = daysInMonth > 0 ? (baseSalary / daysInMonth) : 0;

        // Half Day Salary (Per Day / 2) - Do not round
        const halfDaySalary = perDaySalary / 2;

        // Fetch Attendance Records
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        const records = await Attendance.find({
            staff: id,
            date: { $gte: startDate, $lte: endDate }
        });

        // Fetch Holidays
        const holidaysSetting = await Setting.findOne({ key: 'holidays' });
        const holidaysList = holidaysSetting ? holidaysSetting.value : [];
        const holidaysMap = {};
        if (holidaysList && Array.isArray(holidaysList)) {
            holidaysList.forEach(h => {
                holidaysMap[h.date] = h.reason;
            });
        }

        // Get global settings for fallback deductions
        let globalSettings = await Setting.findOne({ key: 'attendance_settings' });
        const globalAbsentDeduction = globalSettings?.value?.absentDeduction || 0;
        const globalHalfDayDeduction = globalSettings?.value?.halfDayDeduction || 0;
        const globalFreeLeavesPerMonth = globalSettings?.value?.freeLeavesPerMonth !== undefined ? globalSettings.value.freeLeavesPerMonth : 0;

        // Compute days from records
        let presentCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
        let notJoinedCount = 0;
        let pendingCount = 0;
        let extraWorkAmount = 0;
        let totalExtraMinutes = 0;

        // Helper to parse "Xh Ym"
        const parseWorkHours = (str) => {
            if (!str) return 0;
            const match = str.match(/(\d+)h\s*(\d+)m/);
            if (!match) {
                // Try just hours if format differs
                const hoursMatch = str.match(/(\d+)h/);
                if (hoursMatch) return parseInt(hoursMatch[1]) * 60;
                return 0;
            }
            return (parseInt(match[1]) * 60) + parseInt(match[2]);
        };

        const recordsMap = {};
        records.forEach(r => {
            const day = new Date(r.date).getDate();
            recordsMap[day] = r;
        });

        const dailyLogs = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(targetYear, targetMonth, day);
            const dayOfWeek = date.getDay(); // 0 = Sunday
            const record = recordsMap[day];

            let computedStatus = 'Absent';
            let workHours = '-';
            let inTime = '-';
            let outTime = '-';

            const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHoliday = holidaysMap[dateString];

            const compDate = new Date(targetYear, targetMonth, day);
            compDate.setHours(0,0,0,0);

            const joinDate = staff.joiningDate || staff.joinDate || staff.createdAt || new Date();
            const startOfJoin = new Date(joinDate);
            startOfJoin.setHours(0,0,0,0);

            const isBeforeJoin = compDate < startOfJoin;

            if (isBeforeJoin) {
                computedStatus = 'Not Joined';
                if (dayOfWeek !== 0) {
                    notJoinedCount++;
                }
            } else if (isHoliday) {
                computedStatus = 'Holiday';
                if (record) {
                    const durationMinutes = parseWorkHours(record.workHours);
                    workHours = record.workHours || '-';
                    inTime = record.inTime || '-';
                    outTime = record.outTime || '-';

                    if (durationMinutes > 540) { // > 9 hours
                        const extraMinutes = durationMinutes - 540;
                        totalExtraMinutes += extraMinutes;

                        // Overtime Rate: (Per Day Salary / 9 hours / 60 minutes) per minute
                        const perMinuteRate = (perDaySalary / 9) / 60;
                        extraWorkAmount += (extraMinutes * perMinuteRate);
                    }
                }
            } else if (dayOfWeek === 0) {
                computedStatus = 'Weekend';
            } else {
                if (record) {
                    const durationMinutes = parseWorkHours(record.workHours);
                    let status = record.status;
                    workHours = record.workHours || '-';
                    inTime = record.inTime || '-';
                    outTime = record.outTime || '-';

                    // Dynamic Status & Overtime Calculation
                    if (status !== 'Absent' && durationMinutes > 0) {
                        if (durationMinutes > 540) { // > 9 hours
                            // Overtime logic
                            const extraMinutes = durationMinutes - 540;
                            totalExtraMinutes += extraMinutes;

                            // Overtime Rate: (Per Day Salary / 9 hours / 60 minutes) per minute
                            const perMinuteRate = (perDaySalary / 9) / 60;
                            extraWorkAmount += (extraMinutes * perMinuteRate);

                            status = 'Present';
                        } else if (durationMinutes < 270) { // < 4.5 hours
                            status = 'Half Day';
                        } else {
                            status = 'Present';
                        }
                    }

                    if (status === 'Present' || status === 'Late') {
                        presentCount++;
                        computedStatus = status;
                    } else if (status === 'Half Day') {
                        halfDayCount++;
                        computedStatus = 'Half Day';
                    } else if (status === 'Leave') {
                        leaveCount++;
                        computedStatus = 'Leave';
                    } else {
                        absentCount++;
                        computedStatus = 'Absent';
                    }
                } else {
                    // Not a Sunday and no record = Absent (if past day) or Pending (if future/today)
                    const todayDate = new Date();
                    todayDate.setHours(0,0,0,0);

                    if (compDate < todayDate) {
                        absentCount++;
                        computedStatus = 'Absent';
                    } else {
                        computedStatus = 'Pending';
                        if (dayOfWeek !== 0) {
                            pendingCount++;
                        }
                    }
                }
            }

            dailyLogs.push({
                day,
                status: computedStatus,
                isWeekend: dayOfWeek === 0,
                inTime,
                outTime,
                workHours,
                holidayReason: isHoliday || undefined
            });
        }

        // Priority: staff-specific override → global setting flat rate → per-day salary
        const absentRate = (staff.absentDeduction && staff.absentDeduction > 0)
            ? staff.absentDeduction
            : (globalAbsentDeduction > 0 ? globalAbsentDeduction : perDaySalary);
        const halfDayRate = (staff.halfDayDeduction && staff.halfDayDeduction > 0)
            ? staff.halfDayDeduction
            : (globalHalfDayDeduction > 0 ? globalHalfDayDeduction : halfDaySalary);

        let absentDeduction = absentCount * absentRate;
        let halfDayDeduction = halfDayCount * halfDayRate;
        const billableLeaves = Math.max(0, leaveCount - globalFreeLeavesPerMonth);
        // Leave deduction uses same flat rate as absent (from settings)
        let leaveDeduction = billableLeaves * absentRate;
        let notJoinedDeduction = 0;
        let pendingDeduction = 0;

        if (isDriverRole && staff.salaryMethod === 'Per Trip') {
            absentDeduction = 0;
            halfDayDeduction = 0;
            leaveDeduction = 0;
            notJoinedDeduction = 0;
            pendingDeduction = 0;
        }

        const netPayable = baseSalary - absentDeduction - halfDayDeduction - leaveDeduction - notJoinedDeduction - pendingDeduction + extraWorkAmount;

        // Check if salary already paid for this month
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthString = `${monthNames[targetMonth]} ${targetYear}`;

        const salaryRecord = await Salary.findOne({ staff: id, month: monthString });

        let paidAmount = 0;
        let salaryStatus = 'Pending';
        let remainingAmount = netPayable;
        let finalAbsentDeduction = absentDeduction;
        let finalHalfDayDeduction = halfDayDeduction;
        let finalLeaveDeduction = leaveDeduction;
        let finalNotJoinedDeduction = notJoinedDeduction;
        let finalPendingDeduction = pendingDeduction;
        let finalExtraWorkAmount = extraWorkAmount;
        let finalTotalNetPayable = netPayable;

        if (salaryRecord) {
            paidAmount = salaryRecord.netPay || 0;
            salaryStatus = salaryRecord.status || 'Pending';

            if (salaryStatus === 'Paid') {
                remainingAmount = Math.max(0, netPayable - paidAmount);
                finalAbsentDeduction = salaryRecord.deductions || 0;
                finalHalfDayDeduction = 0;
                finalLeaveDeduction = 0;
                finalNotJoinedDeduction = 0;
                finalPendingDeduction = 0;
                finalExtraWorkAmount = 0;
                finalTotalNetPayable = salaryRecord.netPay;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                baseSalary,
                daysInMonth: daysInMonth, // actual days of the month (e.g. 31)
                workingDays: workingDays, // working days (excluding Sundays, e.g. 26)
                presentDays: presentCount,
                halfDays: halfDayCount,
                absentDays: absentCount,
                leaveDays: leaveCount,
                freeLeavesPerMonth: globalFreeLeavesPerMonth,
                billableLeaveDays: Math.max(0, leaveCount - globalFreeLeavesPerMonth),
                perDaySalary,
                halfDaySalary,
                absentDeduction: finalAbsentDeduction,
                halfDayDeduction: finalHalfDayDeduction,
                leaveDeduction: finalLeaveDeduction,
                notJoinedDeduction: finalNotJoinedDeduction,
                pendingDeduction: finalPendingDeduction,
                extraWorkAmount: finalExtraWorkAmount,
                netPayable: remainingAmount,
                totalNetPayable: finalTotalNetPayable,
                paidAmount,
                salaryStatus,
                month: targetMonth,
                year: targetYear,
                totalExtraMinutes,
                dailyLogs
            }
        });
    } catch (error) {
        console.error('Get Staff Payroll Error:', error);
        res.status(500).json({ success: false, message: 'Server error calculating payroll' });
    }
};

/**
 * @desc    Create Razorpay Order for Staff Salary
 * @route   POST /api/crm/staff/salary/create-order
 * @access  Admin
 */
export const createSalaryPaymentOrder = async (req, res) => {
    try {
        const { amount, staffId, month, year, description } = req.body;

        if (!amount || !staffId) {
            return res.status(400).json({ success: false, message: 'Amount and Staff ID are required' });
        }

        // Generate transaction ID
        const transactionId = razorpayService.generateTransactionId('SAL');

        // Create Razorpay order
        const order = await razorpayService.createOrder({
            amount: parseFloat(amount),
            receipt: `sal_${staffId.slice(-4)}_${Date.now()}`,
            notes: {
                staff_id: staffId,
                month: month,
                year: year,
                transaction_id: transactionId,
                payment_type: 'staff_salary',
                description: description || 'Staff Salary Payment'
            }
        });

        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                transactionId,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('Create Salary Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

/**
 * @desc    Verify Salary Payment
 * @route   POST /api/crm/staff/salary/verify
 * @access  Admin
 */
export const verifySalaryPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            staffId,
            amount,
            month,
            year,
            baseSalary,
            deductions,
            bonus,
            note
        } = req.body;

        // Verify signature
        const isValid = razorpayService.verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Format month string, e.g., "January 2024"
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        // Handle month as number (0-11) or string
        let monthName = month;
        if (!isNaN(month) && parseInt(month) >= 0 && parseInt(month) <= 11) {
            monthName = monthNames[parseInt(month)];
        }
        const monthString = `${monthName} ${year}`;

        // Create or Update Salary Record
        // Check if record exists
        let payroll = await Salary.findOne({ staff: staffId, month: monthString });

        const transactionData = {
            transactionId: req.body.transaction_id || razorpayService.generateTransactionId('SAL'),
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: amount,
            status: 'success',
            paymentMethod: 'razorpay',
            paymentDate: new Date()
        };

        if (payroll) {
            payroll.status = 'Paid';
            payroll.paidDate = new Date();
            payroll.netPay = amount;
            payroll.deductions = deductions || 0;
            payroll.bonus = bonus || 0;
            payroll.note = note || '';
            // Push new transaction
            payroll.transactions.push(transactionData);
            await payroll.save();
        } else {
            payroll = await Salary.create({
                staff: staffId,
                month: monthString,
                baseSalary: baseSalary || amount,
                deductions: deductions || 0,
                bonus: bonus || 0,
                note: note || '',
                netPay: amount,
                status: 'Paid',
                paidDate: new Date(),
                transactions: [transactionData]
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully and payroll recorded',
            data: payroll
        });

        // Send real-time notification to employee (async, don't block response)
        createNotification({
            recipient: staffId,
            recipientModel: 'Staff',
            title: 'Salary Credited!',
            message: `Your salary of ₹${parseFloat(amount).toLocaleString('en-IN')} for ${monthString} has been processed successfully.`,
            type: 'salary_paid',
            relatedId: payroll._id,
            relatedModel: 'Salary',
            sendPush: true
        }).catch(err => console.error('❌ Failed to send salary notification:', err));

    } catch (error) {
        console.error('Verify Salary Payment Error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

/**
 * @desc    Get Monthly Calculated Payroll for All Active Staff
 * @route   GET /api/crm/payroll/calculate
 * @access  Admin
 */
export const getMonthlyCalculatedPayroll = async (req, res) => {
    try {
        const { month, year } = req.query;

        // Default to current month/year if not provided
        const now = new Date();
        const targetMonth = month !== undefined ? parseInt(month) : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();

        // Calculate the end of the target month
        const endOfMonthDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        // Get all active/on-duty/leave staff members (exclude resigned/deleted)
        let staffMembers = await Staff.find({ isDeleted: false, status: { $ne: 'Inactive' } });

        // Filter out employees who joined after the target month
        staffMembers = staffMembers.filter(staff => {
            const joinDate = staff.joiningDate || staff.joinDate || staff.createdAt;
            return joinDate <= endOfMonthDate;
        });

        // Get global settings for fallback deductions
        let globalSettings = await Setting.findOne({ key: 'attendance_settings' });
        const globalAbsentDeduction = globalSettings?.value?.absentDeduction || 0;
        const globalHalfDayDeduction = globalSettings?.value?.halfDayDeduction || 0;
        const globalOvertimeRate = globalSettings?.value?.overtimeRate || 0;
        const globalFreeLeavesPerMonth = globalSettings?.value?.freeLeavesPerMonth !== undefined ? globalSettings.value.freeLeavesPerMonth : 0;

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const monthString = `${monthNames[targetMonth]} ${targetYear}`;

        // Fetch Holidays
        const holidaysSetting = await Setting.findOne({ key: 'holidays' });
        const holidaysList = holidaysSetting ? holidaysSetting.value : [];
        const holidaysMap = {};
        if (holidaysList && Array.isArray(holidaysList)) {
            holidaysList.forEach(h => {
                holidaysMap[h.date] = h.reason;
            });
        }

        const parseWorkHours = (str) => {
            if (!str) return 0;
            const match = str.match(/(\d+)h\s*(\d+)m/);
            if (!match) {
                const hoursMatch = str.match(/(\d+)h/);
                if (hoursMatch) return parseInt(hoursMatch[1]) * 60;
                return 0;
            }
            return (parseInt(match[1]) * 60) + parseInt(match[2]);
        };

        const payrolls = [];

        for (const staff of staffMembers) {
            let baseSalary = staff.salary || 0;
            let completedTripsCount = 0;

            const isDriverRole = staff.role && (staff.role.toLowerCase() === 'driver' || staff.role.toLowerCase().includes('driver'));

            if (isDriverRole) {
                const startOfMonth = new Date(targetYear, targetMonth, 1);
                const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
                completedTripsCount = await mongoose.model('Booking').countDocuments({
                    assignedDriver: staff._id,
                    $or: [
                        { status: 'completed' },
                        { tripStatus: 'completed' }
                    ],
                    $or: [
                        { completedAt: { $gte: startOfMonth, $lte: endOfMonth } },
                        { createdAt: { $gte: startOfMonth, $lte: endOfMonth } }
                    ]
                });

                if (staff.salaryMethod === 'Per Trip') {
                    baseSalary = completedTripsCount * (staff.salary || 0);
                }
            }

            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

            // Calculate working days (set to total days in month)
            let workingDays = daysInMonth;

            // Calculations
            const perDaySalary = daysInMonth > 0 ? (baseSalary / daysInMonth) : 0;
            const halfDaySalary = perDaySalary / 2;

            // Fetch Attendance Records
            const startDate = new Date(targetYear, targetMonth, 1);
            const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

            const records = await Attendance.find({
                staff: staff._id,
                date: { $gte: startDate, $lte: endDate }
            });

            // Compute days from records
            let presentCount = 0;
            let halfDayCount = 0;
            let absentCount = 0;
            let leaveCount = 0;
            let notJoinedCount = 0;
            let pendingCount = 0;
            let extraWorkAmount = 0;
            let totalExtraMinutes = 0;

            const recordsMap = {};
            records.forEach(r => {
                const day = new Date(r.date).getDate();
                recordsMap[day] = r;
            });

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(targetYear, targetMonth, day);
                const dayOfWeek = date.getDay(); // 0 = Sunday
                const record = recordsMap[day];

                const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isHoliday = holidaysMap[dateString];

                const compDate = new Date(targetYear, targetMonth, day);
                compDate.setHours(0,0,0,0);

                const joinDate = staff.joiningDate || staff.joinDate || staff.createdAt || new Date();
                const startOfJoin = new Date(joinDate);
                startOfJoin.setHours(0,0,0,0);

                const isBeforeJoin = compDate < startOfJoin;

                if (isBeforeJoin) {
                    if (dayOfWeek !== 0) {
                        notJoinedCount++;
                    }
                    continue;
                }

                if (isHoliday) {
                    if (record) {
                        const durationMinutes = parseWorkHours(record.workHours);
                        if (durationMinutes > 540) { // > 9 hours
                            const extraMinutes = durationMinutes - 540;
                            totalExtraMinutes += extraMinutes;
                            
                            // Use custom staff overtime rate or proportional
                            const overtimeRate = staff.overtimeRate || globalOvertimeRate || ((perDaySalary / 9) / 60);
                            extraWorkAmount += (extraMinutes * overtimeRate);
                        }
                    }
                    continue; // Skip holiday from any absent/half-day deductions!
                }

                if (dayOfWeek === 0) {
                    continue; // Skip weekends in calculation
                }

                if (record) {
                    const durationMinutes = parseWorkHours(record.workHours);
                    let status = record.status;

                    if (status !== 'Absent' && durationMinutes > 0) {
                        if (durationMinutes > 540) { // > 9 hours
                            const extraMinutes = durationMinutes - 540;
                            totalExtraMinutes += extraMinutes;
                            
                            // Use custom staff overtime rate or proportional
                            const overtimeRate = staff.overtimeRate || globalOvertimeRate || ((perDaySalary / 9) / 60);
                            extraWorkAmount += (extraMinutes * overtimeRate);
                            status = 'Present';
                        } else if (durationMinutes < 270) {
                            status = 'Half Day';
                        } else {
                            status = 'Present';
                        }
                    }

                    if (status === 'Present' || status === 'Late') {
                        presentCount++;
                    } else if (status === 'Half Day') {
                        halfDayCount++;
                    } else if (status === 'Leave') {
                        leaveCount++;
                    } else {
                        absentCount++;
                    }
                } else {
                    const todayDate = new Date();
                    todayDate.setHours(0,0,0,0);

                    if (compDate < todayDate) {
                        absentCount++;
                    } else {
                        if (dayOfWeek !== 0) {
                            pendingCount++;
                        }
                    }
                }
            }

            // Deductions logic
            // Priority: staff-specific override → global setting flat rate → per-day salary
            const absentRate = (staff.absentDeduction && staff.absentDeduction > 0)
                ? staff.absentDeduction
                : (globalAbsentDeduction > 0 ? globalAbsentDeduction : perDaySalary);
            const halfDayRate = (staff.halfDayDeduction && staff.halfDayDeduction > 0)
                ? staff.halfDayDeduction
                : (globalHalfDayDeduction > 0 ? globalHalfDayDeduction : halfDaySalary);

            let absentDeduction = absentCount * absentRate;
            let halfDayDeduction = halfDayCount * halfDayRate;
            const billableLeaves = Math.max(0, leaveCount - globalFreeLeavesPerMonth);
            // Leave deduction uses same flat rate as absent (from settings)
            let leaveDeduction = billableLeaves * absentRate;
            let notJoinedDeduction = 0;
            let pendingDeduction = 0;

            if (isDriverRole && staff.salaryMethod === 'Per Trip') {
                absentDeduction = 0;
                halfDayDeduction = 0;
                leaveDeduction = 0;
                notJoinedDeduction = 0;
                pendingDeduction = 0;
            }

            const totalNetPayable = baseSalary - absentDeduction - halfDayDeduction - leaveDeduction - notJoinedDeduction - pendingDeduction + extraWorkAmount;

            // Check saved payroll record
            const salaryRecord = await Salary.findOne({ staff: staff._id, month: monthString });

            let paidAmount = 0;
            let salaryStatus = 'Pending';
            let remainingAmount = totalNetPayable;
            let bonus = 0;
            let note = '';
            let paidDate = null;
            let transactionId = '-';
            let paymentMethod = '-';
            let bankName, accountNumber, ifscCode, upiId;

            let finalAbsentDeduction = absentDeduction;
            let finalHalfDayDeduction = halfDayDeduction;
            let finalLeaveDeduction = leaveDeduction;
            let finalNotJoinedDeduction = notJoinedDeduction;
            let finalPendingDeduction = pendingDeduction;
            let finalExtraWorkAmount = extraWorkAmount;
            let finalTotalNetPayable = totalNetPayable;

            if (salaryRecord) {
                paidAmount = salaryRecord.netPay || 0;
                salaryStatus = salaryRecord.status || 'Pending';
                bonus = salaryRecord.bonus || 0;
                note = salaryRecord.note || '';
                paidDate = salaryRecord.paidDate || null;

                if (salaryRecord.transactions && salaryRecord.transactions.length > 0) {
                    const successTx = salaryRecord.transactions.find(t => t.status === 'success') || salaryRecord.transactions[0];
                    transactionId = successTx.transactionId || '-';
                    paymentMethod = successTx.paymentMethod || '-';
                    bankName = successTx.bankName;
                    accountNumber = successTx.accountNumber;
                    ifscCode = successTx.ifscCode;
                    upiId = successTx.upiId;
                }

                if (salaryStatus === 'Paid') {
                    remainingAmount = Math.max(0, totalNetPayable + bonus - paidAmount);
                    finalAbsentDeduction = salaryRecord.deductions || 0;
                    finalHalfDayDeduction = 0;
                    finalLeaveDeduction = 0;
                    finalNotJoinedDeduction = 0;
                    finalPendingDeduction = 0;
                    finalExtraWorkAmount = 0;
                    finalTotalNetPayable = salaryRecord.netPay;
                }
            }

            payrolls.push({
                staffId: staff._id,
                name: staff.name,
                role: staff.role,
                salaryMethod: staff.salaryMethod || 'Monthly',
                completedTrips: completedTripsCount,
                department: staff.department,
                phone: staff.phone,
                email: staff.email,
                baseSalary,
                daysInMonth,
                workingDays,
                presentDays: presentCount,
                halfDays: halfDayCount,
                absentDays: absentCount,
                leaveDays: leaveCount,
                freeLeavesPerMonth: globalFreeLeavesPerMonth,
                billableLeaveDays: Math.max(0, leaveCount - globalFreeLeavesPerMonth),
                absentDeduction: finalAbsentDeduction,
                halfDayDeduction: finalHalfDayDeduction,
                leaveDeduction: finalLeaveDeduction,
                notJoinedDeduction: finalNotJoinedDeduction,
                pendingDeduction: finalPendingDeduction,
                extraWorkAmount: finalExtraWorkAmount,
                totalNetPayable: finalTotalNetPayable,
                netPayable: remainingAmount,
                paidAmount,
                salaryStatus,
                month: targetMonth,
                year: targetYear,
                monthString,
                bonus,
                note,
                paidDate,
                transactionId,
                paymentMethod,
                bankName,
                accountNumber,
                ifscCode,
                upiId
            });
        }

        res.status(200).json({
            success: true,
            data: { payrolls }
        });
    } catch (error) {
        console.error('Calculate monthly payrolls error:', error);
        res.status(500).json({ success: false, message: 'Server error calculating monthly payrolls' });
    }
};

/**
 * @desc    Record Manual Salary Payment
 * @route   POST /api/crm/staff/salary/manual-pay
 * @access  Admin
 */
export const recordManualSalaryPayment = async (req, res) => {
    try {
        const {
            staffId,
            amount,
            month,
            year,
            baseSalary,
            deductions,
            bonus,
            note,
            paymentMethod,
            bankName,
            accountNumber,
            ifscCode,
            upiId
        } = req.body;

        if (!staffId || !amount || !month || !year) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Format month string
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        let monthName = month;
        if (!isNaN(month) && parseInt(month) >= 0 && parseInt(month) <= 11) {
            monthName = monthNames[parseInt(month)];
        }
        const monthString = `${monthName} ${year}`;

        // Create transaction log
        const transactionId = razorpayService.generateTransactionId('SAL');
        const transactionData = {
            transactionId: transactionId,
            amount: parseFloat(amount),
            status: 'success',
            paymentMethod: paymentMethod || 'manual',
            bankName: bankName || undefined,
            accountNumber: accountNumber || undefined,
            ifscCode: ifscCode || undefined,
            upiId: upiId || undefined,
            paymentDate: new Date()
        };

        // Create or Update Salary Record
        let payroll = await Salary.findOne({ staff: staffId, month: monthString });

        if (payroll) {
            payroll.status = 'Paid';
            payroll.paidDate = new Date();
            payroll.netPay = parseFloat(amount);
            payroll.deductions = parseFloat(deductions) || 0;
            payroll.bonus = parseFloat(bonus) || 0;
            payroll.note = note || '';
            payroll.transactions.push(transactionData);
            await payroll.save();
        } else {
            payroll = await Salary.create({
                staff: staffId,
                month: monthString,
                baseSalary: parseFloat(baseSalary) || parseFloat(amount),
                deductions: parseFloat(deductions) || 0,
                bonus: parseFloat(bonus) || 0,
                note: note || '',
                netPay: parseFloat(amount),
                status: 'Paid',
                paidDate: new Date(),
                transactions: [transactionData]
            });
        }

        res.status(200).json({
            success: true,
            message: 'Manual payment recorded successfully',
            data: payroll
        });

        // Send real-time notification to employee (async)
        createNotification({
            recipient: staffId,
            recipientModel: 'Staff',
            title: 'Salary Credited!',
            message: `Your salary of ₹${parseFloat(amount).toLocaleString('en-IN')} for ${monthString} has been paid via ${paymentMethod || 'manual mode'}.`,
            type: 'salary_paid',
            relatedId: payroll._id,
            relatedModel: 'Salary',
            sendPush: true
        }).catch(err => console.error('❌ Failed to send salary notification:', err));

    } catch (error) {
        console.error('Record Manual Salary Payment Error:', error);
        res.status(500).json({ success: false, message: 'Server error recording manual payment' });
    }
};

/**
 * @desc    Get Vendor Ledger - Car Profitability + Payment History
 * @route   GET /api/crm/vendors/:id/ledger
 * @access  Admin
 */
export const getVendorLedger = async (req, res) => {
    try {
        const { id } = req.params;

        const vendor = await Vendor.findById(id).lean();
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Step 1: Find associated Outward cars
        const outwardCars = await mongoose.model('OutwardCar').find({
            $or: [
                { vendorId: vendor._id },
                { ownerName: { $regex: new RegExp(`^${vendor.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } }
            ]
        }).lean();

        // Step 3: Build Outward car profitability list
        const carsWithStats = await Promise.all(
            outwardCars.map(async (car) => {
                const stats = await buildOutwardCarStats(car, id);
                return {
                    id: car._id,
                    brand: car.brand,
                    model: car.model,
                    registrationNumber: car.registrationNumber || 'N/A',
                    type: 'Outward',
                    vendorCost: stats.totalVendorCost,
                    agreedAmountConfigured: Boolean(car.vendorSettlement?.agreedAmount),
                    settlementNotes: car.vendorSettlement?.notes || '',
                    image: car.image || null,
                    agreementPricePerDay: car.agreementPricePerDay || 0,
                    agreementPricePerMonth: car.agreementPricePerMonth || 0,
                    vendorAgreementType: car.vendorAgreementType || 'daily',
                    ...stats
                };
            })
        );

        // Step 4: Fetch Payment Ledger (VendorTransactions)
        const transactions = await VendorTransaction.find({ vendor: id })
            .sort({ date: -1 })
            .lean();

        // Step 5: Compute summary
        const totalPaid = transactions
            .filter(t => t.type === 'Payout' && t.status === 'Completed')
            .reduce((sum, t) => sum + t.amount, 0);

        const paymentMethodBreakdown = transactions
            .filter(t => t.type === 'Payout' && t.status === 'Completed')
            .reduce((acc, txn) => {
                const remarks = txn.remarks || '';
                const match = remarks.match(/^\[(\w+)\]/);
                const method = match?.[1] === 'Online' ? 'Online' : 'Cash';

                if (!acc[method]) {
                    acc[method] = { amount: 0, count: 0 };
                }

                acc[method].amount += txn.amount || 0;
                acc[method].count += 1;
                return acc;
            }, { Cash: { amount: 0, count: 0 }, Online: { amount: 0, count: 0 } });

        const totalRevenue = carsWithStats.reduce((sum, c) => sum + c.totalRevenue, 0);
        const totalVendorCost = carsWithStats.reduce((sum, c) => sum + c.totalVendorCost, 0);
        const outstandingBalance = Math.max(totalVendorCost - totalPaid, 0);
        const excessPaid = Math.max(totalPaid - totalVendorCost, 0);
        const totalCarWisePaid = carsWithStats.reduce((sum, c) => sum + (c.totalPaidForCar || 0), 0);

        res.json({
            success: true,
            data: {
                vendor: { id: vendor._id, name: vendor.name, type: vendor.type, profileImage: vendor.profileImage },
                cars: carsWithStats,
                transactions,
                summary: {
                    totalCars: carsWithStats.length,
                    totalTrips: carsWithStats.reduce((sum, c) => sum + c.tripsCount, 0),
                    totalRevenue,
                    totalVendorCost,
                    totalPaid,
                    outstandingBalance,
                    excessPaid,
                    paymentMethodBreakdown,
                    totalPaymentsRecorded: transactions.length,
                    totalCarWisePaid,
                    netProfit: totalRevenue - totalVendorCost
                }
            }
        });
    } catch (error) {
        console.error('Get Vendor Ledger Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching vendor ledger' });
    }
};

/**
 * @desc    Get individual trip details for an outward car
 * @route   GET /api/crm/vendors/:vendorId/cars/outward/:carId/trips
 * @access  Admin
 */
export const getCarTripDetails = async (req, res) => {
    try {
        const { vendorId, carId } = req.params;

        const outwardCar = await mongoose.model('OutwardCar').findById(carId).lean();
        if (!outwardCar) {
            return res.status(404).json({ success: false, message: 'Car not found' });
        }

        const trips = [];

        // 1. Manual outward bookings from fleet portal
        const outwardBookings = await mongoose.model('OutwardBooking').find({
            carId: outwardCar.originalOutputId,
            status: { $ne: 'cancelled' }
        }).lean();

        outwardBookings.forEach(b => {
            const from = new Date(b.fromDate);
            const to = new Date(b.toDate);
            const days = Math.ceil((to - from) / (1000 * 3600 * 24)) || 1;
            const adminRevenue = b.totalPrice || (outwardCar.pricePerDay || 0) * days;
            const vendorCost = outwardCar.vendorAgreementType === 'monthly'
                ? 0
                : (outwardCar.agreementPricePerDay || 0) * days;

            trips.push({
                bookingId: b.bookingId || b._id,
                source: 'Fleet (Manual)',
                fromDate: b.fromDate,
                toDate: b.toDate,
                days,
                adminRevenue,
                vendorCost,
                profit: adminRevenue - vendorCost,
                status: b.status
            });
        });

        // 2. Standard customer bookings (shadow car)
        const shadowCar = await mongoose.model('Car').findOne({ outwardCarId: outwardCar.originalOutputId }).lean();
        if (shadowCar) {
            const regularBookings = await mongoose.model('Booking').find({
                car: shadowCar._id,
                status: { $in: ['confirmed', 'active', 'completed'] }
            }).lean();

            regularBookings.forEach(b => {
                const days = b.totalDays || 1;
                const adminRevenue = b.pricing?.totalPrice || (outwardCar.pricePerDay || 0) * days;
                const vendorCost = outwardCar.vendorAgreementType === 'monthly'
                    ? 0
                    : (outwardCar.agreementPricePerDay || 0) * days;

                trips.push({
                    bookingId: b.bookingId || b._id,
                    source: 'Customer Booking',
                    fromDate: b.tripStart?.date,
                    toDate: b.tripEnd?.date,
                    days,
                    adminRevenue,
                    vendorCost,
                    profit: adminRevenue - vendorCost,
                    status: b.status
                });
            });
        }

        // Sort by date desc
        trips.sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));

        res.json({ success: true, data: { trips, car: { brand: outwardCar.brand, model: outwardCar.model, vendorAgreementType: outwardCar.vendorAgreementType } } });
    } catch (error) {
        console.error('Get Car Trip Details Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching trip details' });
    }
};
export const updateVendorCarSettlement = async (req, res) => {
    try {
        const { vendorId, carType, carId } = req.params;
        const { agreedAmount, notes } = req.body;

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        if (agreedAmount === undefined || Number(agreedAmount) < 0) {
            return res.status(400).json({ success: false, message: 'Valid agreed amount is required' });
        }

        const normalizedType = String(carType || '').toLowerCase();
        const Model = normalizedType === 'outward' ? mongoose.model('OutwardCar') : mongoose.model('Car');
        const car = await Model.findById(carId);

        if (!car) {
            return res.status(404).json({ success: false, message: 'Car not found' });
        }

        car.vendorSettlement = {
            agreedAmount: Number(agreedAmount),
            notes: notes?.trim() || '',
            updatedAt: new Date()
        };

        await car.save();

        await VendorHistory.create({
            vendor: vendorId,
            action: 'Settlement Updated',
            detail: `Hidden agreed amount updated for ${car.brand} ${car.model}`,
            status: 'Completed'
        });

        res.json({
            success: true,
            data: {
                carId: car._id,
                carType: normalizedType === 'outward' ? 'Outward' : 'Inward',
                vendorSettlement: car.vendorSettlement
            }
        });
    } catch (error) {
        console.error('Update Vendor Car Settlement Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating vendor settlement' });
    }
};

/**
 * @desc    Record a new Vendor Payout Payment
 * @route   POST /api/crm/vendors/:id/payments
 * @access  Admin
 */
export const recordVendorPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod, referenceId, remarks, relatedCarId, relatedCarType, relatedCarLabel } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        // Auto-generate referenceId if not provided
        const refId = referenceId?.trim() || `VPY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Store payment method in remarks for historical tracking
        const fullRemarks = `[${paymentMethod || 'Cash'}] ${remarks || ''}`.trim();

        const transaction = await VendorTransaction.create({
            vendor: id,
            amount: parseFloat(amount),
            type: 'Payout',
            status: 'Completed',
            referenceId: refId,
            remarks: fullRemarks,
            relatedCarId: relatedCarId ? String(relatedCarId) : undefined,
            relatedCarType: relatedCarId ? (relatedCarType || 'General') : 'General',
            relatedCarLabel: relatedCarLabel?.trim() || undefined
        });

        // Also log vendor history
        await VendorHistory.create({
            vendor: id,
            action: 'Payout',
            detail: `Payment of ₹${amount} via ${paymentMethod || 'Cash'}. Ref: ${refId}`,
            status: 'Completed'
        });

        res.status(201).json({ success: true, data: { transaction } });
    } catch (error) {
        console.error('Record Vendor Payment Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A transaction with this Reference ID already exists. Please use a unique ID.' });
        }
        res.status(500).json({ success: false, message: 'Server error recording payment' });
    }
};

/**
 * @desc    Get Administrative Expenses (with optional filters)
 * @route   GET /api/crm/expenses
 * @access  Admin
 */
export const getExpenses = async (req, res) => {
    try {
        const { category, month, year, search } = req.query;
        let query = {};

        if (category && category !== 'All' && category !== '') {
            query.category = category;
        }

        if (month && month !== 'All' && month !== '' && year && year !== 'All' && year !== '') {
            query.month = `${month} ${year}`;
        } else if (month && month !== 'All' && month !== '') {
            query.month = { $regex: `^${month}`, $options: 'i' };
        } else if (year && year !== 'All' && year !== '') {
            query.year = Number(year);
        }

        if (search) {
            const keywords = search.trim().split(/\s+/).filter(Boolean);
            if (keywords.length > 0) {
                query.$and = keywords.map(keyword => ({
                    description: { $regex: keyword, $options: 'i' }
                }));
            }
        }


        const expenses = await Expense.find(query).sort({ date: -1 });
        
        // Find unique months and years for filters
        const allExpenses = await Expense.find({});
        
        const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const uniqueMonths = [...new Set(allExpenses.map(e => e.month.split(' ')[0]))].sort((a, b) => {
            return monthsList.indexOf(a) - monthsList.indexOf(b);
        });
        
        const uniqueYears = [...new Set(allExpenses.map(e => e.year))].sort((a, b) => b - a);

        res.json({
            success: true,
            data: {
                expenses,
                uniqueMonths,
                uniqueYears
            }
        });
    } catch (error) {
        console.error('Get Expenses Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching expenses' });
    }
};

/**
 * @desc    Create a new Administrative Expense
 * @route   POST /api/crm/expenses
 * @access  Admin
 */
export const createExpense = async (req, res) => {
    try {
        const { category, amount, date, description } = req.body;

        if (!category || !amount) {
            return res.status(400).json({ success: false, message: 'Category and amount are required' });
        }

        const expense = await Expense.create({
            category,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
            description: description?.trim()
        });

        res.status(201).json({ success: true, data: { expense } });
    } catch (error) {
        console.error('Create Expense Error:', error);
        res.status(500).json({ success: false, message: 'Server error creating expense' });
    }
};

/**
 * @desc    Delete an Administrative Expense
 * @route   DELETE /api/crm/expenses/:id
 * @access  Admin
 */
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await Expense.findByIdAndDelete(id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete Expense Error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting expense' });
    }
};

/**
 * @desc    Get Attendance Settings
 * @route   GET /api/crm/attendance/settings
 * @access  Admin
 */
export const getAttendanceSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne({ key: 'attendance_settings' });
        if (!setting) {
            setting = {
                key: 'attendance_settings',
                value: {
                    officeStartTime: '09:00 AM',
                    officeEndTime: '06:00 PM',
                    halfDayDeduction: 250,
                    absentDeduction: 500,
                    lateGracePeriod: 15,
                    overtimeRate: 0,
                    freeLeavesPerMonth: 0
                }
            };
        }
        res.status(200).json({ success: true, data: setting.value });
    } catch (error) {
        console.error('Get Attendance Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching attendance settings' });
    }
};

/**
 * @desc    Update Attendance Settings
 * @route   PUT /api/crm/attendance/settings
 * @access  Admin
 */
export const updateAttendanceSettings = async (req, res) => {
    try {
        const { officeStartTime, officeEndTime, halfDayDeduction, absentDeduction, lateGracePeriod, overtimeRate, freeLeavesPerMonth } = req.body;
        
        if (!officeStartTime || !officeEndTime) {
            return res.status(400).json({ success: false, message: 'Office start and end times are required' });
        }

        const value = {
            officeStartTime,
            officeEndTime,
            halfDayDeduction: Number(halfDayDeduction) || 0,
            absentDeduction: Number(absentDeduction) || 0,
            lateGracePeriod: lateGracePeriod !== undefined ? Number(lateGracePeriod) : 15,
            overtimeRate: overtimeRate !== undefined ? Number(overtimeRate) : 0,
            freeLeavesPerMonth: freeLeavesPerMonth !== undefined ? Number(freeLeavesPerMonth) : 0
        };

        const setting = await Setting.findOneAndUpdate(
            { key: 'attendance_settings' },
            { key: 'attendance_settings', value, description: 'Office timing and attendance payroll deductions config' },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: 'Attendance settings updated successfully', data: setting.value });
    } catch (error) {
        console.error('Update Attendance Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating attendance settings' });
    }
};

/**
 * @desc    Get Enquiries Grouped by Assigned Caller (Staff)
 * @route   GET /api/crm/enquiries/assignments
 * @access  Admin/CRM
 */
export const getEnquiryAssignments = async (req, res) => {
    try {
        // Get all enquiries with staff populated
        const allEnquiries = await Enquiry.find({})
            .populate('assignedTo', 'name phone email role department avatar employeeId')
            .sort({ createdAt: -1 })
            .lean();

        // Manually populate carInterested for ObjectId refs
        const carIdsToFetch = allEnquiries
            .filter(enq => enq.carInterested && mongoose.Types.ObjectId.isValid(enq.carInterested))
            .map(enq => enq.carInterested);

        let carMap = {};
        if (carIdsToFetch.length > 0) {
            const cars = await mongoose.model('Car').find({ _id: { $in: carIdsToFetch } }).select('brand model').lean();
            carMap = cars.reduce((acc, car) => {
                acc[car._id.toString()] = car;
                return acc;
            }, {});
        }

        const enrichedEnquiries = allEnquiries.map(enq => {
            let carName = 'Not Specified';
            if (enq.carInterested) {
                if (mongoose.Types.ObjectId.isValid(enq.carInterested)) {
                    const car = carMap[enq.carInterested.toString()];
                    if (car) carName = `${car.brand} ${car.model}`;
                } else if (typeof enq.carInterested === 'string') {
                    carName = enq.carInterested;
                } else if (enq.carInterested.brand) {
                    carName = `${enq.carInterested.brand} ${enq.carInterested.model}`;
                }
            }
            return { ...enq, carName };
        });

        // Separate assigned and unassigned
        const unassigned = enrichedEnquiries.filter(enq => !enq.assignedTo);
        const assigned = enrichedEnquiries.filter(enq => enq.assignedTo);

        // Group assigned enquiries by caller
        const callerMap = {};
        assigned.forEach(enq => {
            const callerId = enq.assignedTo._id.toString();
            if (!callerMap[callerId]) {
                callerMap[callerId] = {
                    caller: enq.assignedTo,
                    enquiries: [],
                    count: 0
                };
            }
            callerMap[callerId].enquiries.push(enq);
            callerMap[callerId].count++;
        });

        const callerGroups = Object.values(callerMap).sort((a, b) => b.count - a.count);

        res.status(200).json({
            success: true,
            data: {
                callerGroups,
                unassigned,
                totalAssigned: assigned.length,
                totalUnassigned: unassigned.length
            }
        });
    } catch (error) {
        console.error('Get Enquiry Assignments Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching assignments', error: error.message });
    }
};

/**
 * @desc    Bulk Assign Enquiries to a Caller (Staff) — pass staffId: null to unassign
 * @route   POST /api/crm/enquiries/bulk-assign
 * @access  Admin/CRM
 */
export const bulkAssignEnquiries = async (req, res) => {
    try {
        const { enquiryIds, staffId } = req.body;

        if (!enquiryIds || !Array.isArray(enquiryIds) || enquiryIds.length === 0) {
            return res.status(400).json({ success: false, message: 'enquiryIds array is required' });
        }

        const updatePayload = staffId
            ? { assignedTo: new mongoose.Types.ObjectId(staffId) }
            : { $unset: { assignedTo: 1 } };

        await Enquiry.updateMany({ _id: { $in: enquiryIds } }, updatePayload);

        // Send notification to the newly assigned staff member
        if (staffId) {
            const staffMember = await Staff.findById(staffId).select('name').lean();
            try {
                await createNotification({
                    recipient: staffId,
                    recipientModel: 'Staff',
                    title: 'Enquiries Assigned to You',
                    message: `${enquiryIds.length} enquir${enquiryIds.length === 1 ? 'y has' : 'ies have'} been assigned to you.`,
                    type: 'enquiry_assigned',
                });
            } catch (notifErr) {
                // Non-fatal — don't fail the whole request
                console.warn('Notification error (non-fatal):', notifErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: staffId
                ? `${enquiryIds.length} enquir${enquiryIds.length === 1 ? 'y' : 'ies'} assigned successfully`
                : `${enquiryIds.length} enquir${enquiryIds.length === 1 ? 'y' : 'ies'} unassigned successfully`,
            data: { updatedCount: enquiryIds.length }
        });
    } catch (error) {
        console.error('Bulk Assign Enquiries Error:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk assignment', error: error.message });
    }
};

/**
 * @desc    Get Holidays List
 * @route   GET /api/crm/attendance/holidays
 * @access  Admin/Employee
 */
export const getHolidays = async (req, res) => {
    try {
        let setting = await Setting.findOne({ key: 'holidays' });
        if (!setting) {
            setting = {
                key: 'holidays',
                value: []
            };
        }
        res.status(200).json({ success: true, data: setting.value || [] });
    } catch (error) {
        console.error('Get Holidays Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching holidays' });
    }
};

/**
 * @desc    Mark/Add Holiday
 * @route   POST /api/crm/attendance/holidays
 * @access  Admin
 */
export const markHoliday = async (req, res) => {
    try {
        const { date, reason } = req.body;
        if (!date || !reason) {
            return res.status(400).json({ success: false, message: 'Date and reason are required' });
        }

        let setting = await Setting.findOne({ key: 'holidays' });
        let holidays = [];
        if (setting) {
            holidays = setting.value || [];
        }

        // Check if holiday already exists for this date and update it, else add new
        const existingIdx = holidays.findIndex(h => h.date === date);
        if (existingIdx !== -1) {
            holidays[existingIdx].reason = reason;
        } else {
            holidays.push({ date, reason });
        }

        setting = await Setting.findOneAndUpdate(
            { key: 'holidays' },
            { key: 'holidays', value: holidays, description: 'List of marked holidays' },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: 'Holiday marked successfully', data: setting.value });
    } catch (error) {
        console.error('Mark Holiday Error:', error);
        res.status(500).json({ success: false, message: 'Server error marking holiday' });
    }
};

/**
 * @desc    Delete/Remove Holiday
 * @route   DELETE /api/crm/attendance/holidays/:date
 * @access  Admin
 */
export const deleteHoliday = async (req, res) => {
    try {
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required' });
        }

        let setting = await Setting.findOne({ key: 'holidays' });
        if (!setting) {
            return res.status(404).json({ success: false, message: 'No holidays configured' });
        }

        let holidays = setting.value || [];
        holidays = holidays.filter(h => h.date !== date);

        setting = await Setting.findOneAndUpdate(
            { key: 'holidays' },
            { key: 'holidays', value: holidays },
            { new: true }
        );

        res.status(200).json({ success: true, message: 'Holiday removed successfully', data: setting.value });
    } catch (error) {
        console.error('Delete Holiday Error:', error);
        res.status(500).json({ success: false, message: 'Server error removing holiday' });
    }
};

/**
 * @desc    Get Employee Support settings (email & phone)
 * @route   GET /api/crm/settings/employee-support
 * @access  Private/Public
 */
export const getEmployeeSupportSettings = async (req, res) => {
    try {
        const emailSetting = await Setting.findOne({ key: 'employeeSupportEmail' });
        const phoneSetting = await Setting.findOne({ key: 'employeeSupportPhone' });
        
        res.status(200).json({
            success: true,
            data: {
                email: emailSetting ? emailSetting.value : 'support.employee@driveon.com',
                phone: phoneSetting ? phoneSetting.value : '+91 98765 43210'
            }
        });
    } catch (error) {
        console.error('Get Employee Support settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching employee support settings',
            error: error.message
        });
    }
};

/**
 * @desc    Update Employee Support settings (email & phone)
 * @route   PUT /api/crm/settings/employee-support
 * @access  Private (Admin)
 */
export const updateEmployeeSupportSettings = async (req, res) => {
    try {
        const { email, phone } = req.body;
        
        if (!email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Both support email and phone number are required'
            });
        }

        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        await Setting.findOneAndUpdate(
            { key: 'employeeSupportEmail' },
            { value: email.trim().toLowerCase() },
            { upsert: true, new: true }
        );

        await Setting.findOneAndUpdate(
            { key: 'employeeSupportPhone' },
            { value: phone.trim() },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Employee support contact details updated successfully'
        });
    } catch (error) {
        console.error('Update Employee Support settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating employee support settings',
            error: error.message
        });
    }
};



