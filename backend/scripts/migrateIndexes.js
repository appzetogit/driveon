import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import GuarantorPoints from '../models/GuarantorPoints.js';

dotenv.config();

const migrateIndexes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    console.log('\n🔍 Listing current indexes on guarantorpoints collection...');
    const collection = mongoose.connection.db.collection('guarantorpoints');
    const indexes = await collection.indexes();
    console.log('Current Indexes:', indexes.map(idx => idx.name));

    const targetIndexName = 'booking_1_guarantor_1_status_1';
    const hasTargetIndex = indexes.some(idx => idx.name === targetIndexName);

    if (hasTargetIndex) {
      console.log(`\n🔥 Dropping index: ${targetIndexName}...`);
      await collection.dropIndex(targetIndexName);
      console.log('✅ Index dropped successfully.');
    } else {
      console.log(`\nℹ️ Index ${targetIndexName} does not exist.`);
    }

    console.log('\n🏗️ Rebuilding indexes using Mongoose schema...');
    // Drop all indexes managed by mongoose and recreate them
    await GuarantorPoints.cleanIndexes();
    await GuarantorPoints.createIndexes();
    
    const newIndexes = await collection.indexes();
    console.log('\n✅ New Indexes on guarantorpoints collection:', newIndexes.map(idx => ({
      name: idx.name,
      unique: idx.unique,
      partialFilterExpression: idx.partialFilterExpression
    })));

    console.log('\n🎉 Index migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during index migration:', error);
    process.exit(1);
  }
};

migrateIndexes();
