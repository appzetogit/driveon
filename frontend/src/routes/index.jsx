import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, useState, useEffect } from "react";
import AdminRoute from "../components/layout/AdminRoute";
import EmployeeRoute from "../components/layout/EmployeeRoute";
import AdminLayout from "../components/admin/layout/AdminLayout";
import ModuleLayout from "../module/components/layout/ModuleLayout";
import { useAdminAuth } from "../context/AdminContext";
import RouteErrorBoundary from "../components/common/RouteErrorBoundary";

// Module pages (new frontend)
const ModuleHomePage = lazy(() => import("../module/pages/HomePage"));
const ModuleSearchPage = lazy(() => import("../module/pages/SearchPage"));
const ModuleCarDetailsPage = lazy(() =>
  import("../module/pages/CarDetailsPage").catch((error) => {
    console.error("Failed to load CarDetailsPage:", error);
    // Return a fallback component
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Failed to load page</h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload
            </button>
          </div>
        </div>
      ),
    };
  })
);
const ModuleCarReviewsPage = lazy(() => import("../module/pages/CarReviewsPage"));
const ModuleProfilePage = lazy(() => import("../module/pages/ModuleProfilePage"));
const ModuleCompleteProfilePage = lazy(() => import("../module/pages/ModuleCompleteProfilePage"));
const ModuleEditProfilePage = lazy(() => import("../module/pages/ModuleEditProfilePage"));
const ModuleChangePasswordPage = lazy(() => import("../module/pages/ModuleChangePasswordPage"));
const ModuleKYCStatusPage = lazy(() => import("../module/pages/ModuleKYCStatusPage"));
const ModuleGuarantorPage = lazy(() => import("../module/pages/ModuleGuarantorPage"));
const ModuleReferralDashboardPage = lazy(() => import("../module/pages/ModuleReferralDashboardPage"));
const ModuleSettingsPage = lazy(() => import("../module/pages/ModuleSettingsPage"));
const ModuleSupportPage = lazy(() => import("../module/pages/ModuleSupportPage"));
const ModuleLoginPage = lazy(() => import("../module/pages/LoginPage"));
const ModuleRegisterPage = lazy(() => import("../module/pages/RegisterPage"));
const ModuleBookingsPage = lazy(() => import("../module/pages/BookingsPage"));
const ModulePaymentCallbackPage = lazy(() => import("../module/pages/PaymentCallbackPage"));
const ModuleBookNowPage = lazy(() => import("../module/pages/BookNowPage"));
const ModuleWriteReviewPage = lazy(() => import("../module/pages/ModuleWriteReviewPage"));
const ModuleFAQPage = lazy(() => import("../module/pages/FAQPage"));
const ModuleAboutPage = lazy(() => import("../module/pages/AboutPage"));
const ModuleContactPage = lazy(() => import("../module/pages/ContactPage"));
const ModulePrivacyPolicyPage = lazy(() => import("../module/pages/PrivacyPolicyPage"));
const ModuleTermsAndConditionsPage = lazy(() => import("../module/pages/TermsAndConditionsPage"));
const ModuleCancellationRefundPolicyPage = lazy(() => import("../module/pages/CancellationRefundPolicyPage"));
const ModuleTestPage = lazy(() => import("../module/pages/ModuleTestPage"));
const ModuleLocationPage = lazy(() => import("../module/pages/ModuleLocationPage"));
const CategoryPage = lazy(() => import("../module/pages/CategoryPage"));
const BrandPage = lazy(() => import("../module/pages/BrandPage"));
const ModuleNewProfilePage = lazy(() => import("../module/pages/ModuleNewProfilePage"));
const ModuleProfile1Page = lazy(() => import("../module/pages/ModuleProfile1Page"));
const ModuleFavoritesPage = lazy(() => import("../module/pages/ModuleFavoritesPage"));
const PublicSupportPage = lazy(() => import("../module/pages/PublicSupportPage"));

const EmployeeHomePage = lazy(() => import("../employee/pages/EmployeeHomePage"));
const EmployeeBookingsPage = lazy(() => import("../employee/pages/BookingsPage"));
const EnquiriesListPage = lazy(() => import("../employee/pages/EnquiriesListPage"));
const EnquiryDetailsPage = lazy(() => import("../employee/pages/EnquiryDetailsPage"));
const AttendancePage = lazy(() => import("../employee/pages/AttendancePage"));
const TasksPage = lazy(() => import("../employee/pages/TasksPage"));
const ProfilePage = lazy(() => import("../employee/pages/ProfilePage"));
const StaffDirectoryPage = lazy(() => import("../employee/pages/StaffDirectoryPage"));
const SalaryPage = lazy(() => import("../employee/pages/SalaryPage"));
const PrivacySecurityPage = lazy(() => import("../employee/pages/PrivacySecurityPage"));
const NotificationsPage = lazy(() => import("../employee/pages/NotificationsPage"));
const EmployeeLoginPage = lazy(() => import("../employee/pages/EmployeeLoginPage"));
const EmployeeResetPasswordPage = lazy(() => import("../employee/pages/EmployeeResetPasswordPage"));
const EmployeePrivacyPolicyPage = lazy(() => import("../employee/pages/EmployeePrivacyPolicyPage"));
const EmployeeTermsPage = lazy(() => import("../employee/pages/EmployeeTermsPage"));
const EmployeeLicensesPage = lazy(() => import("../employee/pages/EmployeeLicensesPage"));
const EmployeeSupportPage = lazy(() => import("../employee/pages/EmployeeSupportPage"));




// Admin pages
const AdminDashboardPage = lazy(() =>
  import("../pages/admin/AdminDashboardPage")
);
const UserListPage = lazy(() =>
  import("../pages/admin/users/UserListPage")
);
const GuarantorListPage = lazy(() =>
  import("../pages/admin/guarantors/GuarantorListPage")
);
const CarListPage = lazy(() =>
  import("../pages/admin/cars/CarListPage")
);
const AddCarPage = lazy(() =>
  import("../pages/admin/cars/AddCarPage")
);
const AddOutwardCarPage = lazy(() =>
  import("../pages/admin/cars/AddOutwardCarPage")
);
const EditCarPage = lazy(() =>
  import("../pages/admin/cars/EditCarPage")
);
const OnlineCarsPage = lazy(() =>
  import("../pages/admin/online-cars/OnlineCarsPage")
);
const BookingListPage = lazy(() =>
  import("../pages/admin/bookings/BookingListPage")
);
const PaymentListPage = lazy(() =>
  import("../pages/admin/payments/PaymentListPage")
);
const CashPaymentListPage = lazy(() =>
  import("../pages/admin/payments/CashPaymentListPage")
);
const TrackingPage = lazy(() =>
  import("../pages/admin/tracking/TrackingPage")
);
const ReferralManagementPage = lazy(() =>
  import("../pages/admin/referrals/ReferralManagementPage")
);
const CouponManagementPage = lazy(() =>
  import("../pages/admin/coupons/CouponManagementPage")
);
const OfferManagementPage = lazy(() =>
  import("../pages/admin/offers/OfferManagementPage")
);
const AddOnServicesPage = lazy(() =>
  import("../pages/admin/addon-services/AddOnServicesPage")
);
const AdminSettingsPage = lazy(() =>
  import("../pages/admin/settings/AdminSettingsPage")
);
const AdminNotificationsPage = lazy(() =>
  import("../pages/admin/notifications/AdminNotificationsPage")
);
const BannerManagementPage = lazy(() =>
  import("../pages/admin/banners/BannerManagementPage")
);
const AdminProfilePage = lazy(() =>
  import("../pages/admin/profile/AdminProfilePage")
);
const SubAdminsPage = lazy(() =>
  import("../pages/admin/profile/SubAdminsPage")
);
const AdminSupportPage = lazy(() =>
  import("../pages/admin/support/AdminSupportPage")
);
const AdminPolicyEditorPage = lazy(() =>
  import("../pages/admin/policies/AdminPolicyEditorPage")
);

// Fleet Management (isolated admin module)
const FleetLayout = lazy(() => import("../fleet/layout/FleetLayout"));
const FleetOutwardCarsPage = lazy(() => import("../fleet/pages/OutwardCarsPage"));
const FleetInwardCarsPage = lazy(() => import("../fleet/pages/InwardCarsPage"));
const FleetBookingsPage = lazy(() => import("../fleet/pages/FleetBookingsPage"));
const AdminLoginPage = lazy(() =>
  import("../pages/admin/AdminLoginPage")
);
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));




/**
 * ModuleResponsiveHome Component
 * - Mobile view: show ModuleTestPage (module-test UI)
 * - Desktop / tablet view: show original ModuleHomePage
 * All other routes and redirections remain unchanged.
 */
const ModuleResponsiveHome = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth < 768; // Tailwind md breakpoint
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return <ModuleTestPage />;
  }

  return <ModuleHomePage />;
};

/**
 * ModuleResponsiveProfile Component
 * Use the unified mobile-first profile UI on all breakpoints to avoid
 * inconsistent designs between desktop and mobile.
 */
const ModuleResponsiveProfile = () => {
  return <ModuleProfile1Page />;
};

/**
 * AdminRedirectRoute Component
 * Handles /admin route - redirects to dashboard if authenticated, login if not
 */
const AdminRedirectRoute = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 border-purple-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/admin/login" replace />;
};

const CRMLayout = lazy(() => import("../crm/layout/CRMLayout"));
const CRM_DashboardPage = lazy(() => import("../crm/pages/DashboardPage"));
const CRM_EnquiriesPage = lazy(() => import("../crm/pages/EnquiriesPage"));

// Import Subpages
const CRM_EnquirySub = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.AllEnquiriesPage })));
const CRM_EnquiryNew = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.NewEnquiriesPage })));
const CRM_EnquiryInProgress = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.InProgressEnquiriesPage })));
const CRM_EnquiryFollowUp = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.FollowUpsEnquiriesPage })));
const CRM_EnquiryConverted = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.ConvertedEnquiriesPage })));
const CRM_EnquiryClosed = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.ClosedEnquiriesPage })));

const CRM_EnquiryDetails = lazy(() => import("../crm/pages/enquiries/EnquirySubPages").then(module => ({ default: module.EnquiryDetailsPage })));


const CRM_StaffPage = lazy(() => import("../crm/pages/StaffPage"));

// Import Staff Subpages
const CRM_StaffDirectory = lazy(() => import("../crm/pages/staff/StaffSubPages").then(module => ({ default: module.StaffDirectoryPage })));
const CRM_StaffRoles = lazy(() => import("../crm/pages/staff/StaffSubPages").then(module => ({ default: module.RolesPage })));
const CRM_StaffAttendance = lazy(() => import("../crm/pages/staff/StaffSubPages").then(module => ({ default: module.AttendancePage })));
const CRM_StaffSalary = lazy(() => import("../crm/pages/staff/StaffSubPages").then(module => ({ default: module.SalaryPage })));
const CRM_StaffAttendanceSettings = lazy(() => import("../crm/pages/staff/StaffSubPages").then(module => ({ default: module.AttendanceSettingsPage })));
const CRM_StaffDriverAssignment = lazy(() => import("../crm/pages/staff/DriverAssignmentPage"));
const CRM_StaffDriverRecord = lazy(() => import("../crm/pages/staff/DriverRecordPage"));
const CRM_EmployeeSupportPage = lazy(() => import("../crm/pages/staff/EmployeeSupportPage"));
const CRM_UpcomingCarsScreen = lazy(() => import("../crm/pages/UpcomingCarsScreen"));





const CRM_GaragePage = lazy(() => import("../crm/pages/GaragePage"));
// Import Garage Subpages
const CRM_AllGarages = lazy(() => import("../crm/pages/garage/GarageSubPages").then(module => ({ default: module.AllGaragesPage })));
const CRM_ActiveRepairs = lazy(() => import("../crm/pages/garage/GarageSubPages").then(module => ({ default: module.ActiveRepairsPage })));

const CRM_PartsCost = lazy(() => import("../crm/pages/garage/GarageSubPages").then(module => ({ default: module.PartsCostPage })));


const CRM_VendorsPage = lazy(() => import("../crm/pages/VendorsPage"));
// Import Vendor Subpages
const CRM_AllVendors = lazy(() => import("../crm/pages/vendors/VendorSubPages").then(module => ({ default: module.AllVendorsPage })));

const CRM_VendorHistory = lazy(() => import("../crm/pages/vendors/VendorSubPages").then(module => ({ default: module.VendorHistoryPage })));








// Import Setting Subpages
const CRM_SettingsOverview = lazy(() => import("../crm/pages/settings/SettingsSubPages").then(module => ({ default: module.SettingsOverviewPage })));
const CRM_Locations = lazy(() => import("../crm/pages/settings/SettingsSubPages").then(module => ({ default: module.LocationsPage })));
const CRM_PolicyEditor = lazy(() => import("../crm/pages/settings/CRMPolicyEditorPage"));

// Import Expense Pages
const CRM_TrackExpenses = lazy(() => import("../crm/pages/expenses/TrackExpensesPage"));
const CRM_ExpenseCategories = lazy(() => import("../crm/pages/expenses/ExpenseCategoriesPage"));




// Create router configuration
const router = createBrowserRouter([
  // CRM Routes
  {
    path: "/crm",
    element: <CRMLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "dashboard",
        element: <CRM_DashboardPage />,
      },
      // ENQUIRIES ROUTES
      {
        path: "enquiries",
        element: <Navigate to="enquiries/all" replace />,
      },
      {
        path: "enquiries/all",
        element: <CRM_EnquirySub />,
      },
      {
        path: "enquiries/new",
        element: <CRM_EnquiryNew />,
      },
      {
        path: "enquiries/in-progress",
        element: <CRM_EnquiryInProgress />,
      },
      {
        path: "enquiries/follow-ups",
        element: <CRM_EnquiryFollowUp />,
      },
      {
        path: "enquiries/converted",
        element: <CRM_EnquiryConverted />,
      },
      {
        path: "enquiries/closed",
        element: <CRM_EnquiryClosed />,
      },



      {
        path: "enquiries/:id",
        element: <CRM_EnquiryDetails />,
      },
      // STAFF ROUTES
      {
        path: "staff",
        element: <Navigate to="staff/directory" replace />,
      },
      {
        path: "staff/directory",
        element: <CRM_StaffDirectory />,
      },
      {
        path: "staff/roles",
        element: <CRM_StaffRoles />,
      },
      {
        path: "staff/attendance",
        element: <CRM_StaffAttendance />,
      },
      {
        path: "staff/attendance-settings",
        element: <CRM_StaffAttendanceSettings />,
      },
      {
        path: "staff/salary",
        element: <CRM_StaffSalary />,
      },


      // GARAGE ROUTES
      {
        path: "garage",
        element: <Navigate to="garage/active" replace />,
      },
      {
        path: "garage/all",
        element: <CRM_AllGarages />,
      },
      {
        path: "garage/active",
        element: <CRM_ActiveRepairs />,
      },

      /*
      {
        path: "garage/parts",
        element: <CRM_PartsCost />,
      },
      */

      // VENDOR ROUTES
      {
        path: "vendors",
        element: <Navigate to="vendors/all" replace />,
      },
      {
        path: "vendors/all",
        element: <CRM_AllVendors />,
      },

      // {
      //   path: "vendors/history",
      //   element: <CRM_VendorHistory />,
      // },





      // SETTINGS ROUTES
      {
        path: "settings",
        element: <CRM_SettingsOverview />,
      },
      {
        path: "settings/locations",
        element: <CRM_Locations />,
      },
      {
        path: "policies/privacy",
        element: <CRM_PolicyEditor policyKey="employee_privacy_policy" />,
      },
      {
        path: "policies/terms",
        element: <CRM_PolicyEditor policyKey="employee_terms_conditions" />,
      },
      // EXPENSE ROUTES
      {
        path: "expenses",
        element: <Navigate to="track" replace />,
      },
      {
        path: "expenses/track",
        element: <CRM_TrackExpenses />,
      },
      {
        path: "expenses/categories",
        element: <CRM_ExpenseCategories />,
      },
      {
        path: "staff/driver-record",
        element: <CRM_StaffDriverRecord />,
      },
      {
        path: "staff/employee-support",
        element: <CRM_EmployeeSupportPage />,
      },
      {
        path: "upcoming-cars-screen",
        element: <CRM_UpcomingCarsScreen />,
      },




      {
        path: "*",
        element: <Navigate to="dashboard" replace />,
      }
    ]
  },

  // Module routes (new frontend) - wrapped with ModuleLayout
  {
    element: <ModuleLayout />,
    children: [
      {
        path: "/",
        element: <ModuleResponsiveHome />,
      },
      {
        path: "/login",
        element: <ModuleLoginPage />,
      },
      {
        path: "/register",
        element: <ModuleRegisterPage />,
      },
      {
        path: "/search",
        element: <ModuleSearchPage />,
      },
      {
        path: "/car-details/:id",
        element: <ModuleCarDetailsPage />,
        errorElement: <RouteErrorBoundary />,
      },
      {
        path: "/car-details/:id/reviews",
        element: <ModuleCarReviewsPage />,
      },
      {
        path: "/book-now/:id",
        element: <ModuleBookNowPage />,
      },
      {
        path: "/profile",
        element: <ModuleResponsiveProfile />,
      },
      {
        path: "/profile/complete",
        element: <ModuleCompleteProfilePage />,
      },
      {
        path: "/profile/edit",
        element: <ModuleEditProfilePage />,
      },
      {
        path: "/profile/change-password",
        element: <ModuleChangePasswordPage />,
      },
      {
        path: "/profile/kyc",
        element: <ModuleKYCStatusPage />,
      },
      {
        path: "/profile/guarantor",
        element: <ModuleGuarantorPage />,
      },
      {
        path: "/profile/referrals",
        element: <ModuleReferralDashboardPage />,
      },
      {
        path: "/profile/settings",
        element: <ModuleSettingsPage />,
      },
      {
        path: "/profile/support",
        element: <ModuleSupportPage />,
      },
      {
        path: "/favorites",
        element: <ModuleFavoritesPage />,
      },
      {
        path: "/bookings",
        element: <ModuleBookingsPage />,
      },
      {
        path: "/booking/payment-callback",
        element: <ModulePaymentCallbackPage />,
      },
      {
        path: "/write-review/:bookingId",
        element: <ModuleWriteReviewPage />,
      },
      {
        path: "/faq",
        element: <ModuleFAQPage />,
      },
      {
        path: "/about",
        element: <ModuleAboutPage />,
      },
      {
        path: "/contact",
        element: <ModuleContactPage />,
      },
      {
        path: "/privacy-policy",
        element: <ModulePrivacyPolicyPage />,
      },
      {
        path: "/support",
        element: <PublicSupportPage />,
      },
      {
        path: "/terms",
        element: <ModuleTermsAndConditionsPage />,
      },
      {
        path: "/cancellation-policy",
        element: <ModuleCancellationRefundPolicyPage />,
      },
      {
        path: "/module-test",
        element: <ModuleTestPage />,
      },
      {
        path: "/module-location",
        element: <ModuleLocationPage />,
      },
      {
        path: "/category/:categoryName",
        element: <CategoryPage />,
      },
      {
        path: "/brand/:brandName",
        element: <BrandPage />,
      },
      {
        path: "/module-profile1",
        element: <ModuleProfile1Page />,
      },
    ],
  },

  // Admin Auth Routes (public - no authentication required)
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  // Admin root route - redirects based on authentication
  {
    path: "/admin",
    element: <AdminRedirectRoute />,
  },
  // Admin Routes (require admin role and use AdminLayout)
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/admin/dashboard",
            element: <AdminDashboardPage />,
          },
          {
            path: "/admin/users",
            element: <UserListPage />,
          },
          {
            path: "/admin/guarantors",
            element: <GuarantorListPage />,
          },
          {
            path: "/admin/guarantors/pending",
            element: <GuarantorListPage />,
          },
          {
            path: "/admin/cars",
            element: <CarListPage />,
          },
          {
            path: "/admin/online-cars",
            element: <OnlineCarsPage />,
          },
          {
            path: "/admin/cars/new",
            element: <AddCarPage />,
          },
          {
            path: "/admin/cars/add-outward",
            element: <AddOutwardCarPage />,
          },
          {
            path: "/admin/cars/:carId/edit",
            element: <EditCarPage />,
          },
          {
            path: "/admin/cars/pending",
            element: <CarListPage />,
          },
          {
            path: "/admin/fleet",
            element: <FleetLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/admin/fleet/inward" replace />,
              },
              {
                path: "inward",
                element: <FleetInwardCarsPage />,
              },
              {
                path: "inward-bookings",
                element: <FleetBookingsPage />,
              },
              {
                path: "outward",
                element: <FleetOutwardCarsPage />,
              },
              {
                path: "outward-bookings",
                element: <FleetBookingsPage />,
              },
            ],
          },
          {
            path: "/admin/bookings",
            element: <BookingListPage />,
          },
          {
            path: "/admin/bookings/pending",
            element: <BookingListPage />,
          },
          {
            path: "/admin/bookings/active",
            element: <BookingListPage />,
          },
          {
            path: "/admin/bookings/driver-assignment",
            element: <CRM_StaffDriverAssignment />,
          },
          {
            path: "/admin/payments",
            element: <PaymentListPage />,
          },
          {
            path: "/admin/cash-payments",
            element: <CashPaymentListPage />,
          },
          {
            path: "/admin/payments/pending",
            element: <PaymentListPage />,
          },
          {
            path: "/admin/payments/failed",
            element: <PaymentListPage />,
          },
          {
            path: "/admin/tracking",
            element: <TrackingPage />,
          },
          {
            path: "/admin/tracking/active",
            element: <TrackingPage />,
          },
          {
            path: "/admin/tracking/history",
            element: <TrackingPage />,
          },
          {
            path: "/admin/referrals",
            element: <ReferralManagementPage />,
          },
          {
            path: "/admin/referrals/statistics",
            element: <ReferralManagementPage />,
          },
          {
            path: "/admin/referrals/top-referrers",
            element: <ReferralManagementPage />,
          },
          {
            path: "/admin/coupons",
            element: <CouponManagementPage />,
          },
          {
            path: "/admin/offers",
            element: <OfferManagementPage />,
          },
          {
            path: "/admin/addon-services",
            element: <AddOnServicesPage />,
          },
          {
            path: "/admin/support",
            element: <AdminSupportPage />,
          },
          {
            path: "/admin/notifications",
            element: <AdminNotificationsPage />,
          },
          {
            path: "/admin/banners",
            element: <BannerManagementPage />,
          },
          {
            path: "/admin/settings",
            element: <AdminSettingsPage />,
          },
          {
            path: "/admin/settings/notifications",
            element: <AdminSettingsPage />,
          },
          {
            path: "/admin/settings/security",
            element: <AdminSettingsPage />,
          },
          {
            path: "/admin/settings/features",
            element: <AdminSettingsPage />,
          },
          {
            path: "/admin/profile",
            element: <AdminProfilePage />,
          },
          {
            path: "/admin/sub-admins",
            element: <SubAdminsPage />,
          },
          {
            path: "/admin/policies/:policyKey",
            element: <AdminPolicyEditorPage />,
          },
        ],
      },
    ],
  },

  // Employee Routes
  {
    element: <EmployeeRoute />,
    children: [
      {
        path: "/employee",
        element: <EmployeeHomePage />,
      },
      {
        path: "/employee/bookings",
        element: <EmployeeBookingsPage />,
      },
      {
        path: "/employee/enquiries",
        element: <EnquiriesListPage />,
      },
      {
        path: "/employee/enquiries/:id",
        element: <EnquiryDetailsPage />,
      },
      {
        path: "/employee/attendance",
        element: <AttendancePage />,
      },
      {
        path: "/employee/tasks",
        element: <TasksPage />,
      },
      {
        path: "/employee/profile",
        element: <ProfilePage />,
      },
      {
        path: "/employee/directory",
        element: <StaffDirectoryPage />,
      },
      {
        path: "/employee/salary",
        element: <SalaryPage />,
      },
      {
        path: "/employee/privacy",
        element: <PrivacySecurityPage />,
      },
      {
        path: "/employee/notifications",
        element: <NotificationsPage />,
      },
    ],
  },
  {
    path: "/employee/login",
    element: <EmployeeLoginPage />,
  },
  {
    path: "/employee/reset-password/:token",
    element: <EmployeeResetPasswordPage />,
  },
  {
    path: "/employee/privacy-policy",
    element: <EmployeePrivacyPolicyPage />,
  },
  {
    path: "/employee/terms-of-service",
    element: <EmployeeTermsPage />,
  },
  {
    path: "/employee/licenses",
    element: <EmployeeLicensesPage />,
  },
  {
    path: "/employee/support",
    element: <EmployeeSupportPage />,
  },
  // 404 Page
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
