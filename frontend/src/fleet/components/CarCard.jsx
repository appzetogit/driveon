import Card from '../../components/common/Card';
import { Button } from '../../components/common';
import { colors } from '../../module/theme/colors';

const badgeBase = 'text-xs font-semibold px-2 py-1 rounded-full';

const CarCard = ({ car, isBookedNow, onBook }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {car.name}
          </h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {car.brand} • {car.model}
          </p>
          {car.ownerName ? (
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Owner: <span className="font-medium">{car.ownerName}</span>
              {car.ownerPhone ? <span> • {car.ownerPhone}</span> : null}
            </p>
          ) : null}
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Location: {car.location}
          </p>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Price/Day: <span className="font-semibold">₹{car.pricePerDay}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`${badgeBase} ${isBookedNow ? 'text-white' : ''}`}
            style={{
              backgroundColor: isBookedNow ? colors.accentRed : colors.backgroundLight,
              color: isBookedNow ? colors.textWhite : colors.textPrimary,
            }}
          >
            {isBookedNow ? 'Booked' : 'Available'}
          </span>
          <Button
            onClick={onBook}
            disabled={false}
            className="px-4 py-2"
            style={{
              backgroundColor: colors.backgroundTertiary,
              color: colors.textWhite,
              opacity: 1,
            }}
          >
            Book
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CarCard;
