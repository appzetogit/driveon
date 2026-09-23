import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function syncAvailability() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/driveon';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const RepairJob = mongoose.connection.db.collection('repairjobs');
    const Car = mongoose.connection.db.collection('cars');

    // Find all active repair jobs
    const activeRepairs = await RepairJob.find({ status: { $nin: ['Completed', 'Cancelled'] } }).toArray();
    console.log(`Found ${activeRepairs.length} active repair jobs.`);

    const activeCarIds = activeRepairs.map(r => r.car);
    console.log('Cars in active repair:', activeCarIds);

    if (activeCarIds.length > 0) {
      // Set all these cars to isAvailable: false
      const updateResult = await Car.updateMany(
        { _id: { $in: activeCarIds } },
        { $set: { isAvailable: false } }
      );
      console.log(`Updated ${updateResult.modifiedCount} cars to isAvailable: false.`);
    }

    // Set all other cars (not in active repair) to isAvailable: true if they are currently false but not booked
    const allRepairs = await RepairJob.find({}).toArray();
    const completedOrCancelledCarIds = allRepairs
      .filter(r => ['Completed', 'Cancelled'].includes(r.status))
      .map(r => r.car);
    
    // Filter out those that are still in active repair
    const activeCarIdsSet = new Set(activeCarIds.map(id => id.toString()));
    const carsToRestore = completedOrCancelledCarIds.filter(id => id && !activeCarIdsSet.has(id.toString()));

    if (carsToRestore.length > 0) {
      const restoreResult = await Car.updateMany(
        { _id: { $in: carsToRestore } },
        { $set: { isAvailable: true } }
      );
      console.log(`Restored ${restoreResult.modifiedCount} completed/cancelled cars back to isAvailable: true.`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

syncAvailability();
