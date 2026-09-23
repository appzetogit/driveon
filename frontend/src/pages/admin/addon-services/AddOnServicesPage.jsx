import { useState, useEffect } from 'react';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import toastUtils from '../../../config/toast';
import { adminService } from '../../../services/admin.service';

/**
 * Add-on Services Management Page (Admin)
 * Dynamic management for add-on services and their service providers (e.g., Drivers).
 */
const AddOnServicesPage = () => {
  const [services, setServices] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modals state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ name: '', description: '', price: '', singleUnitOnly: false });

  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editServiceData, setEditServiceData] = useState({ id: '', name: '', description: '', price: '', singleUnitOnly: false });

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showViewProviderModal, setShowViewProviderModal] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [newProviderData, setNewProviderData] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAddOnServices();
      if (response.success && response.data) {
        setServices(response.data);
        
        // Map services list to local price inputs
        const initialPrices = {};
        response.data.forEach(service => {
          initialPrices[service.key] = service.price;
        });
        setPrices(initialPrices);
        setHasChanges(false);

        // If active service is currently shown in provider modal, refresh it too
        if (activeService) {
          const updatedActive = response.data.find(s => s._id === activeService._id);
          if (updatedActive) {
            setActiveService(updatedActive);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching add-on services:', error);
      toastUtils.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (serviceKey, value) => {
    setPrices(prev => ({ ...prev, [serviceKey]: parseFloat(value) || 0 }));
    setHasChanges(true);
  };

  const handleSavePrices = async () => {
    try {
      setLoading(true);
      const response = await adminService.updateAddOnServicesPrices(prices);
      if (response.success) {
        toastUtils.success('Prices updated successfully!');
        setHasChanges(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Error saving prices:', error);
      toastUtils.error('Failed to save prices');
    } finally {
      setLoading(false);
    }
  };



  // Add-on Service dynamic operations
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceData.name || !newServiceData.price) {
      toastUtils.error('Please fill in Name and Price');
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.createAddOnService({
        name: newServiceData.name,
        description: newServiceData.description,
        price: parseFloat(newServiceData.price) || 0,
        singleUnitOnly: newServiceData.singleUnitOnly,
      });

      if (response.success) {
        toastUtils.success('Service created successfully!');
        setNewServiceData({ name: '', description: '', price: '', singleUnitOnly: false });
        setShowAddServiceModal(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = async (e) => {
    e.preventDefault();
    if (!editServiceData.name || !editServiceData.price) {
      toastUtils.error('Please fill in Name and Price');
      return;
    }

    try {
      setLoading(true);
      const response = await adminService.updateAddOnService(editServiceData.id, {
        name: editServiceData.name,
        description: editServiceData.description,
        price: parseFloat(editServiceData.price) || 0,
        singleUnitOnly: editServiceData.singleUnitOnly,
      });

      if (response.success) {
        toastUtils.success('Service updated successfully!');
        setShowEditServiceModal(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete the service "${serviceName}"? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      const response = await adminService.deleteAddOnService(serviceId);
      if (response.success) {
        toastUtils.success('Service deleted successfully!');
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toastUtils.error('Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  // Provider dynamic registry operations
  const handleOpenProviders = (service) => {
    setActiveService(service);
    setNewProviderData({ name: '', phone: '', email: '', address: '' });
    setShowProviderModal(true);
  };

  const handleRegisterProvider = async (e) => {
    e.preventDefault();
    if (!newProviderData.name || !newProviderData.phone) {
      toastUtils.error('Name and Phone are required');
      return;
    }

    if (newProviderData.phone.length !== 10 || isNaN(newProviderData.phone)) {
      toastUtils.error('Phone number must be exactly 10 digits');
      return;
    }

    // Validation for duplicate phone number
    const isDuplicatePhone = activeService?.providers?.some(p => p.phone === newProviderData.phone);
    if (isDuplicatePhone) {
      toastUtils.error('This phone number is already registered for this service');
      return;
    }

    // Validation for duplicate email (if provided)
    if (newProviderData.email) {
      const isDuplicateEmail = activeService?.providers?.some(
        p => p.email && p.email.toLowerCase() === newProviderData.email.toLowerCase()
      );
      if (isDuplicateEmail) {
        toastUtils.error('This email is already registered for this service');
        return;
      }
    }

    try {
      setLoading(true);
      const response = await adminService.addProvider(activeService._id, newProviderData);
      if (response.success) {
        toastUtils.success('Provider registered successfully!');
        setNewProviderData({ name: '', phone: '', email: '', address: '' });
        
        // Refresh full services list to update modal & background
        await fetchServices();
      }
    } catch (error) {
      console.error('Error registering provider:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to register provider');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId, providerName) => {
    if (!window.confirm(`Remove provider "${providerName}"?`)) return;

    try {
      setLoading(true);
      const response = await adminService.deleteProvider(activeService._id, providerId);
      if (response.success) {
        toastUtils.success('Provider removed successfully!');
        await fetchServices();
      }
    } catch (error) {
      console.error('Error removing provider:', error);
      toastUtils.error('Failed to remove provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundPrimary }}>
      <div className="container mx-auto px-4 pt-24 pb-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>Add-on Services Management</h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Manage prices and provider detail registries for dynamic add-on services</p>
          </div>
          <button
            onClick={() => setShowAddServiceModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Service
          </button>
        </div>

        {/* Dynamic Services Grid */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Available Services ({services.length})</h2>
          </div>
          
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service._id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border-2 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundSecondary }}
              >
                {/* Service Details */}
                <div className="mb-3 md:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>{service.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: colors.borderMedium, color: colors.textSecondary }}>
                      {service.providers?.length || 0} Providers
                    </span>
                    {service.singleUnitOnly && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Single Unit Only
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{service.description || 'No description provided'}</p>
                </div>

                {/* Service Actions / Form */}
                <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      value={prices[service.key] !== undefined ? prices[service.key] : service.price}
                      onChange={(e) => handlePriceChange(service.key, e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg border-2 text-base font-semibold text-center outline-none focus:border-indigo-500 transition-colors"
                      style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                    />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>per unit</span>
                  </div>

                  {/* Operational Buttons */}
                  <div className="flex items-center gap-2">
                    {/* View Providers Eye Button */}
                    <button
                      onClick={() => {
                        setActiveService(service);
                        setShowViewProviderModal(true);
                      }}
                      title="View Registered Providers"
                      className="p-2.5 rounded-xl border transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ borderColor: colors.borderMedium, color: colors.textSecondary }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Add/Manage Providers Plus Button */}
                    <button
                      onClick={() => handleOpenProviders(service)}
                      title="Manage Providers (Add Multiple Details)"
                      className="p-2.5 rounded-xl border transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ borderColor: colors.borderMedium, color: colors.backgroundTertiary }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {/* Edit Service Button */}
                    <button
                      onClick={() => {
                        setEditServiceData({
                          id: service._id,
                          name: service.name,
                          description: service.description || '',
                          price: service.price || 0,
                          singleUnitOnly: service.singleUnitOnly || false,
                        });
                        setShowEditServiceModal(true);
                      }}
                      title="Edit Service"
                      className="p-2.5 rounded-xl border transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ borderColor: colors.borderMedium, color: colors.textSecondary }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Service Button */}
                    <button
                      onClick={() => handleDeleteService(service._id, service.name)}
                      title="Delete Service"
                      className="p-2.5 rounded-xl border border-red-200 dark:border-red-900 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950 text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Save Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: colors.borderMedium }}>
            <button
              onClick={handleSavePrices}
              disabled={!hasChanges || loading}
              className="px-5 py-2 rounded-xl font-medium text-white disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Card>

        {/* ======================================= */}
        {/* MODAL 1: ADD NEW SERVICE MODAL          */}
        {/* ======================================= */}
        {showAddServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200"
              style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Create Add-on Service</h3>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Guide, Wifi Hotspot"
                    value={newServiceData.name}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Explain the add-on service details..."
                    value={newServiceData.description}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors resize-none"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="500"
                    value={newServiceData.price}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="newSingleUnitOnly"
                    checked={newServiceData.singleUnitOnly || false}
                    onChange={(e) => setNewServiceData(prev => ({ ...prev, singleUnitOnly: e.target.checked }))}
                    className="w-4 h-4 rounded border-2 transition-all cursor-pointer"
                    style={{ borderColor: colors.backgroundTertiary }}
                  />
                  <label htmlFor="newSingleUnitOnly" className="text-sm font-semibold select-none cursor-pointer" style={{ color: colors.textPrimary }}>
                    Limit to single unit (User can select maximum 1 quantity)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: colors.borderMedium }}>
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="px-4 py-2.5 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    Create Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* MODAL 1.5: EDIT SERVICE MODAL           */}
        {/* ======================================= */}
        {showEditServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200"
              style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Edit Add-on Service</h3>
                <button
                  onClick={() => setShowEditServiceModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditService} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Guide, Wifi Hotspot"
                    value={editServiceData.name}
                    onChange={(e) => setEditServiceData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Explain the add-on service details..."
                    value={editServiceData.description}
                    onChange={(e) => setEditServiceData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors resize-none"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="500"
                    value={editServiceData.price}
                    onChange={(e) => setEditServiceData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-indigo-500 outline-none transition-colors"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundPrimary }}
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="editSingleUnitOnly"
                    checked={editServiceData.singleUnitOnly || false}
                    onChange={(e) => setEditServiceData(prev => ({ ...prev, singleUnitOnly: e.target.checked }))}
                    className="w-4 h-4 rounded border-2 transition-all cursor-pointer"
                    style={{ borderColor: colors.backgroundTertiary }}
                  />
                  <label htmlFor="editSingleUnitOnly" className="text-sm font-semibold select-none cursor-pointer" style={{ color: colors.textPrimary }}>
                    Limit to single unit (User can select maximum 1 quantity)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: colors.borderMedium }}>
                  <button
                    type="button"
                    onClick={() => setShowEditServiceModal(false)}
                    className="px-4 py-2.5 rounded-xl border font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* MODAL 2: MANAGE SERVICE PROVIDERS MODAL */}
        {/* ======================================= */}
        {showProviderModal && activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
              style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: colors.borderMedium }}>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Manage Service Providers</h3>
                  <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Register multiple providers for the <span className="font-bold text-indigo-500">{activeService.name}</span> service.</p>
                </div>
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>


              {/* Modal Content */}
              <div className="p-2">
                {/* Registry Form */}
                <div className="p-4 rounded-xl border-2" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register New Provider Detail
                  </h4>
                  
                  <form onSubmit={handleRegisterProvider} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Rajesh Kumar"
                        value={newProviderData.name}
                        onChange={(e) => setNewProviderData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border-2 focus:border-indigo-500 outline-none text-xs transition-colors"
                        style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Phone Number *</label>
                      <input
                        type="text"
                        required
                        maxLength="10"
                        placeholder="9876543210"
                        value={newProviderData.phone}
                        onChange={(e) => setNewProviderData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border-2 focus:border-indigo-500 outline-none text-xs transition-colors"
                        style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Email Address</label>
                      <input
                        type="email"
                        placeholder="rajesh@driveon.com"
                        value={newProviderData.email}
                        onChange={(e) => setNewProviderData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border-2 focus:border-indigo-500 outline-none text-xs transition-colors"
                        style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Full Address</label>
                      <input
                        type="text"
                        placeholder="Sector 62, Noida"
                        value={newProviderData.address}
                        onChange={(e) => setNewProviderData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border-2 focus:border-indigo-500 outline-none text-xs transition-colors"
                        style={{ borderColor: colors.borderMedium, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }}
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] text-xs shadow-md"
                        style={{ backgroundColor: colors.backgroundTertiary }}
                      >
                        Register Provider
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t mt-4 flex justify-end" style={{ borderColor: colors.borderMedium }}>
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="px-5 py-2.5 rounded-xl border font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                >
                  Close Manager
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ======================================= */}
        {/* MODAL 3: VIEW SERVICE PROVIDERS MODAL   */}
        {/* ======================================= */}
        {showViewProviderModal && activeService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
              className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
              style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.borderMedium }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{ borderColor: colors.borderMedium }}>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Registered Providers</h3>
                  <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>View all providers registered for <span className="font-bold text-indigo-500">{activeService.name}</span>.</p>
                </div>
                <button
                  onClick={() => setShowViewProviderModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Scrollable Grid */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
                <div>
                  {!activeService.providers || activeService.providers.length === 0 ? (
                    <div className="p-8 rounded-xl border-2 border-dashed text-center" style={{ borderColor: colors.borderMedium }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>No providers registered yet.</p>
                      <p className="text-xs text-gray-400 mt-0.5">Use the '+' button in the list to register providers.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeService.providers.map((provider) => (
                        <div
                          key={provider._id}
                          className="p-3.5 rounded-xl border flex justify-between items-center transition-all hover:shadow-sm"
                          style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                        >
                          <div className="space-y-1">
                            <h5 className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{provider.name}</h5>
                            
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.textSecondary }}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              {provider.phone}
                            </div>
                            
                            {provider.email && (
                              <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" style={{ color: colors.textSecondary }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                {provider.email}
                              </div>
                            )}

                            {provider.address && (
                              <div className="flex items-center gap-1.5 text-[11px] truncate max-w-[200px]" style={{ color: colors.textSecondary }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {provider.address}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteProvider(provider._id, provider.name)}
                            title="Remove Provider"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t mt-4 flex justify-end" style={{ borderColor: colors.borderMedium }}>
                <button
                  onClick={() => setShowViewProviderModal(false)}
                  className="px-5 py-2.5 rounded-xl border font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddOnServicesPage;
