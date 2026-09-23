import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function check() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/driveon';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const RepairJob = mongoose.connection.db.collection('repairjobs');
    const Car = mongoose.connection.db.collection('cars');

    const repairs = await RepairJob.find({}).toArray();
    console.log('\n--- ALL REPAIR JOBS IN DB ---');
    repairs.forEach(r => {
      console.log({
        _id: r._id,
        car: r.car,
        status: r.status,
        cost: r.cost,
        description: r.description
      });
    });

    const cars = await Car.find({}).toArray();
    console.log('\n--- ALL CARS IN DB ---');
    cars.forEach(c => {
      console.log({
        _id: c._id,
        brand: c.brand,
        model: c.model,
        registrationNumber: c.registrationNumber,
        isAvailable: c.isAvailable,
        status: c.status,
        source: c.source,
        outwardCarId: c.outwardCarId
      });
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
