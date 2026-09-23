import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { logoutUser } from "../../store/slices/authSlice";
import { clearUser, setUser } from "../../store/slices/userSlice";
import { userService } from "../../services/user.service";
import toastUtils from "../../config/toast";
import BottomNavbar from "../components/layout/BottomNavbar";
import { colors } from "../theme/colors";

/**
 * ModuleProfile1Page Component
 * Profile page matching the image design with light beige background and white rounded cards
 * Mobile view only - hidden on web
 * Premium feel with theme colors
 */
const ModuleProfile1Page = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const { kycStatus, guarantor } = useAppSelector(
    (state) => state.user
  );

  // loading state
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate profile completion percentage
  const profileCompletePercentage = user?.profileComplete ?? 0;
  const isProfileFullyComplete = profileCompletePercentage >= 100;

  const [imageError, setImageError] = useState(false);

  // Handle redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // Fetch user profile data when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setIsFetchingLocal(true);
        const response = await userService.getProfile();
        const userData =
          response?.data?.user || response?.user || response?.data;

        if (userData) {
          const normalizedUserData = {
            ...userData,
            name: userData.name || userData.fullName || "",
            phone: userData.phone || "",
            email: userData.email || "",
          };
          dispatch(setUser(normalizedUserData));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // If profile fetch fails with 401, logic elsewhere (interceptor) usually handles logout
        // or we can handle it here if needed, but for now we trust global state
      } finally {
        setIsFetchingLocal(false);
      }
    };

    fetchUserProfile();
  }, [dispatch, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(clearUser());
      toastUtils.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(clearUser());
      toastUtils.success("Logged out successfully");
      window.location.href = "/login";
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const response = await userService.deleteAccount();
      if (response.success) {
        toastUtils.success("Account deleted successfully");
        // Reuse logout logic
        await dispatch(logoutUser()).unwrap();
        dispatch(clearUser());
        window.location.href = "/login";
      } else {
        toastUtils.error(response.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toastUtils.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Get user data with fallbacks
  const userName = (user?.name || user?.fullName || "").trim() || "User";
  const userPhone = (user?.phone || "").trim();
  const userEmail = (user?.email || "").trim();
  const userPhoto =
    user?.profilePhoto && user.profilePhoto.trim() !== ""
      ? user.profilePhoto
      : null;

  // Format phone number for display (add +91 prefix if it's a 10-digit number)
  const formatPhoneNumber = (phone) => {
    if (!phone || phone.trim() === "") return "";
    const cleaned = String(phone).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    }
    return phone;
  };
  const displayPhone = formatPhoneNumber(userPhone);

  // Format user ID - Show last 5 characters in user-XXXXX format
  const getFormattedUserId = () => {
    const id = user?._id || user?.id;
    if (!id) return "N/A";
    const idStr = id.toString();
    return `user-${idStr.slice(-5)}`;
  };
  const formattedUserId = getFormattedUserId();

  // Get first letter of name for avatar
  const getInitial = (name) => {
    if (!name || name.trim() === "") return "U";
    return name.trim().charAt(0).toUpperCase();
  };

  // Determine KYC status
  const isKYCVerified =
    user?.isKYCVerified ||
    kycStatus === "verified" ||
    kycStatus === "approved" ||
    (typeof kycStatus === "object" && kycStatus?.verified);
  const kycStatusText = isKYCVerified ? "Verified" : "Pending";

  // Determine Guarantor status dynamically
  const isGuarantorAdded = user?.guarantor?.added || guarantor?.added || false;
  const isGuarantorVerified = user?.guarantor?.verified || guarantor?.verified || false;

  // Module theme colors - using colors from module/theme/colors.js
  const primaryColor = colors.backgroundTertiary || "#1C205C"; // Dark color for primary buttons
  const successColor = colors.success || "#4CAF50"; // Green for verified status

  // Menu items matching current profile page
  const menuItems = [
    ...(!isProfileFullyComplete ? [{
      id: "complete",
      title: "Complete Profile",
      description: "Complete your profile to start booking cars.",
      path: "/profile/complete",
    }] : []),
    {
      id: "kyc",
      title: "KYC Status",
      description: "View and manage your KYC verification status.",
      path: "/profile/kyc",
    },
    {
      id: "guarantor",
      title: "Guarantor",
      description: "Add or manage your guarantor information.",
      path: "/profile/guarantor",
    },
    {
      id: "referrals",
      title: "Referral Dashboard",
      description: "Share your code and earn extra on bookings.",
      path: "/profile/referrals",
    },
    {
      id: "bookings",
      title: "My Bookings",
      description: "View and manage your car bookings.",
      path: "/bookings",
    },
    {
      id: "favorites",
      title: "My Favorites",
      description: "Your curated collection of premium cars.",
      path: "/favorites",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Manage your account settings and preferences.",
      path: "/profile/settings",
    },
    {
      id: "support",
      title: "Help & Support",
      description: "Get help and contact support.",
      path: "/profile/support",
    },
    {
      id: "logout",
      title: "Logout",
      description: "Sign out of your account.",
      onClick: handleLogout,
    },
  ];

  // Show loading state while initializing or fetching user
  if (isInitializing || (isFetchingLocal && !user)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.backgroundPrimary || "#F1F2F4" }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
          style={{ borderColor: primaryColor }}
        ></div>
        <p className="text-gray-600 font-medium">Loading your profile...</p>
      </div>
    );
  }

  // If initialization is complete and user is not authenticated, prevent render
  // Redirect handled by useEffect
  if (!isInitializing && !isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundPrimary || "#F1F2F4" }}
    >
      {/* Web Header - Only visible on desktop */}
      <header
        className="hidden md:block w-full sticky top-0 z-50"
        style={{ backgroundColor: colors.brandBlack || "#1C205C" }}
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
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                FAQs
              </Link>
            </nav>

            {/* Right - Profile Icon */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    {userPhoto && !imageError ? (
                      <img
                        src={userPhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold">
                        {getInitial(userName)}
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header with Close Button */}
      <motion.div
        className="md:hidden sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ backgroundColor: colors.backgroundPrimary || "#F1F2F4" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1
          className="text-2xl font-bold"
          style={{ color: colors.textPrimary || "#000000" }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Profile
        </motion.h1>
      </motion.div>

      {/* Main content - compact spacing for mobile, centered on desktop */}
      <div className="px-4 md:px-6 lg:px-8 pt-0 md:pt-6 pb-4 md:pb-6 space-y-2 md:space-y-4 max-w-3xl mx-auto">
        {/* Profile Summary Card */}
        <motion.div
          className="bg-white rounded-2xl p-3 md:p-5 shadow-sm"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Profile Picture or Initial */}
              {userPhoto && !imageError ? (
                <motion.img
                  src={userPhoto}
                  alt={userName}
                  onError={() => setImageError(true)}
                  className="rounded-full object-cover border-2"
                  style={{
                    borderColor: `${primaryColor}20`,
                    width: "56px",
                    height: "56px",
                    minWidth: "56px",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                />
              ) : (
                <motion.div
                  className="rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                    width: "56px",
                    height: "56px",
                    minWidth: "56px",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {getInitial(userName)}
                </motion.div>
              )}

              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <h2
                  className="text-base font-bold leading-tight"
                  style={{ color: colors.textPrimary || "#000000" }}
                >
                  {userName}
                </h2>
                {displayPhone ? (
                  <p
                    className="text-xs leading-tight truncate"
                    style={{ color: colors.textSecondary || "#666666" }}
                  >
                    {displayPhone}
                  </p>
                ) : userEmail ? (
                  <p
                    className="text-xs leading-tight truncate"
                    style={{ color: colors.textSecondary || "#666666" }}
                  >
                    {userEmail}
                  </p>
                ) : null}
                <div className="flex items-center gap-0 leading-tight">
                  <p
                    className="text-xs"
                    style={{ color: colors.textSecondary || "#666666" }}
                  >
                    {formattedUserId}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(formattedUserId);
                        toastUtils.success('User ID copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy:', err);
                        toastUtils.error('Failed to copy User ID');
                      }
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    title="Copy User ID"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 self-center">
              <button
                onClick={() => navigate("/profile/edit")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-50 active:scale-95 whitespace-nowrap"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                  backgroundColor: "transparent",
                }}
              >
                Edit profile
              </button>
            </div>
          </div>

          {/* Status Tags */}
          <div className="flex flex-wrap gap-1.5">
            <motion.span
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{
                backgroundColor: isKYCVerified
                  ? `${successColor}15`
                  : `${primaryColor}15`,
                color: isKYCVerified ? successColor : primaryColor,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              KYC: {kycStatusText}
            </motion.span>
            <motion.span
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{
                backgroundColor: isProfileFullyComplete
                  ? `${successColor}15`
                  : `${primaryColor}15`,
                color: isProfileFullyComplete ? successColor : primaryColor,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              Profile:{" "}
              {isProfileFullyComplete
                ? "Complete"
                : `${profileCompletePercentage}%`}
            </motion.span>
            <motion.span
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
              style={{
                backgroundColor: isGuarantorVerified
                  ? `${successColor}15`
                  : isGuarantorAdded
                    ? `${primaryColor}15`
                    : `${colors.backgroundIcon || "#e0e0e0"}15`,
                color: isGuarantorVerified
                  ? successColor
                  : isGuarantorAdded
                    ? primaryColor
                    : colors.textSecondary,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Guarantor:{" "}
              {isGuarantorVerified
                ? "Verified"
                : isGuarantorAdded
                  ? "Added"
                  : "Not Added"}
            </motion.span>
          </div>
        </motion.div>

        {/* Navigation List Items - Combined in one card */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          {menuItems.map((item, index) => (
            <div key={item.id}>
              <motion.button
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className="w-full p-4 md:py-4 md:px-6 flex items-center justify-between transition-all active:bg-gray-50 relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.2 + index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ backgroundColor: "#f9fafb" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-1 text-left min-w-0">
                  <h4
                    className="text-sm font-bold mb-0.5"
                    style={{ color: item.id === 'logout' ? (colors.error || "#F44336") : (colors.textPrimary || "#000000") }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="text-[11px]"
                    style={{ color: colors.textSecondary || "#666666" }}
                  >
                    {item.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 flex-shrink-0 ml-3"
                  style={{ color: item.id === 'logout' ? (colors.error || "#F44336") : (colors.textTertiary || "#999999") }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
              {index < menuItems.length - 1 && (
                <div className="h-px bg-gray-100 mx-4" />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Navbar - Mobile only */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <motion.div 
            className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete your account? This action is irreversible and you will lose all your data.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="py-3 px-4 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="py-3 px-4 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModuleProfile1Page;
