import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';
import api from '../services/api';

/**
 * PoliciesPage Component
 * Shows policy category tabs at top, and displays dynamic policy content fetched from the server.
 */
const PoliciesPage = () => {
  const navigate = useNavigate();
  const [selectedPolicy, setSelectedPolicy] = useState('privacy');
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const policies = [
    {
      id: 'fee-policy',
      key: 'fee_policy',
      label: 'Fee Policy: Guest Fee Policy',
    },
    {
      id: 'terms',
      key: 'terms_conditions',
      label: 'Platform Terms of Use',
    },
    {
      id: 'c2c-terms',
      key: 'c2c_terms',
      label: 'C2C Terms and Conditions - Host & Guest',
    },
    {
      id: 'privacy',
      key: 'privacy_policy',
      label: 'Privacy Policy',
    },
    {
      id: 'gift-cards',
      key: 'gift_cards',
      label: 'Gift Cards Terms & Conditions',
    },
  ];

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const activePolicy = policies.find((p) => p.id === selectedPolicy);
        const policyKey = activePolicy?.key || selectedPolicy;
        const res = await api.get(`/common/policies/${policyKey}`);
        
        if (res.data?.data) {
          setPolicyData(res.data.data);
        } else {
          setPolicyData(null);
        }
      } catch (err) {
        console.error('Error fetching policy content:', err);
        setPolicyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [selectedPolicy]);

  const handlePolicyClick = (policyId) => {
    setSelectedPolicy(policyId);
    setTimeout(() => {
      const contentSection = document.getElementById('policy-content');
      if (contentSection) {
        contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const currentPolicyConfig = policies.find((p) => p.id === selectedPolicy);

  return (
    <div className="min-h-screen bg-white pb-20">
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
            <h1 className="text-lg font-bold text-white">Policies</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Policies Section Navigation */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center" style={{ color: theme.colors.textPrimary }}>
              POLICIES
            </h2>
            <div className="border-t border-gray-300 mb-6"></div>

            {/* Policy Links - First Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4">
              {policies.slice(0, 4).map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => handlePolicyClick(policy.id)}
                  className={`text-sm md:text-base transition-colors ${
                    selectedPolicy === policy.id ? 'font-bold underline underline-offset-4' : 'font-normal'
                  }`}
                  style={{
                    color: selectedPolicy === policy.id ? theme.colors.primary : theme.colors.textPrimary,
                  }}
                >
                  {policy.label}
                </button>
              ))}
            </div>

            {/* Policy Links - Second Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6">
              {policies.slice(4).map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => handlePolicyClick(policy.id)}
                  className={`text-sm md:text-base transition-colors ${
                    selectedPolicy === policy.id ? 'font-bold underline underline-offset-4' : 'font-normal'
                  }`}
                  style={{
                    color: selectedPolicy === policy.id ? theme.colors.primary : theme.colors.textPrimary,
                  }}
                >
                  {policy.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-300"></div>
          </div>

          {/* Policy Content Section */}
          <div id="policy-content" className="mt-8">
            {loading ? (
              <div className="bg-white rounded-xl shadow-lg border-2 p-8 text-center flex flex-col items-center justify-center" style={{ borderColor: theme.colors.borderLight }}>
                <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: `${theme.colors.primary} transparent transparent transparent` }}></div>
                <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                  Loading {currentPolicyConfig?.label || 'policy'}...
                </p>
              </div>
            ) : policyData && policyData.content ? (
              <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-8" style={{ borderColor: theme.colors.borderLight }}>
                <div className="border-b pb-4 mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                    {policyData.title || currentPolicyConfig?.label}
                  </h3>
                  {policyData.updatedAt && (
                    <p className="text-xs md:text-sm" style={{ color: theme.colors.textTertiary }}>
                      Last Updated: {new Date(policyData.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="prose prose-sm md:prose-base max-w-none">
                  <div className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                    {policyData.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border-2 p-6 md:p-8 text-center" style={{ borderColor: theme.colors.borderLight }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                  <svg className="w-8 h-8" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                  {currentPolicyConfig?.label}
                </h4>
                <p className="text-sm md:text-base max-w-md mx-auto" style={{ color: theme.colors.textSecondary }}>
                  This policy is currently being updated. Please check back soon or contact support for further inquiries.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PoliciesPage;
