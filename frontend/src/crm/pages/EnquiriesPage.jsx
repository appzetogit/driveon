import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdAdd, 
  MdSearch, 
  MdFilterList, 
  MdPhone, 
  MdEmail, 
  MdCalendarToday, 
  MdArrowForward,
  MdMoreVert,
  MdCheckCircle,
  MdCancel
} from 'react-icons/md';
import { premiumColors } from '../../theme/colors';

// MOCK DATA for Enquiries
const MOCK_LEADS = [
  { id: 1, name: 'Amit Sharma', source: 'Website', status: 'New', car: 'Toyota Innova', budget: '5k/day', phone: '9876543210', date: '2 hrs ago' },
  { id: 2, name: 'Priya Singh', source: 'Referral', status: 'Follow-Up', car: 'Swift Dzire', budget: '3k/day', phone: '9898989898', date: '1 day ago' },
  { id: 3, name: 'Rahul Verma', source: 'Direct', status: 'In Progress', car: 'Mahindra XUV700', budget: '8k/day', phone: '9988776655', date: 'Yesterday' },
  { id: 4, name: 'Sandeep Yeole', source: 'Google', status: 'Converted', car: 'Honda City', budget: '4k/day', phone: '9123456780', date: 'Today' },
  { id: 5, name: 'Neha Gupta', source: 'Facebook', status: 'New', car: 'Hyundai Creta', budget: '6k/day', phone: '8877665544', date: '30 mins ago' },
];

const KANBAN_COLUMNS = [
  { id: 'New', title: 'New Leads', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'Follow-Up', title: 'Follow Up', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'In Progress', title: 'Start Progress', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'Converted', title: 'Converted', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'Closed', title: 'Lost / Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const EnquiriesPage = () => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter leads based on tab and search query
  const filteredLeads = MOCK_LEADS.filter(lead => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !cleanSearch ||
      lead.name.toLowerCase().includes(cleanSearch) ||
      (lead.phone || '').includes(cleanSearch) ||
      (lead.car || '').toLowerCase().includes(cleanSearch);
      
    if (!matchesSearch) return false;
    
    if (activeTab === 'All') return true;
    if (activeTab === 'New') return lead.status === 'New';
    if (activeTab === 'In Progress') return lead.status === 'In Progress';
    if (activeTab === 'Follow-ups') return lead.status === 'Follow-Up';
    if (activeTab === 'Converted') return lead.status === 'Converted';
    if (activeTab === 'Closed') return lead.status === 'Closed';
    return true;
  });

  // Tab Filters
  const tabs = ['All', 'New', 'In Progress', 'Follow-ups', 'Converted', 'Closed'];

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* 1. Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm">Manage leads and conversions</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
           {/* Add New Enquiry Button */}
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
              <MdAdd size={20} />
              <span className="font-semibold">Add Lead</span>
           </button>
        </div>
      </div>

      {/* 2. Filters & Views Toolbar */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
         {/* Tabs */}
         <div className="flex overflow-x-auto scrollbar-hide gap-1 p-1">
            {tabs.map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                   ${activeTab === tab 
                     ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                     : 'text-gray-600 hover:bg-gray-50'}`}
               >
                 {tab}
               </button>
            ))}
         </div>

         {/* Search & View Toggles */}
         <div className="flex items-center gap-2 ml-auto">
            <div className="relative hidden md:block">
               <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search name, phone..." 
                 className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value.trimStart())}
               />
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
               <button 
                 onClick={() => setViewMode('kanban')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
               >
                 Board
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
               >
                 List
               </button>
            </div>
         </div>
      </div>

      {/* 3. KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
           <div className="flex gap-4 h-full min-w-[1200px]">
              {KANBAN_COLUMNS.map(column => (
                 <div key={column.id} className="w-80 flex flex-col h-full">
                    {/* Column Header */}
                    <div className={`p-3 rounded-t-xl border-t border-x ${column.color} font-bold flex justify-between items-center bg-opacity-50`}>
                       <span>{column.title}</span>
                       <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                          {filteredLeads.filter(l => l.status === column.id).length}
                       </span>
                    </div>

                    {/* Column Body / Droppable Area */}
                    <div className="flex-1 bg-gray-50/50 border-x border-b border-gray-200 rounded-b-xl p-2 overflow-y-auto space-y-3">
                       {filteredLeads.filter(l => l.status === column.id).map(lead => (
                          <motion.div 
                            key={lead.id}
                            whileHover={{ y: -2 }}
                            layoutId={lead.id}
                            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all"
                          >
                             {/* Card Header: Name & Source */}
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <h4 className="font-bold text-gray-800">{lead.name}</h4>
                                   <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{lead.source}</span>
                                </div>
                                <button className="text-gray-300 hover:text-gray-600">
                                   <MdMoreVert />
                                </button>
                             </div>
                             
                             {/* Card Details */}
                             <div className="space-y-1 mb-3">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                   <MdCheckCircle className="text-gray-400" size={14} /> 
                                   <span className="font-medium text-gray-900">{lead.car}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                   <MdCheckCircle className="text-transparent" size={14} /> 
                                   <span>Budget: {lead.budget}</span>
                                </div>
                             </div>

                             {/* Card Actions */}
                             <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                                <div className="flex gap-2">
                                   <button className="p-1.5 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Call">
                                      <MdPhone size={14} />
                                   </button>
                                   <button className="p-1.5 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Message">
                                      <MdEmail size={14} />
                                   </button>
                                </div>
                                <span className="text-[10px] text-gray-400">{lead.date}</span>
                             </div>
                          </motion.div>
                       ))}
                       
                       {/* Drop Placeholder if empty */}
                       {filteredLeads.filter(l => l.status === column.id).length === 0 && (
                          <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                             Drop here
                          </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* 4. LIST VIEW (Alternative) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                     <th className="px-6 py-4">Name</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Car Interest</th>
                     <th className="px-6 py-4">Budget</th>
                     <th className="px-6 py-4">Contact</th>
                     <th className="px-6 py-4 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map(lead => (
                     <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-900">{lead.name}</p>
                           <p className="text-xs text-gray-400">{lead.source}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold 
                              ${lead.status === 'New' ? 'bg-blue-100 text-blue-700' : 
                                lead.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-600'}`}>
                              {lead.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">{lead.car}</td>
                        <td className="px-6 py-4">{lead.budget}</td>
                        <td className="px-6 py-4 font-mono text-xs">{lead.phone}</td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 justify-end ml-auto">
                              Details <MdArrowForward />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default EnquiriesPage;
