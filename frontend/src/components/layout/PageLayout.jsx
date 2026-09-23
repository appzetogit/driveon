import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import api from "../../services/api";
import Header from "./Header";
import Footer from "./Footer";
import BottomNavbar from "./BottomNavbar";
import { theme } from "../../theme/theme.constants";
import { requestForToken, onMessageListener, isMobileApp } from "../../services/firebase";
import toastUtils from "../../config/toast";


/**
 * PageLayout Component
 * Main layout wrapper for all pages
 * Includes Header, Footer, BottomNavbar (mobile), and loading states
 */
const PageLayout = () => {
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    if (user && user._id) {
      requestForToken().then(async (token) => {
        if (token) {
          const platform = isMobileApp() ? 'mobile' : 'web';
          try {
            await api.post('/user/fcm-token', { fcmToken: token, platform: platform });
            console.log(`User FCM Token saved (${platform})`);
          } catch (error) {
            console.error("Error saving User FCM token:", error);
          }
        }
      });
    } else {
      // Just request permission/token even if not logged in (optional, but good for later)
      // actually, we only save if logged in.
      requestForToken();
    }

    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
        console.log(payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, [user]);

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isProfilePage = location.pathname.startsWith("/profile");
  const isBookingPage =
    location.pathname === "/bookings" ||
    location.pathname.startsWith("/booking");
  const isCarsPage = location.pathname.startsWith("/cars");
  const isCarDetailsPage = location.pathname.match(/^\/cars\/[^/]+$/); // Matches /cars/:id but not /cars/:id/...
  const isCarReviewsPage = location.pathname.match(/^\/cars\/[^/]+\/reviews$/); // Matches /cars/:id/reviews
  const isBookingFormPage = location.pathname.match(/^\/booking\/[^/]+$/); // Matches /booking/:carId
  const isBookingPaymentPage = location.pathname.match(
    /^\/booking\/[^/]+\/payment$/
  ); // Matches /booking/:carId/payment
  const isReviewFormPage = location.pathname.match(
    /^\/booking\/[^/]+\/review$/
  ); // Matches /booking/:bookingId/review
  const isRentNowPage = location.pathname.match(/^\/rent-now\/[^/]+$/); // Matches /rent-now/:carId

  // Check if current route is an admin panel page (excluding login)
  const isAdminPage = location.pathname.startsWith("/admin/") &&
    !location.pathname.startsWith("/admin/login");

  // Pages with custom headers (terms, privacy, about, etc.)
  const isTermsPage = location.pathname === "/terms";
  const isPrivacyPage = location.pathname === "/privacy";
  const isAboutPage = location.pathname === "/about";

  // Routes where header and bottom navbar should be hidden
  const hideNavigationRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/admin/login",
  ];
  const shouldHideNavigation = hideNavigationRoutes.includes(location.pathname);

  // Hide default header on homepage, profile pages, booking pages, cars page, rent-now page, admin pages, and pages with custom headers (they have custom headers)
  const shouldShowHeader =
    !isHomePage &&
    !isProfilePage &&
    !isBookingPage &&
    !isCarsPage &&
    !isRentNowPage &&
    !isAdminPage &&
    !isTermsPage &&
    !isPrivacyPage &&
    !isAboutPage &&
    !shouldHideNavigation;

  // Hide bottom navbar on car details page, car reviews page, booking form page, payment page, review form page, rent now page, admin pages, and pages with custom headers
  const shouldShowBottomNavbar =
    !shouldHideNavigation &&
    !isCarDetailsPage &&
    !isCarReviewsPage &&
    !isBookingFormPage &&
    !isBookingPaymentPage &&
    !isReviewFormPage &&
    !isRentNowPage &&
    !isAdminPage &&
    !isTermsPage &&
    !isPrivacyPage &&
    !isAboutPage;

  return (
    <div
      className={`min-h-screen flex flex-col ${isProfilePage ? "bg-white" : "bg-background-primary"
        }`}
    >
      {/* Header - Mobile and Desktop (hidden on homepage, profile pages, and auth pages) */}
      {shouldShowHeader && <Header />}

      {/* Main Content */}
      <main
        className={`flex-1 w-full ${shouldHideNavigation
          ? ""
          : isHomePage || isProfilePage
            ? ""
            : "pb-16 md:pb-0"
          }`}
      >
        {/* Loading fallback for lazy-loaded routes */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
                  style={{ borderColor: theme.colors.primary }}
                ></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Footer - Desktop Only, shown only on homepage */}
      {isHomePage && <Footer />}

      {/* Bottom Navbar - Mobile Only (hidden on auth pages and car details page) */}
      {shouldShowBottomNavbar && <BottomNavbar />}
    </div>
  );
};

export default PageLayout;
