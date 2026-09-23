import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { offerService } from '../../../services/offer.service';
import toastUtils from '../../../config/toast';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Offer Management Page
 * Admin can create, edit, and manage all promotional offers
 */
const OfferManagementPage = () => {
  const navigate = useNavigate();

  // State management
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, active, expired
    type: 'all', // all, percentage, fixed, free
  });

  // Form state
  const [offerForm, setOfferForm] = useState({
    title: '',
    code: '',
    description: '',
    discountType: 'percentage', // percentage, fixed, free
    discountValue: '',
    isFirstTimeOnly: false,
    validityStart: '',
    validityEnd: '',
    validDays: [],
    isActive: true,
  });

  // Fetch offers from API
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await offerService.getAllOffers({
        status: filters.status,
        type: filters.type,
        search: searchQuery,
      });

      if (response.success && response.data) {
        setOffers(response.data);
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to fetch offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [filters.status, filters.type]);

  // Client-side search filtering
  useEffect(() => {
    let filtered = [...offers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((o) => {
        const code = (o.code || '').toLowerCase();
        const title = (o.title || '').toLowerCase();
        const description = (o.description || '').toLowerCase();

        return keywords.every((keyword) =>
          code.includes(keyword) ||
          title.includes(keyword) ||
          description.includes(keyword)
        );
      });
    }

    setFilteredOffers(filtered);
  }, [offers, searchQuery]);

  const handleCreateOffer = () => {
    setOfferForm({
      title: '',
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      isFirstTimeOnly: false,
      validityStart: '',
      validityEnd: '',
      validDays: [],
      isActive: true,
    });
    setSelectedOffer(null);
    setShowOfferModal(true);
  };

  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    setOfferForm({
      title: offer.title,
      code: offer.code,
      description: offer.description || '',
      discountType: offer.discountType,
      discountValue: offer.discountValue !== undefined ? offer.discountValue : '',
      isFirstTimeOnly: offer.isFirstTimeOnly || false,
      validityStart: formatDate(offer.validityStart),
      validityEnd: formatDate(offer.validityEnd),
      validDays: offer.validDays || [],
      isActive: offer.isActive !== undefined ? offer.isActive : true,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = async () => {
    try {
      if (!offerForm.title || !offerForm.code || !offerForm.validityStart || !offerForm.validityEnd) {
        toastUtils.error('Please fill all required fields');
        return;
      }

      if (offerForm.discountType !== 'free' && !offerForm.discountValue) {
        toastUtils.error('Discount value is required');
        return;
      }

      const offerData = {
        title: offerForm.title.trim(),
        code: offerForm.code.trim().toUpperCase(),
        description: offerForm.description || '',
        discountType: offerForm.discountType,
        discountValue: offerForm.discountType === 'free' ? 0 : parseFloat(offerForm.discountValue),
        isFirstTimeOnly: offerForm.isFirstTimeOnly,
        validityStart: offerForm.validityStart,
        validityEnd: offerForm.validityEnd,
        validDays: offerForm.validDays || [],
        isActive: offerForm.isActive,
      };

      if (selectedOffer) {
        const res = await offerService.updateOffer(selectedOffer._id || selectedOffer.id, offerData);
        if (res.success) {
          toastUtils.success('Offer updated successfully');
          fetchOffers();
        }
      } else {
        const res = await offerService.createOffer(offerData);
        if (res.success) {
          toastUtils.success('Offer created successfully');
          fetchOffers();
        }
      }
      setShowOfferModal(false);
      setSelectedOffer(null);
    } catch (error) {
      console.error('Error saving offer:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to save offer');
    }
  };

  const handleToggleOffer = async (offerId) => {
    try {
      const res = await offerService.toggleOfferStatus(offerId);
      if (res.success) {
        toastUtils.success(res.message || 'Offer status updated');
        fetchOffers();
      }
    } catch (error) {
      console.error('Error toggling offer:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update offer status');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        const res = await offerService.deleteOffer(offerId);
        if (res.success) {
          toastUtils.success('Offer deleted successfully');
          fetchOffers();
        }
      } catch (error) {
        console.error('Error deleting offer:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to delete offer');
      }
    }
  };

  const getStatusColor = (offer) => {
    const now = new Date();
    if (!offer.isActive || new Date(offer.validityEnd) < now) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (offer) => {
    const now = new Date();
    if (!offer.isActive) return 'Inactive';
    if (new Date(offer.validityEnd) < now) return 'Expired';
    return 'Active';
  };

  // Stats calculation
  const stats = {
    total: offers.length,
    active: offers.filter((o) => {
      const now = new Date();
      return o.isActive && new Date(o.validityEnd) >= now;
    }).length,
    expired: offers.filter((o) => {
      const now = new Date();
      return new Date(o.validityEnd) < now || !o.isActive;
    }).length,
  };

  if (loading && offers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading offers...</p>
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
                Offers Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Create promotional discount offers for bookings</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateOffer}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all shadow-md"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                Create Offer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Total Offers</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-green-600">{stats.active}</div>
            <div className="text-xs md:text-sm text-gray-600">Active</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-1 text-red-600">{stats.expired}</div>
            <div className="text-xs md:text-sm text-gray-600">Expired / Inactive</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
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
                placeholder="Search by offer code, title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCustomSelect
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Only' },
                { value: 'expired', label: 'Expired / Inactive' },
              ]}
            />
            <AdminCustomSelect
              label="Discount Type"
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              options={[
                { value: 'all', label: 'All Discount Types' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
                { value: 'free', label: '100% Free Booking' },
              ]}
            />
          </div>
        </Card>

        {/* Offers List */}
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <Card key={offer._id || offer.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-0.5">{offer.title}</h2>
                      <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded text-purple-700">
                        {offer.code}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {offer.isFirstTimeOnly && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          First Time Users
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(offer)}`}>
                        {getStatusText(offer)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{offer.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-500 block text-xs">Discount</span>
                      <span className="font-bold text-gray-900">
                        {offer.discountType === 'percentage'
                          ? `${offer.discountValue}%`
                          : offer.discountType === 'fixed'
                            ? `₹${offer.discountValue}`
                            : '100% FREE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Validity</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(offer.validityStart).toLocaleDateString()} - {new Date(offer.validityEnd).toLocaleDateString()}
                      </span>
                    </div>
                    {offer.validDays && offer.validDays.length > 0 && (
                      <div>
                        <span className="text-gray-500 block text-xs">Valid Days</span>
                        <span className="text-purple-700 font-semibold">
                          {offer.validDays.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-40 justify-center">
                  <button
                    onClick={() => handleEditOffer(offer)}
                    className="w-full px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleOffer(offer._id || offer.id)}
                    className={`w-full px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors ${offer.isActive
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    {offer.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer._id || offer.id)}
                    className="w-full px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            No promotional offers found matching your filters.
          </Card>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOfferModal(false)}>
          <div
            className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedOffer ? 'Edit Offer' : 'Create Promotional Offer'}
              </h2>
              <button onClick={() => setShowOfferModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. First Time Free Booking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Code *</label>
                <input
                  type="text"
                  value={offerForm.code}
                  onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="e.g. FIRSTFREE"
                  disabled={!!selectedOffer}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="2"
                  placeholder="Explain offer eligibility/details..."
                />
              </div>

              <div>
                <AdminCustomSelect
                  label="Discount Type *"
                  value={offerForm.discountType}
                  onChange={(value) => setOfferForm({ ...offerForm, discountType: value })}
                  options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'fixed', label: 'Fixed Amount (₹)' },
                    { value: 'free', label: '100% Free Booking' },
                  ]}
                />
              </div>

              {offerForm.discountType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    value={offerForm.discountValue}
                    onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={offerForm.discountType === 'percentage' ? 'e.g. 30' : 'e.g. 500'}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  id="firstTimeOnly"
                  checked={offerForm.isFirstTimeOnly}
                  onChange={(e) => setOfferForm({ ...offerForm, isFirstTimeOnly: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="firstTimeOnly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Valid for First-Time Bookings Only
                </label>
              </div>

              {/* Valid Days Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Days (Optional - leave empty for all days)</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = offerForm.validDays?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setOfferForm({ ...offerForm, validDays: offerForm.validDays.filter(d => d !== day) });
                          } else {
                            setOfferForm({ ...offerForm, validDays: [...(offerForm.validDays || []), day] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${isSelected ? 'text-white border-purple-600' : 'text-gray-600 border-gray-200 hover:border-gray-400'}`}
                        style={isSelected ? { backgroundColor: colors.backgroundTertiary, borderColor: colors.backgroundTertiary } : {}}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity Start *</label>
                  <input
                    type="date"
                    value={offerForm.validityStart}
                    onChange={(e) => setOfferForm({ ...offerForm, validityStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity End *</label>
                  <input
                    type="date"
                    value={offerForm.validityEnd}
                    onChange={(e) => setOfferForm({ ...offerForm, validityEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOffer}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium hover:opacity-90"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Save Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferManagementPage;
