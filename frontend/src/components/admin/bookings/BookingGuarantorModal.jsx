import { useState, useEffect } from 'react';
import { colors } from '../../../module/theme/colors';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';

/**
 * BookingGuarantorModal
 * Displays guarantor details for a booking, shows "No guarantor found" when empty,
 * allows adding a new guarantor by ID, viewing full details, and removing guarantor.
 */
const BookingGuarantorModal = ({
  isOpen,
  onClose,
  booking,
  bookingType = 'regular', // 'regular' or 'inward'
  onGuarantorUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [guarantors, setGuarantors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [guarantorIdInput, setGuarantorIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGuarantorDetail, setSelectedGuarantorDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Booking identifiers
  const bookingMongoId = booking?._id || booking?.mongoId || booking?.id;
  const bookingDisplayId = booking?.bookingId || booking?.originalBookingId || booking?.id || 'N/A';
  const customerName = booking?.userName || booking?.customerName || booking?.user?.name || 'Customer';
  const customerEmail = booking?.userEmail || booking?.customerEmail || booking?.user?.email || '';
  const customerPhone = booking?.userPhone || booking?.customerPhone || booking?.user?.phone || '';

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load guarantors when modal opens
  useEffect(() => {
    if (!isOpen || !booking) return;

    fetchGuarantors();
  }, [isOpen, bookingMongoId, bookingDisplayId]);

  const fetchGuarantors = async () => {
    setLoading(true);
    setShowAddForm(false);
    setGuarantorIdInput('');
    setSelectedGuarantorDetail(null);

    try {
      // 1. Fetch requests for this booking from adminService
      const targetId = bookingMongoId || bookingDisplayId;
      const res = await adminService.getAllGuarantorRequests({ bookingId: targetId });
      const requests = res?.data?.requests || res?.requests || [];

      if (requests.length > 0) {
        const mapped = requests.map((req) => {
          const g = req.guarantor || {};
          return {
            id: req._id?.toString(),
            requestId: req._id?.toString(),
            guarantorId: g.guarantorId || req.guarantorId || 'N/A',
            guarantorName: g.name || req.guarantorName || 'N/A',
            guarantorEmail: g.email || req.guarantorEmail || '',
            guarantorPhone: g.phone || req.guarantorPhone || '',
            guarantorKYCStatus: g.kycStatus || 'pending',
            verificationStatus: req.verificationStatus || (req.status === 'accepted' ? 'verified' : 'pending'),
            invitationStatus: req.status || 'accepted',
            invitationSentDate: req.createdAt || null,
            invitationAcceptedDate: req.acceptedAt || null,
            verificationDate: req.verificationDate || req.acceptedAt || null,
            rejectionReason: req.rejectionReason || '',
          };
        });
        setGuarantors(mapped);
      } else {
        // 2. Check if booking already has embedded guarantor
        const embeddedGuarantor = booking?.guarantor || booking?.guarantorDetails;
        if (embeddedGuarantor && (embeddedGuarantor.name || embeddedGuarantor.guarantorId || booking.guarantorName)) {
          setGuarantors([
            {
              id: embeddedGuarantor._id?.toString() || booking.guarantorId || 'embedded-g',
              requestId: embeddedGuarantor._id?.toString() || null,
              guarantorId: embeddedGuarantor.guarantorId || booking.guarantorId || 'N/A',
              guarantorName: embeddedGuarantor.name || booking.guarantorName || 'Guarantor',
              guarantorEmail: embeddedGuarantor.email || '',
              guarantorPhone: embeddedGuarantor.phone || '',
              guarantorKYCStatus: embeddedGuarantor.kycStatus || 'pending',
              verificationStatus: embeddedGuarantor.verificationStatus || 'verified',
              invitationStatus: embeddedGuarantor.invitationStatus || 'accepted',
              invitationSentDate: embeddedGuarantor.invitationSentDate || booking.createdAt || null,
              invitationAcceptedDate: embeddedGuarantor.invitationAcceptedDate || null,
              verificationDate: embeddedGuarantor.verificationDate || null,
            },
          ]);
        } else {
          setGuarantors([]);
        }
      }
    } catch (err) {
      console.error('Error fetching guarantors in modal:', err);
      // Fallback to checking booking prop
      if (booking?.guarantorName || booking?.guarantorDetails) {
        setGuarantors([
          {
            id: 'embedded-g',
            guarantorId: booking.guarantorDetails?.guarantorId || booking.guarantorId || 'N/A',
            guarantorName: booking.guarantorDetails?.name || booking.guarantorName,
            guarantorEmail: booking.guarantorDetails?.email || '',
            guarantorPhone: booking.guarantorDetails?.phone || '',
            guarantorKYCStatus: booking.guarantorDetails?.kycStatus || 'pending',
            verificationStatus: 'verified',
            invitationStatus: 'accepted',
          },
        ]);
      } else {
        setGuarantors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add guarantor submit
  const handleAddGuarantorSubmit = async (e) => {
    e?.preventDefault();
    if (!guarantorIdInput.trim()) {
      toastUtils.error('Please enter a Guarantor ID');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetId = bookingMongoId || bookingDisplayId;

      const response = await adminService.sendGuarantorRequest({
        bookingId: targetId,
        guarantorId: guarantorIdInput.trim(),
      });

      if (response.success) {
        toastUtils.success('Guarantor added / request sent successfully!');
        setGuarantorIdInput('');
        setShowAddForm(false);
        await fetchGuarantors();
        if (onGuarantorUpdated) {
          onGuarantorUpdated({ bookingId: targetId, guarantorId: guarantorIdInput.trim() });
        }
      } else {
        toastUtils.error(response.message || 'Failed to add guarantor');
      }
    } catch (err) {
      console.error('Error adding guarantor:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to add guarantor';
      toastUtils.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove guarantor
  const handleRemoveGuarantor = async (guarantor) => {
    if (!window.confirm(`Are you sure you want to remove ${guarantor.guarantorName} as guarantor?`)) {
      return;
    }

    try {
      const targetBookingId = bookingMongoId || bookingDisplayId;
      const targetReqId = guarantor.requestId || guarantor.id || targetBookingId;

      const response = await adminService.deleteGuarantorRequest(targetReqId, {
        bookingId: targetBookingId,
        guarantorId: guarantor.guarantorId,
      });

      if (response.success) {
        toastUtils.success('Guarantor removed successfully');
        setGuarantors((prev) => prev.filter((g) => g.id !== guarantor.id));
        if (selectedGuarantorDetail?.id === guarantor.id) {
          setSelectedGuarantorDetail(null);
        }
        if (onGuarantorUpdated) {
          onGuarantorUpdated({ bookingId: targetBookingId, removed: true });
        }
      } else {
        toastUtils.error(response.message || 'Failed to remove guarantor');
      }
    } catch (err) {
      console.error('Error removing guarantor:', err);
      const msg = err.response?.data?.message || 'Failed to remove guarantor';
      toastUtils.error(msg);
    }
  };

  // Status color helper
  const getStatusBadge = (status) => {
    const map = {
      verified: 'bg-green-100 text-green-700 border-green-200',
      accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Guarantor Information
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  {bookingDisplayId}
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Customer: <span className="font-semibold text-gray-700">{customerName}</span>
                {customerPhone && ` • ${customerPhone}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center">
              <div
                className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mx-auto mb-3"
                style={{ borderColor: colors.backgroundTertiary }}
              ></div>
              <p className="text-sm text-gray-500">Checking guarantor details...</p>
            </div>
          ) : selectedGuarantorDetail ? (
            /* Detailed view of selected guarantor */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedGuarantorDetail(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Guarantor List
                </button>
                <span className="text-xs font-mono font-medium text-gray-500">
                  ID: {selectedGuarantorDetail.guarantorId}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                {['profile', 'verification', 'history'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'profile' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <label className="text-gray-500 font-medium">Guarantor Name</label>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedGuarantorDetail.guarantorName}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Guarantor ID</label>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">{selectedGuarantorDetail.guarantorId}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Email</label>
                    <p className="text-gray-800 font-medium mt-0.5">{selectedGuarantorDetail.guarantorEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Phone</label>
                    <p className="text-gray-800 font-medium mt-0.5">{selectedGuarantorDetail.guarantorPhone || 'N/A'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <label className="text-gray-500 font-medium">KYC Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${getStatusBadge(selectedGuarantorDetail.guarantorKYCStatus)}`}>
                        {selectedGuarantorDetail.guarantorKYCStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Verification Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${getStatusBadge(selectedGuarantorDetail.verificationStatus)}`}>
                        {selectedGuarantorDetail.verificationStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Invitation Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border capitalize ${getStatusBadge(selectedGuarantorDetail.invitationStatus)}`}>
                        {selectedGuarantorDetail.invitationStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">Verification Date</label>
                    <p className="text-gray-800 font-medium mt-1">
                      {selectedGuarantorDetail.verificationDate
                        ? new Date(selectedGuarantorDetail.verificationDate).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-2 text-xs">
                  {selectedGuarantorDetail.invitationSentDate && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                      <span className="text-gray-600 font-medium">Invitation Sent</span>
                      <span className="font-semibold text-gray-800">{new Date(selectedGuarantorDetail.invitationSentDate).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedGuarantorDetail.invitationAcceptedDate && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex justify-between">
                      <span className="text-blue-700 font-medium">Invitation Accepted</span>
                      <span className="font-semibold text-blue-900">{new Date(selectedGuarantorDetail.invitationAcceptedDate).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedGuarantorDetail.verificationDate && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex justify-between">
                      <span className="text-green-700 font-medium">Guarantor Verified</span>
                      <span className="font-semibold text-green-900">{new Date(selectedGuarantorDetail.verificationDate).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : guarantors.length > 0 ? (
            /* List of existing guarantors */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Linked Guarantors ({guarantors.length})
                </h3>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm hover:opacity-90"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    + Add Guarantor
                  </button>
                )}
              </div>

              {guarantors.map((guarantor, index) => (
                <div
                  key={guarantor.id || index}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      >
                        {guarantor.guarantorName?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-sm text-gray-900">{guarantor.guarantorName}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-200 text-gray-800 rounded font-semibold">
                            {guarantor.guarantorId}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {guarantor.guarantorEmail && <span>{guarantor.guarantorEmail}</span>}
                          {guarantor.guarantorPhone && <span> • {guarantor.guarantorPhone}</span>}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getStatusBadge(guarantor.verificationStatus)}`}>
                            Verification: {guarantor.verificationStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getStatusBadge(guarantor.guarantorKYCStatus)}`}>
                            KYC: {guarantor.guarantorKYCStatus}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${getStatusBadge(guarantor.invitationStatus)}`}>
                            Invitation: {guarantor.invitationStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGuarantorDetail(guarantor)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuarantor(guarantor)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Remove guarantor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state when NO guarantor found */
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No guarantor found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                No guarantor has been attached to this booking yet. You can link a verified guarantor using their Guarantor ID below.
              </p>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Guarantor
                </button>
              )}
            </div>
          )}

          {/* Add Guarantor Form (Inline section) */}
          {showAddForm && (
            <div className="mt-5 p-4 bg-purple-50/60 rounded-xl border border-purple-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-purple-900 flex items-center gap-1.5">
                  <span>➕</span> Add New Guarantor
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleAddGuarantorSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter Guarantor ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guarantorIdInput}
                    onChange={(e) => setGuarantorIdInput(e.target.value)}
                    placeholder="e.g. GURN123456ABC"
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter the unique Guarantor ID of the user you want to attach to this booking.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setGuarantorIdInput('');
                    }}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !guarantorIdInput.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {isSubmitting ? 'Sending Request...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Booking: <strong className="text-gray-700">{bookingDisplayId}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingGuarantorModal;
