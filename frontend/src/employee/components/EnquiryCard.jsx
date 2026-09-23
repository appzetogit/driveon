import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiCalendar, FiCheck, FiX, FiPlay } from 'react-icons/fi';

const EnquiryCard = ({ enquiry, onStatusUpdate, onClick }) => {
  const [showCloseReason, setShowCloseReason] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const getStatusBadge = (status) => {
    const styles = {
      'new': 'bg-blue-50 text-blue-600 border border-blue-100',
      'in progress': 'bg-purple-50 text-purple-600 border border-purple-100',
      'follow-up': 'bg-orange-50 text-orange-600 border border-orange-100',
      'converted': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      'closed': 'bg-rose-50 text-rose-600 border border-rose-100'
    };
    
    const displayStatus = status === 'In Progress' ? 'Pending' : status;
    return (
      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${styles[status.toLowerCase()] || 'bg-gray-50 text-gray-500'}`}>
        {displayStatus}
      </span>
    );
  };

  const statusLower = enquiry.status ? enquiry.status.toLowerCase() : 'new';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.05)" }}
      onClick={onClick}
      className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100/80 mb-4 relative overflow-hidden transition-all group cursor-pointer"
    >
      {/* Background Watermark Stamp for Converted / Closed */}
      {statusLower === 'converted' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] transform rotate-[15deg] font-black text-emerald-600 text-3xl tracking-widest uppercase border-4 border-emerald-600 px-4 py-1.5 rounded-2xl">
          Converted
        </div>
      )}
      {statusLower === 'closed' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] transform rotate-[-15deg] font-black text-rose-600 text-3xl tracking-widest uppercase border-4 border-rose-600 px-4 py-1.5 rounded-2xl">
          Closed
        </div>
      )}

      {/* Main Info */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="min-w-0">
            <h4 className="font-extrabold text-gray-800 text-base leading-tight group-hover:text-[#1C205C] transition-colors truncate">{enquiry.name}</h4>
            {enquiry.car && (
              <p className="text-xs text-indigo-600 font-bold mt-0.5 break-words">{enquiry.car}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{enquiry.phone}</span>
              {/* Dial Button */}
              {statusLower !== 'new' && (
                <a
                  href={`tel:${enquiry.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
                  title="Call Lead"
                >
                  <FiPhone size={11} className="stroke-[3]" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {getStatusBadge(enquiry.status || 'New')}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
            <FiCalendar size={10} />
            <span>{enquiry.date}</span>
          </div>
        </div>
      </div>

      {/* Bottom Info & Interactive Buttons */}
      {(statusLower === 'new' || statusLower === 'in progress' || statusLower === 'follow-up' || statusLower === 'pending') && (
        <div className="flex flex-col gap-3.5 border-t border-gray-100 pt-4 mt-1">
          {/* Dynamic Workflow Actions */}
          {statusLower === 'new' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(enquiry.id, 'In Progress');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C205C] hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-indigo-900/10 hover:shadow-indigo-900/20 active:scale-[0.98]"
            >
              <FiPlay size={14} className="fill-white text-white" />
              Start Enquiry
            </button>
          )}

          {(statusLower === 'in progress' || statusLower === 'follow-up' || statusLower === 'pending') && (
            <div className="grid grid-cols-2 gap-2 w-full mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(enquiry.id, 'Converted');
                }}
                className="flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-[11px] transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <FiCheck size={13} className="stroke-[3]" /> Converted
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCloseReason(true);
                }}
                className="flex items-center justify-center gap-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-[11px] transition-all shadow-md shadow-rose-500/10 hover:shadow-rose-500/20 active:scale-[0.98]"
              >
                <FiX size={13} className="stroke-[3]" /> Closed
              </button>
            </div>
          )}

          {showCloseReason && (
            <div className="mt-2 bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col gap-2 animate-fadeIn" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                placeholder="Reason for closing?"
                className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => { setShowCloseReason(false); setCloseReason(''); }}
                  className="flex-1 py-1.5 bg-white text-rose-500 font-bold rounded-lg border border-rose-200 text-xs hover:bg-rose-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if(!closeReason.trim()) return;
                    onStatusUpdate(enquiry.id, 'Closed', closeReason);
                    setShowCloseReason(false);
                    setCloseReason('');
                  }}
                  className="flex-1 py-1.5 bg-rose-500 text-white font-bold rounded-lg text-xs hover:bg-rose-600 disabled:opacity-50 transition-colors"
                  disabled={!closeReason.trim()}
                >
                  Confirm Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EnquiryCard;
