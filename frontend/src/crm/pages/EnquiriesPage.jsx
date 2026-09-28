import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, 
  MdSearch, 
  MdPhone, 
  MdEmail, 
  MdArrowForward,
  MdMoreVert,
  MdCheckCircle,
  MdRefresh,
  MdDirectionsCar
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const KANBAN_COLUMNS = [
  { id: 'New', title: 'New Leads', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'Follow-Up', title: 'Follow Up', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'Converted', title: 'Converted', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'Closed', title: 'Lost / Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const EnquiriesPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/enquiries');
      if (res.data?.success && res.data?.data?.enquiries) {
        setEnquiries(res.data.data.enquiries);
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error('Failed to load CRM enquiries:', err);
      toast.error('Failed to load enquiries');
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Handle quick status update (e.g. from Kanban or action)
  const handleUpdateStatus = async (enquiryId, newStatus) => {
    try {
      const res = await api.put(`/crm/enquiries/${enquiryId}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Lead moved to ${newStatus}`);
        setEnquiries(prev => prev.map(e => e._id === enquiryId ? { ...e, status: newStatus } : e));
      }
    } catch (err) {
      console.error('Failed to update enquiry status:', err);
      toast.error('Failed to update status');
    }
  };
  
  // Filter leads based on tab and search query
  const filteredLeads = enquiries.filter(lead => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const carName = lead.carInterested?.brand 
      ? `${lead.carInterested.brand} ${lead.carInterested.model}`.toLowerCase()
      : (typeof lead.carInterested === 'string' ? lead.carInterested.toLowerCase() : '');

    const matchesSearch = !cleanSearch ||
      (lead.name || '').toLowerCase().includes(cleanSearch) ||
      (lead.phone || '').includes(cleanSearch) ||
      carName.includes(cleanSearch);
      
    if (!matchesSearch) return false;
    
    if (activeTab === 'All') return true;
    if (activeTab === 'New') return lead.status === 'New';
    if (activeTab === 'In Progress') return lead.status === 'In Progress';
    if (activeTab === 'Follow-ups') return lead.status === 'Follow-Up';
    if (activeTab === 'Converted') return lead.status === 'Converted';
    if (activeTab === 'Closed') return lead.status === 'Closed';
    return true;
  });

  const tabs = ['All', 'New', 'In Progress', 'Follow-ups', 'Converted', 'Closed'];

  return (
    <div className="space-y-6 min-h-[calc(100vh-140px)] flex flex-col">
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries Pipeline</h1>
          <p className="text-gray-500 text-xs">Live customer leads, inquiries and conversions</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <button 
             onClick={fetchEnquiries}
             className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm"
             title="Refresh"
           >
              <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <button 
             onClick={() => navigate('/crm/enquiries/all')}
             className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#1C205C] text-white px-5 py-2.5 rounded-xl hover:bg-[#161a4a] transition-colors shadow-md text-xs font-bold"
           >
              <MdAdd size={18} />
              <span>All Enquiries</span>
           </button>
        </div>
      </div>

      {/* 2. Filters & Views Toolbar */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
         {/* Tabs */}
         <div className="flex overflow-x-auto scrollbar-hide gap-1 p-1">
            {tabs.map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                   activeTab === tab 
                     ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                     : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                 }`}
               >
                 {tab}
               </button>
            ))}
         </div>

         {/* Search & View Toggles */}
         <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
               <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search name, phone..." 
                 className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value.trimStart())}
               />
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
               <button 
                 onClick={() => setViewMode('kanban')}
                 className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
               >
                 Board
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
               >
                 List
               </button>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-xs text-gray-500 font-medium">Loading live enquiries...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* 3. KANBAN BOARD VIEW */
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
           <div className="flex gap-4 h-full min-w-[1200px]">
              {KANBAN_COLUMNS.map(column => {
                 const colLeads = filteredLeads.filter(l => l.status === column.id);

                 return (
                    <div key={column.id} className="w-72 flex flex-col h-full">
                       {/* Column Header */}
                       <div className={`p-3 rounded-t-2xl border-t border-x ${column.color} font-bold text-xs flex justify-between items-center bg-opacity-70 shadow-sm`}>
                          <span>{column.title}</span>
                          <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full font-mono font-bold">
                             {colLeads.length}
                          </span>
                       </div>

                       {/* Column Body */}
                       <div className="flex-1 bg-gray-50/70 border-x border-b border-gray-200 rounded-b-2xl p-2.5 overflow-y-auto space-y-3 min-h-[400px]">
                          {colLeads.map(lead => {
                             const carText = lead.carInterested?.brand 
                               ? `${lead.carInterested.brand} ${lead.carInterested.model}` 
                               : (typeof lead.carInterested === 'string' ? lead.carInterested : 'Any Model');
                             const leadDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                               month: 'short',
                               day: 'numeric'
                             }) : '';

                             return (
                                <div 
                                  key={lead._id || lead.id}
                                  className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                                  onClick={() => navigate(`/crm/enquiries/${lead._id || lead.id}`)}
                                >
                                   {/* Card Header */}
                                   <div className="flex justify-between items-start mb-2">
                                      <div>
                                         <h4 className="font-bold text-gray-800 text-sm">{lead.name}</h4>
                                         <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{lead.source || 'Direct'}</span>
                                      </div>
                                   </div>
                                   
                                   {/* Card Details */}
                                   <div className="space-y-1 mb-3">
                                      <div className="flex items-center gap-2 text-xs text-gray-700">
                                         <MdDirectionsCar className="text-gray-400" size={14} /> 
                                         <span className="font-medium truncate">{carText}</span>
                                      </div>
                                      {lead.budget && (
                                        <div className="text-[11px] text-gray-500 font-mono">
                                           Budget: ₹{lead.budget}
                                        </div>
                                      )}
                                   </div>

                                   {/* Card Actions */}
                                   <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                                      <div className="flex gap-2">
                                         {lead.phone && (
                                           <a 
                                             href={`tel:${lead.phone}`} 
                                             onClick={e => e.stopPropagation()}
                                             className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" 
                                             title="Call"
                                           >
                                              <MdPhone size={14} />
                                           </a>
                                         )}
                                         {lead.email && (
                                           <a 
                                             href={`mailto:${lead.email}`} 
                                             onClick={e => e.stopPropagation()}
                                             className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" 
                                             title="Email"
                                           >
                                              <MdEmail size={14} />
                                           </a>
                                         )}
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-medium">{leadDate}</span>
                                   </div>
                                </div>
                             );
                          })}
                          
                          {colLeads.length === 0 && (
                             <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                                No leads in {column.title}
                             </div>
                          )}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      ) : (
        /* 4. LIST VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4">Client Name</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Vehicle Interest</th>
                       <th className="px-6 py-4">Contact</th>
                       <th className="px-6 py-4">Created</th>
                       <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map(lead => {
                       const carText = lead.carInterested?.brand 
                         ? `${lead.carInterested.brand} ${lead.carInterested.model}` 
                         : (typeof lead.carInterested === 'string' ? lead.carInterested : 'Any Model');
                       const leadDate = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                         month: 'short',
                         day: 'numeric',
                         year: 'numeric'
                       }) : '';

                       return (
                          <tr 
                            key={lead._id || lead.id} 
                            onClick={() => navigate(`/crm/enquiries/${lead._id || lead.id}`)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                             <td className="px-6 py-4">
                                <p className="font-bold text-gray-900">{lead.name}</p>
                                <p className="text-xs text-gray-400">{lead.source || 'Website'}</p>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                   lead.status === 'New' ? 'bg-blue-100 text-blue-700' : 
                                   lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' :
                                   lead.status === 'In Progress' ? 'bg-purple-100 text-purple-700' :
                                   lead.status === 'Follow-Up' ? 'bg-amber-100 text-amber-700' :
                                   'bg-gray-100 text-gray-600'
                                }`}>
                                   {lead.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-medium text-gray-800">{carText}</td>
                             <td className="px-6 py-4 font-mono text-xs text-gray-600">{lead.phone || lead.email || 'N/A'}</td>
                             <td className="px-6 py-4 text-xs text-gray-500">{leadDate}</td>
                             <td className="px-6 py-4 text-right">
                                <button 
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs inline-flex items-center gap-1"
                                >
                                   Details <MdArrowForward />
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
            </div>

            {filteredLeads.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="font-bold text-gray-700">No enquiries found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filter or search query</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default EnquiriesPage;
