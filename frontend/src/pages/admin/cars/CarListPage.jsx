import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/admin.service';
import api from '../../../services/api';
import toastUtils from '../../../config/toast';
import { Button } from '../../../components/common';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

/**
 * Car List Page
 * Admin can view, filter, approve/reject, and manage all car listings
 * No localStorage or Redux - All state managed via React hooks
 */
const CarListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial status from URL
  const getInitialStatus = () => {
    if (location.pathname.includes('/pending')) return 'pending';
    return 'all';
  };

  // State management
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [selectedCar, setSelectedCar] = useState(null);
  const [showCarDetail, setShowCarDetail] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsCar, setReviewsCar] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordCar, setRecordCar] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleViewReviews = (car) => {
    setReviewsCar(car);
    setShowReviewsModal(true);
  };

  const handleViewRecord = (car) => {
    setRecordCar(car);
    setShowRecordModal(true);
  };

  // Listen for global search events from header
  useEffect(() => {
    const handleGlobalSearch = (e) => setSearchQuery(e.detail);
    window.addEventListener('admin-global-search', handleGlobalSearch);
    return () => window.removeEventListener('admin-global-search', handleGlobalSearch);
  }, []);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (showCarDetail || showReviewsModal || showRecordModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCarDetail, showReviewsModal, showRecordModal]);

  // Filter states
  const [filters, setFilters] = useState({
    status: getInitialStatus(), // all, active, inactive, pending, suspended
    availability: 'all', // all, available, booked
    owner: 'all',         // inward car owner (by ownerId)
    outwardOwner: 'all',  // outward car owner (by ownerName)
    location: 'all',
    carType: 'all', // all, sedan, suv, hatchback, luxury
    priceRange: 'all', // all, 0-1000, 1000-2000, 2000+
  });

  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, cars]);

  // Fetch cars from API
  const fetchCarsData = async () => {
    try {
      setLoading(true);
      const [response, outwardRes] = await Promise.all([
        adminService.getAllCars({
          page: 1,
          limit: 1000,
        }),
        api.get('/fleet/outward-cars').catch(() => ({ data: { success: false } }))
      ]);

      let allCars = [];

      if (response.success && response.data) {
        // Format cars data for frontend
        const inwardOnlyCars = (response.data.cars || []).filter(car => car.source !== 'outward');
        const formattedCars = inwardOnlyCars.map((car) => {
          // Get primary image or first image
          const primaryImage = car.images?.find(img => img.isPrimary) || car.images?.[0];
          const imageUrl = primaryImage?.url || null;

          return {
            id: car._id || car.id,
            brand: car.brand,
            model: car.model,
            year: car.year,
            carType: car.carType,
            pricePerDay: car.pricePerDay,
            status: car.status,
            availability: car.isInActiveRepair 
              ? 'undermaintenance' 
              : (car.isCurrentlyBooked ? 'booked' : 'available'),
            ownerId: (car.owner?._id || car.owner?.id || car.owner || car.ownerInfo?.ownerId)?.toString() || '',
            ownerName: car.ownerInfo?.name || car.owner?.name || 'Unknown',
            ownerEmail: car.ownerInfo?.email || car.owner?.email || '',
            location: car.location?.city || car.location || 'Unknown',
            images: car.images || [],
            imageUrl: imageUrl,
            rating: car.averageRating || 0,
            totalBookings: car.totalBookings || 0,
            totalRevenue: car.totalRevenue || 0,
            features: car.features || [],
            registrationDate: car.createdAt || new Date().toISOString(),
            registrationNumber: car.registrationNumber,
            fuelType: car.fuelType,
            transmission: car.transmission,
            seatingCapacity: car.seatingCapacity,
            isFeatured: car.isFeatured,
            isPopular: car.isPopular,
            source: 'inward',
            description: car.description || '',
          };
        });
        allCars = [...formattedCars];
      }

      // Add outward cars
      if (outwardRes.data?.success && outwardRes.data?.data) {
        const standardOutwardCars = (response.data?.cars || []).filter(c => c.source === 'outward');
        const activeRepairOutwardRegs = new Set(
          standardOutwardCars
            .filter(c => c.isInActiveRepair)
            .map(c => (c.registrationNumber || '').toUpperCase().trim())
        );

        const outwardCars = (Array.isArray(outwardRes.data.data) ? outwardRes.data.data : []).map((car) => {
          const reg = (car.carNumber || car.registrationNumber || '').toUpperCase().trim();
          const isInRepair = activeRepairOutwardRegs.has(reg);
          const outwardId = car.id || car._id || '';
          // Backend getOutwardCars already combines OutwardBooking + standard shadow Booking counts
          const totalBookings = car.totalBookings || 0;

          return {
            id: outwardId,
            brand: car.brand || '',
            model: car.model || '',
            year: car.year || '',
            carType: car.carType || 'Outward',
            pricePerDay: car.pricePerDay || 0,
            status: 'active',
            availability: isInRepair ? 'undermaintenance' : 'available',
            ownerId: outwardId,
            ownerName: car.ownerName || 'Unknown',
            ownerEmail: car.ownerEmail || '',
            ownerPhone: car.ownerPhone || '',
            location: car.location || 'Unknown',
            images: car.image ? [{ url: car.image, isPrimary: true }] : [],
            imageUrl: car.image || null,
            rating: car.rating || 5,
            totalBookings,
            totalRevenue: car.totalRevenue || 0,
            features: car.features || [],
            registrationDate: car.createdAt || new Date().toISOString(),
            registrationNumber: car.carNumber || car.registrationNumber || '',
            fuelType: '',
            transmission: '',
            seatingCapacity: '',
            isFeatured: false,
            isPopular: false,
            source: 'outward',
            description: car.description || '',
          };
        });
        allCars = [...allCars, ...outwardCars];
      }

      setCars(allCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarsData();
  }, []);

  // Client-side filtering for availability, price, and search
  useEffect(() => {
    let filtered = [...cars];

    // Search filter (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const keywords = query.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((car) => {
        const brand = (car.brand || '').toLowerCase();
        const model = (car.model || '').toLowerCase();
        const ownerName = (car.ownerName || '').toLowerCase();
        const location = (car.location || '').toLowerCase();
        const registrationNumber = (car.registrationNumber || '').toLowerCase();
        const brandModel = `${brand} ${model}`;

        return keywords.every((keyword) =>
          brand.includes(keyword) ||
          model.includes(keyword) ||
          ownerName.includes(keyword) ||
          location.includes(keyword) ||
          registrationNumber.includes(keyword) ||
          brandModel.includes(keyword)
        );
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((car) => (car.status || '').toLowerCase() === filters.status.toLowerCase());
    }

    // Availability filter
    if (filters.availability !== 'all') {
      filtered = filtered.filter((car) => (car.availability || '').toLowerCase() === filters.availability.toLowerCase());
    }

    // Inward owner filter — only applies to inward cars
    if (filters.owner !== 'all') {
      filtered = filtered.filter(
        (car) => car.source === 'inward' && (car.ownerName || '').toLowerCase().trim() === filters.owner.toLowerCase().trim()
      );
    }

    // Outward owner filter — only applies to outward cars
    if (filters.outwardOwner !== 'all') {
      filtered = filtered.filter(
        (car) => car.source === 'outward' && (car.ownerName || '') === filters.outwardOwner
      );
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter((car) => (car.location || '').toLowerCase().trim() === filters.location.toLowerCase().trim());
    }

    // Car Type filter
    if (filters.carType !== 'all') {
      filtered = filtered.filter((car) => (car.carType || '').toLowerCase() === filters.carType.toLowerCase());
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter((car) => {
        const price = car.pricePerDay || 0;
        switch (filters.priceRange) {
          case '0-1000':
            return price >= 0 && price <= 1000;
          case '1000-2000':
            return price > 1000 && price <= 2000;
          case '2000+':
            return price > 2000;
          default:
            return true;
        }
      });
    }

    setFilteredCars(filtered);
  }, [cars, searchQuery, filters]);

  // Helper function to refresh cars list
  const refreshCarsList = async () => {
    await fetchCarsData();
  };

  // Handle car actions
  const handleApprove = async (carId) => {
    try {
      const response = await adminService.updateCarStatus(carId, 'active');
      if (response.success) {
        toastUtils.success('Car approved successfully');
        await refreshCarsList();
      }
    } catch (error) {
      console.error('Error approving car:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to approve car');
    }
  };

  const handleReject = async (carId) => {
    try {
      const response = await adminService.updateCarStatus(carId, 'rejected', 'Rejected by admin');
      if (response.success) {
        toastUtils.success('Car rejected successfully');
        await refreshCarsList();
      }
    } catch (error) {
      console.error('Error rejecting car:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to reject car');
    }
  };

  const handleSuspend = async (carId) => {
    try {
      const response = await adminService.updateCarStatus(carId, 'suspended');
      if (response.success) {
        toastUtils.success('Car suspended successfully');
        await refreshCarsList();
      }
    } catch (error) {
      console.error('Error suspending car:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to suspend car');
    }
  };

  const handleActivate = async (carId) => {
    try {
      const response = await adminService.updateCarStatus(carId, 'active');
      if (response.success) {
        toastUtils.success('Car activated successfully');
        await refreshCarsList();
      }
    } catch (error) {
      console.error('Error activating car:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to activate car');
    }
  };

  const handleDelete = async (carId) => {
    if (window.confirm('Are you sure you want to delete this car listing?')) {
      try {
        const response = await adminService.deleteCar(carId);
        if (response.success) {
          toastUtils.success('Car deleted successfully');
          await refreshCarsList();
        }
      } catch (error) {
        console.error('Error deleting car:', error);
        toastUtils.error(error.response?.data?.message || 'Failed to delete car');
      }
    }
  };

  const handleToggleFeatured = async (carId) => {
    try {
      const response = await adminService.toggleCarFeatured(carId);
      if (response.success) {
        toastUtils.success(response.message || 'Car featured status updated');
        setCars(prevCars =>
          prevCars.map(c =>
            c.id === carId ? { ...c, isFeatured: !c.isFeatured } : c
          )
        );
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to update featured status');
    }
  };

  const handleViewCar = (car) => {
    setSelectedCar(car);
    setShowCarDetail(true);
  };

  const handleEditCar = (car) => {
    if (car.source === 'outward') {
      navigate('/admin/cars/add-outward', { state: { editCarId: car.id } });
    } else {
      navigate(`/admin/cars/${car.id}/edit`);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      available: 'bg-blue-100 text-blue-800',
      booked: 'bg-orange-100 text-orange-800',
      undermaintenance: 'bg-red-100 text-red-800 border border-red-200 font-bold',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAvailabilityName = (availability) => {
    if (availability === 'undermaintenance') return 'Under Maintenance';
    return availability.charAt(0).toUpperCase() + availability.slice(1);
  };

  // Get car type display name
  const getCarTypeName = (type) => {
    const names = {
      sedan: 'Sedan',
      suv: 'SUV',
      hatchback: 'Hatchback',
      luxury: 'Luxury',
    };
    return names[type] || type;
  };

  // Helper to capitalize city names
  const capitalizeCity = (city) => {
    if (!city) return '';
    return city
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Get unique locations (filter out null/undefined) case-insensitively
  const uniqueLocationsMap = new Map();
  cars.forEach((car) => {
    const rawLoc = car.location || '';
    if (rawLoc.trim()) {
      const normalized = capitalizeCity(rawLoc);
      const key = normalized.toLowerCase();
      if (!uniqueLocationsMap.has(key)) {
        uniqueLocationsMap.set(key, normalized);
      }
    }
  });
  const locations = Array.from(uniqueLocationsMap.values());

  // Get unique inward owners (source === 'inward', keyed by ownerName case-insensitively)
  const ownersMap = new Map();
  cars.forEach((car) => {
    if (car.source === 'inward' && car.ownerName && car.ownerName !== 'Unknown') {
      const key = car.ownerName.trim().toLowerCase();
      if (!ownersMap.has(key)) {
        ownersMap.set(key, {
          id: car.ownerName,
          name: car.ownerName,
        });
      }
    }
  });
  const owners = Array.from(ownersMap.values());

  // Get unique outward owners (source === 'outward', keyed by ownerName)
  const outwardOwnersMap = new Map();
  cars.forEach((car) => {
    if (car.source === 'outward' && car.ownerName && car.ownerName !== 'Unknown') {
      if (!outwardOwnersMap.has(car.ownerName)) {
        outwardOwnersMap.set(car.ownerName, car.ownerName);
      }
    }
  });
  const outwardOwners = Array.from(outwardOwnersMap.values());

  // Stats calculation
  const stats = {
    total: cars.length,
    active: cars.filter((c) => c.status === 'active').length,
    pending: cars.filter((c) => c.status === 'pending').length,
    suspended: cars.filter((c) => c.status === 'suspended').length,
    available: cars.filter((c) => c.status === 'active' && c.availability === 'available').length,
    undermaintenance: cars.filter((c) => c.availability === 'undermaintenance').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.backgroundTertiary }}
          ></div>
          <p className="text-gray-600">Loading cars...</p>
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
                Car Management
              </h1>
              <p className="text-sm md:text-base text-gray-600">Manage all car listings and approvals</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin/cars/new')}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: colors.backgroundTertiary }}
              >
                Add New Car
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 max-w-5xl">
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.status === 'all' && filters.availability === 'all' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'all', availability: 'all' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.backgroundTertiary }}>
              {stats.total}
            </div>
            <div className="text-xs text-gray-600">Total Cars</div>
          </Card>
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.status === 'active' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'active', availability: 'all' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1 text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-600">Active</div>
          </Card>
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.status === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'pending', availability: 'all' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1 text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </Card>
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.status === 'suspended' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'suspended', availability: 'all' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1 text-red-600">{stats.suspended}</div>
            <div className="text-xs text-gray-600">Suspended</div>
          </Card>
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.availability === 'available' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'all', availability: 'available' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1 text-blue-600">{stats.available}</div>
            <div className="text-xs text-gray-600">Available</div>
          </Card>
          <Card 
            className={`p-3 text-center cursor-pointer hover:bg-gray-50 transition-all ${filters.availability === 'undermaintenance' ? 'ring-2 ring-rose-500' : ''}`}
            onClick={() => setFilters({ ...filters, status: 'all', availability: 'undermaintenance' })}
          >
            <div className="text-xl md:text-2xl font-bold mb-1 text-rose-600">{stats.undermaintenance}</div>
            <div className="text-xs text-gray-600">Maintenance</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 md:p-6 mb-6">
          {/* Search Bar */}
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
                placeholder="Search by brand, model, owner, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* Status Filter */}
            <AdminCustomSelect
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Pending', value: 'pending' },
                { label: 'Suspended', value: 'suspended' },
              ]}
            />

            {/* Availability Filter */}
            <AdminCustomSelect
              label="Availability"
              value={filters.availability}
              onChange={(value) => setFilters({ ...filters, availability: value })}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Available', value: 'available' },
                { label: 'Booked', value: 'booked' },
                { label: 'Under Maintenance', value: 'undermaintenance' },
              ]}
            />

            {/* Inward Owner Filter */}
            <AdminCustomSelect
              label="Owner"
              value={filters.owner}
              onChange={(value) => setFilters({ ...filters, owner: value, outwardOwner: 'all' })}
              options={[
                { label: 'All Owners', value: 'all' },
                ...owners.map((owner, index) => ({
                  label: owner.name || 'Unknown Owner',
                  value: owner.id || `owner-${index}`
                }))
              ]}
            />

            {/* Outward Owner Filter */}
            <AdminCustomSelect
              label="Outward Owner"
              value={filters.outwardOwner}
              onChange={(value) => setFilters({ ...filters, outwardOwner: value, owner: 'all' })}
              options={[
                { label: 'All Outward Owners', value: 'all' },
                ...outwardOwners.map((name) => ({
                  label: name,
                  value: name
                }))
              ]}
            />

            {/* Location Filter */}
            <AdminCustomSelect
              label="Location"
              value={filters.location}
              onChange={(value) => setFilters({ ...filters, location: value })}
              options={[
                { label: 'All Locations', value: 'all' },
                ...locations.map((location, index) => ({
                  label: location || 'Unknown Location',
                  value: location || `location-${index}`
                }))
              ]}
            />

            {/* Car Type Filter */}
            <AdminCustomSelect
              label="Car Type"
              value={filters.carType}
              onChange={(value) => setFilters({ ...filters, carType: value })}
              options={[
                { label: 'All Types', value: 'all' },
                { label: 'Sedan', value: 'sedan' },
                { label: 'SUV', value: 'suv' },
                { label: 'Hatchback', value: 'hatchback' },
                { label: 'Luxury', value: 'luxury' },
              ]}
            />

            {/* Price Range Filter */}
            <AdminCustomSelect
              label="Price Range"
              value={filters.priceRange}
              onChange={(value) => setFilters({ ...filters, priceRange: value })}
              options={[
                { label: 'All Prices', value: 'all' },
                { label: '₹0 - ₹1,000', value: '0-1000' },
                { label: '₹1,000 - ₹2,000', value: '1000-2000' },
                { label: '₹2,000+', value: '2000+' },
              ]}
            />
          </div>
        </Card>

        {/* Cars List */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredCars.length}</span> of <span className="font-semibold">{cars.length}</span> cars
          </p>
        </div>

        {/* List View */}
        <div className="space-y-4">
          {paginatedCars.map((car) => (
            <Card 
              key={car.id} 
              className={`p-4 hover:shadow-lg transition-all ${
                car.availability === 'undermaintenance'
                  ? 'bg-gradient-to-r from-red-100/90 to-rose-100/50 border border-red-300 shadow-red-100/20'
                  : ''
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Car Image */}
                <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {car.imageUrl ? (
                    <img
                      src={car.imageUrl}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${car.imageUrl ? 'hidden' : ''}`}
                    style={{ display: car.imageUrl ? 'none' : 'flex' }}
                  >
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Car Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                        <span>{car.brand} {car.model} {car.year ? `(${car.year})` : ''}</span>
                        {car.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFeatured(car.id);
                            }}
                            className="p-1 hover:bg-red-50 rounded-full transition-all duration-200 group active:scale-90 flex items-center justify-center"
                            title={car.isFeatured ? "Remove from Best Cars" : "Add to Best Cars"}
                          >
                            <svg 
                              className={`w-3.5 h-3.5 transition-colors ${car.isFeatured ? 'text-red-500 fill-red-500' : 'text-gray-400 group-hover:text-red-500'}`} 
                              fill={car.isFeatured ? "currentColor" : "none"} 
                              stroke="currentColor" 
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                              />
                            </svg>
                          </button>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 flex items-center flex-wrap gap-2">
                        <span>{getCarTypeName(car.carType)} • {car.location}</span>
                        {car.registrationNumber && (
                          <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase border border-gray-300 tracking-wider font-mono">
                            {car.registrationNumber}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(car.status)}`}>
                        {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(car.availability)}`}>
                        {getAvailabilityName(car.availability)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        car.source === 'outward' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {car.source === 'outward' ? 'Outward Car' : 'Inward Car'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Price/Day</p>
                      <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                        ₹{car.pricePerDay.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Bookings</p>
                      <p className="text-sm font-semibold text-gray-900">{car.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="text-sm font-semibold text-gray-900">₹{car.totalRevenue.toLocaleString()}</p>
                    </div>
                    {car.rating > 0 && (
                      <div>
                        <p className="text-xs text-gray-600">Rating</p>
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                          ⭐ {car.rating}
                          <button
                            onClick={() => handleViewReviews(car)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-purple-600"
                            title="View Reviews"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-600">
                    <span>Owner: </span>
                    <span className="font-medium text-gray-900">{car.ownerName}</span>
                    <span className="mx-2">•</span>
                    <span>{car.ownerEmail}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-48">
                  <button
                    onClick={() => handleViewCar(car)}
                    className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: colors.backgroundTertiary }}
                  >
                    View Details
                  </button>
                  {/* Status-specific Action Button Row */}
                  {car.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(car.id)}
                        className="flex-1 px-3 py-2 text-xs md:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(car.id)}
                        className="flex-1 px-3 py-2 text-xs md:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-center"
                      >
                        Reject
                      </button>
                    </div>
                  ) : car.status === 'active' ? (
                    <button
                      onClick={() => handleSuspend(car.id)}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors text-center"
                    >
                      Suspend
                    </button>
                  ) : (car.status === 'suspended' || car.status === 'inactive') ? (
                    <button
                      onClick={() => handleActivate(car.id)}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-center"
                    >
                      Activate
                    </button>
                  ) : null}

                  {/* Secondary actions: Delete + Record Side by Side */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this car?')) {
                          handleDelete(car.id);
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs md:text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-center"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleViewRecord(car)}
                      className="flex-1 px-2 py-2 text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Record
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCars.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No cars found matching your filters.</p>
          </Card>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg mt-6 shadow-sm">
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
                  <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredCars.length)}</span> of{' '}
                  <span className="font-semibold">{filteredCars.length}</span> results
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

      {/* Car Detail Modal */}
      {showCarDetail && selectedCar && (
        <CarDetailModal
          car={selectedCar}
          onClose={() => {
            setShowCarDetail(false);
            setSelectedCar(null);
          }}
          onEdit={handleEditCar}
          onApprove={handleApprove}
          onReject={handleReject}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
          onDelete={handleDelete}
        />
      )}

      {/* Car Reviews Modal */}
      {showReviewsModal && reviewsCar && (
        <CarReviewsModal
          car={reviewsCar}
          onClose={() => {
            setShowReviewsModal(false);
            setReviewsCar(null);
          }}
        />
      )}

      {/* Car Record Modal */}
      {showRecordModal && recordCar && (
        <CarRecordModal
          car={recordCar}
          onClose={() => {
            setShowRecordModal(false);
            setRecordCar(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Car Detail Modal Component
 */
const CarDetailModal = ({ car, onClose, onEdit, onApprove, onReject, onSuspend, onActivate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (activeTab === 'reviews' && car?.id) {
      const fetchReviews = async () => {
        try {
          setLoadingReviews(true);
          const response = await api.get(`/reviews/car/${car.id}`);
          if (response.data && response.data.success) {
            setReviews(response.data.data.reviews || []);
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [activeTab, car?.id]);

  if (!car) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {car.brand} {car.model} ({car.year})
            </h2>
            <p className="text-sm text-gray-600">{car.location}</p>
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
        <div className="p-6">
          {/* Tabs — hide 'bookings' tab for outward cars */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['details', 'owner', ...(car.source !== 'outward' ? ['bookings'] : []), 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === tab
                    ? 'border-b-2 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
                style={activeTab === tab ? { borderBottomColor: colors.backgroundTertiary } : {}}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Car Images */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Car Images</h3>
                  {car.images && car.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {car.images.map((image, index) => (
                        <div key={index} className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden group">
                          <img
                            src={image.url || image}
                            alt={`${car.brand} ${car.model} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full absolute inset-0 bg-gray-200 rounded-lg items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {image.isPrimary && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="ml-2 text-gray-500 text-sm">No images available</span>
                    </div>
                  )}
                </div>

                {/* Car Specifications */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Brand</label>
                      <p className="text-sm text-gray-900">{car.brand}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Model</label>
                      <p className="text-sm text-gray-900">{car.model}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Year</label>
                      <p className="text-sm text-gray-900">{car.year}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{car.carType}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Price/Day</label>
                      <p className="text-sm font-semibold" style={{ color: colors.backgroundTertiary }}>
                        ₹{car.pricePerDay.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{car.location}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Status</label>
                      <p className="text-sm text-gray-900 capitalize">{car.status}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Availability</label>
                      <p className="text-sm text-gray-900 capitalize">{car.availability}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {car.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{car.description}</p>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Total Bookings</label>
                      <p className="text-sm font-semibold text-gray-900">{car.totalBookings}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Total Revenue</label>
                      <p className="text-sm font-semibold text-gray-900">₹{car.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Rating</label>
                      <p className="text-sm font-semibold text-gray-900">
                        {car.rating > 0 ? `⭐ ${car.rating}` : 'No ratings yet'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Registration Date</label>
                      <p className="text-sm text-gray-900">{new Date(car.registrationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'owner' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{car.ownerName || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{car.ownerEmail || '—'}</p>
                  </div>
                  {car.ownerPhone && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{car.ownerPhone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-700">{car.source === 'outward' ? 'Outward Car ID' : 'Owner ID'}</label>
                    <p className="text-sm text-gray-900 font-mono break-all">{car.source === 'outward' ? car.id : car.ownerId || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking History</h3>
                <p className="text-gray-600">Total Bookings: {car.totalBookings}</p>
                <p className="text-sm text-gray-500 mt-2">Booking history will be displayed here...</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Ratings</h3>
                <p className="text-gray-600 mb-4">Average Rating: {car.rating > 0 ? `⭐ ${car.rating}` : 'No ratings yet'}</p>
                {loadingReviews ? (
                  <p className="text-sm text-gray-500">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No reviews found for this car yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                              {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Anonymous User'}</p>
                              <p className="text-xxs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-yellow-500">⭐ {review.rating}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onEdit(car);
              onClose();
            }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Edit
          </button>
          {car.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  onApprove(car.id);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  onReject(car.id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {car.status === 'active' && (
            <button
              onClick={() => {
                onSuspend(car.id);
                onClose();
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Suspend
            </button>
          )}
          {(car.status === 'suspended' || car.status === 'inactive') && (
            <button
              onClick={() => {
                onActivate(car.id);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Activate
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this car?')) {
                onDelete(car.id);
                onClose();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Car Reviews Modal Component
 */
const CarReviewsModal = ({ car, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/reviews/car/${car.id}`);
        if (response.data && response.data.success) {
          setReviews(response.data.data.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    if (car?.id) {
      fetchReviews();
    }
  }, [car]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Reviews for {car.brand} {car.model}
            </h2>
            <p className="text-xs text-gray-500">Average Rating: ⭐ {car.rating}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No reviews found for this car yet.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                        {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Anonymous User'}</p>
                        <p className="text-xxs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-yellow-500">⭐ {review.rating}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10">"{review.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Car Record & Analytics Modal Component
 */
const CarRecordModal = ({ car, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getCarRecord(car.id);
        if (response.success && response.data) {
          setRecord(response.data);
        } else {
          setError('Failed to load booking record data');
        }
      } catch (err) {
        console.error('Error fetching car record:', err);
        setError(err.response?.data?.message || 'Error loading booking records');
      } finally {
        setLoading(false);
      }
    };

    if (car?.id) {
      fetchRecord();
    }
  }, [car]);

  if (!car) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'bg-green-100 text-green-800 border border-green-200';
    if (s === 'active') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (s === 'cancelled') return 'bg-red-100 text-red-800 border border-red-200';
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-150 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded border border-indigo-100 uppercase">
                {car.source === 'outward' ? 'Outward Car' : 'Inward Car'}
              </span>
              <span className="text-sm font-semibold text-gray-500">{car.registrationNumber}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Booking Record & Analytics: {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-gray-650"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-semibold">Fetching booking analytics & records...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100 p-6">
              <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-bold text-lg mb-1 text-red-650">Failed to retrieve data</h3>
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : !record ? (
            <div className="py-20 text-center text-gray-450">No record data found.</div>
          ) : (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 border border-indigo-100 rounded-2xl">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-1">Total Bookings</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-950">{record.analytics.totalBookings}</span>
                    <span className="text-xs text-indigo-600 font-bold">overall</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-100 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Total Revenue</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-950">₹{record.analytics.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-amber-100 rounded-2xl">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">Pending Amount</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-950">₹{record.analytics.pendingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Trip Breakdown</span>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xxs font-bold">
                    <div className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                      {record.analytics.completedBookings} Done
                    </div>
                    <div className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {record.analytics.activeBookings} Live
                    </div>
                    <div className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      {record.analytics.cancelledBookings} Cancel
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking History Table */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  All Booking Transactions & History
                </h3>

                {record.bookings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-250 p-6">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-350" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-bold text-sm">No bookings recorded for this vehicle yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Bookings will appear here as customers rent this vehicle.</p>
                  </div>
                ) : (
                  <div className="border border-gray-150 rounded-xl overflow-hidden shadow-sm bg-white overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-150 font-black">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Booking ID</th>
                          <th className="px-4 py-3">Rental Period</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Paid</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {record.bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              <div>{booking.customerName}</div>
                              <div className="text-xxs text-gray-450 font-medium mt-0.5">
                                {booking.customerPhone} • {booking.customerEmail}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono font-bold text-indigo-750">
                              #{booking.bookingId}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-gray-700">
                              <span className="block">{formatDate(booking.fromDate)}</span>
                              <span className="block text-gray-400 text-xxs font-normal mt-0.5">to {formatDate(booking.toDate)}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              ₹{(booking.totalPrice || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-emerald-700">
                              ₹{(booking.paidAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase inline-block ${getStatusBadgeClass(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase inline-block ${
                                booking.source === 'outward' 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : booking.source === 'inward'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {booking.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarListPage;

