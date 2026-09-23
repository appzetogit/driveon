import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdPeople,
  MdBuild,
  MdEventAvailable,
  MdCheckCircle,
  MdShowChart,
  MdPieChart,
  MdArrowForward,
  MdAdd,
  MdSearch,
  MdNotifications,
  MdPersonAdd,
  MdBadge,
  MdCurrencyRupee,
  MdDirectionsCar,
  MdStore,
  MdCancel,
  MdHourglassEmpty,
  MdDriveEta,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { premiumColors } from '../../theme/colors';
import { rgba } from 'polished';
import crmService from '../../services/crm.service';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { onMessageListener } from "../../services/firebase";
import toastUtils from '../../config/toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      enquiries: { total: 0, convertedToday: 0 },
      conversions: { month: 0 },
      staff: { total: 0, telecallers: 0, drivers: 0, perTripDrivers: 0, monthlyDrivers: 0, accountantHR: 0 },
      attendance: { present: 0, absent: 0, leave: 0, late: 0, halfDay: 0 },
      payroll: { active: 0, paidMonth: 0, pendingMonth: 0 },
      expense: { spentMonth: 0 },
      garage: { total: 0, active: 0 },
      vendor: { total: 0, cars: 0 },
      trips: { assigned: 0 }
    },
    enquiryPulse: [],
    leadPipeline: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 CRM Update: ${payload.notification.title}`);
        console.log("CRM Notification:", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await crmService.getAnalytics();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderVal = (val, width = 'w-12') => {
    if (loading) {
      return <span className={`animate-pulse bg-gray-200 h-6 ${width} rounded inline-block align-middle`}></span>;
    }
    return val;
  };

  const { stats, enquiryPulse, leadPipeline } = data || {
    stats: {
      enquiries: { total: 0, convertedToday: 0 },
      conversions: { month: 0 },
      staff: { total: 0, telecallers: 0, drivers: 0, perTripDrivers: 0, monthlyDrivers: 0, accountantHR: 0 },
      attendance: { present: 0, absent: 0, leave: 0, late: 0, halfDay: 0 },
      payroll: { active: 0, paidMonth: 0, pendingMonth: 0 },
      expense: { spentMonth: 0 },
      garage: { total: 0, active: 0 },
      vendor: { total: 0, cars: 0 },
      trips: { assigned: 0 }
    },
    enquiryPulse: [],
    leadPipeline: []
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CRM Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time business intelligence and operations command center.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Live System Active</span>
        </div>
      </div>

      {/* CATEGORY 1: ENQUIRY INSIGHTS */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Enquiry Insights</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/enquiries/all')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><MdPeople size={24} /></div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Enquiries</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{renderVal(stats.enquiries.total, 'w-16')}</h3>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/enquiries/converted')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><MdCheckCircle size={24} /></div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Converted Today</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{renderVal(stats.enquiries.convertedToday || 0, 'w-10')}</h3>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/enquiries/converted')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600"><MdShowChart size={24} /></div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Converted This Month</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5">{renderVal(stats.conversions.month, 'w-12')}</h3>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* CATEGORY 2: STAFF OPERATIONS */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Staff & Roles</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-purple-600 mb-2"><MdPeople size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.total, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Total Staff</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-indigo-600 mb-2"><MdBadge size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.telecallers || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Telecallers</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-blue-600 mb-2"><MdDirectionsCar size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.drivers || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Total Drivers</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-emerald-600 mb-2"><MdDirectionsCar size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.perTripDrivers || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Per Trip Drivers</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-orange-600 mb-2"><MdDirectionsCar size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.monthlyDrivers || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Monthly Drivers</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-rose-600 mb-2"><MdPeople size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.staff.accountantHR || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Accountant / HR</p>
          </motion.div>
        </motion.div>
      </div>

      {/* CATEGORY 3: TODAY'S ATTENDANCE */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Today's Attendance Status</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/attendance')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-green-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-green-600 mb-1 font-bold">{renderVal(stats.attendance.present || 0, 'w-8')}</div>
            <p className="text-gray-700 text-sm font-extrabold">Present Today</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/attendance')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-red-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-red-600 mb-1 font-bold">{renderVal(stats.attendance.absent || 0, 'w-8')}</div>
            <p className="text-gray-700 text-sm font-extrabold">Absent Today</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/attendance')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-orange-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-orange-600 mb-1 font-bold">{renderVal(stats.attendance.leave || 0, 'w-8')}</div>
            <p className="text-gray-700 text-sm font-extrabold">On Leave</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/attendance')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-amber-600 mb-1 font-bold">{renderVal(stats.attendance.late || 0, 'w-8')}</div>
            <p className="text-gray-700 text-sm font-extrabold">Late Arrivals</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/attendance')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-400 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-blue-500 mb-1 font-bold">{renderVal(stats.attendance.halfDay || 0, 'w-8')}</div>
            <p className="text-gray-700 text-sm font-extrabold">Half Day Today</p>
          </motion.div>
        </motion.div>
      </div>

      {/* CATEGORY 4: FINANCE & PAYROLL */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Finance & Payroll</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/salary')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-blue-600 mb-2"><MdBadge size={24} /></div>
            <h3 className="text-2xl font-black text-gray-900">{renderVal(stats.payroll.active || 0, 'w-10')}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Active Payroll Staff</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/salary')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-emerald-600 mb-2"><MdCurrencyRupee size={24} /></div>
            <h3 className="text-2xl font-black text-gray-900">{renderVal(formatCurrency(stats.payroll.paidMonth || 0), 'w-24')}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Paid This Month</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/staff/salary')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-rose-600 mb-2"><MdCurrencyRupee size={24} /></div>
            <h3 className="text-2xl font-black text-gray-900">{renderVal(formatCurrency(stats.payroll.pendingMonth || 0), 'w-24')}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Pending Payouts</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/expenses/track')}
            className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-purple-600 mb-2"><MdCurrencyRupee size={24} /></div>
            <h3 className="text-2xl font-black text-gray-900">{renderVal(formatCurrency(stats.expense.spentMonth || 0), 'w-24')}</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Spent This Month</p>
          </motion.div>
        </motion.div>
      </div>

      {/* CATEGORY 5: LOGISTICS & OPERATIONS */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Operations & Logistics</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/garage/all')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-rose-600 mb-2"><MdStore size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.garage.total || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Active Garages</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/garage/active')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-orange-600 mb-2"><MdBuild size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.garage.active || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Active Repairs</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/vendors/all')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-indigo-600 mb-2"><MdStore size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.vendor.total || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Active Vendors</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/crm/vendors/all')}
            className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="text-blue-600 mb-2"><MdDriveEta size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.vendor.cars || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Total Vendor Cars</p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-4 rounded-[1.25rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="text-emerald-600 mb-2"><MdEventAvailable size={22} /></div>
            <h3 className="text-xl font-extrabold text-gray-900">{renderVal(stats.trips.assigned || 0, 'w-8')}</h3>
            <p className="text-gray-500 text-xs font-semibold">Assigned Trips</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry Pulse - Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enquiry Pulse</h3>
              <p className="text-xs text-gray-400">Weekly intake vs conversions</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div> New
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Converted
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-400">Loading metrics...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enquiryPulse}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    animationDuration={2000}
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorConv)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Lead Pipeline - Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center"
        >
          <div className="w-full text-left mb-6">
            <h3 className="text-lg font-bold text-gray-900">Lead Pipeline</h3>
            <p className="text-xs text-gray-400">Current status of active leads</p>
          </div>

          <div className="relative w-full h-64 flex items-center justify-center">
            {loading ? (
              <div className="w-40 h-40 rounded-full border-[6px] border-gray-100 border-t-blue-500 animate-spin flex items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-gray-400">Loading...</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadPipeline}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {leadPipeline.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-gray-900">{stats.enquiries.total}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Leads</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-4">
            {loading ? (
              <div className="col-span-2 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
              </div>
            ) : (
              leadPipeline.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default DashboardPage;
