import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import { useAppSelector } from '../../hooks/redux';
import { commonService } from '../../services/common.service';
import carImg1 from '../../assets/car_img1-removebg-preview.png';

/**
 * PrivacyPolicyPage Component
 * Full privacy policy page with DriveOn branding
 * Responsive for both mobile and web view
 * Based on user-provided privacy policy content
 */
const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Dynamic policy state
  const [policyTitle, setPolicyTitle] = useState(null);
  const [policyContent, setPolicyContent] = useState(null);
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await commonService.getPolicy('privacy_policy');
        // res.data = { success, data: { key, title, content, updatedAt } | null }
        if (res?.success && res?.data?.content) {
          setPolicyTitle(res.data.title || null);
          setPolicyContent(res.data.content);
          if (res.data.updatedAt) {
            setPolicyUpdatedAt(new Date(res.data.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
          }
        }
        // If data is null, silently use static fallback (policy not configured yet)
      } catch (error) {
        console.warn('Privacy policy fetch failed, using static content:', error?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header - Mobile only */}
      <div className="md:hidden sticky top-0 z-50">
        <ProfileHeader title="Privacy Policy" showBack />
      </div>

      {/* Web Header - Only visible on web */}
      <header
        className="hidden md:block w-full sticky top-0 z-50"
        style={{ backgroundColor: colors.brandBlack }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center h-16 md:h-20 lg:h-24 justify-between">
            {/* Left - Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/driveonlogo.png"
                alt="DriveOn Logo"
                className="h-8 md:h-10 lg:h-12 xl:h-14 w-auto object-contain"
              />
            </Link>

            {/* Center - Navigation Tabs */}
            <nav className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 h-full">
              <Link
                to="/"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite }}
              >
                FAQs
              </Link>
            </nav>

            {/* Right - Login/Signup and Profile Icon */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                >
                  {/* Circular profile icon with white border */}
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <img
                        src={carImg1}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-3 md:px-4 lg:px-5 xl:px-6 py-1.5 md:py-2 lg:py-2.5 rounded-lg border text-xs md:text-sm lg:text-base font-medium transition-all hover:opacity-90"
                  style={{
                    borderColor: colors.borderMedium,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Back Button - Below Header */}
      <div className="hidden md:block w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: colors.backgroundTertiary }}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-base md:text-lg font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 md:px-6 lg:px-8 xl:px-12 pt-6 md:pt-8 pb-6 md:pb-8 mt-4 md:mt-0">
        <div className="max-w-4xl mx-auto">
          {/* Content Container */}
          <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-6 lg:p-8" style={{ borderColor: colors.borderLight }}>
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: colors.backgroundTertiary }}></div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>Loading Privacy Policy...</p>
                  </div>
                </div>
              ) : (
                <>
                  {(policyTitle || policyUpdatedAt) && (
                    <div className="mb-4 pb-4 border-b" style={{ borderColor: colors.borderLight }}>
                      {policyTitle && <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: colors.textPrimary }}>{policyTitle}</h2>}
                      {policyUpdatedAt && <p className="text-xs" style={{ color: colors.textSecondary }}>Last Updated: {policyUpdatedAt}</p>}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm lg:text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                    {policyContent || 'Privacy policy has not been configured yet.'}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

