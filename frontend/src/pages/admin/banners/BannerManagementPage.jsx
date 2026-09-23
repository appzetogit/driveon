import { useState, useEffect } from 'react';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { bannerService } from '../../../services/banner.service';
import { carService } from '../../../services/car.service';
import toastUtils from '../../../config/toast';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Banner Management Page
 * Admin can create, edit, toggle, and delete promotional banner advertisements.
 * Banners can be linked to active cars for direct navigation.
 */
const BannerManagementPage = () => {
  const [banners, setBanners] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCars, setLoadingCars] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  
  // Form state
  const [bannerForm, setBannerForm] = useState({
    title: '',
    linkedCar: '',
    imageFile: null,
    imagePreview: '',
  });

  // Fetch banners and cars
  useEffect(() => {
    fetchBanners();
    fetchActiveCars();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getAllBanners();
      if (response.success && response.data?.banners) {
        setBanners(response.data.banners);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to fetch banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCars = async () => {
    try {
      setLoadingCars(true);
      const response = await carService.getCars({
        page: 1,
        limit: 1000,
        status: 'active',
      });
      if (response.success && response.data?.cars) {
        setCars(response.data.cars);
      } else {
        setCars([]);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      toastUtils.error('Failed to load cars list');
      setCars([]);
    } finally {
      setLoadingCars(false);
    }
  };

  const handleOpenCreateModal = () => {
    setBannerForm({
      title: '',
      linkedCar: '',
      imageFile: null,
      imagePreview: '',
    });
    setSelectedBanner(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (banner) => {
    setSelectedBanner(banner);
    setBannerForm({
      title: banner.title,
      linkedCar: banner.linkedCar?._id || banner.linkedCar || '',
      imageFile: null,
      imagePreview: banner.image, // URL of existing image
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastUtils.error('Image file size must be less than 5MB');
        return;
      }
      setBannerForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();

    if (!bannerForm.title.trim()) {
      toastUtils.error('Banner title is required');
      return;
    }

    if (!selectedBanner && !bannerForm.imageFile) {
      toastUtils.error('Banner image file is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', bannerForm.title.trim());
      formData.append('linkedCar', bannerForm.linkedCar || '');
      if (bannerForm.imageFile) {
        formData.append('image', bannerForm.imageFile);
      }

      let response;
      if (selectedBanner) {
        response = await bannerService.updateBanner(selectedBanner._id || selectedBanner.id, formData);
        if (response.success) {
          toastUtils.success('Banner updated successfully');
        }
      } else {
        response = await bannerService.createBanner(formData);
        if (response.success) {
          toastUtils.success('Banner created successfully');
        }
      }

      setShowModal(false);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleToggleStatus = async (bannerId) => {
    try {
      const response = await bannerService.toggleBannerStatus(bannerId);
      if (response.success) {
        toastUtils.success(response.message || 'Banner status updated');
        // Update local state instantly
        setBanners((prev) =>
          prev.map((b) =>
            (b._id === bannerId || b.id === bannerId)
              ? { ...b, isActive: response.data.banner.isActive }
              : b
          )
        );
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update banner status');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner advertisement? This action cannot be undone.')) {
      try {
        const response = await bannerService.deleteBanner(bannerId);
        if (response.success) {
          toastUtils.success('Banner deleted successfully');
          setBanners((prev) => prev.filter((b) => b._id !== bannerId && b.id !== bannerId));
        }
      } catch (error) {
        console.error('Error deleting banner:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to delete banner');
      }
    }
  };

  // Stats calculation
  const totalBanners = banners.length;
  const activeBanners = banners.filter((b) => b.isActive).length;
  const linkedBanners = banners.filter((b) => b.linkedCar).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading banners...</p>
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
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2" style={{ color: colors.backgroundTertiary }}>
                Banner Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Create, edit and link promotional advertisements on user homepages</p>
            </div>
            <div>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Banner
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card padding={false} className="p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalBanners}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Banners</div>
            </div>
          </Card>
          
          <Card padding={false} className="p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activeBanners}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Banners</div>
            </div>
          </Card>

          <Card padding={false} className="p-4 flex items-center gap-4 shadow-sm border border-gray-100">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{linkedBanners}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Linked to Cars</div>
            </div>
          </Card>
        </div>

        {/* Banners Grid list */}
        {banners.length === 0 ? (
          <Card className="p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No banner advertisements found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Create a banner advertisement and select a car for redirection when users click on it from their homepages.</p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all shadow-sm"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              Upload Your First Banner
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner._id || banner.id} padding={false} className="overflow-hidden flex flex-col hover:shadow-lg transition-all border border-gray-100 relative group">
                {/* Image Preview */}
                <div className="aspect-[21/9] w-full bg-gray-100 overflow-hidden relative">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Status Overlay */}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                    banner.isActive 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Banner Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{banner.title}</h3>
                    {banner.linkedCar ? (
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-800 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="font-medium truncate">
                          Linked Car: {banner.linkedCar.brand} {banner.linkedCar.model} ({banner.linkedCar.registrationNumber})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="truncate">No Linked Car (Plain Ad)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleStatus(banner._id || banner.id)}
                      className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg text-center transition-colors border ${
                        banner.isActive
                          ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {banner.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner._id || banner.id)}
                      className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Banner Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-xl max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBanner ? 'Edit Banner Advertisement' : 'Create Banner Advertisement'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="e.g., Summer Discount Special Sale"
                />
              </div>

              {/* Linked Car Select */}
              <div>
                <AdminCustomSelect
                  label="Link to Specific Car (Optional)"
                  value={bannerForm.linkedCar}
                  onChange={(value) => setBannerForm({ ...bannerForm, linkedCar: value })}
                  options={[
                    { value: '', label: '-- No Car Linked (Plain Advertisement) --' },
                    ...cars.map((car) => ({
                      value: car._id || car.id,
                      label: `${car.brand} ${car.model} (${car.registrationNumber})`
                    }))
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">When users click this banner advertisement, they will be redirected to the booking page of this car.</p>
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banner Image *</label>
                
                {/* Preview Container */}
                {bannerForm.imagePreview ? (
                  <div className="relative aspect-[21/9] w-full rounded-lg overflow-hidden bg-gray-100 mb-3 border border-gray-200 group">
                    <img
                      src={bannerForm.imagePreview}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-xs shadow hover:bg-gray-100 transition-colors">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-[21/9] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-purple-300/60 hover:border-purple-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-700 font-semibold mb-1">Click to upload banner image</p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB (Recommeded: 21:9 Aspect Ratio)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      required={!selectedBanner}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow transition-opacity"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  {selectedBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagementPage;
