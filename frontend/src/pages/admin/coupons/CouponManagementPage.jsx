import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { couponService } from '../../../services/coupon.service';
import { carService } from '../../../services/car.service';
import toastUtils from '../../../config/toast';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Coupon Management Page
 * Admin can create, edit, and manage all coupons and discounts
 * No localStorage or Redux - All state managed via React hooks
 */
const CouponManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, active, expired, used
    couponType: 'all', // all, percentage, fixed
    dateRange: 'all', // all, today, week, month, custom
    startDate: '', // YYYY-MM-DD
    endDate: '', // YYYY-MM-DD
  });

  // Form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage', // percentage, fixed
    discountValue: '',
    minAmount: '',
    maxDiscount: '',
    validityStart: '',
    validityEnd: '',
    usageLimit: '',
    usedCount: 0,
    applicableTo: 'car_id', // car_id, user_id, all
    carIds: [], // Array of car IDs for multi-select
    userId: '',
    validDays: [], // Days of week coupon is valid (empty = all days)
    isActive: true,
    description: '',
  });

  // Cars list for dropdown
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(false);

  // Fetch coupons from API
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const response = await couponService.getAllCoupons({
          status: filters.status,
          couponType: filters.couponType,
          dateRange: filters.dateRange !== 'custom' ? filters.dateRange : 'all',
          search: searchQuery,
        });

        if (response.success && response.data?.coupons) {
          setCoupons(response.data.coupons);
        } else {
          setCoupons([]);
        }
      } catch (error) {
        console.error('Error fetching coupons:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to fetch coupons');
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [filters.status, filters.couponType, filters.dateRange]);

  // Fetch cars when applicableTo is 'car_id'
  useEffect(() => {
    const fetchCars = async () => {
      if (couponForm.applicableTo === 'car_id' && showCouponModal) {
        try {
          setLoadingCars(true);
          const response = await carService.getCars({
            page: 1,
            limit: 1000, // Get all active cars
            status: 'active',
          });

          if (response.success && response.data?.cars) {
            setCars(response.data.cars);
          } else {
            setCars([]);
          }
        } catch (error) {
          console.error('Error fetching cars:', error);
          toastUtils.error('Failed to fetch cars');
          setCars([]);
        } finally {
          setLoadingCars(false);
        }
      }
    };

    fetchCars();
  }, [couponForm.applicableTo, showCouponModal]);

  // Filter and search coupons (client-side filtering for search)
  useEffect(() => {
    let filtered = [...coupons];

    // Search filter (client-side for instant results)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((coupon) => {
        const code = (coupon.code || '').toLowerCase();
        const description = (coupon.description || '').toLowerCase();

        return keywords.every((keyword) =>
          code.includes(keyword) ||
          description.includes(keyword)
        );
      });
    }

    // Custom date range filter
    if (filters.dateRange === 'custom') {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((coupon) => {
        const createdDate = new Date(coupon.createdAt);
        if (start && end) {
          return createdDate >= start && createdDate <= end;
        } else if (start) {
          return createdDate >= start;
        } else if (end) {
          return createdDate <= end;
        }
        return true;
      });
    }

    setFilteredCoupons(filtered);
  }, [coupons, searchQuery, filters.dateRange, filters.startDate, filters.endDate]);

  const handleCreateCoupon = () => {
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minAmount: '',
      maxDiscount: '',
      validityStart: '',
      validityEnd: '',
      usageLimit: '',
      usedCount: 0,
      applicableTo: 'car_id',
      carIds: [],
      userId: '',
      validDays: [],
      isActive: true,
      description: '',
    });
    setSelectedCoupon(null);
    setShowCouponModal(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    // Format dates for input fields (YYYY-MM-DD)
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    // Handle carIds - convert single carId to array or use existing array
    let carIds = [];
    if (coupon.carIds && Array.isArray(coupon.carIds)) {
      carIds = coupon.carIds.map(id => id._id || id);
    } else if (coupon.carId) {
      carIds = [coupon.carId._id || coupon.carId];
    }

    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      validityStart: formatDate(coupon.validityStart),
      validityEnd: formatDate(coupon.validityEnd),
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount || 0,
      applicableTo: coupon.applicableTo || 'car_id',
      carIds: carIds,
      userId: coupon.userId?._id || coupon.userId || '',
      validDays: coupon.validDays || [],
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      description: coupon.description || '',
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async () => {
    try {
      // Validate required fields
      if (!couponForm.code || !couponForm.discountValue ||
        !couponForm.validityStart || !couponForm.validityEnd || !couponForm.usageLimit) {
        toastUtils.error('Please fill all required fields');
        return;
      }

      // Car selection is optional - if applicableTo is car_id but no cars selected, coupon applies to all cars

      // Prepare data with proper types
      const couponData = {
        code: couponForm.code.trim(),
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minAmount: couponForm.minAmount ? parseFloat(couponForm.minAmount) : 0,
        maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
        validityStart: couponForm.validityStart,
        validityEnd: couponForm.validityEnd,
        usageLimit: parseInt(couponForm.usageLimit, 10),
        applicableTo: couponForm.applicableTo,
        isActive: couponForm.isActive,
        description: couponForm.description || '',
        validDays: couponForm.validDays.length > 0 ? couponForm.validDays : [], // Empty = all days
      };

      // Add carIds or userId based on applicableTo
      if (couponForm.applicableTo === 'car_id') {
        couponData.carIds = couponForm.carIds;
      } else if (couponForm.applicableTo === 'user_id') {
        couponData.userId = couponForm.userId;
      }

      if (selectedCoupon) {
        // Update existing coupon
        const response = await couponService.updateCoupon(selectedCoupon._id || selectedCoupon.id, couponData);
        if (response.success) {
          toastUtils.success('Coupon updated successfully');
          // Refresh coupons list
          const refreshResponse = await couponService.getAllCoupons();
          if (refreshResponse.success && refreshResponse.data?.coupons) {
            setCoupons(refreshResponse.data.coupons);
          }
        }
      } else {
        // Create new coupon
        const response = await couponService.createCoupon(couponData);
        if (response.success) {
          toastUtils.success('Coupon created successfully');
          // Refresh coupons list
          const refreshResponse = await couponService.getAllCoupons();
          if (refreshResponse.success && refreshResponse.data?.coupons) {
            setCoupons(refreshResponse.data.coupons);
          }
        }
      }
      setShowCouponModal(false);
      setSelectedCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
      console.error('Error details:', {
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        status: error.response?.status,
        data: error.response?.data,
      });
      toastUtils.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const response = await couponService.toggleCouponStatus(couponId);
      if (response.success) {
        toastUtils.success(response.message || 'Coupon status updated');
        // Refresh coupons list
        const refreshResponse = await couponService.getAllCoupons();
        if (refreshResponse.success && refreshResponse.data?.coupons) {
          setCoupons(refreshResponse.data.coupons);
        }
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await couponService.deleteCoupon(couponId);
        if (response.success) {
          toastUtils.success('Coupon deleted successfully');
          // Refresh coupons list
          const refreshResponse = await couponService.getAllCoupons();
          if (refreshResponse.success && refreshResponse.data?.coupons) {
            setCoupons(refreshResponse.data.coupons);
          }
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const handleViewUsage = (coupon) => {
    setSelectedCoupon(coupon);
    setShowUsageModal(true);
  };

  const handleExport = () => {
    // In real app, this would generate and download CSV/Excel
    console.log('Exporting coupons data...');
  };

  // Get status badge color
  const getStatusColor = (coupon) => {
    const now = new Date();
    if (!coupon.isActive || new Date(coupon.validityEnd) < now) {
      return 'bg-red-100 text-red-800';
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return 'Inactive';
    if (new Date(coupon.validityEnd) < now) return 'Expired';
    if (coupon.usedCount >= coupon.usageLimit) return 'Used Up';
    return 'Active';
  };

  // Stats calculation
  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => {
      const now = new Date();
      return c.isActive && new Date(c.validityEnd) >= now && c.usedCount < c.usageLimit;
    }).length,
    expired: coupons.filter((c) => {
      const now = new Date();
      return new Date(c.validityEnd) < now || !c.isActive;
    }).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usedCount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading coupons...</p>
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
                Coupon Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Create and manage discount coupons</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateCoupon}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                Create Coupon
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card padding={false} className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs text-gray-600">Total Coupons</div>
          </Card>
          <Card padding={false} className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </Card>
          <Card padding={false} className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1 text-red-600">{stats.expired}</div>
            <div className="text-xs text-gray-600">Expired</div>
          </Card>
          <Card padding={false} className="p-3 text-center">
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.totalUsage}
            </div>
            <div className="text-xs text-gray-600">Total Usage</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
          {/* Search and Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
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
                  placeholder="Search by coupon code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <AdminCustomSelect
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'used', label: 'Used Up' },
              ]}
            />

            {/* Coupon Type Filter */}
            <AdminCustomSelect
              label="Discount Type"
              value={filters.couponType}
              onChange={(value) => setFilters({ ...filters, couponType: value })}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
              ]}
            />

            {/* Date Range Filter */}
            <AdminCustomSelect
              label="Created"
              value={filters.dateRange}
              onChange={(value) => setFilters({ ...filters, dateRange: value })}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />
          </div>

          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
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

        {/* Coupons List */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredCoupons.length}</span> of <span className="font-semibold">{coupons.length}</span> coupons
          </p>
        </div>

        <div className="space-y-4">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon._id || coupon.id} className="p-4 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Coupon Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        <span className="font-mono text-lg" style={{ color: colors.backgroundTertiary }}>
                          {coupon.code}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500">{coupon.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coupon)}`}>
                      {getStatusText(coupon)}
                    </span>
                  </div>

                  {/* Coupon Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Discount</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </p>
                      {coupon.maxDiscount && (
                        <p className="text-xs text-gray-500">Max: ₹{coupon.maxDiscount}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Min Amount</p>
                      <p className="text-sm text-gray-900">₹{coupon.minAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Usage</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {coupon.usedCount} / {coupon.usageLimit}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{
                            width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Validity</p>
                      <p className="text-sm text-gray-900">
                        {new Date(coupon.validityStart).toLocaleDateString()} - {new Date(coupon.validityEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Applicable To */}
                  <div className="text-xs text-gray-600">
                    Applicable to:{' '}
                    {coupon.applicableTo === 'car_id'
                      ? `Cars: ${coupon.carIds && Array.isArray(coupon.carIds)
                        ? `${coupon.carIds.length} car(s) selected`
                        : coupon.carId
                          ? '1 car'
                          : 'N/A'}`
                      : coupon.applicableTo === 'user_id'
                        ? `User ID: ${coupon.userId?._id || coupon.userId || 'N/A'}`
                        : 'N/A'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-40">
                  <button
                    onClick={() => handleViewUsage(coupon)}
                    className="w-full px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    View Usage
                  </button>
                  <button
                    onClick={() => handleEditCoupon(coupon)}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleCoupon(coupon._id || coupon.id)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${coupon.isActive
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteCoupon(coupon._id || coupon.id)}
                    className="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCoupons.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No coupons found matching your filters.</p>
          </Card>
        )}
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <CouponModal
          couponForm={couponForm}
          setCouponForm={setCouponForm}
          onClose={() => {
            setShowCouponModal(false);
            setSelectedCoupon(null);
          }}
          onSave={handleSaveCoupon}
          cars={cars}
          loadingCars={loadingCars}
          isEditMode={!!selectedCoupon}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedCoupon && (
        <UsageModal
          coupon={selectedCoupon}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedCoupon(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Coupon Modal Component
 */
const CouponModal = ({ couponForm, setCouponForm, onClose, onSave, cars = [], loadingCars = false, isEditMode = false }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              placeholder="e.g., WELCOME20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="2"
              placeholder="Coupon description..."
            />
          </div>

          <div>
            <AdminCustomSelect
              label="Discount Type *"
              value={couponForm.discountType}
              onChange={(value) => setCouponForm({ ...couponForm, discountType: value })}
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
            <input
              type="number"
              value={couponForm.discountValue}
              onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={couponForm.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
            />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity Start *</label>
              <input
                type="date"
                value={couponForm.validityStart}
                onChange={(e) => setCouponForm({ ...couponForm, validityStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validity End *</label>
              <input
                type="date"
                value={couponForm.validityEnd}
                onChange={(e) => setCouponForm({ ...couponForm, validityEnd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit *</label>
            <input
              type="number"
              value={couponForm.usageLimit}
              onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 100"
            />
          </div>

          {/* Valid Days Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valid Days (Optional - leave empty for all days)</label>
            <div className="flex flex-wrap gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const isSelected = couponForm.validDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCouponForm({ ...couponForm, validDays: couponForm.validDays.filter(d => d !== day) });
                      } else {
                        setCouponForm({ ...couponForm, validDays: [...couponForm.validDays, day] });
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
            {couponForm.validDays.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{couponForm.validDays.length} day(s) selected</p>
            )}
          </div>

          <div>
            <AdminCustomSelect
              label="Applicable To *"
              value={couponForm.applicableTo}
              onChange={(value) => setCouponForm({ ...couponForm, applicableTo: value, carIds: [] })}
              options={[
                { value: 'all', label: 'All Cars' },
                { value: 'car_id', label: 'Specific Car' },
                { value: 'user_id', label: 'Specific User' },
              ]}
            />
          </div>

          {couponForm.applicableTo === 'car_id' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Cars (Optional)</label>
              {loadingCars ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 mx-auto" style={{ borderColor: colors.backgroundTertiary }}></div>
                  <p className="text-xs text-gray-500 mt-2">Loading cars...</p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-3">
                  {cars.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No cars available</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Select All Checkbox */}
                      <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer border-b border-gray-200 mb-1">
                        <input
                          type="checkbox"
                          checked={couponForm.carIds.length === cars.length && cars.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCouponForm({
                                ...couponForm,
                                carIds: cars.map(car => car._id || car.id),
                              });
                            } else {
                              setCouponForm({ ...couponForm, carIds: [] });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-bold text-gray-800">Select All ({cars.length})</span>
                      </label>
                      {cars.map((car) => {
                        const carId = car._id || car.id;
                        const isSelected = couponForm.carIds.includes(carId);
                        return (
                          <label
                            key={carId}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCouponForm({
                                    ...couponForm,
                                    carIds: [...couponForm.carIds, carId],
                                  });
                                } else {
                                  setCouponForm({
                                    ...couponForm,
                                    carIds: couponForm.carIds.filter((id) => id !== carId),
                                  });
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
                            </span>
                            <span className="text-xs text-gray-500">
                              ₹{car.pricePerDay || car.price}/day
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {couponForm.carIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {couponForm.carIds.length} car(s) selected
                </p>
              )}
            </div>
          )}

          {couponForm.applicableTo === 'user_id' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                type="text"
                value={couponForm.userId}
                onChange={(e) => setCouponForm({ ...couponForm, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., user123"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={couponForm.isActive}
              onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Coupon
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Usage Modal Component
 */
const UsageModal = ({ coupon, onClose }) => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponStats, setCouponStats] = useState(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        const response = await couponService.getCouponUsage(coupon._id || coupon.id);
        if (response.success && response.data) {
          setUsageData(response.data.usage || []);
          setCouponStats(response.data.coupon || null);
        }
      } catch (error) {
        console.error('Error fetching coupon usage:', error);
        toastUtils.error('Failed to fetch coupon usage');
        setUsageData([]);
      } finally {
        setLoading(false);
      }
    };

    if (coupon) {
      fetchUsage();
    }
  }, [coupon]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Coupon Usage Statistics</h2>
            <p className="text-sm text-gray-600">Code: {coupon.code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total Usage</p>
              <p className="text-2xl font-bold" style={{ color: colors.backgroundTertiary }}>
                {couponStats?.usedCount || coupon.usedCount || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Usage Limit</p>
              <p className="text-2xl font-bold text-gray-900">{couponStats?.usageLimit || coupon.usageLimit || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {(couponStats?.usageLimit || coupon.usageLimit || 0) - (couponStats?.usedCount || coupon.usedCount || 0)}
              </p>
            </div>
          </div>

          {/* Usage List */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage History</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto mb-2" style={{ borderColor: colors.backgroundTertiary }}></div>
              <p className="text-gray-600">Loading usage data...</p>
            </div>
          ) : usageData.length > 0 ? (
            <div className="space-y-2">
              {usageData.map((usage, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{usage.userName || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">Booking: {usage.bookingId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">₹{usage.discountApplied || 0}</p>
                      <p className="text-xs text-gray-500">{new Date(usage.usedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No usage history found for this coupon</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponManagementPage;

