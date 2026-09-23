import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { colors } from '../../module/theme/colors';
import Card from '../../components/common/Card';
import { adminService } from '../../services/admin.service';
import { onMessageListener } from "../../services/firebase";
import toastUtils from '../../config/toast';

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};

/**
 * Admin Dashboard Page
 * Comprehensive admin dashboard based on ADMIN_PANEL_PLAN.md
 * No localStorage or Redux - All state managed via React hooks
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [chartView, setChartView] = useState('monthly');

  // Dashboard data state (using useState)
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    stats: {
      totalUsers: 0,
      totalCars: 0,
      activeBookings: 0,
      totalBookings: 0,
      pendingKYC: 0,
      todayRevenue: 0,
      activeTrips: 0,
      totalOutwardCars: 0,
      pendingBookings: 0,
      totalInwardBookings: 0,
      totalOutwardBookings: 0,
      activeOffers: 0,
      activeCoupons: 0,
      totalAddonServices: 0,
    },
    recentBookings: [],
    pendingKYC: [],
    recentPayments: [],
    revenueTrend: [],
    bookingTrends: [],
    userGrowth: [],
    topCars: [],
  });

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 Admin Alert: ${payload.notification.title}`);
        console.log("Admin Notification:", payload);

        // Refresh dashboard data on new notification if relevant
        // fetchDashboardData(); 
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch dashboard statistics from backend with year parameter
        const statsResponse = await adminService.getDashboardStats({ year: selectedYear });

        if (statsResponse.success && statsResponse.data) {
          const stats = statsResponse.data.stats;

          setDashboardData(prev => ({
            ...prev,
            loading: false,
            stats: {
              totalUsers: stats.totalUsers || 0,
              totalCars: stats.totalCars || 0,
              activeBookings: stats.activeBookings || 0,
              totalBookings: stats.totalBookings || 0,
              pendingKYC: stats.pendingKYC || 0,
              todayRevenue: stats.todayRevenue || 0,
              activeTrips: stats.activeTrips || 0,
              totalOutwardCars: stats.totalOutwardCars || 0,
              pendingBookings: stats.pendingBookings || 0,
              totalInwardBookings: stats.totalInwardBookings || 0,
              totalOutwardBookings: stats.totalOutwardBookings || 0,
              activeOffers: stats.activeOffers || 0,
              activeCoupons: stats.activeCoupons || 0,
              totalAddonServices: stats.totalAddonServices || 0,
            },
            recentBookings: statsResponse.data.recentBookings || [],
            pendingKYC: statsResponse.data.pendingKYC || [],
            recentPayments: statsResponse.data.recentPayments || [],
            bookingTrends: statsResponse.data.bookingTrends || { monthly: [], yearly: [] },
            topCars: statsResponse.data.topCars || [],
          }));
        } else {
          setDashboardData(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [selectedYear]);

  // Helper to render value or skeleton
  const renderStatValue = (val, width = 'w-12') => {
    if (dashboardData.loading) {
      return <span className={`animate-pulse bg-gray-200 h-6 ${width} rounded inline-block align-middle`}></span>;
    }
    return val;
  };

  // Overview Statistics Cards
  const statsCards = [
    {
      title: 'Total Users',
      value: renderStatValue(dashboardData.stats.totalUsers.toLocaleString(), 'w-12'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: colors.backgroundTertiary,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/users'),
    },
    {
      title: 'Total Cars',
      value: renderStatValue(dashboardData.stats.totalCars.toLocaleString(), 'w-12'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      color: colors.info,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/cars'),
    },
    {
      title: 'Total Bookings',
      value: renderStatValue(dashboardData.stats.totalBookings.toString(), 'w-10'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: colors.success,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/bookings'),
    },
    {
      title: "Today's Revenue",
      value: renderStatValue(formatCurrency(dashboardData.stats.todayRevenue), 'w-16'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: colors.success,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/payments'),
    },
    {
      title: 'Active Trips',
      value: renderStatValue(dashboardData.stats.activeTrips.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: colors.info,
      change: 'Live',
      changeType: 'info',
      onClick: () => navigate('/admin/bookings/active'),
    },
    {
      title: 'Total Outward Cars',
      value: renderStatValue(dashboardData.stats.totalOutwardCars.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: colors.warning,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/cars/add-outward'),
    },
    {
      title: 'Pending Bookings',
      value: renderStatValue(dashboardData.stats.pendingBookings.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: colors.warning,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/bookings/pending'),
    },
    {
      title: 'Total Inward Bookings',
      value: renderStatValue(dashboardData.stats.totalInwardBookings.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: colors.success,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/fleet/inward-bookings'),
    },
    {
      title: 'Total Outward Bookings',
      value: renderStatValue(dashboardData.stats.totalOutwardBookings.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      color: colors.info,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/bookings'),
    },
    {
      title: 'Active Offers',
      value: renderStatValue(dashboardData.stats.activeOffers.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      color: colors.error,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/offers'),
    },
    {
      title: 'Active Add-on Services',
      value: renderStatValue(dashboardData.stats.totalAddonServices.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: colors.success,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/addon-services'),
    },
    {
      title: 'Active Coupons',
      value: renderStatValue(dashboardData.stats.activeCoupons.toString(), 'w-8'),
      icon: (
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      color: colors.backgroundTertiary,
      change: '',
      changeType: 'neutral',
      onClick: () => navigate('/admin/coupons'),
    },
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      confirmed: colors.success,
      pending: colors.warning,
      active: colors.info,
      completed: colors.backgroundTertiary,
      cancelled: colors.error,
      success: colors.success,
      'Advance Done': colors.success,
      failed: colors.error,
    };
    return statusColors[status] || colors.textSecondary;
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Admin Dashboard
          </h1>
          <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>Welcome back! Here's what's happening today.</p>
        </div>

        {/* Overview Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 md:mb-8">
          {statsCards.map((stat, index) => (
            <Card
              key={index}
              variant="clickable"
              onClick={stat.onClick}
              className="p-3 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex gap-3">
                {/* Left Column: Icon and Title */}
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                    {stat.title}
                  </div>
                </div>

                {/* Right Column: Number and Status */}
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  <div className="text-lg md:text-xl font-bold text-right" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div
                    className="text-xs font-medium whitespace-nowrap"
                    style={{
                      color: stat.changeType === 'positive' ? colors.success :
                        stat.changeType === 'warning' ? colors.warning :
                          stat.changeType === 'info' ? colors.info :
                            stat.changeType === 'neutral' ? colors.textTertiary : colors.textSecondary
                    }}
                  >
                    {stat.change}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Booking Trends & Top Cars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
          {/* Left Column: Booking Trends Chart */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col gap-4 mb-6">
              {/* Row 1: Title & Legends */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <h3 className="text-lg md:text-xl font-semibold whitespace-nowrap" style={{ color: colors.textPrimary }}>
                  In-Out Booking  Analytics
                </h3>

                {/* Custom Legend like CRM */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 whitespace-nowrap">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> Total Bookings
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 whitespace-nowrap">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Inward Bookings
                  </div>
                </div>
              </div>

              {/* Row 2: Controls */}
              <div className="flex items-center justify-end gap-3">
                {/* Month/Year View Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setChartView('monthly')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${chartView === 'monthly' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    style={chartView === 'monthly' ? { backgroundColor: colors.backgroundTertiary } : {}}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartView('yearly')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${chartView === 'yearly' ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    style={chartView === 'yearly' ? { backgroundColor: colors.backgroundTertiary } : {}}
                  >
                    Yearly
                  </button>
                </div>

                {/* Year Selector Dropdown (Only active in Monthly View) */}
                {chartView === 'monthly' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-semibold border rounded-lg bg-white outline-none cursor-pointer"
                    style={{
                      borderColor: colors.borderMedium || '#D1D5DB',
                      color: colors.textPrimary || '#1F2937',
                    }}
                  >
                    {Array.from({ length: 2090 - 2025 + 1 }, (_, i) => 2025 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div style={{ height: '350px', width: '100%' }}>
              {dashboardData.loading ? (
                <div className="h-full w-full bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-400">Loading booking trends...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'monthly' ? (
                    <AreaChart
                      data={dashboardData.bookingTrends?.monthly || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        name="Total Bookings"
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBookings)"
                        animationDuration={2000}
                      />
                      <Area
                        name="Inward Bookings"
                        type="monotone"
                        dataKey="inwardBookings"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorInward)"
                        animationDuration={2000}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={dashboardData.bookingTrends?.yearly || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.6} />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                      />
                      <Bar
                        name="Total Bookings"
                        dataKey="bookings"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar
                        name="Inward Bookings"
                        dataKey="inwardBookings"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Right Column: Top 5 Cars by Revenue */}
          <Card className="p-4 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.textPrimary }}>
                    Top Revenue Cars
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Top 5 cars generating the highest booking revenue.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/cars')}
                  className="text-sm font-medium hover:underline flex-shrink-0"
                  style={{ color: colors.backgroundTertiary }}
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {dashboardData.loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="h-12 bg-gray-50 rounded animate-pulse w-full"></div>
                    ))}
                  </div>
                ) : dashboardData.topCars && dashboardData.topCars.length > 0 ? (
                  dashboardData.topCars.slice(0, 5).map((car, index) => {
                    const rowBg = index === 0 ? 'rgba(254, 243, 199, 0.25)' // soft gold/yellow
                      : index === 1 ? 'rgba(224, 242, 254, 0.25)' // soft blue
                        : index === 2 ? 'rgba(255, 237, 213, 0.25)' // soft orange/bronze
                          : 'transparent';
                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-1.5 p-3 rounded-xl border border-transparent transition-all"
                        style={rowBg !== 'transparent' ? { backgroundColor: rowBg, borderColor: index === 0 ? '#FDE68A' : index === 1 ? '#BAE6FD' : '#FED7AA' } : { borderBottom: '1px solid #F3F4F6' }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Car Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Rank Circle Badge */}
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: index === 0 ? '#FEF3C7' : index === 1 ? '#BAE6FD' : index === 2 ? '#FFEDD5' : '#F3F4F6',
                                color: index === 0 ? '#D97706' : index === 1 ? '#0369A1' : index === 2 ? '#EA580C' : '#9CA3AF',
                              }}
                            >
                              #{index + 1}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                                {car.name || 'Unknown Car'}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 font-mono bg-gray-100/80 px-1.5 py-0.5 rounded">
                                  {car.registrationNumber || 'N/A'}
                                </span>
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                                  style={{
                                    backgroundColor: car.source === 'outward' ? '#DBEAFE' : '#E8F5E9',
                                    color: car.source === 'outward' ? '#1D4ED8' : '#1B5E20'
                                  }}
                                >
                                  {car.source || 'inward'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Revenue Amount */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-bold" style={{ color: colors.success }}>
                              ₹{(car.revenue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No revenue data available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Bookings */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.textPrimary }}>Recent Bookings</h3>
              <button
                onClick={() => navigate('/admin/bookings')}
                className="text-sm font-medium hover:underline"
                style={{ color: colors.backgroundTertiary }}
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="h-16 bg-gray-50 rounded animate-pulse w-full"></div>
                  ))}
                </div>
              ) : dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.backgroundLight,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{booking.userId}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{booking.car}</p>
                      <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{booking.time}</p>
                    </div>
                    <div className="flex flex-col items-end ml-3">
                      <span className="text-sm font-bold" style={{ color: colors.backgroundTertiary }}>
                        {formatCurrency(booking.amount)}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white mt-1"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8" style={{ color: colors.textSecondary }}>
                  <p className="text-sm">No recent bookings</p>
                </div>
              )}
            </div>
          </Card>



          {/* Recent Payments */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-semibold" style={{ color: colors.textPrimary }}>Recent Payments</h3>
              <button
                onClick={() => navigate('/admin/payments')}
                className="text-sm font-medium hover:underline"
                style={{ color: colors.backgroundTertiary }}
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {dashboardData.loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="h-16 bg-gray-50 rounded animate-pulse w-full"></div>
                  ))}
                </div>
              ) : dashboardData.recentPayments.length > 0 ? (
                dashboardData.recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.backgroundLight,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{payment.userId}</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Booking: {payment.bookingId}</p>
                      <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>{payment.time}</p>
                    </div>
                    <div className="flex flex-col items-end ml-3">
                      <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                        {formatCurrency(payment.amount)}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full text-white mt-1"
                        style={{ backgroundColor: getStatusColor(payment.status) }}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8" style={{ color: colors.textSecondary }}>
                  <p className="text-sm">No recent payments</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
