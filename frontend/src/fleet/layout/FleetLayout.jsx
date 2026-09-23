import { Outlet } from 'react-router-dom';
import { colors } from '../../module/theme/colors';
import FleetTabs from '../components/FleetTabs';
import { FleetProvider } from '../context/FleetContext';

const FleetLayout = () => {
  return (
    <FleetProvider>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            Fleet Management
          </h1>
          <p className="mt-1" style={{ color: colors.textSecondary }}>
            Manage outward/inward cars and create bookings.
          </p>
          <div className="mt-4">
            <FleetTabs />
          </div>
        </div>

        <Outlet />
      </div>
    </FleetProvider>
  );
};

export default FleetLayout;
