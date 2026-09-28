import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MdBuild, 
  MdDateRange, 
  MdAdd, 
  MdCheckCircle, 
  MdWarning,
  MdRefresh,
  MdPhone,
  MdLocationOn
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

// Active Repairs View (Connected to Real API)
const ActiveRepairs = ({ repairJobs, loading, onMarkComplete, onAddJob }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading active repair jobs...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {repairJobs.map(job => {
         const carTitle = job.car ? `${job.car.brand} ${job.car.model}` : 'Vehicle';
         const regNumber = job.car?.registrationNumber || 'N/A';
         const garageName = job.garage?.name || job.garageName || 'External Garage';
         const issue = job.issueDescription || job.issue || 'Maintenance / Repair';
         const cost = job.estimatedCost || job.cost || 0;
         const estOut = job.estimatedCompletionDate 
           ? new Date(job.estimatedCompletionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
           : 'Pending';

         return (
           <div key={job._id || job.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                   <div>
                     <span className="font-bold text-gray-900 block text-base">{carTitle}</span>
                     <span className="text-xs font-mono text-gray-500">{regNumber}</span>
                   </div>
                   <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                     job.status === 'In Progress' 
                       ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                       : 'bg-amber-100 text-amber-700 border border-amber-200'
                   }`}>
                      {job.status || 'Active'}
                   </span>
                </div>
                
                <div className="p-4 space-y-3">
                   <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Issue Reported</p>
                      <p className="text-gray-900 font-medium text-sm flex items-start gap-2">
                         <MdWarning className="text-amber-500 mt-0.5 shrink-0" size={16} /> 
                         <span>{issue}</span>
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gray-50 p-2 rounded-xl">
                         <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Assigned Garage</p>
                         <p className="text-gray-800 text-xs font-bold truncate">{garageName}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-xl">
                         <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Est. Cost</p>
                         <p className="text-gray-900 font-bold text-xs font-mono">₹{cost.toLocaleString('en-IN')}</p>
                      </div>
                   </div>
                   
                   <div className="bg-blue-50/80 p-2.5 rounded-xl flex items-center gap-2 text-xs text-blue-800">
                      <MdDateRange size={16} />
                      <span>Target Delivery: <strong className="font-bold">{estOut}</strong></span>
                   </div>
                </div>
              </div>

              <div className="p-3 border-t border-gray-100 bg-gray-50/70 flex gap-2">
                 {job.garage?.phone && (
                   <a 
                     href={`tel:${job.garage.phone}`}
                     className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 text-center flex items-center justify-center gap-1 shadow-sm"
                   >
                     <MdPhone size={14} /> Call
                   </a>
                 )}
                 <button 
                   onClick={() => onMarkComplete(job._id || job.id)}
                   className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                 >
                   Mark Complete
                 </button>
              </div>
           </div>
         );
       })}
       
       {/* Add Repair Job */}
       <div 
         onClick={() => navigate('/crm/garage/active')}
         className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:text-blue-600 transition-all cursor-pointer min-h-[260px] group"
       >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors mb-2">
            <MdAdd size={28} className="text-gray-500 group-hover:text-blue-600" />
          </div>
          <span className="font-bold text-sm text-gray-700 group-hover:text-blue-700">Add Repair Job</span>
          <span className="text-xs text-gray-400 mt-1">Open garage repairs module</span>
       </div>
    </div>
  );
};

// History View (Connected to Real API)
const HistoryList = ({ historyJobs, loading }) => {
  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading repair history...</p>
      </div>
    );
  }

  if (historyJobs.length === 0) {
    return (
      <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <p className="font-bold text-gray-700">No completed repair records</p>
        <p className="text-xs text-gray-400 mt-1">Completed repairs will automatically archive here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
       <div className="overflow-x-auto">
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold border-b border-gray-100">
               <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Issue Resolved</th>
                  <th className="px-6 py-4">Garage</th>
                  <th className="px-6 py-4 text-right">Final Cost</th>
                  <th className="px-6 py-4">Completion Date</th>
                  <th className="px-6 py-4 text-center">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {historyJobs.map(job => {
                  const carTitle = job.car ? `${job.car.brand} ${job.car.model}` : 'Vehicle';
                  const regNumber = job.car?.registrationNumber || 'N/A';
                  const garageName = job.garage?.name || job.garageName || 'External Garage';
                  const cost = job.finalCost || job.estimatedCost || job.cost || 0;
                  const completedDate = job.completedAt || job.updatedAt
                    ? new Date(job.completedAt || job.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'Completed';

                  return (
                    <tr key={job._id || job.id} className="hover:bg-gray-50/70 transition-colors">
                       <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{carTitle}</p>
                          <p className="text-xs font-mono text-gray-400">{regNumber}</p>
                       </td>
                       <td className="px-6 py-4 text-gray-800">{job.issueDescription || job.issue || 'Maintenance'}</td>
                       <td className="px-6 py-4 text-gray-600 font-medium">{garageName}</td>
                       <td className="px-6 py-4 font-bold text-gray-900 text-right font-mono">₹{cost.toLocaleString('en-IN')}</td>
                       <td className="px-6 py-4 text-gray-600 text-xs font-mono">{completedDate}</td>
                       <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                             <MdCheckCircle className="text-emerald-500" /> Done
                          </span>
                       </td>
                    </tr>
                  );
               })}
            </tbody>
         </table>
       </div>
    </div>
  );
};

// Garage Directory View (Connected to Real API)
const GarageList = ({ garages, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading registered garages...</p>
      </div>
    );
  }

  if (garages.length === 0) {
    return (
      <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <p className="font-bold text-gray-700">No partner garages registered</p>
        <p className="text-xs text-gray-400 mt-1">Register new garage partners in the All Garages module</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {garages.map(g => (
          <div key={g._id || g.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
             <div>
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl shadow-sm">
                      {(g.name || 'G').charAt(0).toUpperCase()}
                   </div>
                   <span className="text-[11px] font-bold bg-gray-100 px-2.5 py-1 rounded-full text-gray-700">
                      {g.status || 'Active'}
                   </span>
                </div>
                
                <h3 className="font-bold text-lg text-gray-900">{g.name}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                   <MdLocationOn className="text-gray-400 mt-0.5 shrink-0" size={14} />
                   <span>{g.address || g.city || 'Local Area'}</span>
                </p>
                {g.phone && (
                   <p className="text-xs text-gray-600 mt-1 font-mono flex items-center gap-1">
                      <MdPhone className="text-gray-400" size={14} />
                      {g.phone}
                   </p>
                )}
             </div>
             
             <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={() => navigate('/crm/garage/all')}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                >
                  View Details
                </button>
                {g.phone && (
                  <a 
                    href={`tel:${g.phone}`}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors text-center"
                  >
                    Call Garage
                  </a>
                )}
             </div>
          </div>
       ))}
    </div>
  );
};

const GaragePage = () => {
  const [activeTab, setActiveTab] = useState('Active Repairs'); // Active Repairs, History, Garages

  const [activeRepairs, setActiveRepairs] = useState([]);
  const [activeRepairsLoading, setActiveRepairsLoading] = useState(false);

  const [historyJobs, setHistoryJobs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [garages, setGarages] = useState([]);
  const [garagesLoading, setGaragesLoading] = useState(false);

  const fetchActiveRepairs = useCallback(async () => {
    try {
      setActiveRepairsLoading(true);
      const res = await api.get('/crm/repairs/active');
      if (res.data?.success && res.data?.data?.repairs) {
        setActiveRepairs(res.data.data.repairs);
      } else {
        setActiveRepairs([]);
      }
    } catch (err) {
      console.error('Failed to load active repairs:', err);
      setActiveRepairs([]);
    } finally {
      setActiveRepairsLoading(false);
    }
  }, []);

  const fetchRepairLogs = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/crm/repairs/logs');
      if (res.data?.success && res.data?.data?.repairs) {
        setHistoryJobs(res.data.data.repairs);
      } else {
        setHistoryJobs([]);
      }
    } catch (err) {
      console.error('Failed to load repair logs:', err);
      setHistoryJobs([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchGarages = useCallback(async () => {
    try {
      setGaragesLoading(true);
      const res = await api.get('/crm/garages');
      if (res.data?.success && res.data?.data?.garages) {
        setGarages(res.data.data.garages);
      } else {
        setGarages([]);
      }
    } catch (err) {
      console.error('Failed to load garages:', err);
      setGarages([]);
    } finally {
      setGaragesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Active Repairs') {
      fetchActiveRepairs();
    } else if (activeTab === 'History') {
      fetchRepairLogs();
    } else if (activeTab === 'Garages') {
      fetchGarages();
    }
  }, [activeTab, fetchActiveRepairs, fetchRepairLogs, fetchGarages]);

  const handleMarkComplete = async (jobId) => {
    try {
      const res = await api.put(`/crm/repairs/${jobId}`, { status: 'Completed' });
      if (res.data?.success) {
        toast.success('Repair job marked as completed');
        fetchActiveRepairs();
      }
    } catch (err) {
      console.error('Failed to complete repair job:', err);
      toast.error('Failed to complete repair');
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Garage & Maintenance</h1>
            <p className="text-gray-500 text-xs">Live repairs, historical logs, and partner garages</p>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={() => {
                   if (activeTab === 'Active Repairs') fetchActiveRepairs();
                   else if (activeTab === 'History') fetchRepairLogs();
                   else fetchGarages();
                }}
                className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm"
                title="Refresh"
             >
                <MdRefresh size={18} className={activeRepairsLoading || historyLoading || garagesLoading ? 'animate-spin' : ''} />
             </button>

             <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                {['Active Repairs', 'History', 'Garages'].map(tab => (
                   <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                         activeTab === tab 
                           ? 'bg-[#1C205C] text-white shadow' 
                           : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                   >
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
          {activeTab === 'Active Repairs' && (
            <ActiveRepairs 
              repairJobs={activeRepairs} 
              loading={activeRepairsLoading} 
              onMarkComplete={handleMarkComplete} 
            />
          )}
          {activeTab === 'History' && (
            <HistoryList 
              historyJobs={historyJobs} 
              loading={historyLoading} 
            />
          )}
          {activeTab === 'Garages' && (
            <GarageList 
              garages={garages} 
              loading={garagesLoading} 
            />
          )}
       </motion.div>
    </div>
  );
};

export default GaragePage;
