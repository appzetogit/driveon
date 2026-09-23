import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { theme } from '../../theme/theme.constants';
import { userService } from '../../services/user.service';
import toastUtils from '../../config/toast';
import Card from '../../components/common/Card';

/**
 * GuarantorRequestsPage Component
 * Shows pending guarantor requests for the logged-in user
 */
const GuarantorRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await userService.getMyGuarantorRequests();
      const requestsData = response?.data?.requests || response?.requests || [];
      setRequests(requestsData.filter(req => req.status === 'pending'));
    } catch (error) {
      console.error('Error fetching guarantor requests:', error);
      toastUtils.error('Failed to load guarantor requests');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAccept = async (requestId) => {
    if (!window.confirm('Are you sure you want to accept this guarantor request?')) {
      return;
    }

    try {
      const response = await userService.acceptGuarantorRequest(requestId);
      if (response.success) {
        toastUtils.success('Guarantor request accepted successfully!');
        fetchRequests(); // Refresh list
        setShowDetailsModal(false);
      } else {
        toastUtils.error(response.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please enter rejection reason (optional):');
    
    try {
      const response = await userService.rejectGuarantorRequest(requestId, reason || 'Rejected by guarantor');
      if (response.success) {
        toastUtils.success('Guarantor request rejected');
        fetchRequests(); // Refresh list
        setShowDetailsModal(false);
      } else {
        toastUtils.error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          ></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Only show when not viewing details */}
      {!showDetailsModal && (
        <header className="sticky top-0 z-50 text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
          <div className="relative px-4 pt-2 pb-2 md:px-6 md:py-3">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(-1)}
                  className="p-1 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg md:text-2xl font-bold text-white">Guarantor Requests</h1>
                <div className="w-10"></div>
              </div>
            </div>
          </div>
        </header>
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
        <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-7xl mx-auto">
          {requests.length === 0 ? (
            <Card className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg mb-2">No Pending Requests</p>
              <p className="text-gray-500 text-sm">You don't have any pending guarantor requests at the moment.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request._id} className="p-4 hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Request from {request.user?.name || 'User'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">{request.user?.email}</p>
                          <p className="text-sm text-gray-600">Booking: {request.booking?.bookingId || 'N/A'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested on: {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 md:w-40">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAccept(request._id)}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuarantorRequestsPage;

