import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { theme } from '../../theme/theme.constants';
import toastUtils from '../../config/toast';
import supportService from '../../services/support.service';

/**
 * SupportPage Component
 * Token-based user support system
 * Users can create support tickets with unique tokens
 * View ticket history and add messages
 * Mobile and web responsive
 */
const SupportPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);

  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state for new ticket
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Message state for existing tickets
  const [newMessage, setNewMessage] = useState('');

  // Load ticket details function - defined first
  const loadTicketDetails = useCallback(async (ticketId) => {
    console.log('loadTicketDetails called with ticketId:', ticketId);
    if (!ticketId) {
      console.error('No ticket ID provided');
      return;
    }

    try {
      console.log('Fetching ticket details from API for ticketId:', ticketId);
      const response = await supportService.getTicketById(ticketId);
      console.log('Ticket details response:', response);

      if (response && response.success && response.data && response.data.ticket) {
        console.log('Setting selected ticket:', response.data.ticket);
        setSelectedTicket(response.data.ticket);
        console.log('Selected ticket set successfully');
      } else {
        console.error('Invalid response structure:', response);
        toastUtils.error('Failed to load ticket details - invalid response');
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toastUtils.error(error.response?.data?.message || 'Failed to load ticket details');
    }
  }, []);

  // Load tickets function - using useCallback to memoize
  const loadTickets = useCallback(async (shouldUpdateSelectedTicket = false) => {
    console.log('loadTickets function called');
    const userId = user?.id || user?._id;

    if (!userId) {
      console.log('No user ID available, cannot load tickets');
      return;
    }

    try {
      console.log('Setting loading to true');
      setLoading(true);
      console.log('Calling supportService.getUserTickets()...');
      const response = await supportService.getUserTickets();
      console.log('Tickets API response received:', response);

      if (response && response.success && response.data && response.data.tickets) {
        console.log('Tickets found:', response.data.tickets.length);
        setTickets(response.data.tickets);

        // Only update selected ticket if explicitly requested (e.g., after adding a message)
        if (shouldUpdateSelectedTicket) {
          setSelectedTicket(prevTicket => {
            if (prevTicket) {
              const updatedTicket = response.data.tickets.find(t => t.id === prevTicket.id);
              return updatedTicket || prevTicket;
            }
            return prevTicket;
          });
        }
      } else {
        console.log('No tickets in response or invalid structure:', response);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      console.error('Error response:', error.response?.data);
      toastUtils.error(error.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id]);

  // Load tickets from backend - run when user ID changes or component mounts
  useEffect(() => {
    const userId = user?.id || user?._id;
    console.log('SupportPage useEffect triggered, userId:', userId, 'user:', user);

    if (userId) {
      console.log('User ID exists, loading tickets immediately...');
      // Load tickets immediately
      loadTickets();

      // Auto-refresh tickets every 30 seconds to get status updates from admin
      const interval = setInterval(() => {
        console.log('Auto-refreshing tickets...');
        loadTickets(true); // Update selected ticket on auto-refresh
      }, 30000); // 30 seconds

      return () => {
        console.log('Cleaning up interval');
        clearInterval(interval);
      };
    } else {
      console.log('No user ID found, will retry when user is available...');
      // Retry after a short delay if user is not available yet
      const retryTimer = setTimeout(() => {
        const retryUserId = user?.id || user?._id;
        if (retryUserId) {
          console.log('User ID now available, loading tickets...');
          loadTickets();
        }
      }, 500); // Retry after 500ms

      return () => clearTimeout(retryTimer);
    }
  }, [loadTickets]); // Only depend on loadTickets function

  // Auto-refresh selected ticket details every 20 seconds if a ticket is selected
  useEffect(() => {
    if (selectedTicket && selectedTicket.id) {
      const interval = setInterval(() => {
        loadTicketDetails(selectedTicket.id);
      }, 20000); // 20 seconds

      return () => clearInterval(interval);
    }
  }, [selectedTicket?.id, loadTicketDetails]);

  // Create new support ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      toastUtils.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await supportService.createTicket({
        subject: subject.trim(),
        category,
        description: description.trim(),
        priority,
      });

      if (response.success && response.data?.ticket) {
        toastUtils.success(`Support ticket created! Token: ${response.data.ticket.token}`);

        // Reset form
        setSubject('');
        setCategory('general');
        setDescription('');
        setPriority('medium');

        // Reload tickets and switch to history
        await loadTickets();
        setActiveTab('history');

        // Load and select the new ticket
        if (response.data.ticket.id) {
          await loadTicketDetails(response.data.ticket.id);
        }
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  // Add message to existing ticket
  const handleAddMessage = async (ticketId) => {
    if (!newMessage.trim()) {
      toastUtils.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      const response = await supportService.addMessage(ticketId, newMessage.trim());

      if (response.success) {
        toastUtils.success('Message sent successfully');
        setNewMessage('');

        // Reload ticket details to get updated messages
        await loadTicketDetails(ticketId);
        // Reload tickets list and update selected ticket
        await loadTickets(true);
      }
    } catch (error) {
      console.error('Error adding message:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Copy token to clipboard
  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    toastUtils.success('Token copied to clipboard!');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Handle back button click
  const handleBackClick = () => {
    // If a ticket is selected, go back to ticket list first
    if (selectedTicket) {
      setSelectedTicket(null);
    } else {
      // Otherwise, navigate back to previous page
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="text-white relative overflow-hidden sticky top-0 z-40" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  onClick={handleBackClick}
                  className="p-1.5 md:p-2 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Support</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] md:top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab('new');
                setSelectedTicket(null);
              }}
              className={`px-4 py-3 md:py-4 text-sm md:text-base font-medium transition-colors border-b-2 ${activeTab === 'new'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              style={activeTab === 'new' ? { borderBottomColor: theme.colors.primary, color: theme.colors.primary } : {}}
            >
              New Ticket
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setSelectedTicket(null);
              }}
              className={`px-4 py-3 md:py-4 text-sm md:text-base font-medium transition-colors border-b-2 ${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              style={activeTab === 'history' ? { borderBottomColor: theme.colors.primary, color: theme.colors.primary } : {}}
            >
              Ticket History {tickets.length > 0 && `(${tickets.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {activeTab === 'new' ? (
          /* New Ticket Form */
          <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6" style={{ color: theme.colors.textPrimary }}>
              Create New Support Ticket
            </h2>

            <form onSubmit={handleCreateTicket} className="space-y-4 md:space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm md:text-base font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border text-sm md:text-base focus:outline-none transition-colors"
                  style={{
                    borderColor: theme.colors.borderDefault,
                    color: theme.colors.textPrimary,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm md:text-base font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border text-sm md:text-base focus:outline-none transition-colors"
                  style={{
                    borderColor: theme.colors.borderDefault,
                    color: theme.colors.textPrimary,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm md:text-base font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border text-sm md:text-base focus:outline-none transition-colors resize-none"
                  style={{
                    borderColor: theme.colors.borderDefault,
                    color: theme.colors.textPrimary,
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                  placeholder="Please provide detailed information about your issue..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl font-semibold text-sm md:text-base text-white shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Create Ticket
              </button>
            </form>
          </div>
        ) : (
          /* Ticket History */
          <div className="space-y-4 md:space-y-6">
            {selectedTicket ? (
              /* Ticket Detail View - Full Details */
              /* Ticket Detail View - Full Details */
              <div className="space-y-4 md:space-y-6">
                {/* Ticket Header */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                        <h2 className="text-lg md:text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
                          {selectedTicket.subject}
                        </h2>
                        <span className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${getStatusColor(selectedTicket.status)} text-white`}>
                          {selectedTicket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Token Section */}
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm text-gray-600 mb-1">Support Ticket Token</p>
                            <p className="text-base md:text-lg font-mono font-bold" style={{ color: theme.colors.primary }}>
                              {selectedTicket.token}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyToken(selectedTicket.token)}
                            className="px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: theme.colors.primary }}
                          >
                            Copy Token
                          </button>
                        </div>
                      </div>

                      {/* Ticket Information Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Category</p>
                          <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                            {categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Status</p>
                          <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                            {selectedTicket.status.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Created Date</p>
                          <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                            {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">Last Updated</p>
                          <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                            {new Date(selectedTicket.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>

                      {/* User Information */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">User Information</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Name</p>
                            <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                              {selectedTicket.userName || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Email/Phone</p>
                            <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                              {selectedTicket.userEmail || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
                      aria-label="Close ticket details"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description Section */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4" style={{ color: theme.colors.textPrimary }}>
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                    <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {/* Ticket Metadata */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4" style={{ color: theme.colors.textPrimary }}>
                    Ticket Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Ticket ID</p>
                      <p className="text-sm md:text-base font-mono font-medium" style={{ color: theme.colors.textPrimary }}>
                        {selectedTicket.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Total Messages</p>
                      <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                        {selectedTicket.messages?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Created At</p>
                      <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                        {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Last Updated</p>
                      <p className="text-sm md:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                        {new Date(selectedTicket.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Section */}
                <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
                    Conversation History
                  </h3>

                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                      {selectedTicket.messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 md:p-4 ${msg.sender === 'user'
                            ? 'bg-blue-50 border border-blue-100'
                            : 'bg-gray-50 border border-gray-200'
                            }`}>
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span className={`text-xs font-semibold ${msg.sender === 'user' ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                {msg.sender === 'user' ? 'You' : 'Support Team'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                            <p className="text-sm md:text-base text-gray-800 whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                      User has not started a conversation yet.
                    </div>
                  )}

                  {/* Add Message Form */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                      Reply to Ticket
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-sm md:text-base focus:outline-none transition-colors resize-none mb-3"
                      style={{
                        borderColor: theme.colors.borderDefault,
                      }}
                      onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.target.style.borderColor = theme.colors.borderDefault}
                      placeholder="Type your message here..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleAddMessage(selectedTicket.id)}
                        disabled={loading || !newMessage.trim()}
                        className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Ticket List */
              <div className="space-y-3 md:space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Ticket clicked:', ticket.id, ticket);
                      loadTicketDetails(ticket.id);
                    }}
                    className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-200 p-4 md:p-5 cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <h3 className="text-base md:text-lg font-semibold truncate" style={{ color: theme.colors.textPrimary }}>
                            {ticket.subject}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} text-white flex-shrink-0`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600 mb-2">
                          <span className="font-mono font-medium" style={{ color: theme.colors.primary }}>
                            {ticket.token}
                          </span>
                          <span>•</span>
                          <span>{categories.find(c => c.value === ticket.category)?.label}</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(ticket.updatedAt).toLocaleString('en-US', {
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;

