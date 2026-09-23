import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiMail, FiPhone, FiSave } from 'react-icons/fi';
import api from '../../../services/api';

const GRADIENT_HEADER = "linear-gradient(135deg, #1C205C 0%, #0f1642 100%)";

const EmployeeSupportPage = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/settings/employee-support');
      if (res.data.success) {
        setEmail(res.data.data.email || '');
        const phoneSetting = res.data.data.phone || '';
        setPhone(phoneSetting);
      }
    } catch (error) {
      console.error('Error fetching employee support settings:', error);
      toast.error('Failed to load support settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!email || !phone) {
      toast.error('Please fill in both email and phone number.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/crm/settings/employee-support', { email, phone });
      if (res.data.success) {
        toast.success('Support settings updated successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 min-h-screen bg-[#F5F7FA] pb-10">
      {/* Premium Gradient Header */}
      <div
        className="text-white pt-10 pb-16 px-8 rounded-b-[40px] shadow-xl relative overflow-hidden"
        style={{ background: GRADIENT_HEADER }}
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left">
            <div className="flex items-center gap-2 text-sm text-blue-100/70 mb-1 font-semibold uppercase tracking-wider">
              <span>Staff Operations</span> <span>/</span> <span className="text-blue-100">Employee Support</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Configure Employee Support</h1>
            <p className="text-blue-200/80 text-sm mt-1">Set contact details that employees will see when seeking support in their app.</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="px-8 -mt-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 shadow-lg border border-gray-100 max-w-2xl flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C205C]"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-100 max-w-2xl space-y-6"
          >
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Support Details</h2>
              <p className="text-gray-500 text-xs mt-1">These details will be displayed to staff members on their support dashboard.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Support Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hr@driveon.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] font-semibold text-xs text-gray-700 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Emergency Phone / Helpline</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiPhone size={16} />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] font-semibold text-xs text-gray-700 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-[#1C205C] text-white py-3.5 px-6 rounded-2xl text-xs font-bold hover:bg-[#151949] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSupportPage;
