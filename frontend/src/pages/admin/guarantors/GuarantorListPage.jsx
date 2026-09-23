import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Guarantor List Page
 * Admin can view, filter, and manage all guarantor relationships
 * No localStorage or Redux - All state managed via React hooks
 */
const GuarantorListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get initial status from URL
  const getInitialStatus = () => {
    if (location.pathname.includes('/pending')) return 'pending';
    return 'all';
  };

  // State management
  const [guarantors, setGuarantors] = useState([]);
  const [filteredGuarantors, setFilteredGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [showGuarantorDetail, setShowGuarantorDetail] = useState(false);
  const [showAddGuarantorModal, setShowAddGuarantorModal] = useState(false);
  const [selectedBookingForGuarantor, setSelectedBookingForGuarantor] = useState(null);
  const [guarantorIdInput, setGuarantorIdInput] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    verificationStatus: getInitialStatus(), // all, verified, pending, rejected
    invitationStatus: 'all', // all, sent, accepted, pending, expired
    linkedUser: 'all', // all or specific user
  });

  // Prevent body scroll when any modal is open
  useEffect(() => {
    if (showGuarantorDetail || showAddGuarantorModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showGuarantorDetail, showAddGuarantorModal]);

  // Load guarantor data from both bookings and guarantor requests
  useEffect(() => {
    const fetchGuarantors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both bookings and guarantor requests
        const [bookingsResponse, guarantorRequestsResponse] = await Promise.all([
          adminService.getAllBookings({ limit: 200 }),
          adminService.getAllGuarantorRequests({ status: 'accepted' }),
        ]);

        const bookingsData = bookingsResponse?.data?.bookings || bookingsResponse?.bookings || [];
        const guarantorRequestsData = guarantorRequestsResponse?.data?.requests || guarantorRequestsResponse?.requests || [];

        // Create a map to store all guarantors per booking ID
        const bookingGuarantorsMap = new Map();

        // Process bookings (for backward compatibility)
        // First, get all guarantor requests to map them to bookings
        const allRequestsMap = new Map();
        guarantorRequestsData.forEach((req) => {
          // Handle both populated and non-populated booking/guarantor
          let reqBookingId = null;
          let reqGuarantorId = null;
          
          if (req.booking) {
            reqBookingId = req.booking._id?.toString() || req.booking.toString() || String(req.booking);
          }
          
          if (req.guarantor) {
            reqGuarantorId = req.guarantor._id?.toString() || req.guarantor.toString() || String(req.guarantor);
          }
          
          if (reqBookingId && reqGuarantorId) {
            const key = `${reqBookingId}-${reqGuarantorId}`;
            allRequestsMap.set(key, req._id?.toString());
            console.log('📝 Mapped request:', { key, requestId: req._id?.toString() });
          }
        });
        
        console.log('📊 Total requests mapped:', allRequestsMap.size);

        bookingsData.forEach((booking) => {
          const user = booking.user || {};
          const guarantor = booking.guarantor || null;
          const bookingId = booking.bookingId || booking._id?.toString() || 'N/A';
          const bookingMongoId = booking._id?.toString() || booking.id?.toString();

          // Skip if no valid booking ID
          if (bookingId === 'N/A' && !bookingMongoId) return;

          // Create or get booking group
          if (!bookingGuarantorsMap.has(bookingId)) {
            bookingGuarantorsMap.set(bookingId, {
              bookingId: bookingId,
              bookingMongoId: bookingMongoId,
              linkedUserId: user._id || booking.userId || 'unknown-user',
              linkedUserName: user.name || booking.userName || 'N/A',
              linkedUserEmail: user.email || booking.userEmail || 'N/A',
              avatar: user.profilePhoto || null,
              guarantors: [],
            });
          }

          const bookingData = bookingGuarantorsMap.get(bookingId);

          if (guarantor) {
            // Check if this guarantor already exists for this booking
            const existingGuarantor = bookingData.guarantors.find(
              (g) => g.guarantorId === guarantor._id?.toString() && g.bookingId === bookingId
            );

            if (!existingGuarantor) {
              // Try to find the request ID for this booking+guarantor combination
              const guarantorId = guarantor._id?.toString();
              const requestKey = `${bookingMongoId}-${guarantorId}`;
              const requestId = allRequestsMap.get(requestKey) || null;

              console.log('🔍 Looking for request:', {
                bookingId,
                bookingMongoId,
                guarantorId,
                requestKey,
                found: !!requestId,
                requestId,
              });

              bookingData.guarantors.push({
                id: requestId || `${bookingId}-${guarantor._id}-${booking._id}`,
                requestId: requestId, // Store the actual request ID if found
                bookingId: bookingId,
                bookingMongoId: bookingMongoId,
                guarantorId: guarantor._id?.toString() || null,
                guarantorName: guarantor.name || 'N/A',
                guarantorEmail: guarantor.email || '',
                guarantorPhone: guarantor.phone || '',
                guarantorKYCStatus: guarantor.kycStatus || 'pending',
                verificationStatus: 'verified',
                verificationDate: booking.updatedAt || booking.completedAt || booking.confirmedAt || new Date(),
                invitationStatus: 'accepted',
                invitationSentDate: booking.createdAt || booking.bookingDate || new Date(),
                invitationAcceptedDate: booking.updatedAt || booking.completedAt || new Date(),
              });
            }
          }
        });

        // Process guarantor requests (accepted ones)
        guarantorRequestsData.forEach((request) => {
          const user = request.user || {};
          const guarantor = request.guarantor || {};
          const bookingId = request.booking?.bookingId || request.booking?._id?.toString() || 'N/A';
          const bookingMongoId = request.booking?._id || request.booking?.id || null;

          // Skip if no valid booking ID
          if (bookingId === 'N/A' && !bookingMongoId) return;

          // Create or get booking group
          if (!bookingGuarantorsMap.has(bookingId)) {
            bookingGuarantorsMap.set(bookingId, {
              bookingId: bookingId,
              bookingMongoId: bookingMongoId,
              linkedUserId: user._id?.toString() || 'unknown-user',
              linkedUserName: user.name || 'N/A',
              linkedUserEmail: user.email || 'N/A',
              avatar: user.profilePhoto || null,
              guarantors: [],
            });
          }

          const bookingData = bookingGuarantorsMap.get(bookingId);

          // Check if this guarantor already exists for this booking
          const existingGuarantor = bookingData.guarantors.find(
            (g) => g.guarantorId === guarantor._id?.toString() && g.bookingId === bookingId
          );

          if (!existingGuarantor) {
            bookingData.guarantors.push({
              id: request._id?.toString() || `${bookingId}-${guarantor._id}`,
              requestId: request._id?.toString() || null, // Store request ID separately
              bookingId: bookingId,
              bookingMongoId: bookingMongoId,
              guarantorId: guarantor._id?.toString() || null,
              guarantorName: guarantor.name || 'N/A',
              guarantorEmail: guarantor.email || '',
              guarantorPhone: guarantor.phone || '',
              guarantorKYCStatus: guarantor.kycStatus || 'pending',
              verificationStatus: request.status === 'accepted' ? 'verified' : 'pending',
              verificationDate: request.acceptedAt || request.updatedAt || new Date(),
              invitationStatus: request.status || 'pending',
              invitationSentDate: request.createdAt || new Date(),
              invitationAcceptedDate: request.acceptedAt || request.updatedAt || new Date(),
            });
          }
        });

        // Convert map to array format for display - grouped by booking ID
        const guarantorList = Array.from(bookingGuarantorsMap.values()).map((bookingData) => ({
          id: bookingData.bookingId,
          bookingId: bookingData.bookingId,
          bookingMongoId: bookingData.bookingMongoId,
          linkedUserId: bookingData.linkedUserId,
          linkedUserName: bookingData.linkedUserName,
          linkedUserEmail: bookingData.linkedUserEmail,
          avatar: bookingData.avatar,
          guarantors: bookingData.guarantors,
        }));

        setGuarantors(guarantorList);
        setFilteredGuarantors(guarantorList);
      } catch (err) {
        console.error('Error loading guarantors:', err);
        setGuarantors([]);
        setFilteredGuarantors([]);
        setError('Failed to load guarantor data.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuarantors();
  }, []);

  // Filter and search guarantors
  useEffect(() => {
    let filtered = [...guarantors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((bookingGroup) => {
        return keywords.every((keyword) => {
          const bookingId = (bookingGroup.bookingId || '').toLowerCase();
          const linkedUserName = (bookingGroup.linkedUserName || '').toLowerCase();
          const linkedUserEmail = (bookingGroup.linkedUserEmail || '').toLowerCase();

          const matchesBookingId = bookingId.includes(keyword);
          const matchesLinkedUser = linkedUserName.includes(keyword) || linkedUserEmail.includes(keyword);
          
          const matchesGuarantor = bookingGroup.guarantors?.some((guarantor) => {
            const guarantorName = (guarantor.guarantorName || '').toLowerCase();
            const guarantorEmail = (guarantor.guarantorEmail || '').toLowerCase();
            const guarantorPhone = (guarantor.guarantorPhone || '').toLowerCase();
            
            return guarantorName.includes(keyword) || guarantorEmail.includes(keyword) || guarantorPhone.includes(keyword);
          });

          return matchesBookingId || matchesLinkedUser || matchesGuarantor;
        });
      });
    }

    // Verification status filter
    if (filters.verificationStatus !== 'all') {
      filtered = filtered.map((bookingGroup) => {
        const filteredGuarantors = bookingGroup.guarantors?.filter(
          (guarantor) => guarantor.verificationStatus === filters.verificationStatus
        ) || [];
        return { ...bookingGroup, guarantors: filteredGuarantors };
      }).filter((bookingGroup) => bookingGroup.guarantors?.length > 0);
    }

    // Invitation status filter
    if (filters.invitationStatus !== 'all') {
      filtered = filtered.map((bookingGroup) => {
        const filteredGuarantors = bookingGroup.guarantors?.filter(
          (guarantor) => guarantor.invitationStatus === filters.invitationStatus
        ) || [];
        return { ...bookingGroup, guarantors: filteredGuarantors };
      }).filter((bookingGroup) => bookingGroup.guarantors?.length > 0);
    }

    // Linked user filter
    if (filters.linkedUser !== 'all') {
      filtered = filtered.filter((bookingGroup) => bookingGroup.linkedUserId === filters.linkedUser);
    }

    setFilteredGuarantors(filtered);
  }, [guarantors, searchQuery, filters]);

  // Handle guarantor actions
  const handleVerify = (guarantorId) => {
    setGuarantors((prevList) =>
      prevList.map((guarantor) => {
        if (guarantor.id === guarantorId) {
          return {
            ...guarantor,
            verificationStatus: 'verified',
            verificationDate: new Date().toISOString(),
          };
        }
        return guarantor;
      })
    );
  };

  const handleReject = (guarantorId, reason) => {
    setGuarantors((prevList) =>
      prevList.map((guarantor) => {
        if (guarantor.id === guarantorId) {
          return {
            ...guarantor,
            verificationStatus: 'rejected',
            rejectionDate: new Date().toISOString(),
            rejectionReason: reason,
          };
        }
        return guarantor;
      })
    );
  };

  const handleRemoveLink = async (guarantor) => {
    try {
      console.log('🗑️ Delete guarantor clicked:', {
        guarantorId: guarantor.id,
        requestId: guarantor.requestId,
        bookingMongoId: guarantor.bookingMongoId,
        guarantorUserId: guarantor.guarantorId,
      });

      // Use requestId if available
      let requestId = guarantor.requestId;
      
      // If no requestId, try to find it by booking and guarantor
      if (!requestId && guarantor.bookingMongoId && guarantor.guarantorId) {
        try {
          console.log('🔍 Searching for request by booking and guarantor...');
          const allRequests = await adminService.getAllGuarantorRequests({});
          const requests = allRequests?.data?.requests || allRequests?.requests || [];
          
          console.log('📋 Total requests found:', requests.length);
          
          const matchingRequest = requests.find(req => {
            const reqBookingId = req.booking?._id?.toString() || req.booking?.toString();
            const reqGuarantorId = req.guarantor?._id?.toString() || req.guarantor?.toString();
            const matches = reqBookingId === guarantor.bookingMongoId?.toString() &&
                   reqGuarantorId === guarantor.guarantorId?.toString();
            if (matches) {
              console.log('✅ Found matching request:', req._id.toString());
            }
            return matches;
          });
          
          if (matchingRequest && matchingRequest._id) {
            requestId = matchingRequest._id.toString();
            console.log('✅ Using found request ID:', requestId);
          } else {
            console.log('❌ No matching request found');
          }
        } catch (error) {
          console.error('Error finding request:', error);
        }
      }
      
      // Check if we have a valid request ID
      if (!requestId) {
        console.error('❌ No request ID available for deletion');
        toastUtils.error('Cannot delete: No guarantor request found');
        return;
      }
      
      // Check if it's a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(requestId);
      if (!isValidObjectId) {
        console.error('❌ Invalid ObjectId format:', requestId);
        toastUtils.error('Cannot delete: Invalid request ID format');
        return;
      }
      
      console.log('🚀 Calling delete API with request ID:', requestId);
      // Call API to delete from backend
      const response = await adminService.deleteGuarantorRequest(requestId);
      console.log('📥 Delete API response:', response);
      
      if (response.success) {
        // Update state - remove guarantor from the nested structure
        const guarantorIdToRemove = guarantor.id;
        setGuarantors((prevList) => {
          return prevList.map((bookingGroup) => {
            // Filter out the deleted guarantor from this booking's guarantors array
            const updatedGuarantors = bookingGroup.guarantors?.filter(
              (g) => g.id !== guarantorIdToRemove && g.requestId !== requestId
            ) || [];
            
            // If no guarantors left, we can either keep the booking group or remove it
            // For now, keep it but with empty guarantors array
            return {
              ...bookingGroup,
              guarantors: updatedGuarantors,
            };
          }).filter((bookingGroup) => {
            // Optionally remove booking groups with no guarantors
            // For now, keep them so user can add new guarantors
            return true;
          });
        });
        
        // Also update filtered guarantors
        setFilteredGuarantors((prevList) => {
          return prevList.map((bookingGroup) => {
            const updatedGuarantors = bookingGroup.guarantors?.filter(
              (g) => g.id !== guarantorIdToRemove && g.requestId !== requestId
            ) || [];
            return {
              ...bookingGroup,
              guarantors: updatedGuarantors,
            };
          });
        });
        
        toastUtils.success('Guarantor removed successfully');
      } else {
        toastUtils.error(response.message || 'Failed to remove guarantor');
      }
    } catch (error) {
      console.error('Error removing guarantor:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to remove guarantor');
    }
  };

  const handleSendReminder = (guarantorId) => {
    // In real app, this would send a reminder notification
    console.log(`Sending reminder to guarantor: ${guarantorId}`);
  };

  const handleViewGuarantor = (guarantor) => {
    setSelectedGuarantor(guarantor);
    setShowGuarantorDetail(true);
  };

  const handleAddGuarantor = (guarantor) => {
    setSelectedBookingForGuarantor(guarantor);
    setGuarantorIdInput('');
    setShowAddGuarantorModal(true);
  };

  const handleSendGuarantorRequest = async () => {
    console.log('handleSendGuarantorRequest called', {
      guarantorIdInput,
      selectedBookingForGuarantor,
    });

    if (!guarantorIdInput.trim()) {
      toastUtils.error('Please enter a Guarantor ID');
      return;
    }

    if (!selectedBookingForGuarantor) {
      toastUtils.error('Booking information not found');
      return;
    }

    try {
      setIsSendingRequest(true);
      
      // Get bookingMongoId (MongoDB _id) - fetch if missing
      let bookingId = selectedBookingForGuarantor.bookingMongoId || selectedBookingForGuarantor.id;
      
      // If bookingMongoId is missing but we have bookingId string, fetch the booking
      if (!bookingId && selectedBookingForGuarantor.bookingId) {
        try {
          console.log('Fetching booking by bookingId:', selectedBookingForGuarantor.bookingId);
          const bookingResponse = await adminService.getBookingById(selectedBookingForGuarantor.bookingId);
          if (bookingResponse?.success && bookingResponse?.data?.booking) {
            bookingId = bookingResponse.data.booking._id || bookingResponse.data.booking.id;
            console.log('Fetched booking MongoDB ID:', bookingId);
          }
        } catch (fetchError) {
          console.error('Error fetching booking:', fetchError);
          toastUtils.error('Failed to fetch booking details. Please try again.');
          setIsSendingRequest(false);
          return;
        }
      }
      
      if (!bookingId) {
        toastUtils.error('Invalid booking ID. Please try selecting the booking again.');
        setIsSendingRequest(false);
        return;
      }

      console.log('Sending guarantor request:', {
        bookingId,
        guarantorId: guarantorIdInput.trim(),
        bookingData: selectedBookingForGuarantor,
      });

      const response = await adminService.sendGuarantorRequest({
        bookingId: bookingId,
        guarantorId: guarantorIdInput.trim(),
      });

      console.log('Response received:', response);

      if (response.success) {
        toastUtils.success('Guarantor request sent successfully!');
        setShowAddGuarantorModal(false);
        setGuarantorIdInput('');
        setSelectedBookingForGuarantor(null);
        // Refresh guarantors list
        window.location.reload();
      } else {
        toastUtils.error(response.message || 'Failed to send guarantor request');
      }
    } catch (error) {
      console.error('Error sending guarantor request:', error);
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to send guarantor request. Please try again.';
      toastUtils.error(errorMessage);
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-blue-100 text-blue-800',
      sent: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Stats calculation
  const stats = {
    total: guarantors.reduce((sum, userGroup) => sum + (userGroup.guarantors?.length || 0), 0),
    verified: guarantors.reduce((sum, userGroup) => 
      sum + (userGroup.guarantors?.filter((g) => g.verificationStatus === 'verified').length || 0), 0
    ),
    pending: guarantors.reduce((sum, userGroup) => 
      sum + (userGroup.guarantors?.filter((g) => g.verificationStatus === 'pending').length || 0), 0
    ),
    rejected: guarantors.reduce((sum, userGroup) => 
      sum + (userGroup.guarantors?.filter((g) => g.verificationStatus === 'rejected').length || 0), 0
    ),
    activeLinks: guarantors.reduce((sum, userGroup) => 
      sum + (userGroup.guarantors?.filter((g) => g.verificationStatus === 'verified' && g.invitationStatus === 'accepted').length || 0), 0
    ),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading guarantors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
              Guarantor Management
            </h1>
            <p className="text-sm md:text-base text-gray-600">Manage guarantor relationships and verifications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 max-w-4xl">
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs text-gray-600">Total Guarantors</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-green-600">{stats.verified}</div>
            <div className="text-xs text-gray-600">Verified</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-600">Rejected</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-blue-600">{stats.activeLinks}</div>
            <div className="text-xs text-gray-600">Active Links</div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by guarantor name, email, phone, or linked user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Verification Status Filter */}
            <AdminCustomSelect
              label="Verification Status"
              value={filters.verificationStatus}
              onChange={(value) => setFilters({ ...filters, verificationStatus: value })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />

            {/* Invitation Status Filter */}
            <AdminCustomSelect
              label="Invitation Status"
              value={filters.invitationStatus}
              onChange={(value) => setFilters({ ...filters, invitationStatus: value })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'sent', label: 'Sent' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'pending', label: 'Pending' },
                { value: 'expired', label: 'Expired' },
              ]}
            />

            {/* Linked User Filter */}
            <AdminCustomSelect
              label="Linked User"
              value={filters.linkedUser}
              onChange={(value) => setFilters({ ...filters, linkedUser: value })}
              options={[
                { value: 'all', label: 'All Users' },
                ...Array.from(new Set(guarantors.map((g) => g.linkedUserId))).map((userId) => {
                  const bookingGroup = guarantors.find((g) => g.linkedUserId === userId);
                  return {
                    value: userId,
                    label: bookingGroup?.linkedUserName || 'Unknown',
                  };
                }),
              ]}
            />
          </div>
        </Card>

        {/* Guarantors List */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">
              {filteredGuarantors.reduce((sum, userGroup) => sum + (userGroup.guarantors?.length || 0), 0)}
            </span> of <span className="font-semibold">
              {guarantors.reduce((sum, userGroup) => sum + (userGroup.guarantors?.length || 0), 0)}
            </span> guarantors
          </p>
        </div>

        <div className="space-y-4">
          {filteredGuarantors.map((bookingGroup, groupIndex) => (
            <Card key={bookingGroup.bookingId || groupIndex} className="p-4 hover:shadow-lg transition-all">
              {/* Booking ID Header */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: colors.backgroundTertiary }}
                    >
                    {bookingGroup.avatar ? (
                      <img src={bookingGroup.avatar} alt={bookingGroup.linkedUserName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                      <span>{bookingGroup.linkedUserName?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {/* Booking ID and Add Button Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xs text-gray-500">Booking ID: </span>
                          <span className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {bookingGroup.bookingId}
                          </span>
                        </div>
                        {/* Add Guarantor Button - Top Right Corner */}
                        <button
                          onClick={() => {
                            // Use booking info for adding guarantor
                            const firstGuarantor = bookingGroup.guarantors?.[0];
                            if (firstGuarantor) {
                              handleAddGuarantor({
                                ...firstGuarantor,
                                linkedUserName: bookingGroup.linkedUserName,
                                linkedUserEmail: bookingGroup.linkedUserEmail,
                                bookingId: bookingGroup.bookingId,
                                bookingMongoId: bookingGroup.bookingMongoId,
                              });
                            } else {
                              // If no guarantors, create a booking object
                              handleAddGuarantor({
                                linkedUserName: bookingGroup.linkedUserName,
                                linkedUserEmail: bookingGroup.linkedUserEmail,
                                bookingId: bookingGroup.bookingId,
                                bookingMongoId: bookingGroup.bookingMongoId,
                              });
                            }
                          }}
                          className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                          style={{ backgroundColor: colors.backgroundTertiary }}
                        >
                          + Add Guarantor
                        </button>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{bookingGroup.linkedUserName}</h3>
                      <p className="text-xs text-gray-500 mb-1">{bookingGroup.linkedUserEmail}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600">Guarantors: </span>
                        <span className="text-xs font-semibold text-gray-900">{bookingGroup.guarantors?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Guarantors List - Horizontal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {bookingGroup.guarantors && bookingGroup.guarantors.length > 0 ? (
                  bookingGroup.guarantors.map((guarantor, guarantorIndex) => (
                    <div key={guarantor.id || guarantorIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative">
                      {/* Delete Button - Top Right Corner */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${guarantor.guarantorName} as a guarantor?`)) {
                            handleRemoveLink(guarantor);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        aria-label="Delete guarantor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Guarantor Header */}
                      <div className="mb-2 pr-6">
                        <p className="text-xs font-medium text-gray-500 mb-1">Guarantor {guarantorIndex + 1}</p>
                        <h4 className="font-semibold text-sm text-gray-900 mb-1 break-words">{guarantor.guarantorName}</h4>
                        <p className="text-xs text-gray-500 break-words">{guarantor.guarantorEmail}</p>
                        {guarantor.guarantorPhone && (
                          <p className="text-xs text-gray-500 mt-0.5">{guarantor.guarantorPhone}</p>
                        )}
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(guarantor.verificationStatus)}`}>
                          {guarantor.verificationStatus.charAt(0).toUpperCase() + guarantor.verificationStatus.slice(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(guarantor.guarantorKYCStatus)}`}>
                          KYC: {guarantor.guarantorKYCStatus.charAt(0).toUpperCase() + guarantor.guarantorKYCStatus.slice(1)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(guarantor.invitationStatus)}`}>
                          {guarantor.invitationStatus.charAt(0).toUpperCase() + guarantor.invitationStatus.slice(1)}
                        </span>
                      </div>

                      {/* Dates - Compact */}
                      <div className="space-y-1 mb-2 text-xs text-gray-600">
                        {guarantor.invitationSentDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Invited:</span>
                            <span>{new Date(guarantor.invitationSentDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {guarantor.invitationAcceptedDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Accepted:</span>
                            <span>{new Date(guarantor.invitationAcceptedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {guarantor.verificationDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Verified:</span>
                            <span>{new Date(guarantor.verificationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-2">
                        <button
                          onClick={() => handleViewGuarantor(guarantor)}
                          className="w-full px-2 py-1.5 text-xs font-medium text-white rounded hover:opacity-90 transition-colors"
                          style={{ backgroundColor: colors.backgroundTertiary }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                    No guarantors added yet
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredGuarantors.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No guarantors found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Guarantor Detail Modal */}
      {showGuarantorDetail && selectedGuarantor && (
        <GuarantorDetailModal
          guarantor={selectedGuarantor}
          onClose={() => {
            setShowGuarantorDetail(false);
            setSelectedGuarantor(null);
          }}
          onVerify={handleVerify}
          onReject={handleReject}
          onRemoveLink={handleRemoveLink}
          onSendReminder={handleSendReminder}
        />
      )}

      {/* Add Guarantor Modal */}
      {showAddGuarantorModal && selectedBookingForGuarantor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddGuarantorModal(false)}>
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Guarantor</h2>
              <button
                onClick={() => setShowAddGuarantorModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Booking: <span className="font-semibold">{selectedBookingForGuarantor.bookingId}</span>
              </p>
              <p className="text-sm text-gray-600">
                User: <span className="font-semibold">{selectedBookingForGuarantor.linkedUserName}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Guarantor ID
              </label>
              <input
                type="text"
                value={guarantorIdInput}
                onChange={(e) => setGuarantorIdInput(e.target.value)}
                placeholder="e.g., GURN123456ABC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSendingRequest}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the Guarantor ID of the user you want to add as guarantor
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddGuarantorModal(false);
                  setGuarantorIdInput('');
                  setSelectedBookingForGuarantor(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSendingRequest}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Send Request button clicked', {
                    guarantorIdInput,
                    selectedBookingForGuarantor,
                    isSendingRequest,
                  });
                  handleSendGuarantorRequest();
                }}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.backgroundTertiary }}
                disabled={isSendingRequest || !guarantorIdInput.trim()}
              >
                {isSendingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Guarantor Detail Modal Component
 */
const GuarantorDetailModal = ({ guarantor, onClose, onVerify, onReject, onRemoveLink, onSendReminder }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!guarantor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Guarantor Details</h2>
            <p className="text-sm text-gray-600">{guarantor.guarantorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['profile', 'linkedUser', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === tab ? { borderBottomColor: colors.backgroundTertiary } : {}}
              >
                {tab === 'linkedUser' ? 'Linked User' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guarantor Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{guarantor.linkedUserName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{guarantor.linkedUserEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{guarantor.guarantorPhone}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">KYC Status</label>
                    <p className="text-sm text-gray-900 capitalize">{guarantor.guarantorKYCStatus}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Verification Status</label>
                    <p className="text-sm text-gray-900 capitalize">{guarantor.verificationStatus}</p>
                  </div>
                  {guarantor.verificationDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Verification Date</label>
                      <p className="text-sm text-gray-900">{new Date(guarantor.verificationDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'linkedUser' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{guarantor.guarantorName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{guarantor.guarantorEmail}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Linked Bookings</label>
                    {guarantor.bookingId ? (
                      <p className="text-sm text-gray-900 font-mono">{guarantor.bookingId}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No booking ID available</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Invitation Status</label>
                    <p className="text-sm text-gray-900 capitalize">{guarantor.invitationStatus}</p>
                  </div>
                  {guarantor.invitationSentDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Invitation Sent</label>
                      <p className="text-sm text-gray-900">{new Date(guarantor.invitationSentDate).toLocaleString()}</p>
                    </div>
                  )}
                  {guarantor.invitationAcceptedDate && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Invitation Accepted</label>
                      <p className="text-sm text-gray-900">{new Date(guarantor.invitationAcceptedDate).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitation History</h3>
                <div className="space-y-3">
                  {guarantor.invitationSentDate && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Invitation Sent</p>
                      <p className="text-xs text-gray-500">{new Date(guarantor.invitationSentDate).toLocaleString()}</p>
                    </div>
                  )}
                  {guarantor.invitationAcceptedDate && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Invitation Accepted</p>
                      <p className="text-xs text-gray-500">{new Date(guarantor.invitationAcceptedDate).toLocaleString()}</p>
                    </div>
                  )}
                  {guarantor.verificationDate && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Verified</p>
                      <p className="text-xs text-gray-500">{new Date(guarantor.verificationDate).toLocaleString()}</p>
                    </div>
                  )}
                  {guarantor.rejectionDate && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Rejected</p>
                      <p className="text-xs text-gray-500">{new Date(guarantor.rejectionDate).toLocaleString()}</p>
                      {guarantor.rejectionReason && (
                        <p className="text-xs text-red-700 mt-1">{guarantor.rejectionReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {guarantor.verificationStatus === 'pending' && (
            <>
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => {
                      onVerify(guarantor.id);
                      onClose();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              ) : (
                <div className="flex-1">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (rejectReason.trim()) {
                          onReject(guarantor.id, rejectReason);
                          onClose();
                        }
                      }}
                      disabled={!rejectReason.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Rejection
                    </button>
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

export default GuarantorListPage;

