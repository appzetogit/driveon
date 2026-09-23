import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiDownload, FiTrendingUp, FiArrowDownLeft, FiArrowUpRight, FiCalendar, FiPieChart } from 'react-icons/fi';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';

const SalaryPage = () => {
    
  // Dummy Salary Data
  const currentMonth = {
    month: "December 2025",
    netPayable: "28,500",
    status: "Processed",
    daysWorked: 26,
    breakdown: [
        { label: "Basic Salary", amount: "15,000", type: "earning" },
        { label: "HRA", amount: "8,000", type: "earning" },
        { label: "Performance Bonus", amount: "4,500", type: "earning" },
        { label: "Attendance Incentive", amount: "2,000", type: "earning" },
        { label: "PF Deduction", amount: "-1,000", type: "deduction" }
    ]
  };

  // Transaction History
  const history = [
    { id: 1, title: 'Salary Credited', date: '01 Dec 2025', amount: '+ ₹28,500', type: 'credit', status: 'Success' },
    { id: 2, title: 'Fuel Expense Reimbursement', date: '28 Nov 2025', amount: '+ ₹1,200', type: 'credit', status: 'Success' },
    { id: 3, title: 'Advance Salary Deduction', date: '01 Nov 2025', amount: '- ₹5,000', type: 'debit', status: 'Deducted' },
    { id: 4, title: 'Salary Credited', date: '01 Nov 2025', amount: '+ ₹23,500', type: 'credit', status: 'Success' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-32 font-sans selection:bg-blue-100 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="bg-[#1C205C] pt-6 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

          <HeaderTopBar title="Salary & Ledger" />
          
          <div className="mt-6 text-white text-center">
             <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">{currentMonth.month}</p>
             <h2 className="text-5xl font-black mb-2">₹{currentMonth.netPayable}</h2>
             <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                <FiTrendingUp /> +12% from last month
             </span>
          </div>
      </div>

      {/* STATS GRID - OVERLAPPING */}
      <div className="px-6 -mt-12 z-10 grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-blue-900/10 border border-white flex flex-col items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                 <FiCalendar />
             </div>
             <span className="text-xl font-bold text-[#1C205C]">{currentMonth.daysWorked}</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase">Days Payable</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-blue-900/10 border border-white flex flex-col items-center justify-center">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                 <FiPieChart />
             </div>
             <span className="text-xl font-bold text-[#1C205C]">{currentMonth.breakdown.length}</span>
             <span className="text-[10px] text-gray-400 font-bold uppercase">Components</span>
          </div>
      </div>

      {/* BREAKDOWN LIST */}
      <div className="px-5 mt-6">
          <h3 className="text-[#1C205C] font-bold text-lg mb-4 flex justify-between items-center">
             Earnings Breakdown 
             <button className="text-xs text-blue-500 font-bold flex items-center gap-1">
                 <FiDownload /> Slip
             </button>
          </h3>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
              {currentMonth.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-50 last:border-0 last:pb-0 pb-2">
                      <span className="text-sm font-semibold text-gray-600">{item.label}</span>
                      <span className={`text-sm font-bold ${item.type === 'deduction' ? 'text-red-500' : 'text-gray-800'}`}>
                          {item.amount}
                      </span>
                  </div>
              ))}
              <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                   <span className="text-sm font-bold text-[#1C205C]">Net Payable</span>
                   <span className="text-lg font-black text-[#1C205C]">₹{currentMonth.netPayable}</span>
              </div>
          </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="px-5 mt-8 flex-1">
          <h3 className="text-[#1C205C] font-bold text-lg mb-4">Transaction History</h3>
          <div className="space-y-3">
              {history.map((tx) => (
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
              ))}
          </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SalaryPage;
