import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdBuild, 
  MdDateRange, 
  MdAttachMoney, 
  MdEngineering, 
  MdHistory,
  MdAdd,
  MdCheckCircle,
  MdWarning
} from 'react-icons/md';

// MOCK DATA: REPAIRS
const REPAIR_JOBS = [
  { id: 'JOB-901', car: 'Toyota Innova Crysta', garage: 'AutoFix Hub', status: 'In Progress', issue: 'Brake Pad Replacement', cost: 4500, dateIn: '2023-12-26', estOut: '2023-12-28' },
  { id: 'JOB-902', car: 'Maruti Swift Dzire', garage: 'Sai Motors', status: 'Pending', issue: 'Regular Service (10k)', cost: 3500, dateIn: '2023-12-27', estOut: '2023-12-27' },
  { id: 'JOB-903', car: 'Honda City', garage: 'City Honda Care', status: 'Completed', issue: 'AC Filter Cleaning', cost: 1200, dateIn: '2023-12-20', estOut: '2023-12-21' },
  { id: 'JOB-904', car: 'Hyundai Creta', garage: 'AutoFix Hub', status: 'In Progress', issue: 'Denting & Painting', cost: 12000, dateIn: '2023-12-25', estOut: '2023-12-30' },
];

const GARAGES = [
  { id: 1, name: 'AutoFix Hub', phone: '9876543210', address: 'Baner, Pune', rating: 4.5, activeJobs: 2 },
  { id: 2, name: 'Sai Motors', phone: '9988776655', address: 'Hinjewadi, Pune', rating: 4.0, activeJobs: 1 },
  { id: 3, name: 'City Honda Care', phone: '8877665544', address: 'Kothrud, Pune', rating: 4.8, activeJobs: 0 },
];

// Active Repairs View
const ActiveRepairs = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
     {REPAIR_JOBS.filter(job => job.status !== 'Completed').map(job => (
       <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
             <span className="font-bold text-gray-800">{job.car}</span>
             <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {job.status}
             </span>
          </div>
          
          <div className="p-4 space-y-3">
             <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Issue</p>
                <p className="text-gray-900 font-medium text-sm flex items-start gap-2">
                   <MdWarning className="text-amber-500 mt-0.5 shrink-0" /> {job.issue}
                </p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                   <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Garage</p>
                   <p className="text-gray-700 text-sm">{job.garage}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Est. Cost</p>
                   <p className="text-gray-900 font-bold text-sm">Rs. {job.cost}</p>
                </div>
             </div>
             
             <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-sm text-blue-800 mt-2">
                <MdDateRange />
                <span>Est. Out: <strong>{job.estOut}</strong></span>
             </div>
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
             <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">Contact Garage</button>
             <button className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 shadow-sm shadow-green-200">Mark Complete</button>
          </div>
       </div>
     ))}
     
     {/* New Repair Card */}
     <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer min-h-[250px]">
        <MdAdd size={40} />
        <span className="font-semibold mt-2">Add Repair Job</span>
     </div>
  </div>
);

// History View
const HistoryList = () => (
   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left text-sm">
         <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
               <th className="px-6 py-4">Job ID</th>
               <th className="px-6 py-4">Car</th>
               <th className="px-6 py-4">Issue Resolved</th>
               <th className="px-6 py-4">Garage</th>
               <th className="px-6 py-4">Final Cost</th>
               <th className="px-6 py-4">Completion Date</th>
               <th className="px-6 py-4">Status</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
            {REPAIR_JOBS.filter(job => job.status === 'Completed').map(job => (
               <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-500">{job.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{job.car}</td>
                  <td className="px-6 py-4">{job.issue}</td>
                  <td className="px-6 py-4">{job.garage}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">Rs. {job.cost}</td>
                  <td className="px-6 py-4">{job.estOut}</td>
                  <td className="px-6 py-4">
                     <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full w-fit">
                        <MdCheckCircle /> Done
                     </span>
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
   </div>
);

// Garage Directory View
const GarageList = () => (
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {GARAGES.map(g => (
         <div key={g.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {g.name.charAt(0)}
               </div>
               <div className="text-right">
                  <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600">{g.activeJobs} Active Jobs</span>
               </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900">{g.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{g.address}</p>
            
            <div className="flex items-center gap-1 text-amber-500 text-sm font-bold mb-4">
               ★ {g.rating}/5.0
            </div>
            
            <div className="flex gap-2">
               <button className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">View History</button>
               <button className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200">Call Now</button>
            </div>
         </div>
      ))}
   </div>
);

const GaragePage = () => {
  const [activeTab, setActiveTab] = useState('Active Repairs'); // Active Repairs, History, Garages

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Garage & Maintenance</h1>
            <p className="text-gray-500 text-sm">Track repairs, costs, and garage partners</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             {['Active Repairs', 'History', 'Garages'].map(tab => (
                <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                      ${activeTab === tab 
                        ? 'bg-gray-900 text-white shadow' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                   {tab}
                </button>
             ))}
          </div>
       </div>

       <motion.div
         key={activeTab}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
       >
          {activeTab === 'Active Repairs' && <ActiveRepairs />}
          {activeTab === 'History' && <HistoryList />}
          {activeTab === 'Garages' && <GarageList />}
       </motion.div>
    </div>
  );
};

export default GaragePage;
