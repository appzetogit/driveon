import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdStore, 
  MdAttachMoney, 
  MdDirectionsCar, 
  MdPhone, 
  MdHistory,
  MdAdd,
  MdWarning,
  MdCheckCircle
} from 'react-icons/md';

// MOCK DATA: VENDORS
const VENDORS = [
  { id: 1, name: 'Rahul Auto Works', type: 'Garage', pending: 15000, paid: 45000, carsWithVendor: 2, phone: '9876543210', rating: 4.5 },
  { id: 2, name: 'Shell Petrol Pump', type: 'Fuel', pending: 0, paid: 120000, carsWithVendor: 0, phone: '9988776655', rating: 5.0 },
  { id: 3, name: 'Suresh Tyres', type: 'Parts', pending: 2500, paid: 12500, carsWithVendor: 0, phone: '8877665544', rating: 4.2 },
  { id: 4, name: 'City Car Wash', type: 'Cleaning', pending: 800, paid: 5000, carsWithVendor: 1, phone: '7766554433', rating: 4.8 },
];

const PAYMENTS_HISTORY = [
  { id: 101, vendor: 'Rahul Auto Works', date: '2023-12-20', amount: 5000, status: 'Paid', method: 'UPI' },
  { id: 102, vendor: 'Shell Petrol Pump', date: '2023-12-18', amount: 15000, status: 'Paid', method: 'Bank Transfer' },
  { id: 103, vendor: 'Suresh Tyres', date: '2023-12-25', amount: 2500, status: 'Pending', method: '-' },
];

// Vendor Directory View
const DirectoryView = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {/* Summary Card */}
     <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
           <h2 className="text-2xl font-bold">Vendor Overview</h2>
           <p className="opacity-80">Track costs and settlements</p>
        </div>
        <div className="flex gap-8 text-center md:text-right">
           <div>
              <p className="text-xs uppercase font-bold opacity-60">Total Paid (Dec)</p>
              <p className="text-2xl font-bold">Rs. 1.8L</p>
           </div>
           <div>
              <p className="text-xs uppercase font-bold opacity-60 text-red-200">Total Pending</p>
              <p className="text-2xl font-bold text-red-300">Rs. 18.3k</p>
           </div>
        </div>
     </div>

     {/* Vendor Cards */}
     {VENDORS.map(v => (
       <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all relative overflow-hidden group">
          {/* Status Indicator */}
          <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full opacity-20 transition-all group-hover:scale-110 ${v.pending > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
                <h3 className="font-bold text-lg text-gray-900">{v.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold tracking-wide">{v.type}</span>
             </div>
             {v.carsWithVendor > 0 && (
                <div className="flex flex-col items-center bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                   <MdDirectionsCar className="text-blue-600" />
                   <span className="text-[10px] font-bold text-blue-800">{v.carsWithVendor} Cars</span>
                </div>
             )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
             <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Pending</p>
                <p className={`font-bold ${v.pending > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                   Rs. {v.pending.toLocaleString()}
                </p>
             </div>
             <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Total Paid</p>
                <p className="font-bold text-gray-800">
                   Rs. {v.paid.toLocaleString()}
                </p>
             </div>
          </div>

          <div className="flex gap-2 relative z-10">
             <button className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-1">
                <MdPhone size={16} /> Call
             </button>
             {v.pending > 0 ? (
               <button className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm shadow-red-200">
                  Pay Now
               </button>
             ) : (
               <button className="flex-1 bg-gray-100 text-gray-400 py-1.5 rounded-lg text-sm font-semibold cursor-default">
                  Settled
               </button>
             )}
          </div>
       </div>
     ))}

     {/* Add Vendor */}
     <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 cursor-pointer hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[200px]">
        <MdAdd size={32} />
        <span className="mt-2 font-semibold">Add New Vendor</span>
     </div>
  </div>
);

// Payments List View
const PaymentsView = () => (
   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
         {PAYMENTS_HISTORY.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                     ${p.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                     {p.status === 'Paid' ? <MdCheckCircle /> : <MdWarning />}
                  </div>
                  <div>
                     <h4 className="font-bold text-gray-900">{p.vendor}</h4>
                     <p className="text-xs text-gray-500">{p.date} • {p.method}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className={`font-bold ${p.status === 'Paid' ? 'text-gray-900' : 'text-amber-600'}`}>
                     Rs. {p.amount.toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                     ${p.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                     {p.status}
                  </span>
               </div>
            </div>
         ))}
      </div>
   </div>
);

const VendorsPage = () => {
  const [activeTab, setActiveTab] = useState('Directory'); // Directory, Payments

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-500 text-sm">Manage partners and outgoing payments</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             {['Directory', 'Payments'].map(tab => (
                <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                      ${activeTab === tab 
                        ? 'bg-gray-900 text-white shadow' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                   {tab === 'Directory' ? <MdStore /> : <MdHistory />}
                   {tab}
                </button>
             ))}
          </div>
       </div>

       <motion.div
         key={activeTab}
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.2 }}
       >
          {activeTab === 'Directory' && <DirectoryView />}
          {activeTab === 'Payments' && <PaymentsView />}
       </motion.div>
    </div>
  );
};

export default VendorsPage;
