import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MdPersonAdd, 
  MdEvent, 
  MdSearch, 
  MdFilterList,
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
  MdPhone,
  MdWork,
  MdAttachMoney,
  MdCheckCircle,
  MdCancel,
  MdAccessTime
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { premiumColors } from '../../theme/colors';

// Helper for formatted display date
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Staff Directory Component (Connected to Real API)
const StaffDirectory = ({ staffList, loading, searchTerm, setSearchTerm, statusFilter, setStatusFilter, onRefresh }) => {
  const navigate = useNavigate();

  const filteredStaff = staffList.filter(staff => {
    const cleanSearch = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = 
      (staff.name || '').toLowerCase().includes(cleanSearch) || 
      (staff.role || '').toLowerCase().includes(cleanSearch) ||
      (staff.department || '').toLowerCase().includes(cleanSearch) ||
      (staff.phone || '').includes(cleanSearch);

    const matchesStatus = statusFilter === 'All' || staff.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSalaryDisplay = (staff) => {
    const salary = staff.salary || 0;
    if (staff.salaryMethod === 'Daily') {
      return `₹${salary.toLocaleString('en-IN')}/day`;
    }
    if (staff.salaryMethod === 'Per Trip') {
      return `₹${salary.toLocaleString('en-IN')}/trip`;
    }
    const days = staff.workingDays || 26;
    const perDay = days > 0 ? Math.round(salary / days) : salary;
    return `₹${perDay.toLocaleString('en-IN')}/day (₹${salary.toLocaleString('en-IN')}/mo)`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'On Duty':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Leave':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Inactive':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search by name, role, department or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Duty">On Duty</option>
              <option value="Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button 
            onClick={onRefresh}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            title="Refresh Staff List"
          >
            <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-3" style={{ borderColor: premiumColors.primary.DEFAULT }}></div>
          <p className="text-sm text-gray-500 font-medium">Loading staff records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map(staff => (
            <div 
              key={staff._id || staff.id} 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4 relative group"
            >
              {staff.avatar ? (
                <img 
                  src={staff.avatar} 
                  alt={staff.name} 
                  className="w-14 h-14 rounded-full object-cover bg-gray-100 border border-gray-200 flex-shrink-0" 
                />
              ) : (
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: premiumColors.primary.DEFAULT }}
                >
                  {(staff.name || 'S').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 text-base truncate" title={staff.name}>
                    {staff.name}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusBadgeClass(staff.status)}`}>
                    {staff.status || 'Active'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                  {staff.role} {staff.department ? `• ${staff.department}` : ''}
                </p>

                {staff.phone && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">
                    <MdPhone size={12} className="flex-shrink-0" />
                    {staff.phone}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600 font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 w-fit">
                  <span className="font-bold text-gray-800">{getSalaryDisplay(staff)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Staff Card */}
          <div 
            onClick={() => navigate('/crm/staff/directory')}
            className="bg-gray-50/70 hover:bg-blue-50/50 rounded-2xl p-5 border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition-all cursor-pointer h-full min-h-[140px] group"
          >
            <div className="w-12 h-12 rounded-full bg-white group-hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm mb-2">
              <MdPersonAdd size={24} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-700">Add New Staff</span>
            <span className="text-xs text-gray-400 mt-0.5">Open staff management directory</span>
          </div>
        </div>
      )}

      {!loading && filteredStaff.length === 0 && (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="font-semibold text-gray-700">No staff found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria or add new staff members</p>
        </div>
      )}
    </div>
  );
};

// Attendance Tracker Component (Connected to Real API)
const AttendanceTracker = ({ staffList, currentDate, setCurrentDate, attendanceMap, loading, onMarkAttendance, onMarkAllPresent }) => {
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/70">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
            title="Previous Day"
          >
            <MdChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <MdEvent className="text-blue-600" size={18} />
            <input 
              type="date"
              value={currentDate}
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
            />
          </div>

          <button 
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
            title="Next Day"
          >
            <MdChevronRight size={20} />
          </button>

          <button
            onClick={handleToday}
            className="text-xs font-bold px-2.5 py-1.5 bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onMarkAllPresent}
            disabled={loading || staffList.length === 0}
            className="text-xs font-bold px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all shadow-sm disabled:opacity-50"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Attendance List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-3" style={{ borderColor: premiumColors.primary.DEFAULT }}></div>
          <p className="text-sm text-gray-500 font-medium">Loading attendance for {formatDisplayDate(currentDate)}...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p className="font-semibold text-gray-700">No active staff members found</p>
          <p className="text-xs text-gray-400 mt-1">Please add staff members in the Directory tab</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {staffList.map(staff => {
            const staffId = staff._id || staff.id;
            const record = attendanceMap[staffId];
            const currentStatus = record?.status || null;

            return (
              <div key={staffId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  {staff.avatar ? (
                    <img 
                      src={staff.avatar} 
                      alt={staff.name} 
                      className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: premiumColors.primary.DEFAULT }}
                    >
                      {(staff.name || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{staff.name}</p>
                      {currentStatus ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          currentStatus === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          currentStatus === 'Absent' ? 'bg-rose-100 text-rose-800' :
                          currentStatus === 'Half Day' ? 'bg-amber-100 text-amber-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {currentStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">
                          Unmarked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{staff.role} {staff.department ? `• ${staff.department}` : ''}</p>
                  </div>
                </div>
                
                {/* Attendance Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Present Button */}
                  <button 
                    onClick={() => onMarkAttendance(staffId, 'Present')}
                    className={`flex flex-col items-center gap-0.5 transition-all p-1 rounded-lg ${
                      currentStatus === 'Present' ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mark Present"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      currentStatus === 'Present' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200' 
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                    }`}>
                      P
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">Present</span>
                  </button>

                  {/* Absent Button */}
                  <button 
                    onClick={() => onMarkAttendance(staffId, 'Absent')}
                    className={`flex flex-col items-center gap-0.5 transition-all p-1 rounded-lg ${
                      currentStatus === 'Absent' ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mark Absent"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      currentStatus === 'Absent' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-rose-200' 
                        : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white'
                    }`}>
                      A
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">Absent</span>
                  </button>

                  {/* Half Day Button */}
                  <button 
                    onClick={() => onMarkAttendance(staffId, 'Half Day')}
                    className={`flex flex-col items-center gap-0.5 transition-all p-1 rounded-lg ${
                      currentStatus === 'Half Day' ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mark Half Day"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      currentStatus === 'Half Day' 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-amber-200' 
                        : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
                    }`}>
                      H
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">Half Day</span>
                  </button>

                  {/* Leave Button */}
                  <button 
                    onClick={() => onMarkAttendance(staffId, 'Leave')}
                    className={`flex flex-col items-center gap-0.5 transition-all p-1 rounded-lg ${
                      currentStatus === 'Leave' ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mark Leave"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      currentStatus === 'Leave' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                        : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                    }`}>
                      L
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">Leave</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Payroll Preview Component (Connected to Real API)
const PayrollPreview = ({ payrollData, loading, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, onRefresh }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const payrolls = payrollData?.payrolls || [];

  const totalPayable = payrolls.reduce((sum, p) => sum + (p.totalNetPayable || p.netPayable || 0), 0);
  const totalPaid = payrolls.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalPending = Math.max(0, totalPayable - totalPaid);

  return (
    <div className="space-y-6">
      {/* Month & Year Selection Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>{name}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onRefresh}
          className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
          title="Recalculate Payroll"
        >
          <MdRefresh size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-100 shadow-sm">
          <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Total Payable</p>
          <p className="text-2xl font-black text-blue-950 mt-1">₹{totalPayable.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-blue-600/80 mt-1">{payrolls.length} Staff calculated</p>
        </div>

        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Disbursed / Paid</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-emerald-600/80 mt-1">Processed payments</p>
        </div>

        <div className="bg-rose-50/80 p-5 rounded-2xl border border-rose-100 shadow-sm">
          <p className="text-xs text-rose-600 uppercase font-bold tracking-wider">Pending Amount</p>
          <p className="text-2xl font-black text-rose-950 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-rose-600/80 mt-1">Outstanding payout</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-3" style={{ borderColor: premiumColors.primary.DEFAULT }}></div>
            <p className="text-sm text-gray-500 font-medium">Calculating payroll for {monthNames[selectedMonth]} {selectedYear}...</p>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <p className="font-semibold text-gray-700">No payroll records for this period</p>
            <p className="text-xs text-gray-400 mt-1">Select another month or check staff attendance logs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4">Staff Member</th>
                  <th className="px-5 py-4 text-center">Days Worked</th>
                  <th className="px-5 py-4 text-right">Base / Rate</th>
                  <th className="px-5 py-4 text-right">Deductions</th>
                  <th className="px-5 py-4 text-right">Net Payable</th>
                  <th className="px-5 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map((payroll) => {
                  const daysWorked = (payroll.presentDays || 0) + ((payroll.halfDays || 0) * 0.5);
                  const totalDeductions = (payroll.absentDeduction || 0) + (payroll.halfDayDeduction || 0) + (payroll.leaveDeduction || 0);
                  const isPaid = payroll.salaryStatus === 'Paid';

                  return (
                    <tr key={payroll.staffId} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{payroll.name}</p>
                        <p className="text-xs text-gray-400">{payroll.role} {payroll.department ? `• ${payroll.department}` : ''}</p>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-medium">
                        {daysWorked} / {payroll.workingDays || 26}
                      </td>
                      <td className="px-5 py-4 text-right font-mono">
                        ₹{(payroll.baseSalary || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-rose-600">
                        {totalDeductions > 0 ? `- ₹${totalDeductions.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900 font-mono">
                        ₹{(payroll.totalNetPayable || payroll.netPayable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {payroll.salaryStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Staff Page Component
const StaffPage = () => {
  const [activeTab, setActiveTab] = useState('Directory'); // Directory, Attendance, Payroll
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Real Data States
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [payrollData, setPayrollData] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  // 1. Fetch Staff List from API
  const fetchStaffList = useCallback(async () => {
    try {
      setStaffLoading(true);
      const res = await api.get('/crm/staff');
      if (res.data?.success && res.data?.data?.staff) {
        setStaffList(res.data.data.staff);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error('Failed to fetch CRM staff:', err);
      toast.error('Failed to load staff list');
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  // 2. Fetch Attendance for Current Date
  const fetchAttendance = useCallback(async (date) => {
    try {
      setAttendanceLoading(true);
      const res = await api.get('/crm/attendance', { params: { date } });
      const records = res.data?.data?.records || [];
      const map = {};
      records.forEach(rec => {
        const sId = rec.staff?._id || rec.staff;
        if (sId) {
          map[sId.toString()] = rec;
        }
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
      setAttendanceMap({});
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // 3. Fetch Payroll Calculation for Month & Year
  const fetchPayroll = useCallback(async (month, year) => {
    try {
      setPayrollLoading(true);
      const res = await api.get('/crm/staff/payroll/calculate', { params: { month, year } });
      if (res.data?.success && res.data?.data) {
        setPayrollData(res.data.data);
      } else {
        setPayrollData(null);
      }
    } catch (err) {
      console.error('Failed to fetch calculated payroll:', err);
      setPayrollData(null);
    } finally {
      setPayrollLoading(false);
    }
  }, []);

  // Initial load of staff
  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  // Load attendance when Attendance tab is active or date changes
  useEffect(() => {
    if (activeTab === 'Attendance') {
      fetchAttendance(currentDate);
    }
  }, [activeTab, currentDate, fetchAttendance]);

  // Load payroll when Payroll tab is active or month/year changes
  useEffect(() => {
    if (activeTab === 'Payroll') {
      fetchPayroll(selectedMonth, selectedYear);
    }
  }, [activeTab, selectedMonth, selectedYear, fetchPayroll]);

  // Action: Mark Attendance
  const handleMarkAttendance = async (staffId, status) => {
    const prevRecord = attendanceMap[staffId];

    // Optimistic UI update
    setAttendanceMap(prev => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        status: status
      }
    }));

    try {
      const res = await api.post('/crm/attendance', {
        staffId,
        date: currentDate,
        status
      });

      if (res.data?.success) {
        toast.success(`Marked as ${status}`);
        if (res.data.data?.attendance) {
          setAttendanceMap(prev => ({
            ...prev,
            [staffId]: res.data.data.attendance
          }));
        }
      } else {
        throw new Error(res.data?.message || 'Failed to update attendance');
      }
    } catch (err) {
      console.error('Mark attendance error:', err);
      toast.error('Failed to record attendance');
      // Revert optimistic update
      setAttendanceMap(prev => {
        const copy = { ...prev };
        if (prevRecord) {
          copy[staffId] = prevRecord;
        } else {
          delete copy[staffId];
        }
        return copy;
      });
    }
  };

  // Action: Mark All Present
  const handleMarkAllPresent = async () => {
    const activeStaff = staffList.filter(s => s.status !== 'Inactive');
    if (activeStaff.length === 0) return;

    // Optimistically update all
    const optimisticMap = { ...attendanceMap };
    activeStaff.forEach(s => {
      const id = s._id || s.id;
      optimisticMap[id] = { ...(optimisticMap[id] || {}), status: 'Present' };
    });
    setAttendanceMap(optimisticMap);

    const toastId = toast.loading('Marking all active staff as Present...');

    try {
      await Promise.all(
        activeStaff.map(s => 
          api.post('/crm/attendance', {
            staffId: s._id || s.id,
            date: currentDate,
            status: 'Present'
          })
        )
      );
      toast.success('All active staff marked as Present', { id: toastId });
      fetchAttendance(currentDate);
    } catch (err) {
      console.error('Mark all present error:', err);
      toast.error('Error marking some staff present', { id: toastId });
      fetchAttendance(currentDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Operations</h1>
          <p className="text-gray-500 text-sm">Attendance & Salary Management</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          {['Directory', 'Attendance', 'Payroll'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab 
                  ? 'text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={activeTab === tab ? { backgroundColor: premiumColors.primary.DEFAULT } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'Directory' && (
          <StaffDirectory 
            staffList={staffList}
            loading={staffLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onRefresh={fetchStaffList}
          />
        )}

        {activeTab === 'Attendance' && (
          <AttendanceTracker 
            staffList={staffList}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            attendanceMap={attendanceMap}
            loading={attendanceLoading}
            onMarkAttendance={handleMarkAttendance}
            onMarkAllPresent={handleMarkAllPresent}
          />
        )}

        {activeTab === 'Payroll' && (
          <PayrollPreview 
            payrollData={payrollData}
            loading={payrollLoading}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onRefresh={() => fetchPayroll(selectedMonth, selectedYear)}
          />
        )}
      </motion.div>
    </div>
  );
};

export default StaffPage;
