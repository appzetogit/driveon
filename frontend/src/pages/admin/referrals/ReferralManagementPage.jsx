import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';
import { adminService } from '../../../services';
import toastUtils from '../../../config/toast';

/**
 * Referral Management Page
 * Admin can view, filter, and manage all referral activities
 * No localStorage or Redux - All state managed via React hooks
 */
const ReferralManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial view from URL
  const getInitialView = () => {
    if (location.pathname.includes('/statistics')) return 'statistics';
    if (location.pathname.includes('/top-referrers')) return 'top-referrers';
    return 'list';
  };

  // State management
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showReferralDetail, setShowReferralDetail] = useState(false);
  const [viewMode, setViewMode] = useState(getInitialView()); // list, statistics, top-referrers
  
  const [filters, setFilters] = useState({
    status: 'all', // all, pending, completed
    dateRange: 'all', // all, today, week, month, custom
    startDate: '', // YYYY-MM-DD
    endDate: '', // YYYY-MM-DD
    referrer: 'all',
  });

  // Fetch referrals data from API (Runs only once on mount)
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllReferrals();
        
        if (response.success && response.data?.referrals) {
          setReferrals(response.data.referrals);
        } else {
          setReferrals([]);
          toastUtils.error('Failed to fetch referrals');
        }
      } catch (error) {
        console.error('Error fetching referrals:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to fetch referrals');
        setReferrals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  // Combined client-side search and filtering for referrals
  useEffect(() => {
    let filtered = [...referrals];
    
    // 1. Status Filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    
    // 2. Referrer Filter
    if (filters.referrer !== 'all') {
      filtered = filtered.filter((r) => r.referrerId === filters.referrer);
    }
    
    // 3. Date Range Filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((referral) => {
        const referralDate = referral.referralDate ? new Date(referral.referralDate) : null;
        if (!referralDate) return false;

        switch (filters.dateRange) {
          case 'today': {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return referralDate >= startOfToday;
          }
          case 'week': {
            // Start of current week (Monday)
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0);
            return referralDate >= startOfWeek;
          }
          case 'month': {
            // Start of current month
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return referralDate >= startOfMonth;
          }
          case 'custom': {
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            if (start && end) {
              return referralDate >= start && referralDate <= end;
            } else if (start) {
              return referralDate >= start;
            } else if (end) {
              return referralDate <= end;
            }
            return true;
          }
          default:
            return true;
        }
      });
    }
    
    // 4. Search Filter (Splits query by whitespace for space-independent keyword matching)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((referral) => {
        const referrerName = (referral.referrerName || '').toLowerCase();
        const referrerEmail = (referral.referrerEmail || '').toLowerCase();
        const referredUserName = (referral.referredUserName || '').toLowerCase();
        const referredUserEmail = (referral.referredUserEmail || '').toLowerCase();
        const referralCode = (referral.referralCode || '').toLowerCase();

        return keywords.every((keyword) =>
          referrerName.includes(keyword) ||
          referrerEmail.includes(keyword) ||
          referredUserName.includes(keyword) ||
          referredUserEmail.includes(keyword) ||
          referralCode.includes(keyword)
        );
      });
    }
    
    setFilteredReferrals(filtered);
  }, [referrals, filters.status, filters.dateRange, filters.startDate, filters.endDate, filters.referrer, searchQuery]);

  // Calculate statistics
  const statistics = {
    totalReferrals: referrals.length,
    completedReferrals: referrals.filter((r) => r.status === 'completed').length,
    pendingReferrals: referrals.filter((r) => r.status === 'pending').length,
    totalPointsEarned: referrals.reduce((sum, r) => sum + r.pointsEarned, 0),
    totalPointsRedeemed: referrals.reduce(
      (sum, r) => sum + r.redemptionHistory.reduce((redSum, red) => redSum + red.points, 0),
      0
    ),
    activeReferrers: new Set(referrals.map((r) => r.referrerId)).size,
  };

  // Calculate top referrers
  const topReferrers = Array.from(
    referrals.reduce((acc, referral) => {
      const referrerId = referral.referrerId;
      if (!acc.has(referrerId)) {
        acc.set(referrerId, {
          referrerId,
          referrerName: referral.referrerName,
          referrerEmail: referral.referrerEmail,
          referralCode: referral.referralCode,
          totalReferrals: 0,
          completedReferrals: 0,
          totalPointsEarned: 0,
          totalPointsRedeemed: 0,
        });
      }
      const referrer = acc.get(referrerId);
      referrer.totalReferrals++;
      if (referral.status === 'completed') {
        referrer.completedReferrals++;
        referrer.totalPointsEarned += referral.pointsEarned;
      }
      referrer.totalPointsRedeemed += referral.redemptionHistory.reduce(
        (sum, red) => sum + red.points,
        0
      );
      return acc;
    }, new Map())
  )
    .map(([_, data]) => data)
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, 10);

  const handleViewReferral = (referral) => {
    setSelectedReferral(referral);
    setShowReferralDetail(true);
  };

  const handleAdjustPoints = async (referralId, points) => {
    try {
      const response = await adminService.updateReferralPoints(referralId, points);
      if (response.success) {
        toastUtils.success('Points updated successfully');
        // Refresh referrals list
        const refreshResponse = await adminService.getAllReferrals();
        if (refreshResponse.success && refreshResponse.data?.referrals) {
          setReferrals(refreshResponse.data.referrals);
        }
      } else {
        toastUtils.error('Failed to update points');
      }
    } catch (error) {
      console.error('Error updating referral points:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update points');
    }
  };

  const handleExport = () => {
    if (referrals.length === 0) {
      toastUtils.error('No referral data available to export');
      return;
    }

    const headers = [
      'Referrer Name',
      'Referrer Email',
      'Referral Code',
      'Referred User Name',
      'Referred User Email',
      'Status',
      'Points Earned',
      'Referral Date',
      'Completed Date'
    ];

    const rows = referrals.map((r) => [
      r.referrerName || '',
      r.referrerEmail || '',
      r.referralCode || '',
      r.referredUserName || '',
      r.referredUserEmail || '',
      r.status || '',
      r.pointsEarned || 0,
      r.referralDate ? new Date(r.referralDate).toLocaleDateString() : '',
      r.completedDate ? new Date(r.completedDate).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastUtils.success('Referrals report exported successfully!');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get unique referrers
  const referrers = Array.from(
    referrals.reduce((acc, referral) => {
      if (referral.referrerId && referral.referrerName) {
        acc.set(referral.referrerId, referral.referrerName);
      }
      return acc;
    }, new Map())
  ).map(([id, name]) => ({ id, name }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
                Referral Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Manage referral activities and points</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                Export Reports
              </button>
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={viewMode === 'list' ? { backgroundColor: colors.backgroundTertiary } : {}}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('statistics')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'statistics'
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={viewMode === 'statistics' ? { backgroundColor: colors.backgroundTertiary } : {}}
                >
                  Statistics
                </button>
                <button
                  onClick={() => setViewMode('top-referrers')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'top-referrers'
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={viewMode === 'top-referrers' ? { backgroundColor: colors.backgroundTertiary } : {}}
                >
                  Top Referrers
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {statistics.totalReferrals}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Total Referrals</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-green-600">{statistics.completedReferrals}</div>
            <div className="text-xs md:text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-yellow-600">{statistics.pendingReferrals}</div>
            <div className="text-xs md:text-sm text-gray-600">Pending</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {statistics.totalPointsEarned}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Points Earned</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-purple-600">{statistics.totalPointsRedeemed}</div>
            <div className="text-xs md:text-sm text-gray-600">Points Redeemed</div>
          </Card>
        </div>

        {/* Referrals List View */}
        {viewMode === 'list' && (
          <>
            {/* Search and Filters */}
            <Card className="p-4 md:p-6 mb-6">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by referrer name, email, referral code, or referred user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <AdminCustomSelect
                  label="Status"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />

                {/* Date Range Filter */}
                <AdminCustomSelect
                  label="Date Range"
                  value={filters.dateRange}
                  onChange={(value) => setFilters({ ...filters, dateRange: value })}
                  options={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' },
                    { value: 'custom', label: 'Custom Range' },
                  ]}
                />

                {/* Referrer Filter */}
                <AdminCustomSelect
                  label="Referrer"
                  value={filters.referrer}
                  onChange={(value) => setFilters({ ...filters, referrer: value })}
                  options={[
                    { value: 'all', label: 'All Referrers' },
                    ...referrers.map((referrer) => ({
                      value: referrer.id,
                      label: referrer.name,
                    })),
                  ]}
                />
              </div>
            </Card>

            {filters.dateRange === 'custom' && (
              <Card className="p-4 md:p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Referrals List */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredReferrals.length}</span> of <span className="font-semibold">{referrals.length}</span> referrals
              </p>
            </div>

            <div className="space-y-4">
              {filteredReferrals.map((referral) => (
                <Card key={referral.id} className="p-4 hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Referral Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {referral.referrerName} → {referral.referredUserName}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            Code: <span className="font-mono font-semibold">{referral.referralCode}</span>
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                          {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                        </span>
                      </div>

                      {/* Referral Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Referrer</p>
                          <p className="text-sm font-semibold text-gray-900">{referral.referrerName}</p>
                          <p className="text-xs text-gray-500">{referral.referrerEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Referred User</p>
                          <p className="text-sm font-semibold text-gray-900">{referral.referredUserName}</p>
                          <p className="text-xs text-gray-500">{referral.referredUserEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Points Earned</p>
                          <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                            {referral.pointsEarned}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Referral Date</p>
                          <p className="text-sm text-gray-900">{new Date(referral.referralDate).toLocaleDateString()}</p>
                          {referral.completedDate && (
                            <p className="text-xs text-gray-500">Completed: {new Date(referral.completedDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      {/* Redemption History */}
                      {referral.redemptionHistory.length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs font-medium text-purple-800 mb-2">Redemption History:</p>
                          <div className="space-y-1">
                            {referral.redemptionHistory.map((redemption, index) => (
                              <p key={index} className="text-xs text-purple-700">
                                {new Date(redemption.date).toLocaleDateString()} - {redemption.points} points - {redemption.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:w-40">
                      <button
                        onClick={() => handleViewReferral(referral)}
                        className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          const points = prompt('Enter points to add (negative to subtract):');
                          if (points) handleAdjustPoints(referral.id, parseInt(points));
                        }}
                        className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                        style={{
                          color: colors.textPrimary,
                          backgroundColor: colors.backgroundLight,
                          border: `1px solid ${colors.borderMedium}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.backgroundIcon;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.backgroundLight;
                        }}
                      >
                        Adjust Points
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredReferrals.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-gray-600">No referrals found matching your filters.</p>
              </Card>
            )}
          </>
        )}

        {/* Statistics View */}
        {viewMode === 'statistics' && (
          <div className="space-y-6">
            {/* Overview Statistics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Referral Statistics Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold" style={{ color: colors.backgroundTertiary }}>
                    {statistics.totalReferrals}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.totalReferrals > 0
                      ? ((statistics.completedReferrals / statistics.totalReferrals) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Active Referrers</p>
                  <p className="text-2xl font-bold" style={{ color: colors.backgroundTertiary }}>
                    {statistics.activeReferrers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Referrals/User</p>
                  <p className="text-2xl font-bold" style={{ color: colors.backgroundTertiary }}>
                    {statistics.activeReferrers > 0
                      ? (statistics.totalReferrals / statistics.activeReferrers).toFixed(1)
                      : 0}
                  </p>
                </div>
              </div>
            </Card>

            {/* Points Statistics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Points Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Points Earned</p>
                  <p className="text-2xl font-bold" style={{ color: colors.backgroundTertiary }}>
                    {statistics.totalPointsEarned}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Points Redeemed</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.totalPointsRedeemed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Available Points</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.totalPointsEarned - statistics.totalPointsRedeemed}
                  </p>
                </div>
              </div>
            </Card>

            {/* Chart Placeholder */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Referral Trends</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart visualization will appear here</p>
              </div>
            </Card>
          </div>
        )}

        {/* Top Referrers View */}
        {viewMode === 'top-referrers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Top Referrers</h2>
            {topReferrers.map((referrer, index) => (
              <Card key={referrer.referrerId} className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {index + 1}
                  </div>

                  {/* Referrer Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{referrer.referrerName}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {referrer.referrerEmail} • Code: <span className="font-mono">{referrer.referralCode}</span>
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Total Referrals</p>
                        <p className="text-sm font-semibold text-gray-900">{referrer.totalReferrals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Completed</p>
                        <p className="text-sm font-semibold text-green-600">{referrer.completedReferrals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Points Earned</p>
                        <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                          {referrer.totalPointsEarned}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Points Redeemed</p>
                        <p className="text-sm font-semibold text-purple-600">{referrer.totalPointsRedeemed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Referral Detail Modal */}
      {showReferralDetail && selectedReferral && (
        <ReferralDetailModal
          referral={selectedReferral}
          onClose={() => {
            setShowReferralDetail(false);
            setSelectedReferral(null);
          }}
          onAdjustPoints={handleAdjustPoints}
        />
      )}
    </div>
  );
};

/**
 * Referral Detail Modal Component
 */
const ReferralDetailModal = ({ referral, onClose, onAdjustPoints }) => {
  if (!referral) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Referral Details</h2>
            <p className="text-sm text-gray-600">Code: {referral.referralCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Referrer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{referral.referrerName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{referral.referrerEmail}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Referral Code</label>
                <p className="text-sm text-gray-900 font-mono">{referral.referralCode}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Referrer ID</label>
                <p className="text-sm text-gray-900">{referral.referrerId}</p>
              </div>
            </div>
          </div>

          {/* Referred User Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referred User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{referral.referredUserName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{referral.referredUserEmail}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Referred User ID</label>
                <p className="text-sm text-gray-900">{referral.referredUserId}</p>
              </div>
            </div>
          </div>

          {/* Referral Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Status</label>
                <p className="text-sm text-gray-900 capitalize">{referral.status}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Points Earned</label>
                <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                  {referral.pointsEarned}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Referral Date</label>
                <p className="text-sm text-gray-900">{new Date(referral.referralDate).toLocaleString()}</p>
              </div>
              {referral.completedDate && (
                <div>
                  <label className="text-xs font-medium text-gray-700">Completed Date</label>
                  <p className="text-sm text-gray-900">{new Date(referral.completedDate).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Redemption History */}
          {referral.redemptionHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Redemption History</h3>
              <div className="space-y-2">
                {referral.redemptionHistory.map((redemption, index) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{redemption.description}</p>
                        <p className="text-xs text-gray-500">{new Date(redemption.date).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        -{redemption.points} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{
              borderColor: colors.borderMedium,
              color: colors.textPrimary,
              backgroundColor: colors.backgroundSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.backgroundLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.backgroundSecondary;
            }}
          >
            Close
          </button>
          <button
            onClick={() => {
              const points = prompt('Enter points to add (negative to subtract):');
              if (points) {
                onAdjustPoints(referral.id, parseInt(points));
                onClose();
              }
            }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Adjust Points
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralManagementPage;

