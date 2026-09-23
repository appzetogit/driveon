import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { theme } from '../../theme/theme.constants';

/**
 * GuarantorHistoryPage Component
 * Shows user's guarantor history with all past guarantor relationships
 * Mobile-first design matching the app's UI structure
 */
const GuarantorHistoryPage = () => {
  const navigate = useNavigate();
  const { guarantor } = useAppSelector((state) => state.user);

  // Mock guarantor history data - Replace with actual API call later
  const mockGuarantorHistory = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '+91 9876543210',
      email: 'rajesh.kumar@example.com',
      relationship: 'Friend',
      status: 'verified',
      addedDate: '2024-01-15',
      verifiedDate: '2024-01-16',
      removedDate: null,
      bookingsCount: 5,
    },
    {
      id: '2',
      name: 'Priya Sharma',
      phone: '+91 9876543211',
      email: 'priya.sharma@example.com',
      relationship: 'Family',
      status: 'removed',
      addedDate: '2023-12-10',
      verifiedDate: '2023-12-12',
      removedDate: '2024-01-10',
      bookingsCount: 3,
    },
    {
      id: '3',
      name: 'Amit Patel',
      phone: '+91 9876543212',
      email: 'amit.patel@example.com',
      relationship: 'Colleague',
      status: 'pending',
      addedDate: '2023-11-05',
      verifiedDate: null,
      removedDate: '2023-11-20',
      bookingsCount: 0,
    },
  ];

  const [guarantorHistory] = useState(mockGuarantorHistory);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Verified',
        icon: (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Pending',
        icon: (
          <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        ),
      },
      removed: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: 'Removed',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header */}
      <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>
        <div className="relative px-4 pt-2 pb-2 md:px-6 md:py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-1.5">
              <button
                onClick={() => navigate(-1)}
                className="p-1 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors md:p-1.5"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Guarantor History</h1>
              <div className="w-8"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 pb-4 md:pt-6 md:pb-4">
        <div className="max-w-7xl mx-auto">
          {guarantorHistory.length === 0 ? (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-md border text-center" style={{ borderColor: theme.colors.borderLight }}>
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <svg className="w-8 h-8 md:w-10 md:h-10" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                No History Found
              </h3>
              <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                You haven't added any guarantors yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {guarantorHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 md:p-5 shadow-md border"
                  style={{ borderColor: theme.colors.borderLight }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base md:text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                          {item.name}
                        </h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="space-y-1.5">
                        {item.phone && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" style={{ color: theme.colors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                              {item.phone}
                            </p>
                          </div>
                        )}
                        {item.email && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" style={{ color: theme.colors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs md:text-sm truncate" style={{ color: theme.colors.textSecondary }}>
                              {item.email}
                            </p>
                          </div>
                        )}
                        {item.relationship && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs md:text-sm px-2 py-0.5 rounded-md" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                              {item.relationship}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: theme.colors.borderLight }}>
                    <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                      <div>
                        <p className="font-medium mb-1" style={{ color: theme.colors.textTertiary }}>
                          Added
                        </p>
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                          {formatDate(item.addedDate)}
                        </p>
                      </div>
                      {item.verifiedDate && (
                        <div>
                          <p className="font-medium mb-1" style={{ color: theme.colors.textTertiary }}>
                            Verified
                          </p>
                          <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                            {formatDate(item.verifiedDate)}
                          </p>
                        </div>
                      )}
                      {item.removedDate && (
                        <div>
                          <p className="font-medium mb-1" style={{ color: theme.colors.textTertiary }}>
                            Removed
                          </p>
                          <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                            {formatDate(item.removedDate)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium mb-1" style={{ color: theme.colors.textTertiary }}>
                          Bookings
                        </p>
                        <p className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                          {item.bookingsCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuarantorHistoryPage;

