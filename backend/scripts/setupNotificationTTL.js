import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Notification from '../models/Notification.js';

const setupTTL = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    const collection = Notification.collection;
    const existingIndexes = await collection.indexes();
    console.log('Current indexes:', existingIndexes);

    // Check if any TTL index exists on createdAt
    const existingTTL = existingIndexes.find(idx => idx.key?.createdAt && idx.expireAfterSeconds !== undefined);
    if (existingTTL) {
      console.log(`Found existing TTL index: ${existingTTL.name} with expireAfterSeconds: ${existingTTL.expireAfterSeconds}`);
      if (existingTTL.expireAfterSeconds !== 259200) {
        console.log(`Dropping old TTL index ${existingTTL.name}...`);
        await collection.dropIndex(existingTTL.name);
        console.log('Creating new 3-day TTL index (259200 seconds)...');
        await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 259200, name: 'createdAt_ttl_3days' });
      } else {
        console.log('TTL index already set to 259200 seconds (3 days).');
      }
    } else {
      console.log('Creating 3-day TTL index (259200 seconds) on createdAt...');
      await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 259200, name: 'createdAt_ttl_3days' });
      console.log('✅ TTL index createdAt_ttl_3days created successfully.');
    }

    const updatedIndexes = await collection.indexes();
    console.log('\nUpdated Indexes on notifications collection:', updatedIndexes);

    const totalBefore = await Notification.countDocuments();
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const expiredCount = await Notification.countDocuments({ createdAt: { $lt: cutoff } });
    console.log(`\n📊 Notification counts:`);
    console.log(`- Total notifications: ${totalBefore}`);
    console.log(`- Expired notifications (> 3 days old): ${expiredCount}`);
    console.log(`- Active notifications (<= 3 days old): ${totalBefore - expiredCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up TTL index:', error);
    process.exit(1);
  }
};

setupTTL();
