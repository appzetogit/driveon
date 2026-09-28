import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, FiDownload, FiTrendingUp, FiArrowDownLeft, 
  FiArrowUpRight, FiCalendar, FiPieChart, FiChevronLeft, FiChevronRight, FiClock 
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import api from '../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SalaryPage = () => {
  const user = useSelector((state) => state.user?.user || state.auth?.user);
  const userId = user?._id || user?.id;

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Fetch live payroll and transactions
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSalaryData = async () => {
      setLoading(true);
      try {
        const [payrollRes, recordsRes] = await Promise.all([
          api.get(`/crm/staff/${userId}/payroll`, {
            params: { month: selectedMonth, year: selectedYear }
          }).catch(err => {
            console.error('Error fetching staff payroll:', err);
            return { data: { success: false } };
          }),
          api.get(`/crm/payroll`, {
            params: { staff: userId }
          }).catch(err => {
            console.error('Error fetching payroll records:', err);
            return { data: { success: false } };
          })
        ]);

        if (payrollRes.data?.success && payrollRes.data?.data) {
          setPayrollData(payrollRes.data.data);
        } else {
          setPayrollData(null);
        }

        if (recordsRes.data?.success && recordsRes.data?.data?.payroll) {
          const list = recordsRes.data.data.payroll;
          // Flatten transactions if present or map payroll records
          const txList = [];
          list.forEach((rec) => {
            if (rec.transactions && Array.isArray(rec.transactions) && rec.transactions.length > 0) {
              rec.transactions.forEach((tx, idx) => {
                txList.push({
                  id: `${rec._id}-${idx}`,
                  title: tx.description || `Salary Payout (${rec.month || ''})`,
                  date: tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
                  amount: `₹${(tx.amount || 0).toLocaleString('en-IN')}`,
                  type: tx.type === 'debit' ? 'debit' : 'credit',
                  status: rec.status || 'Success'
                });
              });
            } else if (rec.paidAmount > 0 || rec.status === 'Paid') {
              txList.push({
                id: rec._id,
                title: `Salary Credited (${rec.month || ''})`,
                date: rec.paidDate ? new Date(rec.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Paid',
                amount: `₹${(rec.paidAmount || rec.netPay || 0).toLocaleString('en-IN')}`,
                type: 'credit',
                status: rec.status || 'Paid'
              });
            }
          });
          setTransactions(txList);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching salary details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, [userId, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const currentMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // Breakdown generation from live data
  const baseSalary = payrollData?.baseSalary || user?.salary || 0;
  const netPayable = payrollData?.netPayable ?? payrollData?.totalNetPayable ?? baseSalary;
  const daysWorked = payrollData?.presentDays ?? 0;
  const workingDays = payrollData?.workingDays || payrollData?.daysInMonth || 30;

  const breakdown = [];
  if (baseSalary > 0) {
    breakdown.push({ label: 'Base Salary', amount: `₹${baseSalary.toLocaleString('en-IN')}`, type: 'earning' });
  }
  if (payrollData?.extraWorkAmount > 0) {
    breakdown.push({ label: 'Extra Hours / Overtime', amount: `+ ₹${payrollData.extraWorkAmount.toLocaleString('en-IN')}`, type: 'earning' });
  }
  if (payrollData?.absentDeduction > 0) {
    breakdown.push({ label: `Absent Deduction (${payrollData.absentDays || 0}d)`, amount: `- ₹${Math.round(payrollData.absentDeduction).toLocaleString('en-IN')}`, type: 'deduction' });
  }
  if (payrollData?.leaveDeduction > 0) {
    breakdown.push({ label: `Unpaid Leave Deduction`, amount: `- ₹${Math.round(payrollData.leaveDeduction).toLocaleString('en-IN')}`, type: 'deduction' });
  }
  if (payrollData?.halfDayDeduction > 0) {
    breakdown.push({ label: `Half-day Deduction (${payrollData.halfDays || 0}d)`, amount: `- ₹${Math.round(payrollData.halfDayDeduction).toLocaleString('en-IN')}`, type: 'deduction' });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-32 font-sans selection:bg-blue-100 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="bg-[#1C205C] pt-6 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

          <HeaderTopBar title="Salary & Ledger" />

          {/* Month selector navigation */}
          <div className="mt-4 flex items-center justify-center gap-4 text-white">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Previous month"
            >
              <FiChevronLeft size={18} />
            </button>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest min-w-[140px] text-center">
              {currentMonthLabel}
            </p>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Next month"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
          
          <div className="mt-3 text-white text-center">
             <h2 className="text-4xl sm:text-5xl font-black mb-2">
               {loading ? '...' : `₹${Math.round(netPayable).toLocaleString('en-IN')}`}
             </h2>
             <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                <FiTrendingUp /> Status: {payrollData?.salaryStatus || (payrollData?.paidAmount > 0 ? 'Paid' : 'Calculated')}
             </span>
          </div>
      </div>

      {/* STATS GRID - OVERLAPPING */}
      <div className="px-6 -mt-12 z-10 grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-blue-900/10 border border-white flex flex-col items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                 <FiCalendar />
             </div>
             <span className="text-xl font-bold text-[#1C205C]">{daysWorked} / {workingDays}</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase">Days Present</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-blue-900/10 border border-white flex flex-col items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                 <FiPieChart />
             </div>
             <span className="text-xl font-bold text-[#1C205C]">{breakdown.length}</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase">Components</span>
          </div>
      </div>

      {/* BREAKDOWN LIST */}
      <div className="px-5 mt-6">
          <h3 className="text-[#1C205C] font-bold text-lg mb-4 flex justify-between items-center">
             Earnings & Deductions Breakdown 
             <button 
               onClick={() => window.print()}
               className="text-xs text-blue-500 font-bold flex items-center gap-1 hover:underline"
             >
                 <FiDownload /> Print
             </button>
          </h3>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              {loading ? (
                <div className="py-6 text-center text-gray-400 text-sm">Calculating monthly payroll...</div>
              ) : breakdown.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">No payroll components calculated for this period.</div>
              ) : (
                breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-50 last:border-0 last:pb-0 pb-2">
                        <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                        <span className={`text-sm font-bold ${item.type === 'deduction' ? 'text-red-500' : 'text-gray-800'}`}>
                            {item.amount}
                        </span>
                    </div>
                ))
              )}
              <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                   <span className="text-sm font-bold text-[#1C205C]">Net Payable</span>
                   <span className="text-lg font-black text-[#1C205C]">
                     ₹{Math.round(netPayable).toLocaleString('en-IN')}
                   </span>
              </div>
          </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="px-5 mt-8 flex-1">
          <h3 className="text-[#1C205C] font-bold text-lg mb-4">Transaction History</h3>
          <div className="space-y-3">
              {loading ? (
                <div className="bg-white p-6 rounded-xl text-center text-gray-400 text-sm border border-gray-100">
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-white p-6 rounded-xl text-center text-gray-400 text-sm border border-gray-100">
                  No payment transactions recorded yet.
                </div>
              ) : (
                transactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {tx.type === 'credit' ? <FiArrowDownLeft size={20} /> : <FiArrowUpRight size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-[#1C205C] text-sm">{tx.title}</p>
                                <p className="text-xs text-gray-400 font-medium">{tx.date}</p>
                            </div>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.amount}
                        </span>
                    </div>
                ))
              )}
          </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SalaryPage;
