import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/database.js";
import Location from "./models/Location.js";
import User from "./models/User.js";
import Staff from "./models/Staff.js";
import "./services/firebase.service.js"; // Initialize Firebase Admin early

// Load environment variables
dotenv.config();

// Log masked Razorpay keys on startup to confirm env load (safe for dev)
if (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET) {
  const mask = (val, start = 4, end = 3) => {
    const trimmed = val?.trim() || '';
    return trimmed && trimmed.length > start + end
      ? `${trimmed.slice(0, start)}***${trimmed.slice(-end)}`
      : trimmed;
  };
  console.log(
    `🔑 Razorpay env (id: ${mask(process.env.RAZORPAY_KEY_ID || '')}, secret: ${mask(
      process.env.RAZORPAY_KEY_SECRET || ''
    )})`
  );

  // Debug: Log actual keys (trimmed) for verification in development
  if (process.env.NODE_ENV === 'development') {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    console.log(
      `[RAZORPAY CHECK]`,
      keyId || 'MISSING',
      keySecret ? 'SET' : 'MISSING'
    );
  }
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Update allowed origins list
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5000",
  "https://driveoncar.co.in",
  "https://www.driveoncar.co.in",
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Make multer instance available for routes
app.locals.upload = upload;

// Connect to MongoDB
connectDB();

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import carRoutes from "./routes/car.routes.js";
import supportRoutes from "./routes/support.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import locationRoutes from "./routes/location.routes.js";
import commonRoutes from "./routes/common.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import crmRoutes from "./routes/crm.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import fleetRoutes from "./routes/fleet.routes.js";
import kycRoutes from "./routes/kyc.routes.js";


// Socket.IO Configuration
// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "http://localhost:5000",
//       "https://driveoncar.co.in",
//       "https://www.driveoncar.co.in",
//       process.env.FRONTEND_URL
//     ].filter(Boolean),
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });


// ---------- Socket.IO ----------
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store io instance in app to use in controllers
app.set("socketio", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Client registers as user, guarantor, or admin
  socket.on("register", async (payload) => {
    try {
      const { role, userId } = payload;

      if (!role || !userId) {
        socket.emit("error", { message: "Role and userId are required" });
        return;
      }

      socket.data.role = role;
      socket.data.userId = userId;

      if (role === "admin") {
        socket.join("admins");
        console.log(`✅ Admin connected: ${socket.id}`);
        socket.emit("registered", { role: "admin", socketId: socket.id });
      } else if (role === "user" || role === "guarantor") {
        // Join user-specific room
        socket.join(`user_${userId}`);
        // Also join a room for their type
        socket.join(`${role}s`);
        console.log(`✅ ${role} connected: ${userId} (${socket.id})`);
        socket.emit("registered", { role, userId, socketId: socket.id });
      } else {
        socket.emit("error", { message: "Invalid role" });
      }
    } catch (error) {
      console.error("Registration error:", error);
      socket.emit("error", { message: "Registration failed" });
    }
  });

  // Receive location update from user/guarantor client
  socket.on("location:update", async (loc) => {
    try {
      const { userId, userType, lat, lng, accuracy, speed, heading, altitude, address, timestamp } = loc;

      if (!userId || !lat || !lng) {
        socket.emit("location:error", { message: "userId, lat, and lng are required" });
        return;
      }

      // Validate userType
      const type = userType === "guarantor" ? "guarantor" : "user";

      // Create location document
      const locationDoc = await Location.create({
        userId: userId.toString(),
        userType: type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        altitude: altitude ? parseFloat(altitude) : null,
        address: address || "",
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        isLatest: true,
      });

      // Update user's location in User model
      await User.findByIdAndUpdate(userId, {
        "location.latitude": lat,
        "location.longitude": lng,
        "location.address": address || "",
        "location.lastLocationUpdate": new Date(),
      });

      // Get user details for admin view
      const user = await User.findById(userId).select("name email phone role").lean();

      // Broadcast to admin clients
      const locationData = {
        userId: userId.toString(),
        userType: type,
        name: user?.name || "Unknown",
        email: user?.email || "",
        phone: user?.phone || "",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        address: address || "",
        timestamp: locationDoc.timestamp,
      };

      io.to("admins").emit("location:update", locationData);

      // Acknowledge to user
      socket.emit("location:ack", { ok: true, timestamp: locationDoc.timestamp });
    } catch (error) {
      console.error("Error saving location:", error);
      socket.emit("location:error", { message: "Failed to save location" });
    }
  });

  // Admin requests latest locations
  socket.on("location:request", async () => {
    try {
      if (socket.data.role !== "admin") {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const locations = await Location.find({ isLatest: true })
        .sort({ timestamp: -1 })
        .limit(1000);

      // Get user details for each location
      const locationsWithDetails = await Promise.all(
        locations.map(async (loc) => {
          try {
            const user = await User.findById(loc.userId).select("name email phone role").lean();
            return {
              userId: loc.userId.toString(),
              userType: loc.userType,
              name: user?.name || "Unknown",
              email: user?.email || "",
              phone: user?.phone || "",
              lat: loc.lat,
              lng: loc.lng,
              accuracy: loc.accuracy,
              speed: loc.speed,
              heading: loc.heading,
              address: loc.address,
              timestamp: loc.timestamp,
            };
          } catch (err) {
            return {
              userId: loc.userId.toString(),
              userType: loc.userType,
              name: "Unknown",
              email: "",
              phone: "",
              lat: loc.lat,
              lng: loc.lng,
              accuracy: loc.accuracy,
              speed: loc.speed,
              heading: loc.heading,
              address: loc.address,
              timestamp: loc.timestamp,
            };
          }
        })
      );

      socket.emit("location:latest", { locations: locationsWithDetails });
    } catch (error) {
      console.error("Error fetching latest locations:", error);
      socket.emit("error", { message: "Failed to fetch locations" });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id, socket.data.role);
  });
});

// API Routes
// IMPORTANT: Mount admin routes BEFORE user routes to avoid route conflicts
// Admin routes are more specific, so they should be checked first
app.use("/api/admin", adminRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/fleet", fleetRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/common", commonRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api", supportRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", locationRoutes);
app.use("/api", referralRoutes);
app.use("/api/kyc", kycRoutes);


// Basic route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DriveOn Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔐 Authentication System: Dual Collection Support (User/Staff) Active`);
  console.log(`🔌 Socket.IO enabled for real-time location tracking`);

  // Verify Cloudinary configuration
  const cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const cloudinaryKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cloudinarySecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudinaryName && cloudinaryKey && cloudinarySecret) {
    console.log(
      `✅ Cloudinary configured (Cloud Name: ${cloudinaryName}, API Key: ${cloudinaryKey.substring(0, 8)}...)`
    );
  } else {
    console.warn(`⚠️ Cloudinary not configured:`);
    console.warn(
      `   CLOUDINARY_CLOUD_NAME: ${cloudinaryName ? "✓ Set" : "✗ Missing"}`
    );
    console.warn(
      `   CLOUDINARY_API_KEY: ${cloudinaryKey ? "✓ Set" : "✗ Missing"}`
    );
    console.warn(
      `   CLOUDINARY_API_SECRET: ${cloudinarySecret ? "✓ Set" : "✗ Missing"}`
    );
  }

  // Verify JWT configuration
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret !== 'your-secret-key-change-in-production') {
    console.log(`✅ JWT Secret configured`);
  } else {
    console.warn(`⚠️ JWT_SECRET not configured or using default value`);
  }

  // Verify Google Maps API configuration
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (googleMapsApiKey) {
    console.log(
      `✅ Google Maps API configured (API Key: ${googleMapsApiKey.substring(0, 8)}...)`
    );
  } else {
    console.warn(`⚠️ Google Maps API not configured:`);
    console.warn(`   GOOGLE_MAPS_API_KEY: ✗ Missing`);
    console.warn(`   Please add GOOGLE_MAPS_API_KEY to your backend .env file`);
  }

  // Verify SMSIndia Hub configuration
  const smsApiKey = process.env.SMSINDIAHUB_API_KEY?.trim();
  const smsSenderId = process.env.SMSINDIAHUB_SENDER_ID?.trim();
  if (smsApiKey && smsSenderId) {
    console.log(
      `✅ SMSIndia Hub configured (API Key: ${smsApiKey.substring(
        0,
        8
      )}..., Sender ID: ${smsSenderId})`
    );
  } else {
    console.warn(`⚠️ SMSIndia Hub not configured:`);
    console.warn(
      `   SMSINDIAHUB_API_KEY: ${smsApiKey ? "✓ Set" : "✗ Missing"}`
    );
    console.warn(
      `   SMSINDIAHUB_SENDER_ID: ${smsSenderId ? "✓ Set" : "✗ Missing"}`
    );
  }

  // Verify Razorpay configuration
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (razorpayKeyId && razorpayKeySecret) {
    console.log(
      `✅ Razorpay configured (Key ID: ${razorpayKeyId.substring(0, 8)}...)`
    );
  } else {
    console.error(`❌ Razorpay NOT configured:`);
    console.error(
      `   RAZORPAY_KEY_ID: ${razorpayKeyId ? "✓ Set" : "✗ Missing"}`
    );
    console.error(
      `   RAZORPAY_KEY_SECRET: ${razorpayKeySecret ? "✓ Set" : "✗ Missing"}`
    );
    console.error(`   ⚠️ Payment functionality will not work without Razorpay keys!`);
  }
});
