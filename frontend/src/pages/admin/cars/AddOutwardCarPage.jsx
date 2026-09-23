import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { Button } from '../../../components/common';
import { crmService } from '../../../services/crm.service';
import api from '../../../services/api';
import toastUtils from '../../../config/toast';

const isValidPhone = (value) => {
  if (!value) return false;
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 10;
};

const isValidCarNumber = (num) => {
  if (!num) return false;
  const cleaned = String(num).replace(/[^A-Z0-9]/g, '').toUpperCase();
  const regex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  return regex.test(cleaned);
};

const AddOutwardCarPage = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  
  // View states: 'list' or 'form'
  const [mode, setMode] = useState('list');
  const [editingCarId, setEditingCarId] = useState(null);
  
  // List States
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [agreementPricePerDay, setAgreementPricePerDay] = useState('');
  const [agreementPricePerMonth, setAgreementPricePerMonth] = useState('');
  const [vendorAgreementType, setVendorAgreementType] = useState('daily');
  const [carNumber, setCarNumber] = useState('');
  const [carNumberTouched, setCarNumberTouched] = useState(false);
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [rating, setRating] = useState('5');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  
  const availableFeatures = [
    'AC', 'GPS', 'Bluetooth', 'USB Charging', 'Reverse Camera',
    'Parking Sensors', 'Sunroof', 'Leather Seats', 'Keyless Entry',
    'Push Start', 'Airbags', 'ABS', 'Cruise Control', 'Music System',
    'Power Windows', 'Power Steering', 'Fog Lights', 'Alloy Wheels',
  ];

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // CRM Autocomplete States
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch Outward Cars registered in the database
  const fetchCars = async () => {
    try {
      setLoadingCars(true);
      const response = await api.get('/fleet/outward-cars');
      if (response.data.success) {
        setCars(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load outward cars', err);
      toastUtils.error('Failed to fetch outward cars list');
    } finally {
      setLoadingCars(false);
    }
  };

  // Fetch CRM Vendors for owner autocompletion
  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await crmService.getVendors();
      if (response.success && response.data?.vendors) {
        setVendors(response.data.vendors);
      }
    } catch (err) {
      console.error('Failed to load CRM vendors', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCars();
    fetchVendors();
  }, []);

  // Listen for navigation state triggers to edit a specific car
  useEffect(() => {
    if (routerLocation.state?.editCarId && cars.length > 0) {
      const carToEdit = cars.find((c) => c.id === routerLocation.state.editCarId);
      if (carToEdit) {
        handleEditClick(carToEdit);
        // Clear history state to avoid triggering edit on refresh/back
        window.history.replaceState({}, document.title);
      }
    }
  }, [routerLocation.state, cars]);

  // Auto-fill owner's phone if a matched vendor is selected
  useEffect(() => {
    if (ownerName && vendors.length > 0) {
      const matchedVendor = vendors.find(
        (v) => v.name.toLowerCase() === ownerName.trim().toLowerCase()
      );
      if (matchedVendor && matchedVendor.phone) {
        setOwnerPhone(matchedVendor.phone);
      }
    }
  }, [ownerName, vendors]);

  // Form submission check
  const canSubmit = useMemo(() => {
    if (!ownerName.trim()) return false;
    if (!isValidPhone(ownerPhone)) return false;
    if (!brand.trim()) return false;
    if (!model.trim()) return false;
    if (!location.trim()) return false;
    const price = Number(pricePerDay);
    if (!Number.isFinite(price) || price <= 0) return false;
    if (!carNumber.trim()) return false;
    if (!isValidCarNumber(carNumber)) return false;
    return true;
  }, [ownerName, ownerPhone, brand, model, location, pricePerDay, carNumber]);

  // Filter cars based on search query
  const filteredCars = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return cars;
    const keywords = trimmedQuery.split(/\s+/).filter(Boolean);
    return cars.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const brand = (c.brand || '').toLowerCase();
      const model = (c.model || '').toLowerCase();
      const ownerName = (c.ownerName || '').toLowerCase();
      const location = (c.location || '').toLowerCase();
      const carNumber = (c.carNumber || c.registrationNumber || '').toLowerCase();

      return keywords.every((keyword) =>
        name.includes(keyword) ||
        brand.includes(keyword) ||
        model.includes(keyword) ||
        ownerName.includes(keyword) ||
        location.includes(keyword) ||
        carNumber.includes(keyword)
      );
    });
  }, [cars, searchQuery]);

  const resetForm = () => {
    setOwnerName('');
    setOwnerPhone('');
    setBrand('');
    setModel('');
    setLocation('');
    setPricePerDay('');
    setAgreementPricePerDay('');
    setAgreementPricePerMonth('');
    setVendorAgreementType('daily');
    setCarNumber('');
    setCarNumberTouched(false);
    setImage('');
    setImagePreview('');
    setRating('5');
    setSelectedFeatures([]);
    setEditingCarId(null);
    setError('');
  };

  const handleOpenForm = () => {
    resetForm();
    setMode('form');
  };

  const handleCloseForm = () => {
    resetForm();
    setMode('list');
  };

  // Convert selected car image file to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toastUtils.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Click Edit handler
  const handleEditClick = (car) => {
    setEditingCarId(car.id);
    setBrand(car.brand || '');
    setModel(car.model || '');
    setCarNumber(car.carNumber || car.registrationNumber || '');
    setLocation(car.location || '');
    setPricePerDay(String(car.pricePerDay || ''));
    setAgreementPricePerDay(String(car.agreementPricePerDay || ''));
    setAgreementPricePerMonth(String(car.agreementPricePerMonth || ''));
    setVendorAgreementType(car.vendorAgreementType || 'daily');
    setOwnerName(car.ownerName || '');
    setOwnerPhone(car.ownerPhone || '');
    setImage('');
    setImagePreview(car.image || '');
    setRating(String(car.rating || '5'));
    setSelectedFeatures(car.features || []);
    setMode('form');
  };

  // Click Delete handler
  const handleDeleteClick = async (carId) => {
    if (window.confirm('Are you sure you want to delete this outward car? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/fleet/outward-cars/${carId}`);
        if (response.data.success) {
          toastUtils.success('Outward car deleted successfully!');
          fetchCars();
        } else {
          throw new Error(response.data.message || 'Failed to delete car');
        }
      } catch (err) {
        console.error('Failed to delete outward car:', err);
        toastUtils.error(err?.response?.data?.message || err?.message || 'Failed to delete outward car');
      }
    }
  };

  // Handle Form submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please fill in all required fields with valid details.');
      return;
    }

    setSubmitting(true);
    try {
      const carPayload = {
        id: editingCarId || `fleet_car_out_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: `${brand.trim()} ${model.trim()}`,
        brand: brand.trim(),
        model: model.trim(),
        pricePerDay: Number(pricePerDay),
        agreementPricePerDay: Number(agreementPricePerDay) || 0,
        agreementPricePerMonth: Number(agreementPricePerMonth) || 0,
        vendorAgreementType: vendorAgreementType,
        location: location.trim(),
        type: 'OUTWARD',
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        carNumber: carNumber.trim().toUpperCase(),
        rating: Number(rating) || 5,
        features: selectedFeatures,
        createdAt: new Date().toISOString(),
      };

      // Only attach base64 image if a new file was chosen
      if (image) {
        carPayload.image = image;
      }

      const url = editingCarId 
        ? `/fleet/outward-cars/${editingCarId}`
        : '/fleet/outward-cars';
        
      const method = editingCarId ? 'put' : 'post';
      const response = await api[method](url, carPayload);

      if (response.data.success) {
        toastUtils.success(editingCarId ? 'Outward car updated successfully!' : 'Outward car added successfully!');
        resetForm();
        setMode('list');
        fetchCars(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to save car to database');
      }
    } catch (err) {
      console.error('Failed to save outward car:', err);
      setError(err?.response?.data?.message || err?.message || 'Something went wrong while saving the car.');
      toastUtils.error('Failed to save outward car');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {mode === 'list' ? (
          /* List Mode */
          <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                  Outward Cars Management
                </h1>
                <p className="text-sm mt-1 text-gray-500">
                  Manage and view all external owner vehicles registered to the fleet inventory
                </p>
              </div>
              <Button
                onClick={handleOpenForm}
                className="py-2.5 px-5 text-sm font-semibold rounded-xl text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                style={{
                  backgroundColor: colors.backgroundTertiary,
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Outward Car
              </Button>
            </div>

            {/* Toolbar section */}
            <Card className="p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search cars by name, brand, model, registration no, owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all bg-white"
                  style={{ borderColor: colors.borderMedium }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.backgroundTertiary;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.borderMedium;
                  }}
                />
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Showing {filteredCars.length} of {cars.length} Outward Cars
              </div>
            </Card>

            {/* Grid Cars display */}
            {loadingCars ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <span className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colors.backgroundTertiary} transparent ${colors.backgroundTertiary} ${colors.backgroundTertiary}` }} />
                <p className="text-gray-500 font-medium animate-pulse text-sm">Loading outward fleet cars...</p>
              </div>
            ) : filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <Card key={car.id || car._id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: colors.backgroundTertiary }} />
                    
                    {/* Car Image Header with dynamic ratings and actions overlay */}
                    <div className="w-full h-44 bg-gray-100 relative overflow-hidden flex-shrink-0">
                      {car.image ? (
                        <img
                          src={car.image}
                          alt={car.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 text-indigo-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mt-2">No Image</span>
                        </div>
                      )}

                      {/* Floating Badge overlay */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold flex items-center gap-1 backdrop-blur-sm shadow-sm">
                          ⭐ {car.rating || 5}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-900/80 text-white text-[11px] font-bold backdrop-blur-sm shadow-sm">
                          {car.totalBookings || 0} Bookings
                        </span>
                      </div>

                      {/* Hover floating edit/delete buttons overlay */}
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(car);
                          }}
                          className="p-2 rounded-xl bg-white/95 text-indigo-600 hover:bg-indigo-50 active:scale-90 shadow transition-all"
                          title="Edit Outward Car"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(car.id);
                          }}
                          className="p-2 rounded-xl bg-white/95 text-red-600 hover:bg-red-50 active:scale-90 shadow transition-all"
                          title="Delete Outward Car"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                      {/* Name and badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                            {car.name}
                          </h3>
                          <p className="text-xs font-semibold uppercase text-gray-400 mt-0.5 tracking-wider">
                            {car.brand} • {car.model}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-1 bg-gray-100 border border-gray-200/60 rounded-lg text-gray-600 uppercase">
                          {car.carNumber || 'NO NUMBER'}
                        </span>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2.5 text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{car.location}</span>
                        </div>

                        {/* Owner detail aligned below location */}
                        <div className="flex items-center justify-between text-gray-600 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">Owner: <span className="font-semibold text-gray-900">{car.ownerName}</span></span>
                          </div>
                          {car.ownerPhone && (
                            <a
                              href={`tel:${car.ownerPhone}`}
                              className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                              title="Call Owner"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.24.965l-1.42 1.42a13.91 13.91 0 005.3 5.3l1.42-1.42a1 1 0 01.965-.24l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-2C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{car.ownerPhone}</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-6 2h6m-6 2h6M3 10a9 9 0 1118 0 9 9 0 01-18 0z" />
                          </svg>
                          <span className="font-medium text-gray-900">₹{car.pricePerDay} / day</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty state */
              <Card className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-white/50 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">No Outward Cars Registered</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                    Get started by registering external owner vehicles to book and track them in Fleet Management.
                  </p>
                </div>
                <Button
                  onClick={handleOpenForm}
                  className="py-2 px-5 text-sm font-semibold rounded-xl text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ backgroundColor: colors.backgroundTertiary }}
                >
                  Register First Car
                </Button>
              </Card>
            )}
          </div>
        ) : (
          /* Form Mode */
          <div className="max-w-3xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 hover:border-gray-200 text-gray-600 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Back to listing"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                  {editingCarId ? 'Edit Outward Car' : 'Add Outward Car'}
                </h1>
                <p className="text-sm mt-1 text-gray-500">
                  {editingCarId ? 'Update details of the registered external vehicle' : "Register an external owner's vehicle to the fleet inventory"}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm flex gap-3 text-red-600 animate-fadeIn">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Owner Section */}
                <Card className="p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: colors.backgroundTertiary }} />
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: colors.textPrimary }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Owner Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Owner Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={ownerName}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          setOwnerName(selectedName);
                          // Auto fill phone
                          const matched = vendors.find(v => v.name === selectedName);
                          if (matched && matched.phone) {
                            setOwnerPhone(matched.phone);
                          } else {
                            setOwnerPhone('');
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white font-semibold text-gray-700"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">-- Select Onboarded Vendor --</option>
                        {vendors.map((vendor) => (
                          <option key={vendor._id} value={vendor.name}>
                            {vendor.name} ({vendor.phone || 'No Phone'})
                          </option>
                        ))}
                      </select>
                      {loadingVendors && (
                        <span className="absolute right-3 top-10 text-xs text-gray-400">Loading...</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Owner Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setOwnerPhone(val);
                        }}
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {ownerPhone && ownerPhone.length < 10 && (
                        <p className="text-xs mt-1.5 text-red-500 font-medium">
                          Mobile number must be exactly 10 digits.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Car Details Section */}
                <Card className="p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: colors.backgroundTertiary }} />
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: colors.textPrimary }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Vehicle Specifications
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Volkswagen, Maruti"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. A3, Swift"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Car Registration Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={carNumber}
                        onChange={(e) => setCarNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="e.g. MP09AB1234"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white uppercase font-mono tracking-wider"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          setCarNumberTouched(true);
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {carNumberTouched && carNumber && !isValidCarNumber(carNumber) && (
                        <p className="text-xs mt-1.5 text-red-500 font-medium">
                          Invalid format. E.g., MP41HG5263
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Dewas, Indore"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Price Per Day (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={pricePerDay}
                        onChange={(e) => setPricePerDay(e.target.value)}
                        placeholder="e.g. 300, 1200"
                        className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                        style={{
                          borderColor: colors.borderMedium,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.backgroundTertiary;
                          e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.borderMedium;
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        Agreement Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex p-1 rounded-xl bg-gray-100/80 border border-gray-200/50 max-w-md">
                        <button
                          type="button"
                          onClick={() => setVendorAgreementType('daily')}
                          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                            vendorAgreementType === 'daily'
                              ? 'bg-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                          style={{
                            color: vendorAgreementType === 'daily' ? colors.backgroundDark : undefined,
                          }}
                        >
                          Per Day Wise
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorAgreementType('monthly')}
                          className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                            vendorAgreementType === 'monthly'
                              ? 'bg-white shadow-sm'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                          style={{
                            color: vendorAgreementType === 'monthly' ? colors.backgroundDark : undefined,
                          }}
                        >
                          Fixed / Month
                        </button>
                      </div>
                    </div>

                    {vendorAgreementType === 'daily' ? (
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                          Agreement Amount / day (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={agreementPricePerDay}
                          onChange={(e) => setAgreementPricePerDay(e.target.value)}
                          placeholder="e.g. 200, 800"
                          className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                          style={{
                            borderColor: colors.borderMedium,
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.backgroundTertiary;
                            e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = colors.borderMedium;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                          Agreement Amount / month (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={agreementPricePerMonth}
                          onChange={(e) => setAgreementPricePerMonth(e.target.value)}
                          placeholder="e.g. 5000, 20000"
                          className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 bg-white"
                          style={{
                            borderColor: colors.borderMedium,
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = colors.backgroundTertiary;
                            e.target.style.boxShadow = `0 0 0 4px ${colors.shadowFocus}`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = colors.borderMedium;
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Features Section */}
                <Card className="p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: colors.backgroundTertiary }} />
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: colors.textPrimary }}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vehicle Features
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {availableFeatures.map((feature) => (
                      <label key={feature} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="w-4.5 h-4.5 rounded-lg border-gray-300 transition-all cursor-pointer"
                          style={{ accentColor: colors.backgroundTertiary }}
                        />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-900 font-medium transition-colors">{feature}</span>
                      </label>
                    ))}
                  </div>
                </Card>

                {/* Car Photo Section */}
                <Card className="p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: colors.backgroundTertiary }} />
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: colors.textPrimary }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Vehicle Image
                  </h2>
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      Upload Vehicle Photo
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer hover:bg-gray-50 active:scale-98 transition-all" style={{ borderColor: colors.borderMedium }}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      {imagePreview && (
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden border" style={{ borderColor: colors.borderMedium }}>
                          <img src={imagePreview} alt="Car preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImage('');
                              setImagePreview('');
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
                          >×</button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Max size 2MB. Supports PNG, JPG, JPEG.</p>
                  </div>
                </Card>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl border hover:bg-gray-50 transition-all active:scale-98"
                  style={{
                    borderColor: colors.borderMedium,
                    color: colors.textSecondary,
                    backgroundColor: '#ffffff'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl text-white transition-all active:scale-98"
                  style={{
                    backgroundColor: colors.backgroundTertiary,
                    opacity: !canSubmit || submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    editingCarId ? 'Update Outward Car' : 'Add Outward Car'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddOutwardCarPage;
