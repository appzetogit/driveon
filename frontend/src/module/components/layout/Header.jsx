import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import FilterDropdown from '../common/FilterDropdown';
import { useAppSelector } from '../../../hooks/redux';
import { useLocation } from '../../../hooks/useLocation';
import { carService } from '../../../services/car.service';

/**
 * Header Component - Match to design image
 * Top header with status bar, location selector, search bar, and navigation icons
 * Dark background (#1C205C) with abstract patterns
 */
const Header = ({ onHeightChange }) => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  const { user } = useAppSelector((state) => state.user);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Get user location
  const { currentLocation, locationPermission } = useLocation(
    true,
    isAuthenticated,
    user?.id
  );

  // Measure header height and notify parent
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        // Set CSS variable for performance (avoids React state re-renders in parent)
        document.documentElement.style.setProperty('--mobile-header-height', `${height}px`);

        if (onHeightChange) {
          onHeightChange(height);
        }
      }
    };

    // Update height when visibility states change
    updateHeight();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Also update on state changes
    const timeoutId = setTimeout(updateHeight, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isSearchBarVisible, isLocationDropdownOpen, isScrolled, onHeightChange]);

  // Fetch dynamic filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [brandsRes, typesRes] = await Promise.all([
          carService.getTopBrands({ limit: 20 }),
          carService.getTopCarTypes({ limit: 10 })
        ]);

        if (brandsRes.success && brandsRes.data?.brands) {
          // Extract brand names
          const brandNames = brandsRes.data.brands
            .map(b => b.name || b.brand || b)
            .filter(Boolean);
          setBrands([...new Set(brandNames)].sort());
        }

        if (typesRes.success && typesRes.data?.carTypes) {
          // Extract car types
          const typeNames = typesRes.data.carTypes
            .map(t => t.name || t.carType || t)
            .filter(Boolean);
          setCarTypes([...new Set(typeNames)].sort());
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Handle scroll to show/hide location section
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

          // Only update if scroll difference is significant (reduces flickering)
          if (scrollDifference > 5) {
            // If scrolled down more than 50px, hide location
            if (currentScrollY > 50) {
              setIsScrolled(true);
              // Also hide search bar when scrolling down
              if (isSearchBarVisible) {
                setIsSearchBarVisible(false);
              }
            } else {
              setIsScrolled(false);
            }

            lastScrollY.current = currentScrollY;
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSearchBarVisible]);

  const handleFilterClick = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleSearchIconClick = () => {
    setIsSearchBarVisible(!isSearchBarVisible);
  };

  const handleCloseFilter = () => {
    setIsFilterOpen(false);
  };

  const handleApplyFilters = (filters) => {
    console.log('Applied filters:', filters);
    // Construct query parameters
    const params = new URLSearchParams();

    if (filters.brand && filters.brand !== 'All Brands') params.append('brand', filters.brand);
    if (filters.model) params.append('model', filters.model);
    if (filters.seats && filters.seats !== 'Any') params.append('seats', filters.seats);
    if (filters.fuelType) params.append('fuelType', filters.fuelType);
    if (filters.transmission) params.append('transmission', filters.transmission);
    if (filters.color && filters.color !== 'Any Color') params.append('color', filters.color);
    if (filters.minPrice) params.append('minPrice', filters.minPrice); // Assuming generic structure
    if (filters.priceRange?.min) params.append('minPrice', filters.priceRange.min);
    if (filters.priceRange?.max) params.append('maxPrice', filters.priceRange.max);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.location) params.append('location', filters.location);
    if (filters.carType) params.append('carType', filters.carType);
    if (filters.features && filters.features.length > 0) params.append('features', filters.features.join(','));
    if (filters.availableFrom) params.append('pickupDate', filters.availableFrom);
    if (filters.availableTo) params.append('dropoffDate', filters.availableTo);

    // Navigate to search page with params
    navigate(`/search?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <>
      <header
        ref={headerRef}
        className="w-full relative rounded-b-3xl md:rounded-b-none"
        style={{
          backgroundColor: colors.backgroundTertiary,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          width: '100%'
        }}
      >
        {/* Web container - max-width and centered on larger screens */}
        <div className="max-w-7xl mx-auto">
          {/* Status Bar Area (for mobile) */}
          <div className="h-2" style={{ backgroundColor: colors.backgroundTertiary }}></div>

          {/* Abstract Line Graphics Background - Lighter blue patterns */}
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
            <svg
              className="absolute top-0 right-0 w-full h-full"
              viewBox="0 0 400 200"
              fill="none"
              style={{ color: colors.accentBlue }}
            >
              {/* Abstract flowing lines */}
              <path
                d="M50 30 Q150 20, 250 40 T450 50"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-60"
              />
              <path
                d="M80 60 Q180 50, 280 70 T480 80"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-40"
              />
              <path
                d="M30 90 Q130 80, 230 100 T430 110"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-30"
              />
              <path
                d="M100 120 Q200 110, 300 130 T500 140"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="opacity-25"
              />
              {/* Additional subtle lines */}
              <path
                d="M150 10 Q250 0, 350 20"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="opacity-50"
              />
              <path
                d="M200 40 Q300 30, 400 50"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="opacity-35"
              />
            </svg>
          </div>

          {/* Main Header Content */}
          <div className="relative z-10 px-4 pb-4">
            {/* Top Row - Logo and Search Icon */}
            <div className="flex items-center justify-between mb-1 pt-1">
              {/* Left - Logo */}
              <Link to="/" className="flex-shrink-0">
                <img
                  src="/driveonlogo.png"
                  alt="DriveOn Logo"
                  className="h-9 w-auto object-contain"
                />
              </Link>

              {/* Right - Search Icon */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleSearchIconClick}
                  className="relative flex items-center justify-center w-10 h-10"
                  aria-label="Toggle search"
                >
                  {/* Circular search icon with white border */}
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: colors.textWhite }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Location Section - Below Logo */}
            <div className={`mb-0 relative transition-all duration-200 ease-in-out ${isScrolled
              ? 'max-h-0 opacity-0 mb-0 overflow-hidden'
              : isLocationDropdownOpen
                ? 'opacity-100'
                : 'opacity-100 overflow-hidden max-h-14'
              }`}>
              <div
                className="flex items-start gap-2 text-white w-full"
              >
                {/* Map Pin Icon */}
                <svg
                  className="w-4 h-4 text-white flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg><div className="flex items-start gap-1 flex-1 min-w-0">
                  <span className="text-sm font-medium text-white break-words leading-tight text-left whitespace-normal flex-1 truncate max-w-[120px]">
                    {(() => {
                      if (!currentLocation || currentLocation.includes("Getting") || currentLocation.includes("Loading")) {
                        return "Getting location...";
                      }
                      if (currentLocation.includes("error") || currentLocation.includes("denied") || currentLocation.includes("unavailable")) {
                        return "Location unavailable";
                      }

                      // If dropdown is open, show full location
                      if (isLocationDropdownOpen) {
                        return currentLocation;
                      }

                      // Otherwise show shortened version
                      // Extract city and country from address if available
                      const parts = currentLocation.split(',');
                      if (parts.length >= 2) {
                        return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
                      }
                      return currentLocation.length > 30 ? currentLocation.substring(0, 30) + "..." : currentLocation;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row - Search Bar and Filter (Below Location) */}
            {isSearchBarVisible && !isScrolled && (
              <div className="flex items-center gap-2 justify-center mt-2">
                {/* Search Bar */}
                <div
                  className="rounded-lg px-2.5 py-2 flex items-center gap-2"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    maxWidth: '260px',
                    width: '100%',
                  }}
                >
                  {/* Magnifying Glass Icon */}
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: colors.textTertiary }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>

                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      } else if (e.key === 'Enter') {
                        navigate('/search');
                      }
                    }}
                    onClick={() => navigate('/search')}
                    className="flex-1 text-sm outline-none bg-transparent cursor-pointer"
                    style={{ color: colors.backgroundTertiary }}
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={handleFilterClick}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isFilterOpen ? 'ring-2 ring-white/30' : ''
                    }`}
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    border: `1px solid ${colors.borderForm}`
                  }}
                  aria-label="Open filters"
                >
                  {/* Filter Icon - Three horizontal lines with circles */}
                  <svg
                    className="w-5 h-5 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {/* Top line */}
                    <line x1="3" y1="7" x2="21" y2="7" strokeLinecap="round" />
                    <circle cx="6" cy="7" r="2" fill="currentColor" />

                    {/* Middle line */}
                    <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />

                    {/* Bottom line */}
                    <line x1="3" y1="17" x2="21" y2="17" strokeLinecap="round" />
                    <circle cx="18" cy="17" r="2" fill="currentColor" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filter Dropdown */}
      <FilterDropdown
        isOpen={isFilterOpen}
        onClose={handleCloseFilter}
        onApplyFilters={handleApplyFilters}
        brands={brands}
        carTypes={carTypes}
      />
    </>
  );
};

export default Header;

