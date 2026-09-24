import 'dotenv/config';
import mongoose from 'mongoose';
import Staff from '../models/Staff.js';

async function testSaveHook() {
  await mongoose.connect(process.env.MONGODB_URI);
  const staff = await Staff.findOne({ email: 'prince@gmail.com' });
  const oldHash = staff.password;
  console.log('Old Hash:', oldHash);
  
  // Update a non-password field (like lastLocationUpdate or status)
  staff.status = 'Active';
  await staff.save();

  const refreshedStaff = await Staff.findOne({ email: 'prince@gmail.com' });
  console.log('New Hash after staff.save():', refreshedStaff.password);
  console.log('Did hash change?', oldHash !== refreshedStaff.password);
  console.log('Can 123456 still log in?', await refreshedStaff.matchPassword('123456'));

  // If hash changed, restore it!
  if (oldHash !== refreshedStaff.password) {
    console.log('⚠️ WARNING: Hash changed on staff.save()!');
    await mongoose.connection.db.collection('staffs').updateOne(
      { _id: staff._id },
      { $set: { password: oldHash } }
    );
  }

  await mongoose.disconnect();
}

testSaveHook();
