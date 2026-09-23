import { useParams, useNavigate } from 'react-router-dom';
import { theme } from '../../theme/theme.constants';

const BookingDateTimePage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 md:p-2 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Select Date & Time</h1>
              <div className="w-8 md:w-12"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-6 md:p-8 shadow-md">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: theme.colors.primary }}>
              Select Date & Time
            </h2>
            <p className="text-sm md:text-base mb-2" style={{ color: theme.colors.textSecondary }}>
              Car ID: {carId}
            </p>
            <p className="text-sm md:text-base" style={{ color: theme.colors.textSecondary }}>
              Coming soon
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingDateTimePage;

