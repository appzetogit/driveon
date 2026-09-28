import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';

const AdminNotificationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('send'); // 'send' or 'history'

  // State for Role Notification Form
  const [roles, setRoles] = useState(['Customer', 'Driver', 'Telecaller']);
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // State for History Logs
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  // State for Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch unique roles and sent history logs
  useEffect(() => {
    fetchRoles();
    if (activeTab === 'history') {
      fetchHistory(1);
    }
  }, [activeTab]);

  const fetchRoles = async () => {
    try {
      const response = await adminService.getStaffRoles();
      if (response.success && response.data?.roles) {
        // If roles exist, merge and make unique
        const dbRoles = response.data.roles;
        const combinedRoles = [...new Set(['Customer', ...dbRoles, 'Driver', 'Telecaller'])];
        setRoles(combinedRoles);
        if (combinedRoles.length > 0 && !selectedRole) {
          setSelectedRole(combinedRoles[0]);
        }
      } else {
        const defaultRoles = ['Customer', 'Driver', 'Telecaller'];
        setRoles(defaultRoles);
        if (!selectedRole && defaultRoles.length > 0) {
          setSelectedRole(defaultRoles[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff roles:', error);
      const defaultRoles = ['Customer', 'Driver', 'Telecaller'];
      setRoles(defaultRoles);
      if (!selectedRole && defaultRoles.length > 0) {
        setSelectedRole(defaultRoles[0]);
      }
    }
  };

  const fetchHistory = async (pageNum = 1) => {
    try {
      setHistoryLoading(true);
      const response = await adminService.getSentNotifications({ page: pageNum, limit: 10 });
      if (response.success && response.data) {
        setHistory(response.data.notifications || []);
        setPage(response.data.pagination?.page || 1);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalNotifications(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch sent notifications history:', error);
      toastUtils.error('Failed to load notification history logs');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Form Submission
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      toastUtils.error('Please select a target role');
      return;
    }
    if (!title.trim() || !message.trim()) {
      toastUtils.error('Title and message are required');
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('role', selectedRole);
      formData.append('title', title.trim());
      formData.append('message', message.trim());

      const response = await adminService.sendRoleNotification(formData);
      if (response.success) {
        toastUtils.success(response.message || 'Notification broadcasted successfully!');
        // Reset form
        setTitle('');
        setMessage('');
      } else {
        toastUtils.error(response.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toastUtils.error(error.response?.data?.message || 'Server error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-6 pb-6 md:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-2">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ color: colors.textSecondary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.backgroundLight}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Go back to dashboard"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: colors.backgroundTertiary }}>
                Notification Management
              </h1>
            </div>
            <p className="text-sm md:text-base ml-12 md:ml-14" style={{ color: colors.textSecondary }}>
              Broadcast customized push notifications with optional image attachments to employee roles
            </p>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex border-b mb-6" style={{ borderColor: colors.borderMedium }}>
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-3 font-semibold transition-all relative ${activeTab === 'send'
                ? 'text-white border-b-2'
                : 'text-gray-400 hover:text-white'
              }`}
            style={{
              borderColor: activeTab === 'send' ? colors.backgroundTertiary : 'transparent',
              color: activeTab === 'send' ? colors.backgroundTertiary : undefined
            }}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all relative ${activeTab === 'history'
                ? 'text-white border-b-2'
                : 'text-gray-400 hover:text-white'
              }`}
            style={{
              borderColor: activeTab === 'history' ? colors.backgroundTertiary : 'transparent',
              color: activeTab === 'history' ? colors.backgroundTertiary : undefined
            }}
          >
            History Logs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'send' ? (
          <div className="max-w-4xl">

            {/* Main Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                Compose Notification Broadcast
              </h2>
              <form onSubmit={handleSendNotification} className="space-y-6">

                {/* Role Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Recipient Target Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                  >
                    <option value="" disabled>Select target staff role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                    Message Body
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification details..."
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                    required
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Broadcasting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        ) : (

          /* History Logs Table */
          <Card className="p-6 overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
                  Broadcast Logs ({totalNotifications})
                </h2>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}
                  title="Notifications are automatically removed after 3 days via MongoDB TTL"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Auto-deletes after 3 days (TTL)
                </span>
              </div>
              <button
                onClick={() => fetchHistory(1)}
                className="p-2 bg-gray-100/5 hover:bg-gray-100/15 border border-gray-100/10 rounded-lg text-sm transition-all"
                title="Refresh history logs"
              >
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.228 9H18.06" />
                </svg>
              </button>
            </div>

            {historyLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: colors.backgroundTertiary }}></div>
                <p style={{ color: colors.textSecondary }}>Loading history logs...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-lg" style={{ borderColor: colors.borderMedium }}>
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>No broadcast logs found</p>
                <p className="text-sm text-gray-400 mt-1">Logs are automatically retained for 3 days before being cleared</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderBottomColor: colors.borderMedium }}>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Target Role</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Recipient</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Title</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Message</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Image</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-400">Sent Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((notif) => (
                      <tr
                        key={notif.id}
                        className="border-b hover:bg-white/5 transition-colors"
                        style={{ borderBottomColor: colors.borderMedium }}
                      >
                        <td className="py-4 px-4 text-sm font-medium">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: colors.backgroundLight,
                              color: colors.textPrimary
                            }}
                          >
                            {notif.recipient?.role || 'Staff'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div style={{ color: colors.textPrimary }}>{notif.recipient?.name || 'Unknown Staff'}</div>
                          <div className="text-xs text-gray-400">{notif.recipient?.phone || ''}</div>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {notif.title}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-300 max-w-xs truncate" title={notif.message}>
                          {notif.message}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {notif.image ? (
                            <img
                              src={notif.image}
                              alt="Attachment log thumbnail"
                              onClick={() => setLightboxImage(notif.image)}
                              className="w-10 h-10 object-cover rounded cursor-pointer border hover:opacity-80 transition-all bg-black/10"
                              style={{ borderColor: colors.borderMedium }}
                            />
                          ) : (
                            <span className="text-xs text-gray-500">None</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          <span className="block text-xs text-gray-500">
                            {new Date(notif.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages >= 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <span className="text-sm text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => {
                          if (page > 1) {
                            fetchHistory(page - 1);
                          }
                        }}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm bg-gray-100/5 border border-gray-100/10 hover:bg-gray-100/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>

                      {/* Numeric page buttons */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        // Show first page, last page, current page, and pages immediately adjacent to current page
                        if (
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1
                        ) {
                          return (
                            <button
                              key={p}
                              onClick={() => fetchHistory(p)}
                              className={`px-3 py-1.5 text-sm border rounded-lg transition-all font-semibold ${page === p
                                  ? 'text-white border-transparent font-bold shadow-md shadow-indigo-900/10'
                                  : 'text-gray-400 border-gray-100/10 hover:bg-gray-100/10 hover:text-white'
                                }`}
                              style={page === p ? { backgroundColor: colors.backgroundTertiary } : {}}
                            >
                              {p}
                            </button>
                          );
                        }

                        // Show ellipsis if there's a gap
                        if (
                          (p === 2 && page > 3) ||
                          (p === totalPages - 1 && page < totalPages - 2)
                        ) {
                          return (
                            <span key={`ellipsis-${p}`} className="text-gray-500 px-1 select-none">
                              ...
                            </span>
                          );
                        }

                        return null;
                      })}

                      <button
                        onClick={() => {
                          if (page < totalPages) {
                            fetchHistory(page + 1);
                          }
                        }}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm bg-gray-100/5 border border-gray-100/10 hover:bg-gray-100/10 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

      </div>

      {/* Lightbox / Modal View */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Notification attachment lightbox preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mx-auto"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
              title="Close overlay"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotificationsPage;
