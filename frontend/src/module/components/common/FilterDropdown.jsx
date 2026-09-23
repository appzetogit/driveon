import { useState, useRef, useEffect } from 'react';
import { colors } from '../../theme/colors';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';


/**
 * FilterDropdown Component
 * Dropdown with all filter options based on document.txt specifications
 * Includes: Brand, Model, Seats, Fuel Type, Transmission, Color, Price Range, Rating, Location, Availability, Features, Car Type
 */
const FilterDropdown = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters, // Track currently applied filters
  brands,
  fuelTypes,
  transmissions,
  colorsList,
  carTypes,
  featuresList,
  seatOptions,
  ratingOptions,
  locations
}) => {
  const dropdownRef = useRef(null);
  const desktopRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    seats: '',
    fuelType: '',
    transmission: '',
    color: '',
    priceRange: { min: '', max: '' },
    rating: '',
    location: '',
    carType: '',
    features: [],
    availableFrom: '',
    availableTo: '',
  });

  // Sync internal filters with parent appliedFilters when dropdown opens
  useEffect(() => {
    if (isOpen && initialFilters) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  // Close dropdown when clicking outside (mobile only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close on mobile (when dropdown is visible)
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
        // Desktop: Don't close on click outside
        return;
      }

      // Check if click is outside the dropdown
      if (dropdownRef.current) {
        const clickedElement = event.target;

        // Check if the click target is inside the dropdown or any of its children
        const isClickInside = dropdownRef.current.contains(clickedElement);

        // Check if click is on the filter button that opened the modal (should not close)
        const isFilterButton = clickedElement.closest('[aria-label="Open filters"]');

        // Only close if click is truly outside (not inside dropdown, not on filter button)
        if (!isClickInside && !isFilterButton) {
          onClose();
        }
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Filter options - use props if provided, otherwise use empty arrays (fully dynamic)
  // Only use defaults if no props are provided at all (for backward compatibility)
  const defaultBrands = ['Tesla', 'Lamborghini', 'BMW', 'Ferrari', 'Toyota', 'Honda', 'Mercedes', 'Audi'];
  const defaultFuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const defaultTransmissions = ['Manual', 'Automatic', 'CVT'];
  const defaultColorsList = ['Black', 'White', 'Red', 'Blue', 'Silver', 'Gray', 'Other'];
  const defaultCarTypes = ['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Convertible', 'Wagon'];
  const defaultFeaturesList = ['GPS Navigation', 'Bluetooth', 'USB Charging', 'Air Conditioning', 'Sunroof', 'Leather Seats', 'Backup Camera', 'Parking Sensors'];
  const defaultSeatOptions = ['2', '4', '5', '7', '8+'];
  const defaultRatingOptions = ['4.0+', '4.5+', '5.0'];

  // Use dynamic props if provided (even if empty), only fallback to defaults if props are undefined
  // This ensures that if SearchPage passes empty arrays, we use those (fully dynamic)
  // Always ensure arrays are defined to prevent undefined errors
  const filterBrands = brands !== undefined ? (Array.isArray(brands) && brands.length > 0 ? brands : []) : defaultBrands;
  const filterFuelTypes = fuelTypes !== undefined ? (Array.isArray(fuelTypes) && fuelTypes.length > 0 ? fuelTypes : []) : defaultFuelTypes;
  const filterTransmissions = transmissions !== undefined ? (Array.isArray(transmissions) && transmissions.length > 0 ? transmissions : []) : defaultTransmissions;
  const filterColorsList = colorsList !== undefined ? (Array.isArray(colorsList) && colorsList.length > 0 ? colorsList : []) : defaultColorsList;
  const filterCarTypes = carTypes !== undefined ? (Array.isArray(carTypes) && carTypes.length > 0 ? carTypes : []) : defaultCarTypes;
  const filterFeaturesList = featuresList !== undefined ? (Array.isArray(featuresList) && featuresList.length > 0 ? featuresList : []) : defaultFeaturesList;
  const filterSeatOptions = seatOptions !== undefined ? (Array.isArray(seatOptions) && seatOptions.length > 0 ? seatOptions : []) : defaultSeatOptions;
  const filterRatingOptions = ratingOptions !== undefined ? (Array.isArray(ratingOptions) && ratingOptions.length > 0 ? ratingOptions : []) : defaultRatingOptions;
  const filterLocations = locations !== undefined ? (Array.isArray(locations) && locations.length > 0 ? locations : []) : [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        [key]: value
      };
      
      // Save dates to localStorage when availableFrom or availableTo changes
      if (key === 'availableFrom' || key === 'availableTo') {
        try {
          // Parse date format (YYYY-MM-DDTHH:mm) to separate date and time
          if (value) {
            const [datePart, timePart] = value.split('T');
            const dates = {
              pickupDate: key === 'availableFrom' ? datePart : (updatedFilters.availableFrom ? updatedFilters.availableFrom.split('T')[0] : ''),
              pickupTime: key === 'availableFrom' ? timePart : (updatedFilters.availableFrom ? updatedFilters.availableFrom.split('T')[1] : ''),
              dropDate: key === 'availableTo' ? datePart : (updatedFilters.availableTo ? updatedFilters.availableTo.split('T')[0] : ''),
              dropTime: key === 'availableTo' ? timePart : (updatedFilters.availableTo ? updatedFilters.availableTo.split('T')[1] : ''),
            };
            localStorage.setItem('selectedBookingDates', JSON.stringify(dates));
          } else {
            // If clearing a date, update localStorage accordingly
            const existingDates = JSON.parse(localStorage.getItem('selectedBookingDates') || '{}');
            if (key === 'availableFrom') {
              existingDates.pickupDate = '';
              existingDates.pickupTime = '';
            } else {
              existingDates.dropDate = '';
              existingDates.dropTime = '';
            }
            localStorage.setItem('selectedBookingDates', JSON.stringify(existingDates));
          }
        } catch (error) {
          console.error('Error saving dates to localStorage:', error);
        }
      }
      
      return updatedFilters;
    });
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const cleared = {
      brand: '',
      model: '',
      seats: '',
      fuelType: '',
      transmission: '',
      color: '',
      priceRange: { min: '', max: '' },
      rating: '',
      location: '',
      carType: '',
      features: [],
      availableFrom: '',
      availableTo: '',
    };
    setFilters(cleared);
    onApplyFilters(cleared);
    onClose();
  };

  // On mobile, only show if isOpen is true (dropdown)
  // On desktop, always show as sidebar when isOpen is true
  return (
    <>
      <AnimatePresence>
        {/* Unified Modal - Popup for Mobile, Sidebar for Desktop (or center modal if preferred) */}
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col md:max-w-xl`}
              style={{
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <div className="flex-1 overflow-y-auto">
                {renderFilterContent(false)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animation Styles and Theme Colors for Dropdowns/Calendar */}
      <style>{`
        @keyframes slideUpModal {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .filter-modal-content {
          animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDownFilter {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        /* Style for select dropdowns - theme colors with proper scoping */
        .filter-dropdown select {
          background-color: ${colors.backgroundSecondary} !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000000' d='M6 9L1 4h10z'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.5rem center !important;
          background-size: 1em 1em !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderForm} !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          padding-right: 2.5rem !important;
        }
        
        .filter-dropdown select:focus {
          outline: none !important;
          border-color: ${colors.backgroundTertiary} !important;
          box-shadow: 0 0 0 2px ${colors.shadowFocus} !important;
        }
        
        .filter-dropdown select option {
          background-color: ${colors.backgroundSecondary} !important;
          color: ${colors.textPrimary} !important;
          padding: 0.5rem !important;
        }
        
        .filter-dropdown select option:hover,
        .filter-dropdown select option:checked {
          background-color: ${colors.backgroundTertiary} !important;
          color: ${colors.backgroundSecondary} !important;
        }
        
        /* Style for datetime-local inputs - theme colors */
        .filter-dropdown input[type="datetime-local"] {
          background-color: ${colors.backgroundSecondary} !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderForm} !important;
        }
        
        .filter-dropdown input[type="datetime-local"]:focus {
          outline: none !important;
          border-color: ${colors.backgroundTertiary} !important;
          box-shadow: 0 0 0 2px ${colors.shadowFocus} !important;
        }
        
        /* Calendar picker styling (webkit) - theme colors */
        .filter-dropdown input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: none !important;
          cursor: pointer !important;
          opacity: 1 !important;
          background-color: transparent !important;
        }
        
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit {
          color: ${colors.textPrimary} !important;
        }
        
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit-fields-wrapper {
          color: ${colors.textPrimary} !important;
        }
        
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit-text {
          color: ${colors.textPrimary} !important;
        }
        
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit-month-field,
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit-day-field,
        .filter-dropdown input[type="datetime-local"]::-webkit-datetime-edit-year-field {
          color: ${colors.textPrimary} !important;
        }
        
        /* Calendar picker styling (firefox) */
        .filter-dropdown input[type="datetime-local"]::-moz-calendar-picker-indicator {
          filter: none !important;
          cursor: pointer !important;
        }
        
        /* Number inputs styling */
        .filter-dropdown input[type="number"] {
          background-color: ${colors.backgroundSecondary} !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderForm} !important;
        }
        
        .filter-dropdown input[type="number"]:focus {
          outline: none !important;
          border-color: ${colors.backgroundTertiary} !important;
          box-shadow: 0 0 0 2px ${colors.shadowFocus} !important;
        }
        
        /* Text inputs styling */
        .filter-dropdown input[type="text"] {
          background-color: ${colors.backgroundSecondary} !important;
          color: ${colors.textPrimary} !important;
          border-color: ${colors.borderForm} !important;
        }
        
        .filter-dropdown input[type="text"]:focus {
          outline: none !important;
          border-color: ${colors.backgroundTertiary} !important;
          box-shadow: 0 0 0 2px ${colors.shadowFocus} !important;
        }
      `}</style>
    </>
  );

  function renderFilterContent(isDesktop) {
    return (
      <>
        {/* Header */}
        <div
          className="sticky top-0 z-20 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.borderForm
          }}
        >
          <h3 className="text-base md:text-lg font-bold" style={{ color: colors.textPrimary }}>
            Filters
          </h3>
          {/* Close button - Only show on mobile */}
          {!isDesktop && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close filters"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className="p-3 md:p-4 space-y-3 md:space-y-4"
          onMouseDown={(e) => {
            // Prevent clicks inside filter content from closing the modal
            e.stopPropagation();
          }}
        >
          {/* Brand */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Brand
            </label>
            <CustomSelect
              value={filters.brand}
              onChange={(value) => handleFilterChange('brand', value)}
              options={[
                { label: 'All Brands', value: '' },
                ...filterBrands.map(brand => ({ label: brand, value: brand }))
              ]}
              placeholder="All Brands"
            />
          </div>

          {/* Model */}
          <div onClick={(e) => e.stopPropagation()}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Model
            </label>
            <input
              type="text"
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter model name"
              className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
              style={{
                borderColor: colors.borderForm,
                backgroundColor: colors.backgroundSecondary,
                color: colors.textPrimary
              }}
            />
          </div>

          {/* Seats */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Seats
            </label>
            <CustomSelect
              value={filters.seats}
              onChange={(value) => handleFilterChange('seats', value)}
              options={[
                { label: 'Any', value: '' },
                ...filterSeatOptions.map(seats => ({ label: `${seats} Seats`, value: seats }))
              ]}
              placeholder="Any"
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Fuel Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterFuelTypes.map(fuel => (
                <button
                  key={fuel}
                  onClick={() => handleFilterChange('fuelType', filters.fuelType === fuel ? '' : fuel)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.fuelType === fuel
                    ? 'text-white'
                    : 'border'
                    }`}
                  style={
                    filters.fuelType === fuel
                      ? { backgroundColor: colors.backgroundTertiary }
                      : {
                        borderColor: colors.borderForm,
                        color: colors.textPrimary,
                        backgroundColor: colors.backgroundSecondary
                      }
                  }
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Transmission
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterTransmissions.map(trans => (
                <button
                  key={trans}
                  onClick={() => handleFilterChange('transmission', filters.transmission === trans ? '' : trans)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.transmission === trans
                    ? 'text-white'
                    : 'border'
                    }`}
                  style={
                    filters.transmission === trans
                      ? { backgroundColor: colors.backgroundTertiary }
                      : {
                        borderColor: colors.borderForm,
                        color: colors.textPrimary,
                        backgroundColor: colors.backgroundSecondary
                      }
                  }
                >
                  {trans}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Color
            </label>
            <CustomSelect
              value={filters.color}
              onChange={(value) => handleFilterChange('color', value)}
              options={[
                { label: 'Any Color', value: '' },
                ...filterColorsList.map(color => ({ label: color, value: color }))
              ]}
              placeholder="Any Color"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Price Range (per day)
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                placeholder="Min"
                className="w-24 px-3 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: colors.borderForm,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary
                }}
              />
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                placeholder="Max"
                className="w-24 px-3 py-2 rounded-lg border text-sm"
                style={{
                  borderColor: colors.borderForm,
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.textPrimary
                }}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Minimum Rating
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterRatingOptions.map(rating => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('rating', filters.rating === rating ? '' : rating)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.rating === rating
                    ? 'text-white'
                    : 'border'
                    }`}
                  style={
                    filters.rating === rating
                      ? { backgroundColor: colors.backgroundTertiary }
                      : {
                        borderColor: colors.borderForm,
                        color: colors.textPrimary,
                        backgroundColor: colors.backgroundSecondary
                      }
                  }
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          {/* Car Type */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Car Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterCarTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('carType', filters.carType === type ? '' : type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.carType === type
                    ? 'text-white'
                    : 'border'
                    }`}
                  style={
                    filters.carType === type
                      ? { backgroundColor: colors.backgroundTertiary }
                      : {
                        borderColor: colors.borderForm,
                        color: colors.textPrimary,
                        backgroundColor: colors.backgroundSecondary
                      }
                  }
                >
                  {type}
                </button>
              ))}
            </div>
          </div>


          {/* Features */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textPrimary }}>
              Features
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filterFeaturesList.map(feature => (
                <button
                  key={feature}
                  onClick={() => handleFeatureToggle(feature)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.features.includes(feature)
                    ? 'text-white'
                    : 'border'
                    }`}
                  style={
                    filters.features.includes(feature)
                      ? { backgroundColor: colors.backgroundTertiary }
                      : {
                        borderColor: colors.borderForm,
                        color: colors.textPrimary,
                        backgroundColor: colors.backgroundSecondary
                      }
                  }
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 px-3 md:px-4 py-2 md:py-3 flex gap-2 border-t"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.borderForm
          }}
        >
          <button
            onClick={handleReset}
            className="flex-1 px-3 py-2 rounded-lg font-medium text-xs border transition-colors"
            style={{
              borderColor: colors.borderForm,
              color: colors.textPrimary,
              backgroundColor: colors.backgroundSecondary
            }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-2 rounded-lg font-medium text-xs text-white transition-colors"
            style={{ backgroundColor: colors.backgroundTertiary }}
          >
            Apply Filters
          </button>
        </div>
      </>
    );
  }
};

export default FilterDropdown;

