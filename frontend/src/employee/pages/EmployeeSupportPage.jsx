import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeadphones, FiMail, FiPhone } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const EmployeeSupportPage = () => {
  const navigate = useNavigate();
  const [support, setSupport] = useState({ email: '', phone: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupportDetails();
  }, []);

  const fetchSupportDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/settings/employee-support');
      if (res.data.success) {
        setSupport({
          email: res.data.data.email || 'support.employee@driveon.com',
          phone: res.data.data.phone || '+91 98765 43210'
        });
      }
    } catch (error) {
      console.error('Error fetching employee support details:', error);
      // Fallback defaults
      setSupport({
        email: 'support.employee@driveon.com',
        phone: '+91 98765 43210'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans selection:bg-blue-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-[#1C205C] pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">Employee Support</h1>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
            <FiHeadphones size={20} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 -mt-8 z-10 space-y-6 flex-1 pb-10 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C205C]"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6"
          >
            <div className="text-center pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-[#1C205C]">How can we help?</h2>
              <p className="text-gray-500 text-sm mt-1">Contact official channels for payroll, app issues, or support</p>
            </div>

            <div className="space-y-4">
              <SupportCard 
                title="Email Support" 
                desc="Payroll query, attendance corrections, policy approvals or general questions"
                value={support.email}
                icon={<FiMail size={24} className="text-blue-500" />}
                link={`mailto:${support.email}`}
              />
              
              <SupportCard 
                title="Helpline Number" 
                desc="For urgent assistance, on-field emergencies or official support desk"
                value={support.phone}
                icon={<FiPhone size={24} className="text-red-500" />}
                link={`tel:${support.phone}`}
              />
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Expected response time for emails is 24-48 hours. <br/> For urgent matters, please use the helpline.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const SupportCard = ({ title, desc, value, icon, link }) => (
  <div className="flex flex-col sm:flex-row sm:items-center p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors gap-4">
    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-base text-[#1C205C]">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      <a 
        href={link}
        className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors mt-2 block w-full break-all font-mono"
      >
        {value}
      </a>
    </div>
  </div>
);

export default EmployeeSupportPage;
