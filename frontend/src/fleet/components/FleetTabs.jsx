import { NavLink } from 'react-router-dom';
import { colors } from '../../module/theme/colors';
import { useFleet } from '../context/FleetContext';
import { FLEET_CAR_TYPES } from '../constants/fleetConstants';

const tabBase =
  'px-4 py-2 rounded-lg text-sm font-medium transition-all border';

const FleetTabs = () => {
  const { bookings } = useFleet();

  const fleetBookingsOnly = bookings.filter(b => !b.isRegularBooking);
  const inwardBookingsCount = fleetBookingsOnly.filter(b => b.carType === FLEET_CAR_TYPES.INWARD).length;
  const outwardBookingsCount = fleetBookingsOnly.filter(b => b.carType === FLEET_CAR_TYPES.OUTWARD).length;

  const getTabClass = ({ isActive }) =>
    `${tabBase} ${isActive ? 'text-white shadow-sm' : ''}`;

  const getTabStyle = (isActive) =>
    isActive
      ? {
          backgroundColor: colors.backgroundTertiary,
          borderColor: colors.backgroundTertiary,
          color: colors.textWhite,
        }
      : {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
          color: colors.textPrimary,
        };

  return (
    <div className="flex flex-wrap gap-2">
      <NavLink
        to="/admin/fleet/inward"
        className={getTabClass}
        style={({ isActive }) => getTabStyle(isActive)}
      >
        Inward Cars
      </NavLink>
      <NavLink
        to="/admin/fleet/inward-bookings"
        className={getTabClass}
        style={({ isActive }) => getTabStyle(isActive)}
      >
        Inward Bookings ({inwardBookingsCount})
      </NavLink>
    </div>
  );
};

export default FleetTabs;

