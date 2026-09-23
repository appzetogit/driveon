import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';

const DEFAULT_TEMPLATES = {
  privacy_policy: {
    title: 'Privacy Policy',
    content: 'PRIVACY POLICY\n\nLast Updated - [Date]\n\nAt DriveOn, your trust is our most valuable asset...',
  },
  terms_conditions: {
    title: 'Terms & Conditions',
    content: 'TERMS AND CONDITIONS FOR HOSTS & GUESTS\n\nLast Updated - [Date]\n\nWelcome to DriveOn Host Services...',
  },
  cancellation_refund: {
    title: 'Cancellation & Refund Policy',
    content: 'CANCELLATION & REFUND POLICY\n\nLast Updated - [Date]\n\nAt DriveOn, we strive to offer flexible, fair policies...',
  },
};

const AdminPolicyEditorPage = () => {
  const { policyKey } = useParams();
  const navigate = useNavigate();

  // Map route param to database key
  const dbKeyMap = {
    'privacy-policy': 'privacy_policy',
    'terms-conditions': 'terms_conditions',
    'cancellation-refund': 'cancellation_refund',
  };

  const dbKey = dbKeyMap[policyKey] || 'privacy_policy';
  const displayTitle = dbKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  // Fetch policy on mount or key change
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await adminService.getPolicy(dbKey);
        if (response.success && response.data?.policy) {
          setTitle(response.data.policy.title);
          setContent(response.data.policy.content);
        } else {
          // Use default template fallback
          const template = DEFAULT_TEMPLATES[dbKey] || { title: displayTitle, content: '' };
          setTitle(template.title);
          setContent(template.content);
        }
      } catch (error) {
        console.warn(`Policy ${dbKey} not found in DB, using fallback template`);
        const template = DEFAULT_TEMPLATES[dbKey] || { title: displayTitle, content: '' };
        setTitle(template.title);
        setContent(template.content);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [dbKey, policyKey]);

  // Handle Save
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toastUtils.error('Title and Content are required!');
      return;
    }

    try {
      setSaving(true);
      const response = await adminService.updatePolicy(dbKey, { title, content });
      if (response.success) {
        toastUtils.success(`${title} updated successfully!`);
      } else {
        toastUtils.error(response.message || 'Failed to update policy');
      }
    } catch (error) {
      console.error('Update policy error:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p style={{ color: colors.textSecondary }}>Loading policy content...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-6 pb-6 md:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ color: colors.textSecondary }}
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: colors.backgroundTertiary }}>
                {displayTitle} Editor
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-12">
              Edit database policy page shown dynamically to app users
            </p>
          </div>
          
          {/* Action Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="md:self-center px-6 py-3 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Changes</span>
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
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Write / Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'preview'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Live App Preview
          </button>
        </div>

        {/* Editor Content Area */}
        <Card className="overflow-hidden">
          {activeTab === 'edit' ? (
            <div className="p-6 space-y-6">
              {/* Policy Display Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-black">
                  Policy Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter policy display title"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black font-semibold"
                />
              </div>

              {/* Policy Body Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-black">
                    Policy Content Text
                  </label>
                  <span className="text-xs text-gray-500 font-medium">
                    {content.split(/\s+/).filter(Boolean).length} words | {content.length} characters
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  placeholder="Write policy content here (Markdown or plain text)..."
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-800 font-mono text-sm leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Premium Live App Preview Mode */
            <div className="p-6 bg-gray-50 border border-gray-100 flex items-center justify-center">
              <div 
                className="w-full max-w-sm rounded-[36px] shadow-2xl border-[10px] border-black overflow-hidden relative"
                style={{ backgroundColor: colors.backgroundSecondary, aspectRatio: '9/19', minHeight: '620px' }}
              >
                {/* Smartphone Speaker/Camera Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1 bg-gray-800 rounded-full"></div>
                </div>

                {/* Mobile Screen Workspace */}
                <div className="h-full w-full overflow-y-auto pt-8 pb-10 px-4 relative flex flex-col">
                  {/* Header Title */}
                  <div className="flex items-center gap-3 py-3 border-b mb-4 flex-shrink-0" style={{ borderColor: colors.borderLight }}>
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                    <span className="font-bold text-sm text-black">{title || displayTitle}</span>
                  </div>

                  {/* Body Copy */}
                  <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto mb-4">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-700 max-w-none">
                      {content || 'No content written yet. Edit under Write/Edit tab.'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminPolicyEditorPage;
