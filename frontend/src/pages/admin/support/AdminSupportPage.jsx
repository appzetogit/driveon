import { useState, useEffect } from 'react';
import { colors } from '../../../module/theme/colors';
import toastUtils from '../../../config/toast';
import supportService from '../../../services/support.service';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * AdminSupportPage Component
 * Admin panel for managing user support tickets
 * Based on document.txt and ADMIN_PANEL_PLAN.md
 * Frontend only - reads from localStorage where user tickets are stored
 */
const AdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Admin response
  const [adminMessage, setAdminMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Load all tickets from backend
  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, searchQuery, dateFilter, customStartDate, customEndDate]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      // Build filter params
      const params = {
        page: 1,
        limit: 100,
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
        console.log('AdminSupportPage - Status filter applied:', statusFilter);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
        console.log('AdminSupportPage - Category filter applied:', categoryFilter);
      }

      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
        console.log('AdminSupportPage - Search query applied:', searchQuery.trim());
      }

      if (dateFilter && dateFilter !== 'all') {
        params.dateFilter = dateFilter;
        if (dateFilter === 'custom') {
          if (customStartDate) params.customStartDate = customStartDate;
          if (customEndDate) params.customEndDate = customEndDate;
        }
        console.log('AdminSupportPage - Date filter applied:', dateFilter);
      }

      console.log('AdminSupportPage - Loading tickets with all filters:', params);

      const response = await supportService.getAllTickets(params);

      console.log('AdminSupportPage - Tickets response:', response);

      if (response.success && response.data) {
        const ticketsList = response.data.tickets || [];
        console.log('AdminSupportPage - Setting tickets:', ticketsList.length);
        setTickets(ticketsList);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        console.warn('AdminSupportPage - Invalid response structure:', response);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toastUtils.error(error.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId) => {
    try {
      const response = await supportService.getTicketByIdAdmin(ticketId);
      if (response.success && response.data?.ticket) {
        setSelectedTicket(response.data.ticket);
        setSelectedStatus(response.data.ticket.status);
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to load ticket details');
    }
  };

  // Filter tickets locally (backend already filters, but we can do additional client-side filtering if needed)
  useEffect(() => {
    console.log('AdminSupportPage - Updating filteredTickets, tickets count:', tickets.length);
    setFilteredTickets(tickets);
  }, [tickets]);

  // Update ticket status
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setLoading(true);
      const response = await supportService.updateTicketStatus(ticketId, newStatus);

      if (response.success) {
        toastUtils.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);

        // Update selectedStatus state
        setSelectedStatus(newStatus);

        // Reload tickets and selected ticket
        await loadTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          await loadTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update ticket status');
      // Revert selectedStatus on error
      if (selectedTicket) {
        setSelectedStatus(selectedTicket.status);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add admin response to ticket
  const handleAddResponse = async () => {
    if (!selectedTicket) return;

    if (!adminMessage.trim()) {
      toastUtils.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const response = await supportService.addAdminResponse(
        selectedTicket.id,
        adminMessage.trim(),
        selectedStatus || selectedTicket.status
      );

      if (response.success) {
        toastUtils.success('Response added successfully');
        setAdminMessage('');
        setSelectedStatus('');

        // Reload ticket details and tickets list
        await loadTicketDetails(selectedTicket.id);
        await loadTickets();
      }
    } catch (error) {
      console.error('Error adding response:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to add response');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-orange-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'booking', label: 'Booking Issue' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'kyc', label: 'KYC Verification' },
    { value: 'guarantor', label: 'Guarantor Related' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-4 pt-20 md:pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Support Tickets Management
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              View and manage all user support tickets
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 md:py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Total</p>
            <p className="text-xl md:text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {stats.total}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Open</p>
            <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.open}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">In Progress</p>
            <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Resolved</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Closed</p>
            <p className="text-xl md:text-2xl font-bold text-gray-600">{stats.closed}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-6 mb-6">
            <div className={`grid grid-cols-1 md:grid-cols-2 ${dateFilter === 'custom' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
              {/* Search */}
              <div className={`md:col-span-2 ${dateFilter === 'custom' ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by subject, token, user name, email..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                  style={{
                    borderColor: colors.borderMedium,
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.backgroundTertiary}
                  onBlur={(e) => e.target.style.borderColor = colors.borderMedium}
                />
              </div>

              {/* Status Filter */}
              <AdminCustomSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  ...statusOptions.map(opt => ({ value: opt.value, label: opt.label }))
                ]}
              />

              {/* Category Filter */}
              <AdminCustomSelect
                label="Category"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat.value, label: cat.label }))
                ]}
              />

              {/* Date Filter */}
              <AdminCustomSelect
                label="Date"
                value={dateFilter}
                onChange={(value) => setDateFilter(value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
              />

              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{ borderColor: colors.borderMedium }}
                      onFocus={(e) => e.target.style.borderColor = colors.backgroundTertiary}
                      onBlur={(e) => e.target.style.borderColor = colors.borderMedium}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base"
                      style={{ borderColor: colors.borderMedium }}
                      onFocus={(e) => e.target.style.borderColor = colors.backgroundTertiary}
                      onBlur={(e) => e.target.style.borderColor = colors.borderMedium}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 md:p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.backgroundTertiary }}></div>
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 md:p-12 text-center">
                <svg
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  No Support Tickets Found
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {tickets.length === 0
                    ? 'No support tickets have been created yet.'
                    : 'No tickets match your current filters.'}
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => loadTicketDetails(ticket.id)}
                  className={`bg-white rounded-lg shadow-md border p-4 md:p-5 cursor-pointer hover:shadow-lg transition-all ${selectedTicket?.id === ticket.id
                    ? 'ring-2'
                    : 'border-gray-200'
                    }`}
                  style={
                    selectedTicket?.id === ticket.id
                      ? { borderColor: colors.backgroundTertiary, ringColor: colors.backgroundTertiary }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-semibold truncate" style={{ color: colors.textPrimary }}>
                          {ticket.subject}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} text-white flex-shrink-0`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600 mb-2">
                        <span className="font-mono font-medium" style={{ color: colors.backgroundTertiary }}>
                          {ticket.token}
                        </span>
                        <span>•</span>
                        <span>{categories.find(c => c.value === ticket.category)?.label}</span>
                        <span>•</span>
                        <span>{ticket.userName}</span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(ticket.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-gray-200 bg-opacity-30 z-50 flex items-center justify-center p-4" onClick={() => {
            setSelectedTicket(null);
            setAdminMessage('');
            setSelectedStatus('');
          }}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  Ticket Details
                </h2>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setAdminMessage('');
                    setSelectedStatus('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Token and Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Ticket Token</p>
                    <p className="text-base font-mono font-bold" style={{ color: colors.backgroundTertiary }}>
                      {selectedTicket.token}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Subject</p>
                    <p className="text-base font-bold text-gray-800">
                      {selectedTicket.subject}
                    </p>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <AdminCustomSelect
                    label="Update Status"
                    value={selectedStatus || selectedTicket.status}
                    onChange={(value) => {
                      const newStatus = value;
                      setSelectedStatus(newStatus);
                      handleUpdateStatus(selectedTicket.id, newStatus);
                    }}
                    options={statusOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                    className={loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                  />
                </div>

                {/* User Information */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">User Information</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="font-medium">{selectedTicket.userName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{selectedTicket.userEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>{' '}
                      <span className="font-medium">{selectedTicket.userPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Ticket Information</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Category:</span>{' '}
                      <span className="font-medium">
                        {categories.find(c => c.value === selectedTicket.category)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedTicket.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Description</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>




              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPage;

