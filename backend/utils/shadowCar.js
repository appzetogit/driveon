import mongoose from 'mongoose';
import Car from '../models/Car.js';

// Keeps the customer-facing Car document of an outward (vendor) car in sync with its OutwardCar.
// New cars get placeholder specs; existing cars only take the fields the OutwardCar owns, so
// details entered from the admin Add/Edit Car form (year, color, specs, images, status...) survive.
export const syncShadowCar = async (outCar) => {
  const car = await Car.findOne({ outwardCarId: outCar.originalOutputId });
  const inRepair = car
    ? !!(await mongoose.model('RepairJob').exists({ car: car._id, status: { $nin: ['Completed', 'Cancelled'] } }))
    : false;

  if (!car) {
    const adminUser = await mongoose.model('User').findOne({ role: 'admin' }) || await mongoose.model('User').findOne({});
    const price = outCar.pricePerDay || 1000;
    return Car.create({
      owner: adminUser ? adminUser._id : new mongoose.Types.ObjectId('60d5ec0f1f1d2c001f8e29a5'),
      brand: outCar.brand || 'External',
      model: outCar.model || 'Vehicle',
      year: 2024,
      color: 'N/A',
      registrationNumber: outCar.carNumber || outCar.registrationNumber || `OUT-${outCar.originalOutputId.slice(-6).toUpperCase()}`,
      carType: 'suv',
      fuelType: 'petrol',
      transmission: 'automatic',
      seatingCapacity: 5,
      pricePerDay: price,
      pricePerWeek: price * 7,
      pricePerMonth: price * 30,
      securityDeposit: 0,
      description: `This verified premium outward car is owned by ${outCar.ownerName} and managed by DriveOn partners.`,
      isAvailable: true,
      status: 'active',
      images: outCar.image ? [{ url: outCar.image, isPrimary: true }] : [],
      location: { city: outCar.location || 'Indore', state: 'Madhya Pradesh', address: outCar.location || 'Indore' },
      ownerInfo: { name: outCar.ownerName, email: 'partner@driveon.com', phone: outCar.ownerPhone },
      source: 'outward',
      outwardCarId: outCar.originalOutputId,
      features: outCar.features || [],
    });
  }

  const next = {
    brand: outCar.brand || car.brand,
    model: outCar.model || car.model,
    registrationNumber: outCar.carNumber || outCar.registrationNumber || car.registrationNumber,
    pricePerDay: outCar.pricePerDay || car.pricePerDay,
    'location.city': outCar.location || car.location?.city,
    'ownerInfo.name': outCar.ownerName || car.ownerInfo?.name,
    isAvailable: !inRepair,
  };
  if (outCar.features?.length) next.features = outCar.features;
  if (!car.images?.length && outCar.image) next.images = [{ url: outCar.image, isPrimary: true }];

  const changes = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => JSON.stringify(car.get(key)) !== JSON.stringify(value))
  );
  if (Object.keys(changes).length) {
    car.set(changes);
    await car.save();
  }
  return car;
};
