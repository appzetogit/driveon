import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config();

/**
 * Create Admin Account
 * Script to create a new admin account
 */
const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const adminData = {
      name: 'Ajay Panchal',
      email: 'panchalajay717@gmail.com',
      password: '123456', // Will be hashed by pre-save hook
      role: 'admin',
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
      isActive: true,
      phone: '7610416911',
      department: '',
      notes: 'Initial admin account',
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email.toLowerCase() });

    if (existingAdmin) {
      console.log('⚠️ Admin with this email already exists:');
      console.log({
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive,
      });
      console.log('\n✅ Use existing admin or delete it first to create a new one.');
      process.exit(0);
    }

    // Create admin
    const admin = await Admin.create(adminData);

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Details:');
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  Phone:', admin.phone || 'Not set');
    console.log('  Role:', admin.role);
    console.log('  Status: Active');
    console.log('  Password: 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 You can now login with:');
    console.log('   Email: panchalajay717@gmail.com');
    console.log('   Password: 123456');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin account:');
    console.error(error.message);

    if (error.code === 11000) {
      console.error('\n⚠️ Admin with this email already exists!');
    }

    process.exit(1);
  }
};

// Run the script
createAdmin();

