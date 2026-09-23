import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import { onMessageListener } from "../../../services/firebase";
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Helper Functions - Shared between components
 */

// Calculate KYC status from user data
const getKycStatus = (user) => {
  if (!user) return 'pending';
  if (user.isKYCVerified) return 'verified';
  if (user.kycDetails?.aadhaar?.verified || user.kycDetails?.pan?.verified || user.kycDetails?.dl?.verified) {
    return 'pending'; // Partially verified
  }
  return 'pending';
};


// Helper function to safely get first character
const getFirstChar = (str) => {
  if (!str || typeof str !== 'string') return '?';
  return str.charAt(0).toUpperCase();
};

// Helper function to safely capitalize
const capitalize = (str) => {
  if (!str || typeof str !== 'string') return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper to get user ID (handles both _id and id)
const getUserId = (user) => {
  return user._id || user.id;
};

/**
 * Format user ID to USER001 format
 * Takes MongoDB ObjectId and converts to USER + padded number
 */
const formatUserId = (userId) => {
  if (!userId) return 'N/A';
  const idStr = userId.toString();
  return `user-${idStr.slice(-5)}`;
};

/**
 * User List Page
 * Admin can view, search, filter, and manage all users
 * No localStorage or Redux - All state managed via React hooks
 */
const UserListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);

  // State management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [activeGuarantorIds, setActiveGuarantorIds] = useState([]);
  const [showAdjustCoinsModal, setShowAdjustCoinsModal] = useState(false);
  const [adjustingUser, setAdjustingUser] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    accountStatus: 'all', // all, active, suspended, banned
    kycStatus: 'all', // all, verified, pending
    userType: 'all', // all, regular, guarantor, owner
    registrationDate: 'all', // all, today, week, month, year, custom
    startDate: '', // YYYY-MM-DD
    endDate: '', // YYYY-MM-DD
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, users]);

  // Listen for notifications
  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toastUtils.info(`🔔 Admin Alert: ${payload.notification.title}`);
        console.log("Admin Notification:", payload);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);

  // Listen for global search events from header
  useEffect(() => {
    const handleGlobalSearch = (e) => setSearchQuery(e.detail);
    window.addEventListener('admin-global-search', handleGlobalSearch);
    return () => window.removeEventListener('admin-global-search', handleGlobalSearch);
  }, []);

  // Fetch accepted guarantor requests to identify active guarantors
  useEffect(() => {
    const fetchGuarantors = async () => {
      try {
        const response = await adminService.getAllGuarantorRequests({ status: 'accepted' });
        if (response.success && response.data?.requests) {
          const ids = response.data.requests
            .map((req) => {
              const guarantor = req.guarantor;
              if (!guarantor) return null;
              return typeof guarantor === 'object' ? guarantor._id : guarantor;
            })
            .filter(Boolean)
            .map((id) => id.toString());
          setActiveGuarantorIds([...new Set(ids)]);
        }
      } catch (error) {
        console.error('Error fetching guarantor requests:', error);
      }
    };
    fetchGuarantors();
  }, []);

  // Fetch users from API (Runs only once on mount)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllUsers({
          page: 1,
          limit: 1000, // Fetch all users
        });

        if (response.success && response.data) {
          setUsers(response.data.users || []);
        } else {
          toastUtils.error('Failed to fetch users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Combined client-side search and filtering for ultra-responsive, blink-free user experience
  useEffect(() => {
    let filtered = [...users];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Match special format "user-XXXXX"
      const userMatch = query.match(/^user-?([0-9a-fA-F]+)$/);
      const isCustomIdSearch = !!userMatch;
      const customIdSuffix = userMatch ? userMatch[1] : '';

      if (isCustomIdSearch) {
        filtered = filtered.filter((user) => {
          const id = (user._id || user.id || '').toString().toLowerCase();
          return id.endsWith(customIdSuffix);
        });
      } else {
        const keywords = query.split(/\s+/).filter(Boolean);
        filtered = filtered.filter((user) => {
          const name = (user.name || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const phone = (user.phone || '').toLowerCase();

          return keywords.every((keyword) =>
            name.includes(keyword) || email.includes(keyword) || phone.includes(keyword)
          );
        });
      }
    }

    // 2. Account Status Filter
    if (filters.accountStatus !== 'all') {
      filtered = filtered.filter((user) => {
        const accountStatus = user.accountStatus || 'active';
        return accountStatus === filters.accountStatus;
      });
    }

    // 3. KYC Status Filter
    if (filters.kycStatus !== 'all') {
      filtered = filtered.filter((user) => {
        const kycStatus = getKycStatus(user);
        return kycStatus === filters.kycStatus;
      });
    }

    // 4. User Type Filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter((user) => {
        const role = (user.role || 'user').toLowerCase();
        const userId = (user._id || user.id || '').toString();
        if (filters.userType === 'regular') {
          return role === 'user' || role === 'regular';
        }
        if (filters.userType === 'guarantor') {
          return activeGuarantorIds.includes(userId);
        }
        return role === filters.userType;
      });
    }

    // 6. Registration Date Filter
    if (filters.registrationDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter((user) => {
        const regDate = user.createdAt ? new Date(user.createdAt) : null;
        if (!regDate) return false;

        switch (filters.registrationDate) {
          case 'today':
            return regDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return regDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return regDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return regDate >= yearAgo;
          case 'custom':
            const start = filters.startDate ? new Date(filters.startDate) : null;
            const end = filters.endDate ? new Date(filters.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            
            if (start && end) {
              return regDate >= start && regDate <= end;
            } else if (start) {
              return regDate >= start;
            } else if (end) {
              return regDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filters, activeGuarantorIds]);

  // Handle user actions
  const handleUserAction = async (userId, action) => {
    try {
      const response = await adminService.updateUserStatus(userId, action);

      if (response.success) {
        toastUtils.success(`User ${action}ed successfully`);

        // Update user status locally
        setUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (getUserId(user) === userId) {
              return {
                ...user,
                accountStatus: response.data.user.accountStatus,
                isActive: response.data.user.isActive,
              };
            }
            return user;
          })
        );
      } else {
        toastUtils.error(response.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        const response = await adminService.deleteUser(userId);
        if (response.success) {
          toastUtils.success('User deleted successfully');
          // Remove the user from the state locally
          setUsers((prevUsers) => prevUsers.filter((user) => getUserId(user) !== userId));
        } else {
          toastUtils.error(response.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleAdjustCoinsClick = (user) => {
    setAdjustingUser(user);
    setShowAdjustCoinsModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleExport = () => {
    if (!users || users.length === 0) {
      alert('No users available to export.');
      return;
    }

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Age',
      'Gender',
      'Address',
      'Account Status',
      'KYC Status',
      'Profile Complete (%)',
      'Referral Code',
      'Registered At',
      'Last Login',
    ];

    const rows = users.map((user) => [
      user.name || user.fullName || '',
      user.email || '',
      user.phone || '',
      user.age || '',
      user.gender || '',
      user.address || '',
      user.isActive === false ? 'Suspended' : (user.isBanned ? 'Banned' : 'Active'),
      user.isKYCVerified ? 'Verified' : 'Pending',
      user.profileComplete || 0,
      user.referralCode || '',
      user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
      user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '',
    ]);

    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ];

    const csvContent = csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = `users-export-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      banned: 'bg-red-100 text-red-800',
      verified: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Stats calculation
  const stats = {
    total: users.length,
    active: users.filter((u) => u.accountStatus === 'active').length,
    suspended: users.filter((u) => u.accountStatus === 'suspended').length,
    banned: users.filter((u) => u.accountStatus === 'banned').length,
    kycPending: users.filter((u) => getKycStatus(u) === 'pending').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-6 md:px-6 md:pt-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                User Management
              </h1>
              <p className="text-xs md:text-sm" style={{ color: colors.textSecondary }}>Manage all users and their accounts</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 max-w-4xl">
          <Card className="p-2 text-center">
            <div className="text-lg md:text-xl font-bold mb-0.5" style={{ color: colors.textPrimary }}>
              {stats.total}
            </div>
            <div className="text-xs" style={{ color: colors.textSecondary }}>Total Users</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="text-lg md:text-xl font-bold mb-0.5 text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="text-lg md:text-xl font-bold mb-0.5 text-yellow-600">{stats.suspended}</div>
            <div className="text-xs text-gray-600">Suspended</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="text-lg md:text-xl font-bold mb-0.5 text-red-600">{stats.banned}</div>
            <div className="text-xs text-gray-600">Banned</div>
          </Card>
          <Card className="p-2 text-center">
            <div className="text-lg md:text-xl font-bold mb-0.5 text-orange-600">{stats.kycPending}</div>
            <div className="text-xs text-gray-600">KYC Pending</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-3 md:p-4 mb-4">
          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <svg
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: `1px solid ${colors.borderMedium}`,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary
                }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Account Status Filter */}
            <AdminCustomSelect
              label="Account Status"
              value={filters.accountStatus}
              onChange={(value) => setFilters({ ...filters, accountStatus: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Banned', value: 'banned' },
              ]}
            />

            {/* KYC Status Filter */}
            <AdminCustomSelect
              label="KYC Status"
              value={filters.kycStatus}
              onChange={(value) => setFilters({ ...filters, kycStatus: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Verified', value: 'verified' },
                { label: 'Pending', value: 'pending' },
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
              ]}
            />

            {/* Registration Date Filter */}
            <AdminCustomSelect
              label="Registered"
              value={filters.registrationDate}
              onChange={(value) => setFilters({ ...filters, registrationDate: value })}
              options={[
                { label: 'All Time', value: 'all' },
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
                { label: 'This Year', value: 'year' },
                { label: 'Custom Range', value: 'custom' },
              ]}
            />
          </div>

          {filters.registrationDate === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Users List */}
        <div className="mb-3">
          <p className="text-xs text-gray-600">
            Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
          </p>
        </div>

        <Card className="overflow-hidden p-0 border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">User</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Coins</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">KYC Status</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Account Status</th>
                  <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => {
                  const kycStatus = getKycStatus(user);
                  const accountStatus = user.accountStatus || 'active';
                  
                  return (
                    <tr 
                      key={user._id || user.id} 
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                      onClick={() => handleViewUser(user)}
                    >
                      {/* User Column (Avatar & Name/Email) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-inner"
                            style={{ backgroundColor: colors.backgroundTertiary }}
                          >
                            {user.profilePhoto ? (
                              <img src={user.profilePhoto} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-xs">{getFirstChar(user.name || user.email || 'U')}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {user.name || 'No Name'}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {user.email || 'No Email'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-medium">
                          {user.phone || '—'}
                        </span>
                      </td>

                      {/* Coins Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustCoinsClick(user);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-yellow-800 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors shadow-sm cursor-pointer"
                          title="Click to adjust coins"
                        >
                          🪙 {Math.floor(user.points || 0)}
                        </button>
                      </td>

                      {/* KYC Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(kycStatus)}`}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
                          KYC: {capitalize(kycStatus)}
                        </span>
                      </td>

                      {/* Account Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(accountStatus)}`}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
                          {capitalize(accountStatus)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          {accountStatus === 'active' ? (
                            <button
                              onClick={() => handleUserAction(getUserId(user), 'suspend')}
                              className="px-3 py-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(getUserId(user), 'activate')}
                              className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleUserAction(getUserId(user), 'ban')}
                            className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          >
                            Ban
                          </button>
                          <button
                            onClick={() => handleViewUser(user)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: colors.backgroundTertiary }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteUser(getUserId(user))}
                            className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                            title="Delete User"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredUsers.length === 0 && (
          <Card className="p-4 text-center">
            <p className="text-sm" style={{ color: colors.textSecondary }}>No users found matching your filters.</p>
          </Card>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg mt-4 shadow-sm">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                  <span className="font-semibold">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                        currentPage === page
                          ? 'z-10 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                      style={currentPage === page ? { backgroundColor: colors.backgroundTertiary } : {}}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          onAction={handleUserAction}
        />
      )}

      {/* Adjust Coins Modal */}
      {showAdjustCoinsModal && adjustingUser && (
        <AdjustCoinsModal
          user={adjustingUser}
          onClose={() => {
            setShowAdjustCoinsModal(false);
            setAdjustingUser(null);
          }}
          onSuccess={(updatedUser) => {
            // Update the user's coins in the local users list state
            setUsers((prevUsers) =>
              prevUsers.map((u) => (getUserId(u) === getUserId(updatedUser) ? updatedUser : u))
            );
            if (selectedUser && getUserId(selectedUser) === getUserId(updatedUser)) {
              setSelectedUser(updatedUser);
            }
          }}
        />
      )}
    </div>
  );
};

/**
 * User Detail Modal Component
 */
const UserDetailModal = ({ user, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch real booking and transaction data
  useEffect(() => {
    const fetchUserBookingAndPaymentData = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllBookings({ page: 1, limit: 1000 });
        if (response.success && response.data?.bookings) {
          const userId = user._id || user.id;
          // Filter bookings for this user
          const userBookings = response.data.bookings.filter(
            (b) => (b.user?._id || b.user || '').toString() === userId.toString()
          );
          setBookings(userBookings);

          // Extract transactions
          const userTxns = [];
          userBookings.forEach((b) => {
            if (b.transactions && Array.isArray(b.transactions)) {
              // Sort transactions by date ascending to determine the order of payments
              const sortedTxns = [...b.transactions].sort(
                (t1, t2) => new Date(t1.paymentDate || t1.createdAt || 0) - new Date(t2.paymentDate || t2.createdAt || 0)
              );
              
              sortedTxns.forEach((t, index) => {
                let paymentTypeLabel = '';
                if (b.paymentOption === 'advance') {
                  paymentTypeLabel = index === 0 ? 'Advance' : 'Balance';
                } else if (b.paymentOption === 'full') {
                  paymentTypeLabel = 'Full Payment';
                }

                userTxns.push({
                  ...t,
                  bookingId: b.bookingId,
                  carInfo: b.car ? `${b.car.brand} ${b.car.model}` : 'Unknown Car',
                  carReg: b.car?.registrationNumber || 'N/A',
                  paymentTypeLabel,
                });
              });
            }
          });
          // Sort transactions by paymentDate descending for the final display
          userTxns.sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0));
          setPayments(userTxns);
        }
      } catch (err) {
        console.error('Error fetching user bookings/payments:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserBookingAndPaymentData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
         className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
         onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-600">{user.email}</p>
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
        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {['profile', 'bookings', 'payments', 'kyc', 'referrals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 font-semibold text-xs transition-all duration-200 ${
                  activeTab === tab
                    ? 'border-b-2 font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 rounded-t-lg'
                }`}
                style={
                  activeTab === tab
                    ? { borderBottomColor: colors.backgroundTertiary, color: colors.backgroundTertiary }
                    : {}
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Name</label>
                    <p className="text-xs text-gray-900">{user.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <p className="text-xs text-gray-900">{user.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Phone</label>
                    <p className="text-xs text-gray-900">{user.phone || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700">User ID</label>
                    <p className="text-xs text-gray-900 font-mono">{formatUserId(user._id || user.id)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">KYC Status</label>
                    <p className="text-xs text-gray-900 capitalize">{getKycStatus(user)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Profile Completion</label>
                    <p className="text-xs text-gray-900">{user.profileCompletion || 0}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Registration Date</label>
                    <p className="text-xs text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Booking History</h3>
                  <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    Total Bookings: {bookings.length}
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-sm font-semibold">No bookings found for this user.</p>
                    <p className="text-xs text-gray-400 mt-1">This user hasn't made any bookings yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                          <tr>
                            <th className="px-5 py-3.5">Booking ID</th>
                            <th className="px-5 py-3.5">Car Details</th>
                            <th className="px-5 py-3.5">Dates & Duration</th>
                            <th className="px-5 py-3.5">Paid / Total Price</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-xs text-gray-700 bg-white">
                          {bookings.map((booking) => {
                            const statusColors = {
                              confirmed: 'bg-green-50 text-green-700 border border-green-200',
                              active: 'bg-blue-50 text-blue-700 border border-blue-200',
                              completed: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                              cancelled: 'bg-red-50 text-red-700 border border-red-200',
                              pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                              rejected: 'bg-red-50 text-red-700 border border-red-200',
                            };
                            const statusBg = statusColors[booking.status] || 'bg-gray-50 text-gray-700 border border-gray-200';

                            return (
                              <tr key={booking._id || booking.bookingId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4 font-bold text-gray-900 font-mono">
                                  {booking.bookingId || 'N/A'}
                                </td>
                                <td className="px-5 py-4">
                                  {booking.car ? (
                                    <div>
                                      <div className="font-semibold text-gray-900">{booking.car.brand} {booking.car.model}</div>
                                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{booking.car.registrationNumber || 'No Plate'}</div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </td>
                                <td className="px-5 py-4">
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {booking.tripStart?.date ? new Date(booking.tripStart.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                      <span className="text-gray-400 mx-1.5">→</span>
                                      {booking.tripEnd?.date ? new Date(booking.tripEnd.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                                      Duration: {booking.totalDays || 0} {booking.totalDays === 1 ? 'day' : 'days'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div>
                                    <div className="font-bold text-gray-950">₹{(booking.paidAmount || 0).toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">Total: ₹{(booking.pricing?.totalPrice || booking.totalPrice || 0).toLocaleString()}</div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBg}`}>
                                    {capitalize(booking.status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800">Transaction History</h3>
                  <span className="px-2.5 py-1 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-100">
                    Total Spent: ₹{payments.filter(p => p.status === 'success').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-sm font-semibold">No transactions found for this user.</p>
                    <p className="text-xs text-gray-400 mt-1">No transaction history is recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                          <tr>
                            <th className="px-5 py-3.5">Transaction ID</th>
                            <th className="px-5 py-3.5">Booking ID & Car</th>
                            <th className="px-5 py-3.5">Amount</th>
                            <th className="px-5 py-3.5">Method</th>
                            <th className="px-5 py-3.5">Date</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-xs text-gray-700 bg-white">
                          {payments.map((txn, index) => {
                            const statusColors = {
                              success: 'bg-green-50 text-green-700 border border-green-200',
                              pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                              failed: 'bg-red-50 text-red-700 border border-red-200',
                              cancelled: 'bg-red-50 text-red-700 border border-red-200',
                              refunded: 'bg-blue-50 text-blue-700 border border-blue-200',
                            };
                            const statusBg = statusColors[txn.status] || 'bg-gray-50 text-gray-700 border border-gray-200';
                            
                            const methodColors = {
                              phonepe: 'bg-purple-50 text-purple-700 border border-purple-200',
                              razorpay: 'bg-blue-50 text-blue-700 border border-blue-200',
                              cash: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                              online: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
                            };
                            const methodBg = methodColors[txn.paymentMethod] || 'bg-gray-50 text-gray-700 border border-gray-200';

                            return (
                              <tr key={txn.transactionId || index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4 font-bold text-gray-900 font-mono">
                                  {txn.transactionId || 'N/A'}
                                </td>
                                <td className="px-5 py-4">
                                  <div>
                                    <div className="font-semibold text-gray-900 font-mono">{txn.bookingId || 'N/A'}</div>
                                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">{txn.carInfo}</div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 font-bold text-gray-950">
                                  <div>₹{(txn.amount || 0).toLocaleString()}</div>
                                  {txn.paymentTypeLabel && (
                                    <div className="text-[10px] text-gray-500 font-medium mt-0.5">{txn.paymentTypeLabel}</div>
                                  )}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${methodBg}`}>
                                    {txn.paymentMethod || 'Razorpay'}
                                  </span>
                                  {txn.receivedBy && (
                                    <div className="text-[9px] text-gray-500 mt-0.5 font-medium">Recd by: {txn.receivedBy}</div>
                                  )}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-gray-500 font-medium">
                                  {txn.paymentDate ? new Date(txn.paymentDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBg}`}>
                                    {capitalize(txn.status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700">KYC Status: {capitalize(getKycStatus(user))}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar */}
                  <div className={`p-3 rounded-lg border ${user.kycDetails?.aadhaar?.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="text-xs font-bold mb-1">Aadhaar Card</h4>
                    <p className="text-xs text-gray-900">No: {user.kycDetails?.aadhaar?.number || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">Status: {user.kycDetails?.aadhaar?.verified ? 'Verified' : 'Not Verified'}</p>
                    {user.kycDetails?.aadhaar?.verifiedAt && <p className="text-[10px] text-gray-500">Date: {new Date(user.kycDetails.aadhaar.verifiedAt).toLocaleDateString()}</p>}
                    {user.kycDetails?.aadhaar?.image && (
                      <div className="mt-2 flex justify-center bg-white p-1 rounded border border-gray-200 shadow-sm">
                        <img src={user.kycDetails.aadhaar.image} alt="Aadhaar Document" className="max-h-24 object-contain rounded" />
                      </div>
                    )}
                  </div>

                  {/* PAN */}
                  <div className={`p-3 rounded-lg border ${user.kycDetails?.pan?.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="text-xs font-bold mb-1">PAN Card</h4>
                    <p className="text-xs text-gray-900">No: {user.kycDetails?.pan?.number || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">Status: {user.kycDetails?.pan?.verified ? 'Verified' : 'Not Verified'}</p>
                    {user.kycDetails?.pan?.verifiedAt && <p className="text-[10px] text-gray-500">Date: {new Date(user.kycDetails.pan.verifiedAt).toLocaleDateString()}</p>}
                    {user.kycDetails?.pan?.image && (
                      <div className="mt-2 flex justify-center bg-white p-1 rounded border border-gray-200 shadow-sm">
                        <img src={user.kycDetails.pan.image} alt="PAN Document" className="max-h-24 object-contain rounded" />
                      </div>
                    )}
                  </div>

                  {/* DL */}
                  <div className={`p-3 rounded-lg border ${user.kycDetails?.dl?.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="text-xs font-bold mb-1">Driving License</h4>
                    <p className="text-xs text-gray-900">No: {user.kycDetails?.dl?.number || 'N/A'}</p>
                    <p className="text-xs text-gray-900">DOB: {user.kycDetails?.dl?.dob || 'N/A'}</p>
                    <p className="text-[10px] text-gray-500">Status: {user.kycDetails?.dl?.verified ? 'Verified' : 'Not Verified'}</p>
                    {user.kycDetails?.dl?.verifiedAt && <p className="text-[10px] text-gray-500">Date: {new Date(user.kycDetails.dl.verifiedAt).toLocaleDateString()}</p>}
                    {user.kycDetails?.dl?.image && (
                      <div className="mt-2 flex justify-center bg-white p-1 rounded border border-gray-200 shadow-sm">
                        <img src={user.kycDetails.dl.image} alt="DL Document" className="max-h-24 object-contain rounded" />
                      </div>
                    )}
                  </div>

                  {/* Basic Verification */}
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <h4 className="text-xs font-bold mb-1">Basic Verification</h4>
                    <p className="text-[10px] text-gray-700">Phone: {user.isPhoneVerified ? '✅ Verified' : '❌ Pending'}</p>
                    <p className="text-[10px] text-gray-700">Email: {user.isEmailVerified ? '✅ Verified' : '❌ Pending'}</p>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'referrals' && (
              <div>
                <p className="text-xs text-gray-500">Referral details will be displayed here...</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Adjust Coins Modal Component
 */
const AdjustCoinsModal = ({ user, onClose, onSuccess }) => {
  const [type, setType] = useState('credit'); // credit, debit
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastUtils.error('Please enter a valid positive number');
      return;
    }

    if (!reason.trim()) {
      toastUtils.error('Please enter a reason for the adjustment');
      return;
    }

    if (type === 'debit' && (user.points || 0) < numAmount) {
      toastUtils.error(`Insufficient points. User only has 🪙${Math.floor(user.points || 0)} coins.`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminService.adjustUserPoints(user._id || user.id, {
        type,
        amount: numAmount,
        reason: reason.trim()
      });

      if (response.success) {
        toastUtils.success(response.message || `Successfully adjusted coins.`);
        onSuccess(response.data.user);
        onClose();
      } else {
        toastUtils.error(response.message || 'Failed to adjust coins');
      }
    } catch (err) {
      console.error('Error adjusting coins:', err);
      toastUtils.error(err.response?.data?.message || 'Failed to adjust coins');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 transform scale-100 transition-all duration-300 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <span>Adjust Guarantor Coins</span>
            </h2>
            <p className="text-[11px] text-purple-100 opacity-90 mt-0.5 font-medium">
              For {user.name || 'User'} ({formatUserId(user._id || user.id)})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current balance display */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs font-semibold text-yellow-800">Current Coins Balance</span>
            <span className="text-sm font-bold text-yellow-900 flex items-center gap-1">
              🪙 {Math.floor(user.points || 0)}
            </span>
          </div>

          {/* Type Selector (Credit/Debit tabs) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                  type === 'credit'
                    ? 'bg-white text-green-700 shadow-sm border border-green-100 font-extrabold'
                    : 'text-gray-600 hover:text-gray-955'
                }`}
              >
                🟢 Credit (+)
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                  type === 'debit'
                    ? 'bg-white text-red-700 shadow-sm border border-red-100 font-extrabold'
                    : 'text-gray-600 hover:text-gray-955'
                }`}
              >
                🔴 Debit (-)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Coins Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">🪙</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="Enter points (e.g. 50)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent font-semibold"
              />
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason / Remarks</label>
            <textarea
              required
              rows="3"
              placeholder="e.g. Approved adjustment, Customer care correction, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
            ></textarea>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex gap-3 justify-end border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md ${
                type === 'credit'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm {type === 'credit' ? 'Credit' : 'Debit'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserListPage;

