import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setGuarantor, setUser } from '../../store/slices/userSlice';
import toastUtils from '../../config/toast';
import { userService } from '../../services/user.service';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';

/**
 * ModuleGuarantorPage Component
 * Guarantor management page with new module theme
 * Based on old GuarantorManagementPage but styled with new frontend theme
 */
const ModuleGuarantorPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { guarantor, user } = useAppSelector((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequestsPage, setShowRequestsPage] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [guarantorPoints, setGuarantorPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Fetch requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await userService.getMyGuarantorRequests();
        const requestsData = response?.data?.requests || response?.requests || [];
        // Show pending and accepted requests, filter out rejected
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        setRequests(activeRequests);
      } catch (error) {
        console.error('Error fetching guarantor requests:', error);
        toastUtils.error('Failed to load guarantor requests');
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  // Fetch user profile if not loaded (for login scenarios)
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || user) return; // Skip if already loaded
      
      try {
        const response = await userService.getProfile();
        const userData = response?.data?.user || response?.user || response?.data;
        if (userData) {
          dispatch(setUser(userData));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [isAuthenticated, user, dispatch]);

  // Fetch guarantor points and history
  useEffect(() => {
    const fetchGuarantorPoints = async () => {
      // Wait for authentication
      if (!isAuthenticated) {
        console.log('⚠️ Not authenticated, skipping guarantor points fetch');
        return;
      }
      
      console.log('🔄 Fetching guarantor points...');
      try {
        setLoadingPoints(true);
        const response = await userService.getGuarantorPoints();
        console.log('📊 Guarantor Points API Response:', response);
        console.log('📊 Response type:', typeof response);
        console.log('📊 Response keys:', response ? Object.keys(response) : 'null');
        
        // Backend returns: { success: true, data: { points, history, ... } }
        // userService.getGuarantorPoints() returns: response.data = { success: true, data: { points, history, ... } }
        // So response = { success: true, data: { points, history, ... } }
        // We need: response.data.points
        const pointsData = response?.data || response || {};
        console.log('📊 Extracted Points Data:', pointsData);
        console.log('📊 Points value:', pointsData.points);
        console.log('📊 History length:', pointsData.history?.length || 0);
        
        if (response.success === false) {
          console.error('❌ API returned success: false');
          throw new Error(response.message || 'Failed to fetch guarantor points');
        }
        
        const pointsValue = pointsData.points || 0;
        console.log('✅ Setting guarantor points to:', pointsValue);
        setGuarantorPoints(pointsValue);
        
        // Format history data
        const history = (pointsData.history || []).map((item) => ({
          id: item.id,
          bookingId: item.bookingId,
          userName: item.userName,
          userEmail: item.userEmail,
          bookingAmount: item.bookingAmount,
          totalPoolAmount: item.totalPoolAmount,
          totalGuarantors: item.totalGuarantors,
          pointsEarned: item.pointsEarned,
          date: new Date(item.date),
          status: item.status,
          bookingStatus: item.bookingStatus,
          reversedAt: item.reversedAt ? new Date(item.reversedAt) : null,
          reversalReason: item.reversalReason,
          isAdjustment: item.isAdjustment || item.userName === 'Admin Adjustment',
          isUsedPoints: item.isUsedPoints,
          adjustmentType: item.adjustmentType,
          reason: item.reason,
        }));
        console.log('✅ Setting history with', history.length, 'items');
        setPointsHistory(history);
      } catch (error) {
        console.error('❌ Error fetching guarantor points:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error message:', error.message);
        toastUtils.error('Failed to load points');
        // Set defaults on error
        setGuarantorPoints(0);
        setPointsHistory([]);
      } finally {
        setLoadingPoints(false);
      }
    };
    
    // Fetch points when authenticated (API uses token to identify user, doesn't need guarantorId)
    if (isAuthenticated) {
      fetchGuarantorPoints();
    }
  }, [isAuthenticated]); // Re-fetch when authentication status changes

  // Calculate pending requests count
  const pendingRequestsCount = requests.filter(req => req.status === 'pending').length;

  // Handle remove guarantor
  const handleRemoveGuarantor = () => {
    dispatch(setGuarantor({
      added: false,
      verified: false,
      details: null,
    }));
    toastUtils.success('Guarantor removed successfully');
  };

  // Handle resend invite
  const handleResendInvite = () => {
    toastUtils.success('Invite resent successfully!');
  };

  // Handle copy guarantor ID
  const handleCopyGuarantorId = (guarantorId) => {
    if (guarantorId) {
      navigator.clipboard.writeText(guarantorId);
      toastUtils.success('Guarantor ID copied!');
    }
  };

  // Handle accept request
  const handleAccept = async (requestId) => {
    if (!window.confirm('Are you sure you want to accept this guarantor request?')) {
      return;
    }

    try {
      const response = await userService.acceptGuarantorRequest(requestId);
      if (response.success) {
        toastUtils.success('Guarantor request accepted successfully!');
        // Refresh requests
        const fetchResponse = await userService.getMyGuarantorRequests();
        const requestsData = fetchResponse?.data?.requests || fetchResponse?.requests || [];
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        setRequests(activeRequests);
        setShowDetailsModal(false);
        setRequestDetails(null);
        setSelectedRequest(null);
      } else {
        toastUtils.error(response.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  // Handle reject request
  const handleReject = async (requestId) => {
    const reason = prompt('Please enter rejection reason (optional):');
    
    try {
      const response = await userService.rejectGuarantorRequest(requestId, reason || 'Rejected by guarantor');
      if (response.success) {
        toastUtils.success('Guarantor request rejected');
        // Refresh requests
        const fetchResponse = await userService.getMyGuarantorRequests();
        const requestsData = fetchResponse?.data?.requests || fetchResponse?.requests || [];
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        setRequests(activeRequests);
        setShowDetailsModal(false);
        setRequestDetails(null);
        setSelectedRequest(null);
      } else {
        toastUtils.error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  // Handle view details
  const handleViewDetails = async (request) => {
    try {
      setDetailsLoading(true);
      setSelectedRequest(request);
      const response = await userService.getGuarantorRequestDetails(request._id);
      setRequestDetails(response?.data?.request || response?.request || request);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toastUtils.error('Failed to load request details');
      // Fallback to using request directly
      setRequestDetails(request);
      setShowDetailsModal(true);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Light version of dark background for profile section
  const profileSectionBg = colors.backgroundPrimary || colors.backgroundPrimary;
  const iconBgColor = colors.backgroundPrimary || colors.backgroundImage;

  return (
    <div 
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      {!showDetailsModal && !showRequestsPage && <ProfileHeader title="Guarantor" showBack />}

      {/* Requests Page with Bell Icon */}
      {showRequestsPage && !showDetailsModal && (
        <GuarantorRequestsPage
          requests={requests}
          loadingRequests={loadingRequests}
          pendingRequestsCount={pendingRequestsCount}
          onClose={() => setShowRequestsPage(false)}
          onViewDetails={handleViewDetails}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* Main Content - Show when not viewing requests or details */}
      {!showRequestsPage && !showDetailsModal && (
        <>
          {/* Guarantor ID Card - Always show if user has guarantorId */}
          {user?.guarantorId && (
            <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-2 md:pb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Your Guarantor ID</label>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-black font-mono">{user.guarantorId}</p>
                      <button
                        onClick={() => handleCopyGuarantorId(user.guarantorId)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors touch-target"
                        aria-label="Copy guarantor ID"
                        title="Copy Guarantor ID"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
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
                  <button
                    onClick={() => setShowRequestsPage(true)}
                    className="relative ml-4 p-3 rounded-full hover:bg-gray-100 transition-colors touch-target"
                    style={{ backgroundColor: colors.backgroundIcon || '#f3f4f6' }}
                    aria-label="View requests"
                    title="View Guarantor Requests"
                  >
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {pendingRequestsCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KYC Verification Notice - Always show for guarantors */}
          {user?.guarantorId && (
            <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-2 md:pb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1 text-blue-900">
                      KYC Verification Required
                    </p>
                    <p className="text-xs leading-relaxed text-blue-800">
                      As a guarantor, you must complete KYC verification physically at the office. Please visit our office with valid identification documents to complete the verification process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Points Wallet Section - Show if user is a guarantor */}
          {user?.guarantorId && (
            <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-2 md:pb-4">
              <div className="bg-gradient-to-br rounded-2xl p-5 shadow-lg overflow-hidden relative" style={{
                background: `linear-gradient(135deg, ${colors.backgroundTertiary} 0%, ${colors.backgroundDark || colors.backgroundTertiary} 100%)`
              }}>
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
                    <circle cx="50" cy="50" r="2" fill="white" />
                    <circle cx="150" cy="50" r="2" fill="white" />
                    <circle cx="50" cy="150" r="2" fill="white" />
                    <circle cx="150" cy="150" r="2" fill="white" />
                    <path d="M0 100 Q50 50, 100 100 T200 100" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    <path d="M0 100 Q50 150, 100 100 T200 100" stroke="white" strokeWidth="0.5" opacity="0.3" />
                  </svg>
                </div>

                {/* Wallet Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <svg className="w-6 h-6" style={{ color: colors.backgroundSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
                          Guarantor Points Wallet
                        </p>
                        <p className="text-xs" style={{ color: colors.backgroundSecondary, opacity: 0.7 }}>
                          Earn 10% points from each trip
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Points Balance */}
                  <div className="mb-4">
                    {loadingPoints ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2" style={{ borderColor: colors.backgroundSecondary }}></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-3xl font-bold mb-1" style={{ color: colors.backgroundSecondary }}>
                          {(() => {
                            const pts = Number(guarantorPoints);
                            if (pts % 1 === 0) return pts.toLocaleString();
                            // Show exact decimals: 5.25, 2.625, 10.5 (up to 3 decimal places for exact values)
                            const decimals = pts.toString().split('.')[1]?.length || 0;
                            return decimals <= 3 ? pts.toFixed(decimals) : pts.toFixed(3);
                          })()}
                        </p>
                        <p className="text-sm font-medium" style={{ color: colors.backgroundSecondary, opacity: 0.8 }}>
                          Points Available
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                    Points History
                  </h3>
                  {pointsHistory.length > 0 && (
                    <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                      {pointsHistory.length} transactions
                    </span>
                  )}
                </div>

                {loadingPoints ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: colors.backgroundTertiary }}></div>
                  </div>
                ) : pointsHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointsHistory.map((transaction) => (
                      <div
                        key={transaction.id}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.backgroundPrimary }}>
                          <svg className="w-5 h-5" style={{ color: colors.backgroundTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                {transaction.isAdjustment ? 'Admin Adjustment' : `Points from ${transaction.userName} guarantor`}
                              </p>
                              {transaction.isAdjustment ? (
                                <p className="text-xs italic" style={{ color: colors.textSecondary }}>
                                  Reason: {transaction.reason || 'No reason specified'}
                                </p>
                              ) : (
                                <p className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                                  Booking: {transaction.bookingId}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold" 
                                 style={{ color: (transaction.status === 'reversed' || transaction.pointsEarned < 0) ? colors.error : colors.success }}>
                                {(() => {
                                  const pts = Number(transaction.pointsEarned);
                                  const isNegative = pts < 0 || transaction.status === 'reversed';
                                  const absPts = Math.abs(pts);
                                  const sign = isNegative ? '-' : '+';
                                  if (absPts % 1 === 0) return `${sign}${absPts.toLocaleString()}`;
                                  // Show exact decimals: 5.25, 2.625, 10.5 (up to 3 decimal places for exact values)
                                  const decimals = absPts.toString().split('.')[1]?.length || 0;
                                  return `${sign}${decimals <= 3 ? absPts.toFixed(decimals) : absPts.toFixed(3)}`;
                                })()}
                              </p>
                              {transaction.bookingAmount !== null && transaction.bookingAmount !== undefined && (
                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                  ₹{transaction.bookingAmount.toLocaleString()} booking
                                </p>
                              )}
                              {transaction.totalGuarantors > 1 && (
                                <p className="text-xs" style={{ color: colors.textTertiary }}>
                                  {transaction.totalGuarantors} guarantors
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs" style={{ color: colors.textTertiary }}>
                              {new Date(transaction.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <div className="flex items-center gap-2">
                              {transaction.status === 'reversed' && transaction.reversalReason && (
                                <p className="text-xs" style={{ color: colors.error }}>
                                  Reversed: {transaction.reversalReason}
                                </p>
                              )}
                              {!transaction.isAdjustment && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                                  backgroundColor: transaction.status === 'reversed' 
                                    ? colors.error + '20' 
                                    : transaction.bookingStatus === 'completed' 
                                      ? colors.success + '20' 
                                      : colors.warning + '20',
                                  color: transaction.status === 'reversed' 
                                    ? colors.error 
                                    : transaction.bookingStatus === 'completed' 
                                      ? colors.success 
                                      : colors.warning
                                }}>
                                  {transaction.status === 'reversed' 
                                    ? 'Reversed' 
                                    : transaction.bookingStatus === 'completed' 
                                      ? 'Completed' 
                                      : transaction.bookingStatus || 'Active'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                      No points earned yet
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                      You'll earn 10% points when users complete trips
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Card - Show if guarantor is added */}
          {guarantor.added && (
            <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-2 md:pb-4">
              <div className={`bg-white rounded-xl p-4 shadow-sm border-2 ${
                guarantor.verified ? 'border-green-400' : 'border-yellow-400'
              }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  guarantor.verified ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <svg className={`w-6 h-6 ${guarantor.verified ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-1 text-black">
                    {guarantor.details?.name || 'Guarantor Name'}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {guarantor.details?.phone && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-600">
                          {guarantor.details.phone}
                        </p>
                      </div>
                    )}
                    {guarantor.details?.email && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-600 truncate">
                          {guarantor.details.email}
                        </p>
                      </div>
                    )}
                    {guarantor.details?.relationship && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {guarantor.details.relationship}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${
                  guarantor.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {guarantor.verified ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {!guarantor.verified && (
              <div className="mt-3 pt-3 border-t-2 border-gray-200">
                <div className="flex items-start gap-2 mb-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1 text-blue-900">
                      KYC Verification Required
                    </p>
                    <p className="text-xs leading-relaxed text-blue-800">
                      The guarantor must complete KYC verification physically at the office. Please visit our office with valid identification documents to complete the verification process.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 mb-2.5 p-2 rounded-lg bg-yellow-50">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs leading-relaxed text-yellow-800">
                    Waiting for guarantor to complete registration and KYC verification.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResendInvite}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-white"
                    style={{ backgroundColor: colors.textPrimary }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend Invite
                  </button>
                  <button
                    onClick={handleRemoveGuarantor}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: `${colors.error}15`,
                      color: colors.error,
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
              )}
            </div>
          </div>
          )}
        </>
      )}

      {/* Content */}
      {showDetailsModal && (requestDetails || selectedRequest) ? (
        <RequestDetailsPage
          request={requestDetails || selectedRequest}
          loading={detailsLoading}
          onClose={() => {
            setShowDetailsModal(false);
            setRequestDetails(null);
            setSelectedRequest(null);
          }}
          onAccept={() => handleAccept((requestDetails || selectedRequest)._id)}
          onReject={() => handleReject((requestDetails || selectedRequest)._id)}
        />
      ) : null}

      </div>
      {/* Bottom Navbar - Hidden on web */}
      {!showDetailsModal && !showRequestsPage && (
        <div className="md:hidden">
          <BottomNavbar />
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowTransactionModal(false);
            setSelectedTransaction(null);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedTransaction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Points Info */}
              <div className="bg-gradient-to-br rounded-xl p-4" style={{
                background: `linear-gradient(135deg, ${colors.backgroundTertiary} 0%, ${colors.backgroundDark || colors.backgroundTertiary} 100%)`
              }}>
                <div className="text-center">
                  <p className="text-xs font-medium mb-1" style={{ color: colors.backgroundSecondary, opacity: 0.9 }}>
                    Points Earned
                  </p>
                  <p className="text-3xl font-bold mb-1" style={{ color: colors.backgroundSecondary }}>
                    {(() => {
                      const pts = Number(selectedTransaction.pointsEarned);
                      if (pts % 1 === 0) return pts.toLocaleString();
                      // Show exact decimals: 5.25, 2.625, 10.5 (up to 3 decimal places for exact values)
                      const decimals = pts.toString().split('.')[1]?.length || 0;
                      return decimals <= 3 ? pts.toFixed(decimals) : pts.toFixed(3);
                    })()}
                  </p>
                  <p className="text-xs" style={{ color: colors.backgroundSecondary, opacity: 0.7 }}>
                    {selectedTransaction.status === 'reversed' ? 'Reversed' : 'Active Points'}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-3">
                {selectedTransaction.isAdjustment ? (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Transaction Type</span>
                      <span className="text-sm font-semibold text-gray-900">Admin Adjustment</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Adjustment Type</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{selectedTransaction.adjustmentType || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col py-2 border-b border-gray-100 gap-1 text-left">
                      <span className="text-sm font-medium text-gray-600">Reason</span>
                      <span className="text-sm text-gray-900 bg-gray-50 p-2.5 rounded-lg border border-gray-200">{selectedTransaction.reason || 'No reason specified'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">User Name</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedTransaction.userName}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">User Email</span>
                      <span className="text-sm text-gray-900">{selectedTransaction.userEmail || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Booking ID</span>
                      <span className="text-sm font-mono font-semibold text-gray-900">{selectedTransaction.bookingId}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Booking Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedTransaction.bookingAmount !== null && selectedTransaction.bookingAmount !== undefined
                          ? `₹${selectedTransaction.bookingAmount.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">10% Pool Amount</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(() => {
                          const amt = Number(selectedTransaction.totalPoolAmount);
                          if (isNaN(amt)) return 'N/A';
                          if (amt % 1 === 0) return `₹${amt.toLocaleString()}`;
                          const decimals = amt.toString().split('.')[1]?.length || 0;
                          return `₹${decimals <= 3 ? amt.toFixed(decimals) : amt.toFixed(3)}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Total Guarantors</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedTransaction.totalGuarantors || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Points Per Guarantor</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(() => {
                          const pts = selectedTransaction.totalPoolAmount && selectedTransaction.totalGuarantors
                            ? selectedTransaction.totalPoolAmount / selectedTransaction.totalGuarantors
                            : selectedTransaction.pointsEarned;
                          const numPts = Number(pts);
                          if (isNaN(numPts)) return 'N/A';
                          if (numPts % 1 === 0) return numPts.toLocaleString();
                          const decimals = numPts.toString().split('.')[1]?.length || 0;
                          return decimals <= 3 ? numPts.toFixed(decimals) : numPts.toFixed(3);
                        })()}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Transaction Date</span>
                  <span className="text-sm text-gray-900 text-right">
                    {new Date(selectedTransaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {!selectedTransaction.isAdjustment && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{
                      backgroundColor: selectedTransaction.status === 'reversed' 
                        ? colors.error + '20' 
                        : selectedTransaction.bookingStatus === 'completed' 
                          ? colors.success + '20' 
                          : colors.warning + '20',
                      color: selectedTransaction.status === 'reversed' 
                        ? colors.error 
                        : selectedTransaction.bookingStatus === 'completed' 
                          ? colors.success 
                          : colors.warning
                    }}>
                      {selectedTransaction.status === 'reversed' 
                        ? 'Reversed' 
                        : selectedTransaction.bookingStatus === 'completed' 
                          ? 'Completed' 
                          : selectedTransaction.bookingStatus || 'Active'}
                    </span>
                  </div>
                )}
                {selectedTransaction.status === 'reversed' && selectedTransaction.reversedAt && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Reversed Date</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedTransaction.reversedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {selectedTransaction.status === 'reversed' && selectedTransaction.reversalReason && (
                  <div className="py-2">
                    <span className="text-sm font-medium text-gray-600 block mb-1">Reversal Reason</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.reversalReason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedTransaction(null);
                }}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Request Details Page Component (Full Page)
 */
const RequestDetailsPage = ({ request, loading, onClose, onAccept, onReject }) => {
  const [activeTab, setActiveTab] = useState('user');
  
  if (!request) return null;

  const booking = request.booking || {};
  const car = booking.car || {};
  const user = request.user || {};

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div 
        className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-4 md:pb-6 rounded-b-3xl"
        style={{ backgroundColor: colors.backgroundPrimary }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: colors.backgroundIcon }}
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-black">Guarantor Request Details</h2>
            <p className="text-xs text-gray-600">Booking: {booking.bookingId || 'N/A'}</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-8 lg:pb-10">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.textPrimary }}></div>
            <p className="text-gray-600">Loading details...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-4 border border-gray-100">
              <div className="flex gap-2 border-b border-gray-200 px-4">
                {['user', 'car', 'booking'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 text-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={activeTab === tab ? { 
                      borderBottomColor: colors.textPrimary,
                      color: colors.textPrimary 
                    } : {}}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              {activeTab === 'user' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black mb-4">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Name</label>
                      <p className="text-sm text-black">{user.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Email</label>
                      <p className="text-sm text-black">{user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-black">{user.phone || 'N/A'}</p>
                    </div>
                    {user.age && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Age</label>
                        <p className="text-sm text-black">{user.age}</p>
                      </div>
                    )}
                    {user.gender && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Gender</label>
                        <p className="text-sm text-black capitalize">{user.gender}</p>
                      </div>
                    )}
                    {user.address && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700">Address</label>
                        <p className="text-sm text-black">{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'car' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black mb-4">Car Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Car</label>
                      <p className="text-sm text-black">
                        {car.brand || ''} {car.model || ''} {car.year || ''}
                      </p>
                    </div>
                    {car.registrationNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Registration Number</label>
                        <p className="text-sm text-black">{car.registrationNumber}</p>
                      </div>
                    )}
                    {car.color && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Color</label>
                        <p className="text-sm text-black capitalize">{car.color}</p>
                      </div>
                    )}
                    {car.pricePerDay && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Price per Day</label>
                        <p className="text-sm text-black">₹{car.pricePerDay.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Car Images</label>
                    {car.images && Array.isArray(car.images) && car.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {car.images.slice(0, 6).map((image, index) => {
                          const imageUrl = typeof image === 'string' ? image : (image?.url || image?.secure_url || '');
                          return (
                            <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`Car ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const errorDiv = e.target.parentElement.querySelector('.error-placeholder');
                                    if (errorDiv) errorDiv.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="error-placeholder hidden w-full h-full items-center justify-center bg-gray-200 text-gray-400 text-xs absolute inset-0">
                                <span>No Image</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <p className="text-sm text-gray-400">No images available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'booking' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black mb-4">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Booking ID</label>
                      <p className="text-sm text-black font-mono">{booking.bookingId || 'N/A'}</p>
                    </div>
                    {booking.tripStart?.date && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Trip Start</label>
                        <p className="text-sm text-black">
                          {new Date(booking.tripStart.date).toLocaleDateString()} at {booking.tripStart.time || 'N/A'}
                        </p>
                      </div>
                    )}
                    {booking.tripEnd?.date && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Trip End</label>
                        <p className="text-sm text-black">
                          {new Date(booking.tripEnd.date).toLocaleDateString()} at {booking.tripEnd.time || 'N/A'}
                        </p>
                      </div>
                    )}
                    {booking.totalDays && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Duration</label>
                        <p className="text-sm text-black">{booking.totalDays} days</p>
                      </div>
                    )}
                    {booking.pricing?.totalPrice && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Total Amount</label>
                        <p className="text-sm font-semibold text-black">
                          ₹{booking.pricing.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {booking.status && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Status</label>
                        <p className="text-sm text-black capitalize">{booking.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!loading && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={onReject}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Accept
                      </button>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <div className="flex-1 px-4 py-3 bg-green-100 text-green-700 rounded-lg text-center font-medium">
                      Accepted
                    </div>
                  )}
                  {request.status === 'rejected' && (
                    <div className="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg text-center font-medium">
                      Rejected
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

/**
 * Guarantor Requests Page Component
 * Shows all requests from admin panel with bell icon
 */
const GuarantorRequestsPage = ({ requests, loadingRequests, pendingRequestsCount, onClose, onViewDetails, onAccept, onReject }) => {
  // Handle copy request ID
  const handleCopyRequestId = (requestId) => {
    if (requestId) {
      navigator.clipboard.writeText(requestId);
      toastUtils.success('Request ID copied!');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0">
      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div 
          className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-4 md:pb-6 rounded-b-3xl"
          style={{ backgroundColor: colors.backgroundPrimary }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: colors.backgroundIcon }}
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <h2 className="text-lg font-bold text-black">Guarantor Requests</h2>
                {pendingRequestsCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {pendingRequestsCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                All requests from admin panel
              </p>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        {/* KYC Verification Notice */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1 text-blue-900">
                  KYC Verification Required
                </p>
                <p className="text-xs leading-relaxed text-blue-800">
                  As a guarantor, you must complete KYC verification physically at the office. Please visit our office with valid identification documents to complete the verification process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-6 md:pb-8 lg:pb-10">
          {loadingRequests ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.textPrimary }}></div>
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center border border-gray-100">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold text-black mb-2">No Requests</h3>
              <p className="text-sm text-gray-600">
                You don't have any guarantor requests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const isAccepted = request.status === 'accepted';
                const isPending = request.status === 'pending';
                const requestId = request._id?.toString() || request.id?.toString() || '';
                return (
                  <div key={request._id || Math.random()} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3">
                      {/* Request ID from Admin */}
                      {requestId && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: colors.backgroundSecondary || '#f9fafb' }}>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-medium text-gray-600">Request ID:</span>
                            <span className="text-sm font-bold text-black font-mono">{requestId}</span>
                          </div>
                          <button
                            onClick={() => handleCopyRequestId(requestId)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors touch-target"
                            aria-label="Copy request ID"
                            title="Copy Request ID"
                          >
                            <svg
                              className="w-4 h-4 text-gray-600"
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
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: colors.textPrimary }}
                        >
                          {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-black mb-1">
                            Request from {request.user?.name || 'User'}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1">{request.user?.email}</p>
                          <p className="text-xs text-gray-600">Booking: {request.booking?.bookingId || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isAccepted 
                            ? 'bg-green-100 text-green-800' 
                            : isPending 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isAccepted ? 'Accepted' : isPending ? 'Pending' : request.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewDetails(request)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                          style={{ backgroundColor: colors.textPrimary }}
                        >
                          View Details
                        </button>
                        {isPending && (
                          <>
                            <button
                              onClick={() => onAccept(request._id)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => onReject(request._id)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
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

export default ModuleGuarantorPage;

