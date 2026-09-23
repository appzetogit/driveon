import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { carService } from '../../services/car.service';
import { adminService } from '../../services/admin.service';
import { FLEET_CAR_TYPES } from '../constants/fleetConstants';

const FleetContext = createContext(null);

export const FleetProvider = ({ children }) => {
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const [outwardCarsRes, outwardBookingsRes, inwardCarsRes, regularBookingsRes] = await Promise.all([
          api.get('/fleet/outward-cars'),
          api.get('/fleet/outward-bookings'),
          carService.getCars(),
          adminService.getAllBookings()
        ]);
        
        let allCars = [];
        let allBookings = [];

        // Process Outward Cars
        if (outwardCarsRes.data.success) {
          allCars = [...outwardCarsRes.data.data];
        }
        
        // Process Inward Cars (from regular inventory)
        if (inwardCarsRes.success && inwardCarsRes.data?.cars) {
          const mappedInward = inwardCarsRes.data.cars.map(car => ({
            id: car._id,
            name: `${car.brand} ${car.model}`,
            brand: car.brand,
            model: car.model,
            pricePerDay: car.pricePerDay,
            location: car.location?.city || car.location || '-',
            type: FLEET_CAR_TYPES.INWARD,
            ownerName: car.owner?.name || 'DriveOn Admin',
            ownerPhone: car.owner?.phone || '-',
            images: car.images,
            registrationNumber: car.registrationNumber || ''
          }));
          allCars = [...allCars, ...mappedInward];
        }

        // Process Outward Bookings
        if (outwardBookingsRes.data.success) {
          // Ensure bookings from DB have the correct carType field if missing
          const outwardB = outwardBookingsRes.data.data.map(b => ({
            ...b,
            carType: b.carType || FLEET_CAR_TYPES.OUTWARD
          }));
          allBookings = [...allBookings, ...outwardB];
        }

        // Process Inward Bookings (Regular bookings from regular cars)
        // Only include active bookings for fleet availability check (exclude cancelled/completed)
        const ACTIVE_BOOKING_STATUSES = ['confirmed', 'active', 'pending'];
        if (regularBookingsRes.success && regularBookingsRes.data?.bookings) {
          const mappedRegular = regularBookingsRes.data.bookings
            .filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status))
            .map(b => {
              const carBrand = b.car?.brand || 'DriveOn';
              const carModel = b.car?.model || 'Car';

              return {
                id: b.bookingId || b._id,
                carId: b.car?._id || b.car,
                carName: b.car?.name || `${carBrand} ${carModel}`,
                carType: FLEET_CAR_TYPES.INWARD,
                customerName: b.user?.name || 'Customer',
                fromDate: b.tripStart?.date ? new Date(b.tripStart.date).toISOString().split('T')[0] : (b.fromDate || null),
                toDate: b.tripEnd?.date ? new Date(b.tripEnd.date).toISOString().split('T')[0] : (b.toDate || null),
                totalPrice: b.pricing?.totalPrice || b.pricing?.finalPrice || 0,
                status: b.status || 'unknown',
                paymentStatus: b.paymentStatus || 'unknown',
                paymentMode: b.paymentMode || 'Online',
                paidAmount: b.pricing?.paidAmount || 0,
                createdAt: b.createdAt,
                isRegularBooking: true
              };
            });
          allBookings = [...allBookings, ...mappedRegular];
        }

        setCars(allCars);
        setBookings(allBookings);
      } catch (error) {
        console.error("Failed to load fleet data", error);
      } finally {
        setHydrated(true);
      }
    };

    fetchFleetData();
  }, []);

  const addCar = async (car) => {
    try {
      const response = await api.post('/fleet/outward-cars', car);
      if (response.data.success) {
        setCars((prev) => [car, ...prev]);
        return response.data.data;
      }
      throw new Error("Failed to save to database");
    } catch (error) {
      console.error("Add fleet car error", error);
      throw error;
    }
  };

  const addBooking = async (booking) => {
    try {
      const response = await api.post('/fleet/outward-bookings', booking);
      if (response.data.success) {
        setBookings((prev) => [response.data.data, ...prev]);
        return response.data.data;
      }
      throw new Error("Failed to save booking to database");
    } catch (error) {
      console.error("Add fleet booking error", error);
      throw error;
    }
  };

  const clearAllBookings = () => {
    setBookings([]);
  }

  const updateBookingInContext = (bookingId, updatedFields) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ...updatedFields } : b))
    );
  };

  const value = useMemo(
    () => ({
      cars,
      bookings,
      hydrated,
      getCarById: (carId) => cars.find((c) => c.id === carId),
      getBookingsForCar: (carId) => bookings.filter((b) => b.carId === carId),
      addBooking,
      addCar,
      clearAllBookings,
      updateBookingInContext,
    }),
    [cars, bookings, hydrated]
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};

export const useFleet = () => {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
};
