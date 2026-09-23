import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiArrowLeft, FiInfo, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import commonService from '../../services/common.service';

const EmployeePrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await commonService.getPolicy('employee_privacy_policy');
        if (res.success && res.data) {
          setPolicy(res.data);
        }
      } catch (error) {
        console.warn('Failed to load dynamic policy, falling back to static content');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

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
            <h1 className="text-xl font-bold text-white tracking-wide">Privacy Policy</h1>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                <FiShield size={20} />
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 -mt-8 z-10 space-y-6 flex-1 pb-10 max-w-3xl mx-auto w-full">
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6"
        >
            <div className="text-center pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-[#1C205C]">{policy ? policy.title : 'Employee Privacy Policy'}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {policy && policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : policy ? (
              /* DYNAMIC POLICY CONTENT FROM ADMIN */
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap px-2">
                {policy.content}
              </div>
            ) : (
              /* STATIC FALLBACK */
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                  <PolicySection title="1. Information We Collect" icon={<FiInfo className="text-blue-500" />}>
                      We collect personal information necessary for your employment, including but not limited to your name, contact details, identification documents, financial information for payroll, and location data when using the app during working hours for task assignment and attendance tracking.
                  </PolicySection>

                  <PolicySection title="2. How We Use Your Information" icon={<FiShield className="text-blue-500" />}>
                      Your data is used strictly for employment-related purposes such as processing payroll, managing attendance, task delegation, performance evaluation, and ensuring the security and safety of all staff members and company assets.
                  </PolicySection>

                  <PolicySection title="3. Data Security & Protection" icon={<FiLock className="text-blue-500" />}>
                      We implement strict security measures to protect your personal and employment data. Access to this information is limited to authorized HR and management personnel only. We do not sell or share your data with third parties except as required by law or necessary for payroll/benefits processing.
                  </PolicySection>

                  <PolicySection title="4. Location Tracking" icon={<FiInfo className="text-blue-500" />}>
                      The app may track your location during your active working hours to facilitate accurate attendance tracking, field task assignments, and safety monitoring. Location tracking is strictly disabled outside of your logged-in/working hours.
                  </PolicySection>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-xs text-gray-400 text-center">
                          By using the Driveon Employee App, you consent to the collection and use of your information as outlined in this policy. For any privacy-related concerns, please contact the HR department or use the support section.
                      </p>
                  </div>
              </div>
            )}
        </motion.div>
      </div>
    </div>
  );
};

const PolicySection = ({ title, icon, children }) => (
    <div className="bg-gray-50 p-4 rounded-2xl">
        <h3 className="font-bold text-[#1C205C] flex items-center gap-2 mb-2">
            {icon} {title}
        </h3>
        <p className="text-gray-600 text-sm">{children}</p>
    </div>
);

export default EmployeePrivacyPolicyPage;
