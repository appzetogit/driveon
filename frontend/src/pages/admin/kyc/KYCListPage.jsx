import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { colors } from "../../../module/theme/colors";
import Card from "../../../components/common/Card";
import AdminCustomSelect from "../../../components/admin/common/AdminCustomSelect";
import toastUtils from '../../../config/toast';
import { onMessageListener } from "../../../services/firebase";

/**
 * KYC List Page
 * Admin can view, filter, approve/reject KYC verifications
 * No localStorage or Redux - All state managed via React hooks
 */
const KYCListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial status from URL (pending, approved, rejected)
  const getInitialStatus = () => {
    if (location.pathname.includes("/pending")) return "pending";
    if (location.pathname.includes("/approved")) return "approved";
    if (location.pathname.includes("/rejected")) return "rejected";
    return "all";
  };

  // State management
  const [kycList, setKycList] = useState([]);
  const [filteredKYC, setFilteredKYC] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showKYCDetail, setShowKYCDetail] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingKYCId, setRejectingKYCId] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    status: getInitialStatus(), // all, pending, approved, rejected
    documentType: "all", // all, aadhaar, pan, driving_license
    userType: "all", // all, regular, guarantor, owner
    submissionDate: "all", // all, today, week, month
  });

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 KYC Alert: ${payload.notification.title}`);
        console.log("KYC Notification:", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  // Mock KYC data
  useEffect(() => {
    // Simulate API call
    const timerId = setTimeout(() => {
      const mockKYC = [
        {
          id: "1",
          userId: "1",
          userName: "John Doe",
          userEmail: "john.doe@example.com",
          userPhone: "+91 98765 43210",
          documentType: "aadhaar",
          documentNumber: "XXXX XXXX 1234",
          status: "pending",
          submissionDate: "2024-03-15T10:30:00",
          digiLockerVerified: true,
          documentImage: null, // In real app, this would be image URL
          userType: "regular",
        },
        {
          id: "2",
          userId: "2",
          userName: "Jane Smith",
          userEmail: "jane.smith@example.com",
          userPhone: "+91 98765 43211",
          documentType: "pan",
          documentNumber: "ABCDE1234F",
          status: "pending",
          submissionDate: "2024-03-14T14:20:00",
          digiLockerVerified: false,
          documentImage: null,
          userType: "guarantor",
        },
        {
          id: "3",
          userId: "3",
          userName: "Mike Johnson",
          userEmail: "mike.j@example.com",
          userPhone: "+91 98765 43212",
          documentType: "driving_license",
          documentNumber: "DL-01-2020-1234567",
          status: "approved",
          submissionDate: "2024-03-10T09:15:00",
          approvedDate: "2024-03-11T11:00:00",
          digiLockerVerified: true,
          documentImage: null,
          userType: "owner",
        },
        {
          id: "4",
          userId: "4",
          userName: "Sarah Williams",
          userEmail: "sarah.w@example.com",
          userPhone: "+91 98765 43213",
          documentType: "aadhaar",
          documentNumber: "XXXX XXXX 5678",
          status: "rejected",
          submissionDate: "2024-03-12T16:45:00",
          rejectedDate: "2024-03-13T10:30:00",
          rejectionReason:
            "Document image is unclear. Please upload a clear image.",
          digiLockerVerified: false,
          documentImage: null,
          userType: "regular",
        },
        {
          id: "5",
          userId: "5",
          userName: "David Brown",
          userEmail: "david.b@example.com",
          userPhone: "+91 98765 43214",
          documentType: "aadhaar",
          documentNumber: "XXXX XXXX 9012",
          status: "pending",
          submissionDate: "2024-03-16T08:20:00",
          digiLockerVerified: true,
          documentImage: null,
          userType: "regular",
        },
        {
          id: "6",
          userId: "6",
          userName: "Emily Davis",
          userEmail: "emily.d@example.com",
          userPhone: "+91 98765 43215",
          documentType: "pan",
          documentNumber: "FGHIJ5678K",
          status: "pending",
          submissionDate: "2024-03-15T12:10:00",
          digiLockerVerified: false,
          documentImage: null,
          userType: "guarantor",
        },
        {
          id: "7",
          userId: "7",
          userName: "Robert Wilson",
          userEmail: "robert.w@example.com",
          userPhone: "+91 98765 43216",
          documentType: "driving_license",
          documentNumber: "DL-02-2019-7654321",
          status: "approved",
          submissionDate: "2024-03-08T15:30:00",
          approvedDate: "2024-03-09T09:00:00",
          digiLockerVerified: true,
          documentImage: null,
          userType: "regular",
        },
        {
          id: "8",
          userId: "8",
          userName: "Lisa Anderson",
          userEmail: "lisa.a@example.com",
          userPhone: "+91 98765 43217",
          documentType: "aadhaar",
          documentNumber: "XXXX XXXX 3456",
          status: "pending",
          submissionDate: "2024-03-17T11:00:00",
          digiLockerVerified: true,
          documentImage: null,
          userType: "owner",
        },
      ];
      setKycList(mockKYC);
      setFilteredKYC(mockKYC);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timerId);
  }, []);

  // Filter and search KYC
  useEffect(() => {
    let filtered = [...kycList];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (kyc) =>
          kyc.userName.toLowerCase().includes(query) ||
          kyc.userEmail.toLowerCase().includes(query) ||
          kyc.userPhone.includes(query) ||
          kyc.documentNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((kyc) => kyc.status === filters.status);
    }

    // Document type filter
    if (filters.documentType !== "all") {
      filtered = filtered.filter(
        (kyc) => kyc.documentType === filters.documentType
      );
    }

    // User type filter
    if (filters.userType !== "all") {
      filtered = filtered.filter((kyc) => kyc.userType === filters.userType);
    }

    // Submission date filter
    if (filters.submissionDate !== "all") {
      const now = new Date();
      filtered = filtered.filter((kyc) => {
        const subDate = new Date(kyc.submissionDate);
        switch (filters.submissionDate) {
          case "today":
            return subDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return subDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return subDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredKYC(filtered);
  }, [kycList, searchQuery, filters]);

  // Handle KYC actions
  const handleApprove = (kycId) => {
    setKycList((prevList) =>
      prevList.map((kyc) => {
        if (kyc.id === kycId) {
          return {
            ...kyc,
            status: "approved",
            approvedDate: new Date().toISOString(),
          };
        }
        return kyc;
      })
    );
    setSelectedItems(selectedItems.filter((id) => id !== kycId));
  };

  const handleReject = (kycId, reason) => {
    setKycList((prevList) =>
      prevList.map((kyc) => {
        if (kyc.id === kycId) {
          return {
            ...kyc,
            status: "rejected",
            rejectedDate: new Date().toISOString(),
            rejectionReason: reason,
          };
        }
        return kyc;
      })
    );
    setSelectedItems(selectedItems.filter((id) => id !== kycId));
    setShowRejectModal(false);
    setRejectReason("");
    setRejectingKYCId(null);
  };

  const handleBulkApprove = () => {
    setKycList((prevList) =>
      prevList.map((kyc) => {
        if (selectedItems.includes(kyc.id)) {
          return {
            ...kyc,
            status: "approved",
            approvedDate: new Date().toISOString(),
          };
        }
        return kyc;
      })
    );
    setSelectedItems([]);
  };

  const handleBulkReject = () => {
    if (selectedItems.length > 0) {
      setRejectingKYCId("bulk");
      setShowRejectModal(true);
    }
  };

  const handleBulkRejectConfirm = (reason) => {
    setKycList((prevList) =>
      prevList.map((kyc) => {
        if (selectedItems.includes(kyc.id)) {
          return {
            ...kyc,
            status: "rejected",
            rejectedDate: new Date().toISOString(),
            rejectionReason: reason,
          };
        }
        return kyc;
      })
    );
    setSelectedItems([]);
    setShowRejectModal(false);
    setRejectReason("");
    setRejectingKYCId(null);
  };

  const handleSelectItem = (kycId) => {
    setSelectedItems((prev) =>
      prev.includes(kycId)
        ? prev.filter((id) => id !== kycId)
        : [...prev, kycId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredKYC.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredKYC.map((kyc) => kyc.id));
    }
  };

  const handleDownload = (kycId) => {
    // In real app, this would download the document
    console.log(`Downloading document for KYC: ${kycId}`);
  };

  const handleViewKYC = (kyc) => {
    setSelectedKYC(kyc);
    setShowKYCDetail(true);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get document type display name
  const getDocumentTypeName = (type) => {
    const names = {
      aadhaar: "Aadhaar",
      pan: "PAN",
      driving_license: "Driving License",
    };
    return names[type] || type;
  };

  // Stats calculation
  const stats = {
    total: kycList.length,
    pending: kycList.filter((k) => k.status === "pending").length,
    approved: kycList.filter((k) => k.status === "approved").length,
    rejected: kycList.filter((k) => k.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading KYC verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
                style={{ color: colors.textPrimary }}
              >
                KYC Verification
              </h1>
              <p className="text-sm md:text-base" style={{ color: colors.textSecondary }}>
                Review and verify user documents
              </p>
            </div>
            <div className="flex gap-2">
              {selectedItems.length > 0 && (
                <>
                  <button
                    onClick={handleBulkApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Bulk Approve ({selectedItems.length})
                  </button>
                  <button
                    onClick={handleBulkReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Bulk Reject ({selectedItems.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 max-w-4xl">
          <Card className="p-3 text-center">
            <div
              className="text-xl md:text-2xl font-bold mb-1"
              style={{ color: colors.textPrimary }}
            >
              {stats.total}
            </div>
            <div className="text-xs" style={{ color: colors.textSecondary }}>Total KYC</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.warning }}>
              {stats.pending}
            </div>
            <div className="text-xs" style={{ color: colors.textSecondary }}>Pending</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.success }}>
              {stats.approved}
            </div>
            <div className="text-xs" style={{ color: colors.textSecondary }}>Approved</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.error }}>
              {stats.rejected}
            </div>
            <div className="text-xs" style={{ color: colors.textSecondary }}>Rejected</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, phone, or document number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: `1px solid ${colors.borderMedium}`,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <AdminCustomSelect
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />

            {/* Document Type Filter */}
            <AdminCustomSelect
              label="Document Type"
              value={filters.documentType}
              onChange={(value) => setFilters({ ...filters, documentType: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Aadhaar', value: 'aadhaar' },
                { label: 'PAN', value: 'pan' },
                { label: 'Driving License', value: 'driving_license' },
              ]}
            />

            {/* User Type Filter */}
            <AdminCustomSelect
              label="User Type"
              value={filters.userType}
              onChange={(value) => setFilters({ ...filters, userType: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Regular', value: 'regular' },
                { label: 'Guarantor', value: 'guarantor' },
                { label: 'Owner', value: 'owner' },
              ]}
            />

            {/* Submission Date Filter */}
            <AdminCustomSelect
              label="Submitted"
              value={filters.submissionDate}
              onChange={(value) => setFilters({ ...filters, submissionDate: value })}
              options={[
                { label: 'All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
              ]}
            />
          </div>
        </Card>

        {/* KYC List */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredKYC.length}</span>{" "}
            of <span className="font-semibold">{kycList.length}</span>{" "}
            verifications
          </p>
          {filteredKYC.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  selectedItems.length === filteredKYC.length &&
                  filteredKYC.length > 0
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              Select All
            </label>
          )}
        </div>

        <div className="space-y-4">
          {filteredKYC.map((kyc) => (
            <Card key={kyc.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                {/* Checkbox for bulk selection */}
                <input
                  type="checkbox"
                  checked={selectedItems.includes(kyc.id)}
                  onChange={() => handleSelectItem(kyc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 rounded border-gray-300"
                />

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
                        {kyc.userName}
                      </h3>
                      <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                        {kyc.userEmail}
                      </p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>{kyc.userPhone}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        kyc.status
                      )}`}
                    >
                      {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        Document Type
                      </label>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {getDocumentTypeName(kyc.documentType)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        Document Number
                      </label>
                      <p className="text-sm text-gray-900 font-mono">
                        {kyc.documentNumber}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        DigiLocker
                      </label>
                      <p
                        className={`text-sm font-medium ${kyc.digiLockerVerified
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {kyc.digiLockerVerified ? "Verified" : "Not Verified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                        Submitted
                      </label>
                      <p className="text-sm" style={{ color: colors.textPrimary }}>
                        {new Date(kyc.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {kyc.status === "rejected" && kyc.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-medium text-red-800 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {kyc.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewKYC(kyc)}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDownload(kyc.id)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Download
                </button>
                {kyc.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(kyc.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectingKYCId(kyc.id);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredKYC.length === 0 && (
          <Card className="p-8 text-center">
            <p style={{ color: colors.textSecondary }}>
              No KYC verifications found matching your filters.
            </p>
          </Card>
        )}
      </div>

      {/* KYC Detail Modal */}
      {showKYCDetail && selectedKYC && (
        <KYCDetailModal
          kyc={selectedKYC}
          onClose={() => {
            setShowKYCDetail(false);
            setSelectedKYC(null);
          }}
          onApprove={handleApprove}
          onReject={(id, reason) => {
            handleReject(id, reason);
            setShowKYCDetail(false);
            setSelectedKYC(null);
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          kycId={rejectingKYCId}
          isBulk={rejectingKYCId === "bulk"}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason("");
            setRejectingKYCId(null);
          }}
          onConfirm={(reason) => {
            if (rejectingKYCId === "bulk") {
              handleBulkRejectConfirm(reason);
            } else {
              handleReject(rejectingKYCId, reason);
            }
          }}
        />
      )}
    </div>
  );
};

/**
 * KYC Detail Modal Component
 */
const KYCDetailModal = ({ kyc, onClose, onApprove, onReject }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!kyc) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
              KYC Verification Details
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>{kyc.userName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* User Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Name
                </label>
                <p className="text-sm" style={{ color: colors.textPrimary }}>{kyc.userName}</p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Email
                </label>
                <p className="text-sm text-gray-900">{kyc.userEmail}</p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Phone
                </label>
                <p className="text-sm text-gray-900">{kyc.userPhone}</p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  User Type
                </label>
                <p className="text-sm text-gray-900 capitalize">
                  {kyc.userType}
                </p>
              </div>
            </div>
          </div>

          {/* Document Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Document Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Document Type
                </label>
                <p className="text-sm text-gray-900">
                  {kyc.documentType === "aadhaar"
                    ? "Aadhaar"
                    : kyc.documentType === "pan"
                      ? "PAN"
                      : "Driving License"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Document Number
                </label>
                <p className="text-sm text-gray-900 font-mono">
                  {kyc.documentNumber}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  DigiLocker Status
                </label>
                <p
                  className={`text-sm font-medium ${kyc.digiLockerVerified ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {kyc.digiLockerVerified ? "Verified ✓" : "Not Verified ✗"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                  Submission Date
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(kyc.submissionDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Document Image Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Document Image
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              {kyc.documentImage ? (
                <img
                  src={kyc.documentImage}
                  alt="Document"
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                />
              ) : (
                <div>
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Document image preview will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {kyc.status === "rejected" && kyc.rejectionReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Rejection Reason
              </h4>
              <p className="text-sm text-red-700">{kyc.rejectionReason}</p>
              {kyc.rejectedDate && (
                <p className="text-xs text-red-600 mt-2">
                  Rejected on: {new Date(kyc.rejectedDate).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="3"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {kyc.status === "pending" && (
            <>
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => onApprove(kyc.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (rejectReason.trim()) {
                      onReject(kyc.id, rejectReason);
                    }
                  }}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Reject Modal Component
 */
const RejectModal = ({ kycId, isBulk, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isBulk ? "Bulk Reject KYC" : "Reject KYC Verification"}
        </h3>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a reason for rejection..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
          rows="4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (reason.trim()) {
                onConfirm(reason);
              }
            }}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

export default KYCListPage;
