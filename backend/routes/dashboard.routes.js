import express from 'express';
import jwt from 'jsonwebtoken';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import Admin from '../models/Admin.js';
import Staff from '../models/Staff.js';
import User from '../models/User.js';

const router = express.Router();

// Universal Dashboard Protection Middleware
const protectDashboard = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

        // 1. Check Admin
        let user = await Admin.findById(decoded.id);
        if (user) {
            if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });
            req.user = user;
            req.role = 'admin';
            return next();
        }

        // 2. Check Staff
        user = await Staff.findById(decoded.id);
        if (user) {
            if (user.status === 'Inactive') return res.status(401).json({ message: 'Account inactive' });
            req.user = user;
            req.role = 'staff';
            return next();
        }

        // 3. Check User (less likely for dashboard but supported)
        user = await User.findById(decoded.id);
        if (user) {
            if (user.isActive === false) return res.status(401).json({ message: 'Account deactivated' });
            req.user = user;
            req.role = 'user';
            return next();
        }

        return res.status(401).json({ success: false, message: 'User not found in any role' });

    } catch (error) {
        console.error('Dashboard Auth Error:', error.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

// Get dashboard stats
router.get('/stats', protectDashboard, getDashboardStats);

export default router;
