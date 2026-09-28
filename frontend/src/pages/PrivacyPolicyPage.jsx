import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';
import api from '../services/api';

/**
 * PrivacyPolicyPage Component
 * Displays live Privacy Policy fetched dynamically from the database.
 */
const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await api.get('/common/policies/privacy_policy');
        if (res.data?.data) {
          setPolicyData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching privacy policy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg border-2 p-8 text-center flex flex-col items-center justify-center" style={{ borderColor: theme.colors.borderLight }}>
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: `${theme.colors.primary} transparent transparent transparent` }}></div>
              <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                Loading Privacy Policy...
              </p>
            </div>
          ) : policyData && policyData.content ? (
            <>
              {/* Introduction Card */}
              <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-6 mb-6" style={{ borderColor: theme.colors.borderLight }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                    <svg className="w-6 h-6" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                      {policyData.title || 'DriveOn Privacy Policy'}
                    </h2>
                    <p className="text-sm md:text-base mt-1" style={{ color: theme.colors.textSecondary }}>
                      Last Updated: {policyData.updatedAt ? new Date(policyData.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Body */}
              <div className="bg-white rounded-xl shadow-md border-2 p-5 md:p-8" style={{ borderColor: theme.colors.borderLight }}>
                <div className="prose prose-sm md:prose-base max-w-none">
                  <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                    {policyData.content}
                  </div>
                </div>
              </div>

              {/* Agreement Section */}
              <div
                className="mt-8 md:mt-10 rounded-xl shadow-lg border-2 p-4 md:p-6"
                style={{
                  borderColor: theme.colors.primary,
                  background: `linear-gradient(to right, ${theme.colors.primary}08, white)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                    <svg className="w-5 h-5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                      Your Privacy Matters
                    </h3>
                    <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                      We are committed to protecting your privacy and ensuring the security of your personal information. If you have any questions or concerns about this Privacy Policy or our data practices, please contact our support team.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border-2 p-6 md:p-8 text-center" style={{ borderColor: theme.colors.borderLight }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <svg className="w-8 h-8" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                Privacy Policy
              </h3>
              <p className="text-sm md:text-base max-w-md mx-auto" style={{ color: theme.colors.textSecondary }}>
                Privacy Policy details will be updated shortly. Please check back later.
              </p>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm" style={{ color: theme.colors.textTertiary }}>
              © {currentYear} DriveOn. All rights reserved.
            </p>
            <p className="text-xs md:text-sm mt-2" style={{ color: theme.colors.textTertiary }}>
              For questions about this Privacy Policy, please contact our privacy team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
