import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import Card from '../../../components/common/Card';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const ADMIN_PERMISSIONS_LIST = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'guarantors', label: 'Guarantors' },
  { id: 'cars', label: 'Cars' },
  { id: 'add-outward-car', label: 'Add Outward Car' },
  { id: 'online-cars', label: 'Online Booking Cars' },
  { id: 'fleet-inward', label: 'Fleet: Inward Cars' },
  { id: 'fleet-inward-bookings', label: 'Fleet: Inward Bookings' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'driver-assignment', label: 'Driver Assign' },
  { id: 'payments', label: 'Payments' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'offers', label: 'Offers' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'addon-services', label: 'Add on Services' },
  { id: 'support', label: 'Support' },
  { id: 'privacy-policy', label: 'Privacy Policy' },
  { id: 'terms-conditions', label: 'Terms & Conditions' },
  { id: 'cancellation-refund', label: 'Cancellation & Refund' },
  { id: 'settings', label: 'Settings' }
];

const CRM_PERMISSIONS_LIST = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'enquiries-all', label: 'All Enquiries' },
  { id: 'enquiries-new', label: 'New Enquiries' },
  { id: 'enquiries-in-progress', label: 'In Progress Enquiries' },
  { id: 'enquiries-converted', label: 'Converted Enquiries' },
  { id: 'enquiries-closed', label: 'Closed Enquiries' },
  { id: 'staff-directory', label: 'Staff Directory' },
  { id: 'staff-roles', label: 'Roles & Designation' },
  { id: 'staff-attendance', label: 'Attendance Tracker' },
  { id: 'staff-attendance-settings', label: 'Attendance Settings' },
  { id: 'staff-salary', label: 'Salary Management' },
  { id: 'garage-all', label: 'All Garages' },
  { id: 'garage-active', label: 'Active Repairs' },
  { id: 'vendors-all', label: 'All Vendors' },
  { id: 'policies-privacy', label: 'Employee Privacy Policy' },
  { id: 'policies-terms', label: 'Employee Terms' },
  { id: 'expenses-track', label: 'Track Expenses' },
  { id: 'expenses-categories', label: 'Categories' },
  { id: 'driver-record', label: 'Driver Record' }
];

const SubAdminsPage = () => {
  const navigate = useNavigate();
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'crm'

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: []
  });

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubAdmins();
      if (res.success && res.data?.subadmins) {
        setSubadmins(res.data.subadmins);
      }
    } catch (err) {
      console.error(err);
      toastUtils.error('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      permissions: []
    });
    setEditingId(null);
    setActiveTab('admin');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (subadmin) => {
    setModalMode('edit');
    setFormData({
      name: subadmin.name || '',
      email: subadmin.email || '',
      phone: subadmin.phone || '',
      password: '', // leave empty unless changing
      permissions: subadmin.permissions || []
    });
    setEditingId(subadmin.id || subadmin._id);
    setActiveTab('admin');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleTogglePermission = (permissionKey) => {
    setFormData(prev => {
      const perms = [...prev.permissions];
      if (perms.includes(permissionKey)) {
        return { ...prev, permissions: perms.filter(p => p !== permissionKey) };
      } else {
        return { ...prev, permissions: [...perms, permissionKey] };
      }
    });
  };

  const handleSelectAllInTab = (tab) => {
    const list = tab === 'admin' ? ADMIN_PERMISSIONS_LIST : CRM_PERMISSIONS_LIST;
    const prefix = tab === 'admin' ? 'admin:' : 'crm:';
    
    setFormData(prev => {
      // Find all permissions from this tab
      const otherPerms = prev.permissions.filter(p => !p.startsWith(prefix));
      const hasAll = list.every(item => prev.permissions.includes(`${prefix}${item.id}`));

      if (hasAll) {
        // Deselect all
        return { ...prev, permissions: otherPerms };
      } else {
        // Select all
        const tabPerms = list.map(item => `${prefix}${item.id}`);
        return { ...prev, permissions: [...otherPerms, ...tabPerms] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toastUtils.error('Please fill in Name, Email, and Phone number');
      return;
    }
    if (modalMode === 'create' && !formData.password) {
      toastUtils.error('Password is required for new sub-admins');
      return;
    }

    try {
      if (modalMode === 'create') {
        const res = await adminService.createSubAdmin(formData);
        if (res.success) {
          toastUtils.success('Sub-Admin created successfully');
          setShowModal(false);
          fetchSubAdmins();
        }
      } else {
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          permissions: formData.permissions
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const res = await adminService.updateSubAdmin(editingId, updateData);
        if (res.success) {
          toastUtils.success('Sub-Admin updated successfully');
          setShowModal(false);
          fetchSubAdmins();
        }
      }
    } catch (err) {
      console.error(err);
      toastUtils.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin?')) return;
    try {
      const res = await adminService.deleteSubAdmin(id);
      if (res.success) {
        toastUtils.success('Sub-Admin deleted successfully');
        fetchSubAdmins();
      }
    } catch (err) {
      console.error(err);
      toastUtils.error('Failed to delete sub-admin');
    }
  };

  const handleToggleStatus = async (subadmin) => {
    const id = subadmin.id || subadmin._id;
    try {
      const res = await adminService.updateSubAdmin(id, { isActive: !subadmin.isActive });
      if (res.success) {
        toastUtils.success(`Sub-Admin ${subadmin.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchSubAdmins();
      }
    } catch (err) {
      console.error(err);
      toastUtils.error('Failed to change status');
    }
  };

  const isTabAllSelected = (tab) => {
    const list = tab === 'admin' ? ADMIN_PERMISSIONS_LIST : CRM_PERMISSIONS_LIST;
    const prefix = tab === 'admin' ? 'admin:' : 'crm:';
    return list.every(item => formData.permissions.includes(`${prefix}${item.id}`));
  };

  if (loading && subadmins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.backgroundTertiary }}></div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-6 lg:pt-8 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/profile')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Go to profile"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                Sub-Admin Management
              </h1>
            </div>
            <p className="text-gray-500 ml-12 text-sm">Create and manage sub-admins and their application permissions</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2 rounded-xl text-white font-semibold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md ml-12 sm:ml-0"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Sub-Admin
          </button>
        </div>

        {/* Sub-Admins Table Card */}
        <Card className="overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200" style={{ color: colors.textSecondary }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Permissions Granted</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white" style={{ color: colors.textPrimary }}>
                {subadmins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      No sub-admins found. Click "Add Sub-Admin" to create one.
                    </td>
                  </tr>
                ) : (
                  subadmins.map((sub) => {
                    const adminPermCount = sub.permissions.filter(p => p.startsWith('admin:')).length;
                    const crmPermCount = sub.permissions.filter(p => p.startsWith('crm:')).length;
                    return (
                      <tr key={sub.id || sub._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold">{sub.name}</td>
                        <td className="px-6 py-4 text-sm">{sub.email}</td>
                        <td className="px-6 py-4 text-sm">{sub.phone}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mr-2 border border-blue-100">
                            Admin ({adminPermCount})
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            CRM ({crmPermCount})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleToggleStatus(sub)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                              sub.isActive 
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {sub.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Sub-Admin"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id || sub._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Sub-Admin"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: colors.borderMedium }}>
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                  {modalMode === 'create' ? 'Create New Sub-Admin' : 'Edit Sub-Admin Details'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Details Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: colors.borderMedium }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="subadmin@example.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: colors.borderMedium }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: colors.borderMedium }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: colors.textSecondary }}>
                      Password {modalMode === 'edit' && <span className="text-xs font-normal text-gray-500">(Leave blank to keep same)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={modalMode === 'create'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ borderColor: colors.borderMedium }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Permissions Segment */}
                <div>
                  <label className="block text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
                    Assign Module Permissions
                  </label>

                  {/* Tab Selector */}
                  <div className="flex border-b mb-4" style={{ borderColor: colors.borderMedium }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin')}
                      className={`px-6 py-2.5 font-semibold text-sm border-b-2 transition-all -mb-px ${
                        activeTab === 'admin'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      style={activeTab === 'admin' ? { borderBottomColor: colors.backgroundTertiary, color: colors.backgroundTertiary } : {}}
                    >
                      Admin Panel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('crm')}
                      className={`px-6 py-2.5 font-semibold text-sm border-b-2 transition-all -mb-px ${
                        activeTab === 'crm'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      style={activeTab === 'crm' ? { borderBottomColor: colors.backgroundTertiary, color: colors.backgroundTertiary } : {}}
                    >
                      CRM Panel
                    </button>
                  </div>

                  {/* Select All Row */}
                  <div className="flex justify-between items-center mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-600 font-semibold uppercase">
                      {activeTab === 'admin' ? 'Admin Portal Pages' : 'CRM Portal Pages'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllInTab(activeTab)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      style={{ color: colors.backgroundTertiary }}
                    >
                      {isTabAllSelected(activeTab) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(activeTab === 'admin' ? ADMIN_PERMISSIONS_LIST : CRM_PERMISSIONS_LIST).map((perm) => {
                      const prefix = activeTab === 'admin' ? 'admin:' : 'crm:';
                      const isChecked = formData.permissions.includes(`${prefix}${perm.id}`);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(`${prefix}${perm.id}`)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-800">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer / Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: colors.borderMedium }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: colors.borderMedium }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl text-white font-semibold hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    {modalMode === 'create' ? 'Create' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubAdminsPage;
