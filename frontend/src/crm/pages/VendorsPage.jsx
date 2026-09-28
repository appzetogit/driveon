import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MdStore, 
  MdDirectionsCar, 
  MdPhone, 
  MdHistory, 
  MdAdd, 
  MdWarning, 
  MdCheckCircle,
  MdRefresh
} from 'react-icons/md';
import api from '../../services/api';

// Vendor Directory View (Connected to Real API)
const DirectoryView = ({ vendors, loading, onRefresh }) => {
  const navigate = useNavigate();

  const totalPaid = vendors.reduce((acc, v) => acc + (v.totalPaid || 0), 0);
  const totalPending = vendors.reduce((acc, v) => acc + (v.pendingBalance || v.pending || 0), 0);

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading partner vendors...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {/* Summary Card */}
       <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#1C205C] via-[#21598b] to-[#161a4a] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
             <h2 className="text-2xl font-bold">Vendor Operations</h2>
             <p className="opacity-80 text-xs mt-0.5">Track vendor partners, outstanding balances and payouts</p>
          </div>
          <div className="flex gap-8 text-center md:text-right">
             <div>
                <p className="text-[10px] uppercase font-bold opacity-70 tracking-wider">Total Paid Out</p>
                <p className="text-2xl font-black mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-rose-200 tracking-wider">Total Pending</p>
                <p className="text-2xl font-black text-rose-300 mt-0.5">₹{totalPending.toLocaleString('en-IN')}</p>
             </div>
          </div>
       </div>

       {/* Vendor Cards */}
       {vendors.map(v => {
         const name = v.name || 'Vendor Partner';
         const type = v.category || v.vendorType || 'Services';
         const pending = v.pendingBalance || v.pending || 0;
         const paid = v.totalPaid || 0;
         const carsWithVendor = Array.isArray(v.assignedCars) ? v.assignedCars.length : (v.carsWithVendor || 0);

         return (
           <div key={v._id || v.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
              {/* Status Indicator Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-20 transition-all group-hover:scale-125 ${pending > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                   <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{name}</h3>
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">{type}</span>
                   </div>
                   {carsWithVendor > 0 && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-xl border border-blue-100 text-blue-800">
                         <MdDirectionsCar size={14} className="text-blue-600" />
                         <span className="text-[10px] font-bold">{carsWithVendor} Cars</span>
                      </div>
                   )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                   <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Pending</p>
                      <p className={`font-bold font-mono text-sm ${pending > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                         ₹{pending.toLocaleString('en-IN')}
                      </p>
                   </div>
                   <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Total Paid</p>
                      <p className="font-bold text-gray-900 font-mono text-sm">
                         ₹{paid.toLocaleString('en-IN')}
                      </p>
                   </div>
                </div>
              </div>

              <div className="flex gap-2 relative z-10 pt-2 border-t border-gray-50">
                 {v.phone && (
                   <a 
                     href={`tel:${v.phone}`} 
                     className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1 shadow-sm"
                   >
                      <MdPhone size={14} /> Call
                   </a>
                 )}
                 <button 
                   onClick={() => navigate('/crm/vendors/all')}
                   className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                     pending > 0 
                       ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200' 
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                   }`}
                 >
                    {pending > 0 ? 'View & Settle' : 'Details'}
                 </button>
              </div>
           </div>
         );
       })}

       {/* Add Vendor Card */}
       <div 
         onClick={() => navigate('/crm/vendors/all')}
         className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 hover:text-blue-600 transition-all cursor-pointer min-h-[220px] group"
       >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors mb-2">
            <MdAdd size={28} className="text-gray-500 group-hover:text-blue-600" />
          </div>
          <span className="font-bold text-sm text-gray-700 group-hover:text-blue-700">Add New Vendor</span>
          <span className="text-xs text-gray-400 mt-1">Open vendor directory module</span>
       </div>
    </div>
  );
};

// Payments History List View (Connected to Real API)
const PaymentsView = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading payout history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <p className="font-bold text-gray-700">No payment transaction records found</p>
        <p className="text-xs text-gray-400 mt-1">Recorded vendor disbursements will appear here</p>
      </div>
    );
  }

  return (
     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
           {history.map(p => {
              const vendorName = p.vendor?.name || p.vendorName || 'Vendor';
              const dateStr = p.paymentDate || p.createdAt
                ? new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Recent';
              const method = p.paymentMethod || p.method || 'Transfer';
              const amount = p.amount || 0;
              const status = p.status || 'Paid';
              const isPaid = status === 'Paid' || status === 'Success';

              return (
                <div key={p._id || p.id} className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${
                         isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                         {isPaid ? <MdCheckCircle /> : <MdWarning />}
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-900 text-sm">{vendorName}</h4>
                         <p className="text-xs text-gray-400 mt-0.5">{dateStr} • {method}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold font-mono text-gray-900 text-sm">
                         ₹{amount.toLocaleString('en-IN')}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                         isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                         {status}
                      </span>
                   </div>
                </div>
              );
           })}
        </div>
     </div>
  );
};

const VendorsPage = () => {
  const [activeTab, setActiveTab] = useState('Directory'); // Directory, Payments

  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      setVendorsLoading(true);
      const res = await api.get('/crm/vendors');
      if (res.data?.success && res.data?.data?.vendors) {
        setVendors(res.data.data.vendors);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/crm/vendors/history');
      if (res.data?.success && res.data?.data?.history) {
        setHistory(res.data.data.history);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load vendor payment history:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Directory') {
      fetchVendors();
    } else {
      fetchHistory();
    }
  }, [activeTab, fetchVendors, fetchHistory]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-500 text-xs">Manage partners, fleet services, and outgoing settlements</p>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={() => activeTab === 'Directory' ? fetchVendors() : fetchHistory()}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm"
                title="Refresh"
             >
                <MdRefresh size={18} className={vendorsLoading || historyLoading ? 'animate-spin' : ''} />
             </button>

             <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                {['Directory', 'Payments'].map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                         activeTab === tab 
                           ? 'bg-[#1C205C] text-white shadow' 
                           : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                   >
                      {tab === 'Directory' ? <MdStore size={15} /> : <MdHistory size={15} />}
                      {tab}
                   </button>
                ))}
             </div>
          </div>
       </div>

       <motion.div
         key={activeTab}
         initial={{ opacity: 0, y: 8 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.2 }}
       >
          {activeTab === 'Directory' && (
            <DirectoryView 
              vendors={vendors} 
              loading={vendorsLoading} 
              onRefresh={fetchVendors} 
            />
          )}
          {activeTab === 'Payments' && (
            <PaymentsView 
              history={history} 
              loading={historyLoading} 
            />
          )}
       </motion.div>
    </div>
  );
};

export default VendorsPage;
