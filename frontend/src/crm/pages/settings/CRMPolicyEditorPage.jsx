import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { motion } from 'framer-motion';
import { MdClose, MdSave, MdEdit, MdPhoneIphone, MdArrowBack } from 'react-icons/md';
import { premiumColors } from '../../../theme/colors';
import { rgba } from 'polished';
import { toast } from 'react-hot-toast';

const DEFAULT_TEMPLATES = {
  employee_privacy_policy: {
    title: 'Employee Privacy Policy',
    content: 'EMPLOYEE PRIVACY POLICY\n\nLast Updated: 5/31/2026\n\n1. Information We Collect\nWe collect personal information necessary for your employment, including name, contact details, financial info for payroll, and location data during active working hours.\n\n2. How We Use Your Information\nYour data is used strictly for employment-related purposes such as processing payroll, managing attendance, task delegation, and safety monitoring.\n\n3. Data Security & Protection\nWe implement strict security measures to protect your personal and employment data. Access is limited to authorized HR and management personnel only.\n\n4. Location Tracking\nThe app may track your location during your active working hours to facilitate accurate attendance tracking. It is strictly disabled outside working hours.',
  },
  employee_terms_conditions: {
    title: 'Employee Terms of Service',
    content: 'EMPLOYEE TERMS OF SERVICE\n\nLast Updated: 5/31/2026\n\n1. Acceptance of Terms\nBy accessing and using the DriveOn Employee App, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.\n\n2. Employee Responsibilities\nYou are responsible for maintaining confidentiality of credentials, accurately recording attendance, completing tasks, and reporting issues immediately.\n\n3. Acceptable Use\nThe app must be used solely for work-related purposes. You must not tamper with location tracking or attendance systems.\n\n4. Attendance & Location\nYou agree that the app may track your location during working hours for attendance verification. Falsifying records may result in disciplinary action.',
  },
};

const CRMPolicyEditorPage = ({ policyKey }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  const displayTitle = policyKey === 'employee_privacy_policy' ? 'Employee Privacy Policy' : 'Employee Terms & Conditions';
  const desc = policyKey === 'employee_privacy_policy' 
    ? 'Manage the Privacy Policy shown dynamically to employees in the mobile app.' 
    : 'Manage the Terms of Service shown dynamically to employees in the mobile app.';

  useEffect(() => {
    fetchPolicy();
  }, [policyKey]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/crm/policies/${policyKey}`);
      if (res.data.success && res.data.data) {
        setTitle(res.data.data.title || displayTitle);
        setContent(res.data.data.content || '');
      } else {
        const template = DEFAULT_TEMPLATES[policyKey];
        setTitle(template.title);
        setContent(template.content);
      }
    } catch (error) {
      console.warn('Error fetching policy, using default template:', error);
      const template = DEFAULT_TEMPLATES[policyKey];
      setTitle(template?.title || displayTitle);
      setContent(template?.content || '');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and Content are required!');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/crm/policies/${policyKey}`, { title, content });
      if (res.data.success) {
        toast.success(`${displayTitle} updated successfully!`);
      } else {
        toast.error(res.data.message || 'Failed to update policy');
      }
    } catch (error) {
      console.error('Update policy error:', error);
      toast.error(error.response?.data?.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Path Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/dashboard')}>Home</span>
            <span>/</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/settings')}>Settings</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">{displayTitle}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ color: premiumColors.primary.DEFAULT }}>{displayTitle}</h1>
          <p className="text-gray-500 text-sm">{desc}</p>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50"
          style={{ backgroundColor: premiumColors.primary.DEFAULT, boxShadow: `0 4px 14px ${rgba(premiumColors.primary.DEFAULT, 0.4)}` }}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <MdSave size={20} /> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'edit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Write / Edit
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <MdPhoneIphone size={16} /> Live App Preview
        </button>
      </div>

      {/* Workspace */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'edit' ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Policy Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter policy title"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">
                  Content (Markdown or Plain Text)
                </label>
                <span className="text-xs text-gray-400">
                  {content.split(/\s+/).filter(Boolean).length} words | {content.length} characters
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder="Write policy content here..."
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-700 font-mono text-sm leading-relaxed"
              />
            </div>
          </div>
        ) : (
          /* smartphone preview */
          <div className="p-12 bg-gray-50 flex items-center justify-center">
            <div 
              className="w-full max-w-sm rounded-[36px] shadow-2xl border-[10px] border-black overflow-hidden relative flex flex-col"
              style={{ backgroundColor: '#F5F7FA', aspectRatio: '9/19', minHeight: '620px' }}
            >
              {/* Speaker / Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-800 rounded-full"></div>
              </div>

              {/* simulated mobile screen */}
              <div className="h-full w-full overflow-y-auto pt-8 pb-10 px-4 relative flex flex-col text-sans">
                {/* Header */}
                <div className="flex items-center justify-between py-3 border-b mb-4 flex-shrink-0" style={{ borderColor: '#E5E7EB' }}>
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                    <MdArrowBack className="text-gray-800" size={16} />
                  </div>
                  <span className="font-bold text-xs text-gray-800">{title || displayTitle}</span>
                  <div className="w-8 h-8"></div>
                </div>

                {/* dynamic content card */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-y-auto mb-4">
                  <h3 className="text-lg font-bold text-[#1C205C] mb-3 text-center border-b pb-3">{title || displayTitle}</h3>
                  <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                    {content || 'No content written yet. Edit under Write/Edit tab.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMPolicyEditorPage;
