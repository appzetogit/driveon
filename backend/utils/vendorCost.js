import Car from '../models/Car.js';
import Booking from '../models/Booking.js';
import OutwardBooking from '../models/OutwardBooking.js';

const DAY_MS = 1000 * 3600 * 24;

// What DriveOn owes the vendor for an outward car. Only counts once the car has done at least 1 trip.
export const vendorCostFor = (outwardCar, totalDaysBooked, tripsCount) => {
  if (!tripsCount) return 0;
  if (outwardCar.vendorSettlement?.agreedAmount) return outwardCar.vendorSettlement.agreedAmount;
  if (outwardCar.vendorAgreementType === 'monthly') return outwardCar.agreementPricePerMonth || 0;
  return (outwardCar.agreementPricePerDay || 0) * totalDaysBooked;
};

// Every trip of an outward car: Fleet bookings (stored under the OutwardCar id or its Car _id)
// plus customer app bookings on its Car. Single source for the admin car list and CRM vendor pages.
export const getOutwardCarTrips = async (outwardCar) => {
  const car = await Car.findOne({ outwardCarId: outwardCar.originalOutputId }).select('_id').lean();
  const carIds = [outwardCar.originalOutputId, car && String(car._id)].filter(Boolean);

  const [fleetBookings, customerBookings] = await Promise.all([
    OutwardBooking.find({ carId: { $in: carIds }, status: { $ne: 'cancelled' } }).lean(),
    car ? Booking.find({ car: car._id, status: { $in: ['confirmed', 'active', 'completed'] } }).lean() : [],
  ]);

  return [
    ...fleetBookings.map((b) => ({
      bookingId: b.originalBookingId || b._id,
      source: 'Fleet',
      bookingType: b.carType || null, // 'inward' | 'outward', chosen when booked from the Fleet portal
      fromDate: b.fromDate,
      toDate: b.toDate,
      days: Math.ceil((new Date(b.toDate) - new Date(b.fromDate)) / DAY_MS) || 1,
      bookedValue: b.totalPrice || 0,
      collected: b.paidAmount || 0,
      status: b.status,
    })),
    ...customerBookings.map((b) => ({
      bookingId: b.bookingId || b._id,
      source: 'Customer Booking',
      fromDate: b.tripStart?.date,
      toDate: b.tripEnd?.date,
      days: b.totalDays || 1,
      bookedValue: b.pricing?.totalPrice || 0,
      collected: b.paidAmount || 0,
      status: b.status,
    })),
  ];
};

// Revenue = money actually collected; pendingAmount = booked but not yet collected.
export const summarizeOutwardTrips = (outwardCar, trips) => {
  const sum = (key) => trips.reduce((total, t) => total + t[key], 0);
  const tripsCount = trips.length;
  const totalDaysBooked = sum('days');
  const totalRevenue = sum('collected');
  const totalVendorCost = vendorCostFor(outwardCar, totalDaysBooked, tripsCount);
  return {
    tripsCount,
    totalDaysBooked,
    totalRevenue,
    pendingAmount: Math.max(sum('bookedValue') - totalRevenue, 0),
    totalVendorCost,
    netProfit: totalRevenue - totalVendorCost,
  };
};
