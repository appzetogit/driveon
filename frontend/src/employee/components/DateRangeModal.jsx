import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCalendar, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';

const DateRangeModal = ({ isOpen, onClose, onApply }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeField, setActiveField] = useState('start'); // 'start' or 'end'

  const handleDateChange = (date) => {
    if (activeField === 'start') {
      setStartDate(date);
      // Automatically switch to end date after selecting start
      if (!endDate) setActiveField('end');
    } else {
      setEndDate(date);
    }
  };

  const handleApply = () => {
    onApply({ start: startDate, end: endDate });
    onClose();
  };

  const formatDateDisplay = (date) => {
    return date ? format(date, 'dd/MM/yyyy') : 'DD/MM/YYYY';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[70] p-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl pointer-events-auto">
              
              {/* Header */}
              <div className="bg-[#1C205C] p-6 text-white relative">
                 <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                   <FiX size={16} />
                 </button>
                 <h3 className="text-lg font-semibold mb-6 tracking-wide">Select Date Range</h3>
                 
                 {/* Date Inputs */}
                 <div className="space-y-4">
                    <div 
                      onClick={() => setActiveField('start')}
                      className={`relative cursor-pointer transition-all ${activeField === 'start' ? 'opacity-100' : 'opacity-50'}`}
                    >
                       <span className="text-[10px] font-medium text-blue-200 uppercase tracking-wider block mb-1">From</span>
                       <div className={`flex items-center justify-between border-b ${activeField === 'start' ? 'border-white' : 'border-white/30'} pb-1.5`}>
                          <span className="text-xl font-medium tracking-tight">{formatDateDisplay(startDate)}</span>
                          <FiCalendar className="text-lg opacity-80" />
                       </div>
                    </div>

                    <div 
                      onClick={() => setActiveField('end')}
                      className={`relative cursor-pointer transition-all ${activeField === 'end' ? 'opacity-100' : 'opacity-50'}`}
                    >
                       <span className="text-[10px] font-medium text-blue-200 uppercase tracking-wider block mb-1">To</span>
                       <div className={`flex items-center justify-between border-b ${activeField === 'end' ? 'border-white' : 'border-white/30'} pb-1.5`}>
                          <span className="text-xl font-medium tracking-tight">{formatDateDisplay(endDate)}</span>
                          <FiCalendar className="text-lg opacity-80" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Calendar Area */}
              <div className="p-4 bg-white">
                <style>{`
                  .react-datepicker { font-family: inherit; border: none; width: 100%; }
                  .react-datepicker__header { background-color: white; border-bottom: none; padding-top: 10px; }
                  .react-datepicker__current-month { color: #1C205C; font-weight: 700; font-size: 0.95rem; margin-bottom: 10px; }
                  .react-datepicker__day-name { color: #9ca3af; width: 2.2rem; font-size: 0.75rem; font-weight: 500; }
                  .react-datepicker__day { width: 2.2rem; line-height: 2.2rem; border-radius: 50%; margin: 0.1rem; font-size: 0.9rem; color: #374151; }
                  .react-datepicker__day:hover { background-color: #f3f4f6; }
                  .react-datepicker__day--selected { background-color: #1C205C !important; color: white !important; font-weight: 600; }
                  .react-datepicker__day--keyboard-selected { background-color: #eef2ff !important; color: #1C205C !important; }
                  .react-datepicker__day--in-selecting-range { background-color: #eef2ff !important; color: #1C205C !important; }
                  .react-datepicker__day--in-range { background-color: #eef2ff !important; color: #1C205C !important; }
                  .react-datepicker__day--outside-month { color: #d1d5db; }
                  .react-datepicker__month-container { width: 100%; }
                  .react-datepicker__triangle { display: none; }
                  .react-datepicker__navigation-icon::before { border-color: #1C205C; border-width: 2px 2px 0 0; width: 6px; height: 6px; }
                `}</style>
                <DatePicker
                  selected={activeField === 'start' ? startDate : endDate}
                  onChange={handleDateChange}
                  inline
                  calendarClassName="w-full"
                  minDate={activeField === 'end' ? startDate : null}
                />
              </div>

              {/* Footer Action */}
              <div className="p-6 pt-2">
                 <button 
                   onClick={handleApply}
                   disabled={!startDate && !endDate}
                   className="w-full bg-[#1C205C] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-900/10 hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                 >
                   <FiSearch /> Search Enquiries
                 </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DateRangeModal;
