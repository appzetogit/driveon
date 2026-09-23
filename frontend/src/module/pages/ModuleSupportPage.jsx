import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import toastUtils from '../../config/toast';
import supportService from '../../services/support.service';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import useInViewAnimation from '../hooks/useInViewAnimation';
import CustomSelect from '../components/common/CustomSelect';

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

// Ticket Item Component (separate component to use hooks properly)
const TicketItem = ({ ticket, index, onClick, categories }) => {
  const [ticketRef, isTicketInView] = useInViewAnimation({ threshold: 0.1 });

  return (
    <motion.div
      ref={ticketRef}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={isTicketInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
              {ticket.subject}
            </h3>
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)} text-white flex-shrink-0`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 mb-1">
            <span className="font-mono font-medium" style={{ color: colors.textPrimary }}>
              {ticket.token}
            </span>
            <span>•</span>
            <span>{categories.find(c => c.value === ticket.category)?.label}</span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {ticket.description}
          </p>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(ticket.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * ModuleSupportPage Component
 * Ticket-based user support system for module
 * Users can create support tickets with unique tokens
 * View ticket history and add messages
 * Matches module theme styling
 */
const ModuleSupportPage = () => {
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

  // Load ticket details function
  const loadTicketDetails = useCallback(async (ticketId) => {
    if (!ticketId) return;

    try {
      const response = await supportService.getTicketById(ticketId);

      if (response && response.success && response.data && response.data.ticket) {
        setSelectedTicket(response.data.ticket);
      } else {
        toastUtils.error('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to load ticket details');
    }
  }, []);

  // Load tickets function
  const loadTickets = useCallback(async (shouldUpdateSelectedTicket = false) => {
    const userId = user?.id || user?._id;

    if (!userId) return;

    try {
      setLoading(true);
      const response = await supportService.getUserTickets();

      if (response && response.success && response.data && response.data.tickets) {
        setTickets(response.data.tickets);

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
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id]);

  // Load tickets on mount
  useEffect(() => {
    const userId = user?.id || user?._id;

    if (userId) {
      loadTickets();

      // Auto-refresh tickets every 30 seconds
      const interval = setInterval(() => {
        loadTickets(true);
      }, 30000);

      return () => clearInterval(interval);
    } else {
      const retryTimer = setTimeout(() => {
        const retryUserId = user?.id || user?._id;
        if (retryUserId) {
          loadTickets();
        }
      }, 500);

      return () => clearTimeout(retryTimer);
    }
  }, [loadTickets]);

  // Auto-refresh selected ticket details
  useEffect(() => {
    if (selectedTicket && selectedTicket.id) {
      const interval = setInterval(() => {
        loadTicketDetails(selectedTicket.id);
      }, 20000);

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

  const iconBgColor = colors.backgroundPrimary || '#F1F2F4';

  // Scroll-based animation refs
  const [formRef, isFormInView] = useInViewAnimation({ threshold: 0.1 });
  const [ticketDetailRef, isTicketDetailInView] = useInViewAnimation({ threshold: 0.1 });

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <ProfileHeader title="Help & Support" showBack />

      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div
          className="bg-white border-b border-gray-200 sticky top-[60px] z-30"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <div className="px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setActiveTab('new');
                  setSelectedTicket(null);
                }}
                className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === 'new'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                style={activeTab === 'new' ? { borderBottomColor: colors.textPrimary, color: colors.textPrimary } : {}}
              >
                New Ticket
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setSelectedTicket(null);
                }}
                className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === 'history'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                style={activeTab === 'history' ? { borderBottomColor: colors.textPrimary, color: colors.textPrimary } : {}}
              >
                Ticket History {tickets.length > 0 && `(${tickets.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-3 md:py-4 lg:py-6">
          {activeTab === 'new' ? (
            /* New Ticket Form */
            <motion.div
              ref={formRef}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-3"
              initial={{ opacity: 0, y: 20 }}
              animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-base font-bold mb-3" style={{ color: colors.textPrimary }}>
                Create New Support Ticket
              </h2>

              <form onSubmit={handleCreateTicket} className="space-y-3">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.textPrimary}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: colors.textSecondary }}
                  >
                    Category
                  </label>
                  <CustomSelect
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={categories.map((cat) => ({
                      label: cat.label,
                      value: cat.value,
                    }))}
                    placeholder="Select category"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors resize-none"
                    style={{
                      borderColor: '#e5e7eb',
                      color: colors.textPrimary,
                    }}
                    onFocus={(e) => e.target.style.borderColor = colors.textPrimary}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    placeholder="Please provide detailed information about your issue..."
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.textPrimary }}
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Ticket History */
            <div className="space-y-3">
              {selectedTicket ? (
                /* Ticket Detail View */
                <motion.div
                  ref={ticketDetailRef}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isTicketDetailInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Ticket Header */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                            {selectedTicket.subject}
                          </h2>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)} text-white`}>
                            {selectedTicket.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Token Section */}
                        <div className="bg-gray-50 rounded-lg p-2.5 mb-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-600 mb-0.5">Support Ticket Token</p>
                              <p className="text-sm font-mono font-bold" style={{ color: colors.textPrimary }}>
                                {selectedTicket.token}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyToken(selectedTicket.token)}
                              className="px-3 py-1.5 rounded-lg font-medium text-xs text-white hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: colors.textPrimary }}
                            >
                              Copy Token
                            </button>
                          </div>
                        </div>

                        {/* Ticket Information Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Category</p>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Status</p>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {selectedTicket.status.replace('_', ' ').toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Created Date</p>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {new Date(selectedTicket.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Last Updated</p>
                            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                              {new Date(selectedTicket.updatedAt).toLocaleString()}
                            </p>
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      Description
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>

                  {/* Messages Section */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                      <h3 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Messages ({selectedTicket.messages.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedTicket.messages.map((message, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg ${message.sender === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-200'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                {message.sender === 'admin' ? 'Admin' : 'You'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Message Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      Add Message
                    </h3>
                    <div className="space-y-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors resize-none"
                        style={{
                          borderColor: '#e5e7eb',
                          color: colors.textPrimary,
                        }}
                        onFocus={(e) => e.target.style.borderColor = colors.textPrimary}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        placeholder="Type your message here..."
                      />
                      <button
                        onClick={() => handleAddMessage(selectedTicket.id)}
                        disabled={loading || !newMessage.trim()}
                        className="w-full px-4 py-2 rounded-lg font-semibold text-sm text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.textPrimary }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Ticket List */
                <div className="space-y-2">
                  {loading && tickets.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm">Loading tickets...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                      <p className="text-gray-500 text-sm">No tickets found. Create a new ticket to get started.</p>
                    </div>
                  ) : (
                    tickets.map((ticket, index) => (
                      <TicketItem
                        key={ticket.id}
                        ticket={ticket}
                        index={index}
                        categories={categories}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};


export default ModuleSupportPage;

