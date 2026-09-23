import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setGuarantor } from '../../store/slices/userSlice';
import { theme } from '../../theme/theme.constants';
import toastUtils from '../../config/toast';
import { userService } from '../../services/user.service';
import Card from '../../components/common/Card';

/**
 * GuarantorManagementPage Component
 * Form to add and manage guarantor
 * Based on document.txt - User enters guarantor's phone/email, Guarantor receives invite, completes registration + KYC
 */
const GuarantorManagementPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { guarantor } = useAppSelector((state) => state.user);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);

  // Fetch requests (pending and accepted)
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await userService.getMyGuarantorRequests();
        const requestsData = response?.data?.requests || response?.requests || [];
        // Show pending and accepted requests, filter out rejected
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        const pendingRequests = requestsData.filter(req => req.status === 'pending');
        setRequests(activeRequests);
        setPendingRequestsCount(pendingRequests.length);
      } catch (error) {
        console.error('Error fetching guarantor requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  // Form state removed - fields have been removed

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
        // Show pending and accepted requests, filter out rejected
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        const pendingRequests = requestsData.filter(req => req.status === 'pending');
        setRequests(activeRequests);
        setPendingRequestsCount(pendingRequests.length);
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
        // Show pending and accepted requests, filter out rejected
        const activeRequests = requestsData.filter(req => req.status === 'pending' || req.status === 'accepted');
        const pendingRequests = requestsData.filter(req => req.status === 'pending');
        setRequests(activeRequests);
        setPendingRequestsCount(pendingRequests.length);
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
      setRequestDetails(response?.data?.request || response?.request);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toastUtils.error('Failed to load request details');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header - Only show when not viewing details */}
      {!showDetailsModal && (
        <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          <div className="relative px-4 pt-2 pb-2 md:px-6 md:py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => navigate(-1)}
                  className="p-1 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors md:p-1.5"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg md:text-2xl font-bold text-white">Guarantor</h1>
                <div className="w-10"></div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Status Card */}
      {guarantor.added && (
        <div className="px-4 pt-4 pb-2 md:pt-6 md:pb-2">
          <div className="max-w-7xl mx-auto">
            <div className={`bg-white rounded-xl p-3 md:p-5 shadow-md border-2 ${
              guarantor.verified ? 'border-green-400' : 'border-yellow-400'
            }`}>
            <div className="flex items-start justify-between mb-2.5 md:mb-3">
              <div className="flex items-center gap-2.5 md:gap-4 flex-1">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center shadow-sm ${
                  guarantor.verified ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-yellow-100 to-yellow-50'
                }`}>
                  <svg className={`w-6 h-6 md:w-8 md:h-8 ${guarantor.verified ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-xl font-bold mb-1" style={{ color: theme.colors.textPrimary }}>
                    {guarantor.details?.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {guarantor.details?.phone && (
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-xs md:text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                          {guarantor.details.phone}
                        </p>
                      </div>
                    )}
                    {guarantor.details?.email && (
                      <div className="flex items-center gap-1 md:gap-1.5">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: theme.colors.textSecondary }}>
                          {guarantor.details.email}
                        </p>
                      </div>
                    )}
                    {guarantor.details?.relationship && (
                      <span className="text-xs md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-md" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                        {guarantor.details.relationship}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-sm ${
                  guarantor.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {guarantor.verified ? (
                    <>
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Pending
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {!guarantor.verified && (
              <div className="mt-3 pt-3 border-t-2" style={{ borderColor: theme.colors.borderLight }}>
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
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.white,
                    }}
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
                      backgroundColor: `${theme.colors.error}15`,
                      color: theme.colors.error,
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
      </div>
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
      ) : (
        <>
          {/* Guarantor Requests Section */}
          {requests.length > 0 && (
            <div className="px-4 pt-4 pb-2 md:pt-6 md:pb-2">
              <div className="max-w-7xl mx-auto">
                <div className="mb-3">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Guarantor Requests</h2>
                  <p className="text-sm text-gray-600">
                    {pendingRequestsCount > 0 
                      ? `You have ${pendingRequestsCount} pending request${pendingRequestsCount > 1 ? 's' : ''}`
                      : 'You have no pending requests'}
                  </p>
                </div>
                <div className="space-y-3">
                  {requests.map((request) => {
                    const isAccepted = request.status === 'accepted';
                    const isPending = request.status === 'pending';
                    return (
                      <Card key={request._id} className="p-4 hover:shadow-lg transition-all">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                              style={{ backgroundColor: theme.colors.primary }}
                            >
                              {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                Request from {request.user?.name || 'User'}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">{request.user?.email}</p>
                              <p className="text-xs text-gray-600">Booking: {request.booking?.bookingId || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(request.createdAt).toLocaleString()}
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
                              onClick={() => handleViewDetails(request)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                              style={{ backgroundColor: theme.colors.primary }}
                            >
                              View Details
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleAccept(request._id)}
                                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(request._id)}
                                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty State - Show message if no guarantor added and no pending requests */}
          {!guarantor.added && requests.length === 0 && !loadingRequests && (
            <div className="px-4 pt-4 pb-2 md:pt-6 md:pb-2">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-md text-center">
                  <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Guarantor Added</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    You haven't added a guarantor yet. Check your requests to see if anyone has requested you to be their guarantor.
                  </p>
                  <button
                    onClick={() => navigate('/profile/guarantor/requests')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Check Requests
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Section - Add Guarantor section removed */}
    </div>
  );
};

/**
 * Request Details Page Component (Full Page)
 */
const RequestDetailsPage = ({ request, loading, onClose, onAccept, onReject }) => {
  const [activeTab, setActiveTab] = useState('user');

  const booking = request?.booking || {};
  const car = booking?.car || {};
  const user = request?.user || {};

  // Debug: Log car data to check images
  useEffect(() => {
    if (car && activeTab === 'car') {
      console.log('Car data:', {
        hasCar: !!car,
        images: car.images,
        imagesLength: car.images?.length,
        imagesType: typeof car.images,
        carKeys: Object.keys(car),
      });
    }
  }, [car, activeTab]);

  if (!request) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-[100] text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-2 pb-2 md:px-6 md:py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="p-1 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 text-center">
                <h2 className="text-lg md:text-xl font-bold text-white">Guarantor Request Details</h2>
                <p className="text-xs md:text-sm text-white/80">Booking: {booking.bookingId || 'N/A'}</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
            <p className="text-gray-600">Loading details...</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-4">
              <div className="flex gap-2 border-b border-gray-200 px-4">
                {['user', 'car', 'booking'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={activeTab === tab ? { 
                      borderBottomColor: theme.colors.primary,
                      color: theme.colors.primary 
                    } : {}}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              {activeTab === 'user' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{user.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                    </div>
                    {user.age && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Age</label>
                        <p className="text-sm text-gray-900">{user.age}</p>
                      </div>
                    )}
                    {user.gender && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Gender</label>
                        <p className="text-sm text-gray-900 capitalize">{user.gender}</p>
                      </div>
                    )}
                    {user.address && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700">Address</label>
                        <p className="text-sm text-gray-900">{user.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'car' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Car Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Car</label>
                      <p className="text-sm text-gray-900">
                        {car.brand || ''} {car.model || ''} {car.year || ''}
                      </p>
                    </div>
                    {car.registrationNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Registration Number</label>
                        <p className="text-sm text-gray-900">{car.registrationNumber}</p>
                      </div>
                    )}
                    {car.color && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Color</label>
                        <p className="text-sm text-gray-900 capitalize">{car.color}</p>
                      </div>
                    )}
                    {car.pricePerDay && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Price per Day</label>
                        <p className="text-sm text-gray-900">₹{car.pricePerDay.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-700 mb-2 block">Car Images</label>
                    {car.images && Array.isArray(car.images) && car.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {car.images.slice(0, 6).map((image, index) => {
                          // Handle both string URLs and object with url property
                          const imageUrl = typeof image === 'string' ? image : (image?.url || image?.secure_url || '');
                          return (
                            <div key={index} className="relative w-full h-32 md:h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`Car ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Error loading car image:', imageUrl);
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
                      <div className="w-full h-32 md:h-40 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <p className="text-sm text-gray-400">No images available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'booking' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Booking ID</label>
                      <p className="text-sm text-gray-900 font-mono">{booking.bookingId || 'N/A'}</p>
                    </div>
                    {booking.tripStart?.date && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Trip Start</label>
                        <p className="text-sm text-gray-900">
                          {new Date(booking.tripStart.date).toLocaleDateString()} at {booking.tripStart.time || 'N/A'}
                        </p>
                      </div>
                    )}
                    {booking.tripEnd?.date && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Trip End</label>
                        <p className="text-sm text-gray-900">
                          {new Date(booking.tripEnd.date).toLocaleDateString()} at {booking.tripEnd.time || 'N/A'}
                        </p>
                      </div>
                    )}
                    {booking.totalDays && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Duration</label>
                        <p className="text-sm text-gray-900">{booking.totalDays} days</p>
                      </div>
                    )}
                    {booking.pricing?.totalPrice && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Total Amount</label>
                        <p className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                          ₹{booking.pricing.totalPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {booking.status && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">Status</label>
                        <p className="text-sm text-gray-900 capitalize">{booking.status}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!loading && (
              <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
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
  );
};

export default GuarantorManagementPage;
