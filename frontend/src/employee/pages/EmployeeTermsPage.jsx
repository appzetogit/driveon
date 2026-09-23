import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiArrowLeft, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import commonService from '../../services/common.service';

const EmployeeTermsPage = () => {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await commonService.getPolicy('employee_terms_conditions');
        if (res.success && res.data) {
          setPolicy(res.data);
        }
      } catch (error) {
        console.warn('Failed to load dynamic terms, falling back to static content');
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
            <h1 className="text-xl font-bold text-white tracking-wide">Terms of Service</h1>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                <FiFileText size={20} />
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
                <h2 className="text-2xl font-bold text-[#1C205C]">{policy ? policy.title : 'Terms of Service'}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Last updated: {policy && policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : policy ? (
              /* DYNAMIC TERMS CONTENT FROM ADMIN */
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap px-2">
                {policy.content}
              </div>
            ) : (
              /* STATIC FALLBACK */
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                  <Section title="1. Acceptance of Terms" icon={<FiInfo className="text-blue-500" />}>
                      By accessing and using the DriveOn Employee App, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the application.
                  </Section>

                  <Section title="2. Employee Responsibilities" icon={<FiAlertCircle className="text-amber-500" />}>
                      As an employee, you are responsible for maintaining the confidentiality of your login credentials, accurately recording your attendance and work hours, completing assigned tasks within deadlines, and reporting any issues or discrepancies to your supervisor immediately.
                  </Section>

                  <Section title="3. Acceptable Use" icon={<FiInfo className="text-blue-500" />}>
                      The app must be used solely for work-related purposes. You must not share your account credentials, attempt to access unauthorized areas of the system, use the app for personal commercial activities, or tamper with location tracking or attendance systems.
                  </Section>

                  <Section title="4. Attendance & Location" icon={<FiInfo className="text-blue-500" />}>
                      You agree that the app may track your location during working hours for attendance verification and task management. Falsifying attendance records or manipulating location data is a violation of company policy and may result in disciplinary action.
                  </Section>

                  <Section title="5. Intellectual Property" icon={<FiFileText className="text-purple-500" />}>
                      All content, features, and functionality of the DriveOn Employee App are owned by DriveOn and are protected by intellectual property laws. You may not copy, modify, or distribute any part of the application without prior written consent.
                  </Section>

                  <Section title="6. Termination" icon={<FiAlertCircle className="text-red-500" />}>
                      Your access to the app may be terminated upon end of employment, violation of these terms, or at the company's discretion. Upon termination, all data associated with your account will be handled as per the company's data retention policy.
                  </Section>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-xs text-gray-400 text-center">
                          By continuing to use the DriveOn Employee App, you acknowledge that you have read, understood, and agree to these Terms of Service. For questions, contact the HR department.
                      </p>
                  </div>
              </div>
            )}
        </motion.div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
    <div className="bg-gray-50 p-4 rounded-2xl">
        <h3 className="font-bold text-[#1C205C] flex items-center gap-2 mb-2">
            {icon} {title}
        </h3>
        <p className="text-gray-600 text-sm">{children}</p>
    </div>
);

export default EmployeeTermsPage;
