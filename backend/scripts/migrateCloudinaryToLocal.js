import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { compressImage } from '../utils/imageOptimizer.js';
import { PUBLIC_UPLOADS_DIR, ensureDirectoryExists } from '../services/localStorage.service.js';

import Car from '../models/Car.js';
import Banner from '../models/Banner.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadAndSave(url, folderName) {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com') && !url.startsWith('http')) return null;

  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    if (response.status !== 200 || !response.data) {
      console.warn(`⚠️ Failed to download: ${url}`);
      return null;
    }

    const inputBuffer = Buffer.from(response.data);
    const compressed = await compressImage(inputBuffer, { folder: folderName });

    const cleanFolder = folderName.replace(/^\/+|\/+$/g, '');
    const targetDir = path.join(PUBLIC_UPLOADS_DIR, ...cleanFolder.split('/'));
    ensureDirectoryExists(targetDir);

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${uniqueId}.${compressed.extension}`;
    const filePath = path.join(targetDir, filename);

    await fs.promises.writeFile(filePath, compressed.buffer);
    const relativeUrl = `/uploads/${cleanFolder}/${filename}`;

    return {
      relativeUrl,
      publicId: `${cleanFolder}/${uniqueId}`,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
    };
  } catch (error) {
    console.error(`❌ Error migrating ${url}:`, error.message);
    return null;
  }
}

async function migrateAll() {
  console.log('🚀 Starting Cloudinary to VPS Local Storage Migration...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  let totalMigrated = 0;

  // 1. Migrate Cars
  console.log('\n🚗 Checking Cars...');
  const cars = await Car.find({
    $or: [
      { 'images.url': { $regex: 'cloudinary.com', $options: 'i' } },
      { 'rcDocument.url': { $regex: 'cloudinary.com', $options: 'i' } },
    ],
  });
  console.log(`Found ${cars.length} cars with Cloudinary assets.`);

  for (const car of cars) {
    let modified = false;

    // Migrate images array
    if (Array.isArray(car.images)) {
      for (const img of car.images) {
        if (img.url && img.url.includes('cloudinary.com')) {
          console.log(`Downloading car image: ${img.url}`);
          const res = await downloadAndSave(img.url, 'driveon/cars');
          if (res) {
            img.url = res.relativeUrl;
            img.publicId = res.publicId;
            modified = true;
            totalMigrated++;
          }
        }
      }
    }

    // Migrate RC document
    if (car.rcDocument && car.rcDocument.url && car.rcDocument.url.includes('cloudinary.com')) {
      console.log(`Downloading car RC document: ${car.rcDocument.url}`);
      const res = await downloadAndSave(car.rcDocument.url, 'driveon/cars/documents');
      if (res) {
        car.rcDocument.url = res.relativeUrl;
        car.rcDocument.publicId = res.publicId;
        modified = true;
        totalMigrated++;
      }
    }

    if (modified) {
      await car.save();
      console.log(`✅ Updated car: ${car.brand} ${car.model} (${car.registrationNumber})`);
    }
  }

  // 2. Migrate Banners
  console.log('\n🎨 Checking Banners...');
  const banners = await Banner.find({
    image: { $regex: 'cloudinary.com', $options: 'i' },
  });
  console.log(`Found ${banners.length} banners with Cloudinary assets.`);

  for (const banner of banners) {
    console.log(`Downloading banner: ${banner.image}`);
    const res = await downloadAndSave(banner.image, 'driveon/banners');
    if (res) {
      banner.image = res.relativeUrl;
      banner.cloudinaryPublicId = res.publicId;
      await banner.save();
      console.log(`✅ Updated banner: ${banner.title}`);
      totalMigrated++;
    }
  }

  // 3. Migrate Users Profile Photos
  console.log('\n👤 Checking Users...');
  const users = await User.find({
    profilePhoto: { $regex: 'cloudinary.com', $options: 'i' },
  });
  console.log(`Found ${users.length} users with Cloudinary profile photos.`);

  for (const user of users) {
    console.log(`Downloading user photo: ${user.profilePhoto}`);
    const res = await downloadAndSave(user.profilePhoto, 'driveon/profile-photos');
    if (res) {
      user.profilePhoto = res.relativeUrl;
      await user.save();
      console.log(`✅ Updated user: ${user.name || user.phone}`);
      totalMigrated++;
    }
  }

  // 4. Migrate Staff
  console.log('\n👔 Checking Staff...');
  const staffs = await Staff.find({
    $or: [
      { avatar: { $regex: 'cloudinary.com', $options: 'i' } },
      { aadharCard: { $regex: 'cloudinary.com', $options: 'i' } },
    ],
  });
  console.log(`Found ${staffs.length} staff with Cloudinary assets.`);

  for (const staff of staffs) {
    let modified = false;
    if (staff.avatar && staff.avatar.includes('cloudinary.com')) {
      const res = await downloadAndSave(staff.avatar, 'crm/staff');
      if (res) {
        staff.avatar = res.relativeUrl;
        modified = true;
        totalMigrated++;
      }
    }
    if (staff.aadharCard && staff.aadharCard.includes('cloudinary.com')) {
      const res = await downloadAndSave(staff.aadharCard, 'crm/staff/aadhar');
      if (res) {
        staff.aadharCard = res.relativeUrl;
        modified = true;
        totalMigrated++;
      }
    }
    if (modified) {
      await staff.save();
      console.log(`✅ Updated staff: ${staff.name || staff.email}`);
    }
  }

  console.log(`\n🎉 Migration Complete! Total assets migrated: ${totalMigrated}`);
  await mongoose.disconnect();
  process.exit(0);
}

migrateAll().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
