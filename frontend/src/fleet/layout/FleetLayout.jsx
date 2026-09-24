import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { colors } from '../../module/theme/colors';
import FleetTabs from '../components/FleetTabs';
import AgreementTemplateModal from '../components/AgreementTemplateModal';
import { FleetProvider } from '../context/FleetContext';

const FleetLayout = () => {
  const [showAgreementEditor, setShowAgreementEditor] = useState(false);

  return (
    <FleetProvider>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Fleet Management
            </h1>
            <button
              onClick={() => setShowAgreementEditor(true)}
              type="button"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.borderMedium,
                color: colors.textPrimary,
              }}
              title="Edit Master Fleet Rental Agreement Template"
            >
              <span>📜</span>
              <span>Agreement</span>
            </button>
          </div>
          <p className="mt-1" style={{ color: colors.textSecondary }}>
            Manage outward/inward cars and create bookings.
          </p>
          <div className="mt-4">
            <FleetTabs />
          </div>
        </div>

        <Outlet />

        <AgreementTemplateModal
          open={showAgreementEditor}
          onClose={() => setShowAgreementEditor(false)}
        />
      </div>
    </FleetProvider>
  );
};

export default FleetLayout;
