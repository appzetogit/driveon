import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPersonAdd, MdClose, MdCheck, MdCheckCircle } from 'react-icons/md';
import api from '../../../services/api';

const AssignCallerModal = ({ isOpen, onClose, enquiryIds = [], onSuccess, singleEnquiryId }) => {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [saving, setSaving] = useState(false);

  const ids = singleEnquiryId ? [singleEnquiryId] : enquiryIds;

  useEffect(() => {
    if (isOpen) { fetchStaff(); setSelectedStaffId(null); }
  }, [isOpen]);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get('/crm/staff');
      if (res.data.success) {
        const rawStaff = res.data.data.staff || res.data.data || [];
        const filteredStaff = rawStaff.filter(staff => {
          const roleLower = (staff.role || '').toLowerCase();
          return roleLower.includes('telecaller') || roleLower.includes('caller');
        });
        setStaffList(filteredStaff);
      }
    } catch (e) { console.error('Fetch staff error:', e); }
    finally { setLoadingStaff(false); }
  };

  const handleAssign = async () => {
    if (!selectedStaffId || ids.length === 0) return;
    setSaving(true);
    try {
      const res = await api.post('/crm/enquiries/bulk-assign', { enquiryIds: ids, staffId: selectedStaffId });
      if (res.data.success) onSuccess && onSuccess();
    } catch (e) { console.error('Assign error:', e); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#1C205C] to-indigo-600">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MdPersonAdd size={20} /> Assign to Staff Member
              </h2>
              <p className="text-indigo-200 text-xs mt-0.5">
                Assigning {ids.length} enquir{ids.length === 1 ? 'y' : 'ies'} to a staff member
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <MdClose size={20} />
            </button>
          </div>

          {/* Staff Grid */}
          <div className="p-5 max-h-[380px] overflow-y-auto">
            {loadingStaff ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                Loading staff...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {staffList.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400">No staff found.</div>
                )}
                {staffList.map(staff => {
                  const isSelected = selectedStaffId === staff._id;
                  return (
                    <button
                      key={staff._id}
                      onClick={() => setSelectedStaffId(staff._id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-md">
                        {staff.avatar
                          ? <img src={staff.avatar} alt="" className="w-full h-full object-cover" />
                          : (staff.name?.charAt(0) || '?')
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">{staff.name}</div>
                        <div className="text-gray-500 text-xs truncate">{staff.role}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                          <MdCheck size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
            <button onClick={onClose} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm">
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedStaffId || saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#1C205C] text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <MdCheckCircle size={16} />
              }
              Confirm Assignment
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignCallerModal;
