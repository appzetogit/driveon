import { useMemo, useState, useEffect } from 'react';
import BookingModal from '../components/BookingModal';
import CarCard from '../components/CarCard';
import { useFleet } from '../context/FleetContext';
import { FLEET_CAR_TYPES } from '../constants/fleetConstants';
import { isTodayWithinRangeInclusive } from '../utils/fleetDateUtils';


const OutwardCarsPage = () => {
  const { cars, getBookingsForCar, addBooking, addCar } = useFleet();
  const [selectedCar, setSelectedCar] = useState(null);
  const outwardCars = useMemo(
    () => cars.filter((c) => c.type === FLEET_CAR_TYPES.OUTWARD),
    [cars]
  );

  const visibleCars = outwardCars;

  const onConfirm = async (payload) => {
    if (!selectedCar) return;
    addBooking({
      ...payload,
      carId: selectedCar.id,
      carName: selectedCar.name,
      carType: selectedCar.type,
      carOwnerName: selectedCar.ownerName || '',
    });
  };

  return (
    <div className="space-y-4">


      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleCars.map((car) => {
          const bookings = getBookingsForCar(car.id).filter(b => b.status !== 'completed' && b.status !== 'cancelled');
          const isBookedNow = bookings.some((b) => isTodayWithinRangeInclusive(b.fromDate, b.toDate));
          return (
            <CarCard
              key={car.id}
              car={car}
              isBookedNow={isBookedNow}
              onBook={() => setSelectedCar(car)}
            />
          );
        })}
      </div>

      <BookingModal
        open={Boolean(selectedCar)}
        onClose={() => setSelectedCar(null)}
        car={selectedCar}
        existingBookings={selectedCar ? getBookingsForCar(selectedCar.id).filter(b => b.status !== 'completed' && b.status !== 'cancelled') : []}
        onConfirm={onConfirm}
      />


    </div>
  );
};

export default OutwardCarsPage;
