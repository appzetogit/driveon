// Enquiries List Page
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiArrowLeft, FiCalendar, FiX } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderTopBar from '../components/HeaderTopBar';
import EnquiryCard from '../components/EnquiryCard';
import BottomNav from '../components/BottomNav';
import DateRangeModal from '../components/DateRangeModal';
import { isWithinInterval, parse, startOfDay, endOfDay, format } from 'date-fns';
import api from '../../services/api';
import { toast } from 'react-hot-toast';



const DetailModal = ({ isOpen, onClose, enquiry }) => {
  if (!isOpen || !enquiry) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 relative"
      >
        {/* Header */}
        <div className="bg-[#1C205C] px-6 py-5 text-white flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-lg leading-tight">{enquiry.name}</h3>
            <p className="text-blue-200 text-xs font-semibold tracking-wide uppercase mt-1">{enquiry.phone}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Car Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interested Car</span>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="text-base font-bold text-[#1C205C]">
                {enquiry.car || 'Not Specified'}
              </div>
            </div>
          </div>

          {/* Note details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note Given by Admin</span>
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {enquiry.note || 'No notes added by admin when enquiry was created.'}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="px-6 pb-6 pt-2">
          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-[#1C205C] text-white font-bold rounded-2xl text-sm hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-900/10 active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const EnquiriesListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.user);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'All');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Fetch Enquiries
  useEffect(() => {
    const fetchEnquiries = async () => {
      const staffId = user?._id || user?.id;
      if (!staffId) {
        // Wait for user info to load
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/crm/enquiries?assignedTo=${staffId}`);
        if (response.data.success) {
          // Map backend data to component format
          const mappedEnquiries = response.data.data.enquiries.map(enq => ({
            id: enq._id,
            name: enq.name,
            phone: enq.phone,
            status: enq.status,
            date: enq.createdAt ? format(new Date(enq.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy'),
            createdAt: enq.createdAt, // Keep original for date usage if needed
            car: enq.carInterested?.brand ? `${enq.carInterested.brand} ${enq.carInterested.model}` : (typeof enq.carInterested === 'string' ? enq.carInterested : ''),
            note: enq.note || ''
          }));
          setEnquiries(mappedEnquiries);
        }
      } catch (error) {
        console.error('Error fetching enquiries:', error);
        toast.error('Failed to load enquiries');
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, [user]);

  const handleStatusUpdate = async (enquiryId, newStatus, reason = '') => {
    try {
      const payload = { status: newStatus };
      if (reason) payload.reasonForClosing = reason;
      const response = await api.put(`/crm/enquiries/${enquiryId}`, payload);
      if (response.data.success) {
        toast.success(`Enquiry marked as ${newStatus}`);
        setEnquiries(prev => prev.map(enq => enq.id === enquiryId ? { ...enq, status: newStatus } : enq));
      }
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter Logic
  const filteredEnquiries = enquiries.filter(enquiry => {
    // 1. Tab Filter
    if (activeTab !== 'All') {
      const activeTabLower = activeTab.toLowerCase();
      const statusLower = enquiry.status ? enquiry.status.toLowerCase() : 'new';
      
      if (activeTabLower === 'pending') {
        if (statusLower !== 'in progress' && statusLower !== 'pending' && statusLower !== 'follow-up' && statusLower !== 'new') return false;
      } else {
        if (statusLower !== activeTabLower) return false;
      }
    }

    // 2. Date Filter
    if (dateFilter.start && dateFilter.end) {
      const enquiryDate = startOfDay(new Date(enquiry.createdAt || enquiry.date)); // Simple parsing for now
      const start = startOfDay(dateFilter.start);
      const end = endOfDay(dateFilter.end);

      return isWithinInterval(enquiryDate, { start, end });
    }

    return true;
  });

  const handleDateApply = ({ start, end }) => {
    setDateFilter({ start, end });
  };

  const clearDateFilter = () => {
    setDateFilter({ start: null, end: null });
  };

  const tabs = ['All', 'Pending', 'Closed', 'Converted'];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F7FA] font-sans selection:bg-blue-100">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">

      {/* HEADER */}
      <div className="bg-[#1C205C] pt-12 pb-8 px-4 sm:px-6 rounded-b-[30px] shadow-lg sticky top-0 z-50">
        <HeaderTopBar
          title="Enquiries"
          showBack={false}
          className="mb-3"
          rightAction={
            <div className="relative">
              <button
                onClick={() => setIsDateModalOpen(true)}
                className={`p-2.5 rounded-full transition-all ${dateFilter.start ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <FiCalendar size={20} />
              </button>
              {dateFilter.start && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1C205C]"></span>
              )}
            </div>
          }
        />

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
                 ${activeTab === tab
                  ? 'bg-white text-[#1C205C] shadow-md'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="px-4 sm:px-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Showing {filteredEnquiries.length} {activeTab}
            {dateFilter.start && <span className="text-blue-600 block sm:inline sm:ml-1 mt-1 sm:mt-0 font-normal normal-case">(Filtered by Date)</span>}
          </p>

          {dateFilter.start && (
            <button onClick={clearDateFilter} className="text-red-500 text-xs font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full">
              <FiX /> Clear Dates
            </button>
          )}
        </div>

        <motion.div layout className="space-y-4">
          <AnimatePresence mode='wait'>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C205C]"></div>
              </div>
            ) : filteredEnquiries.length > 0 ? (
              filteredEnquiries.map(enquiry => (
                <EnquiryCard key={enquiry.id} enquiry={enquiry} onStatusUpdate={handleStatusUpdate} onClick={() => setSelectedEnquiry(enquiry)} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-16 text-gray-400 flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiSearch className="text-3xl opacity-50" />
                </div>
                <p className="font-bold text-gray-500">No enquiries found</p>
                <p className="text-xs mt-1">Try changing fields or filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* DATE RANGE MODAL */}
      <DateRangeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onApply={handleDateApply}
      />

      <DetailModal
        isOpen={!!selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        enquiry={selectedEnquiry}
      />



      </div>

      {/* BOTTOM NAV */}
      <BottomNav />
    </div>
  );
};

export default EnquiriesListPage;
