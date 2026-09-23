import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config();

/**
 * Seed Test Admin Account
 * Run this script to create a test admin account
 */
const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    // Test admin credentials
    const testAdmin = {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      permissions: [
        'users.manage',
        'users.view',
        'cars.manage',
        'cars.view',
        'bookings.manage',
        'bookings.view',
        'payments.manage',
        'payments.view',
        'kyc.manage',
        'kyc.view',
        'reports.view',
        'settings.manage',
      ],
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: testAdmin.email });

    if (existingAdmin) {
      console.log('⚠️  Test admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Password: admin123');
      console.log('\n✅ You can use these credentials to login.');
      process.exit(0);
    }

    // Create test admin
    const admin = await Admin.create(testAdmin);

    console.log('\n✅ Test Admin Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', admin.name);
    console.log('🎭 Role:', admin.role);
    console.log('✅ Status: Active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now login with these credentials at /admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

// Run seed function
seedAdmin();

