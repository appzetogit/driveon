import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../theme/colors';
import { useAppSelector } from '../../hooks/redux';
import { commonService } from '../../services/common.service';


/**
 * FAQPage Component
 * Displays all frequently asked questions
 * Only visible on web view
 */
const FAQPage = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  // Fetch FAQs from API
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await commonService.getFAQs();
        if (response.success && response.data?.faqs && Array.isArray(response.data.faqs)) {
          setFaqs(response.data.faqs);
        } else if (Array.isArray(response.faqs)) {
          setFaqs(response.faqs);
        } else if (Array.isArray(response.data)) {
          setFaqs(response.data);
        } else {
          setFaqs([]);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Web Header - Only visible on web */}
      <header className="hidden md:block w-full sticky top-0 z-50" style={{ backgroundColor: colors.brandBlack }}>
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
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-indigo-600 text-white font-bold text-sm">
                    {user?.profilePhoto || user?.avatar ? (
                      <img
                        src={user.profilePhoto || user.avatar}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
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
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6">
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

      {/* FAQ Section */}
      <div className="w-full pt-6 md:pt-8 lg:pt-10 pb-8 md:pb-10 lg:pb-12">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8" style={{ color: colors.textPrimary }}>
            Frequently Asked Questions
          </h1>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                  style={{ borderColor: colors.backgroundTertiary }}
                ></div>
                <p style={{ color: colors.textSecondary }}>Loading FAQs...</p>
              </div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: colors.textSecondary }}>No FAQs available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-3.5">
              {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden transition-all duration-200"
                  style={{ 
                    backgroundColor: colors.backgroundPrimary,
                    border: `1px solid ${isOpen ? colors.textPrimary : colors.borderLight}`,
                    boxShadow: isOpen ? `0 4px 6px ${colors.shadowLight}` : 'none'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 md:p-4 lg:p-5 text-left focus:outline-none transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: isOpen ? colors.backgroundPrimary : 'transparent'
                    }}
                  >
                    <h3 className="text-base md:text-lg lg:text-xl font-bold pr-4 flex-1" style={{ color: colors.textPrimary }}>
                      {faq.question}
                    </h3>
                    <svg
                      className={`w-4 h-4 md:w-5 md:h-5 lg:w-5 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                      style={{ color: colors.textPrimary }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 md:px-4 lg:px-5 pb-4 md:pb-4 lg:pb-5 pt-0">
                      <p className="text-sm md:text-sm lg:text-base leading-normal pt-2" style={{ color: colors.textSecondary }}>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;

