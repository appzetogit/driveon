import { Link } from 'react-router-dom';
import { colors } from '../theme/colors';
import { useAppSelector } from '../../hooks/redux';
import carImg1 from '../../assets/car_img1-removebg-preview.png';

/**
 * AboutPage Component
 * Displays information about DriveOn
 */
const AboutPage = () => {
  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-12">
        <div
          className="rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10"
          style={{
            backgroundColor: colors.backgroundSecondary,
            boxShadow: `0 2px 8px ${colors.shadowLight}`,
          }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 md:mb-8">
            About DriveOn
          </h1>

          <div className="space-y-6 md:space-y-8 text-gray-700">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black mb-3">
                Who We Are
              </h2>
              <p className="text-base md:text-lg leading-relaxed">
                DriveOn is a trusted car rental platform that connects car owners with renters,
                providing a seamless and secure experience for both parties. We believe in making
                car rental accessible, affordable, and safe for everyone.
              </p>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black mb-3">
                Our Mission
              </h2>
              <p className="text-base md:text-lg leading-relaxed">
                Our mission is to revolutionize the car rental industry by providing a transparent,
                secure, and user-friendly platform. We ensure that every transaction is protected
                through comprehensive KYC verification, guarantor systems, and secure payment processing.
              </p>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black mb-3">
                What Makes Us Different
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base md:text-lg leading-relaxed">
                <li>Complete KYC verification through DigiLocker integration</li>
                <li>Guarantor system for added security</li>
                <li>Flexible payment options (Full Payment or 20% Advance)</li>
                <li>Secure payment processing via Razorpay and Stripe</li>
                <li>Comprehensive car and owner verification</li>
                <li>24/7 customer support</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black mb-3">
                Our Commitment
              </h2>
              <p className="text-base md:text-lg leading-relaxed">
                We are committed to providing the best car rental experience with maximum security,
                transparency, and convenience. Your safety and satisfaction are our top priorities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

