import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import FilterDropdown from './FilterDropdown';

/**
 * SearchBar Component - Exact match to design
 * Search bar with magnifying glass icon and filter button
 */
const SearchBar = ({ onFilterToggle, onSearch, searchQuery = '' }) => {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Sync local state with prop when it changes externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const handleFilterClick = () => {
    const newState = !isFilterOpen;
    setIsFilterOpen(newState);
    if (onFilterToggle) {
      onFilterToggle(newState);
    }
  };

  const handleCloseFilter = () => {
    setIsFilterOpen(false);
    if (onFilterToggle) {
      onFilterToggle(false);
    }
  };

  const handleApplyFilters = (filters) => {
    // Handle filter application here
    console.log('Applied filters:', filters);
    // You can pass this to parent component or use context/state management
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Search is already triggered on change, but we can add additional logic here if needed
      if (onSearch) {
        onSearch(localSearchQuery);
      }
    }
  };

  return (
    <>
      <div className="w-full px-4 my-2 md:my-4 flex items-center justify-center gap-2 md:gap-3">
        {/* Search Bar - White with subtle border - Compact width on mobile, full width on desktop */}
        <div 
          className="rounded-lg md:rounded-xl px-3 md:px-5 lg:px-6 py-2 md:py-3 lg:py-3.5 flex items-center gap-2 md:gap-3 flex-1 max-w-[280px] md:max-w-none md:shadow-md"
          style={{ 
            backgroundColor: colors.backgroundSecondary,
            border: `1px solid ${colors.borderForm}`
          }}
        >
          {/* Magnifying Glass Icon */}
          <svg 
            className="w-5 h-5 md:w-6 md:h-6 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
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
            placeholder="Search your dream car....."
            value={localSearchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            className="flex-1 text-sm md:text-base lg:text-lg text-gray-500 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>

        {/* Filter Button - Circular, white with subtle border - Compact size on mobile, larger on desktop */}
        <button 
          onClick={handleFilterClick}
          className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shrink-0 md:shadow-md ${
            isFilterOpen ? 'ring-2 ring-gray-300' : ''
          }`}
          style={{ 
            backgroundColor: colors.backgroundSecondary,
            border: `1px solid ${colors.borderForm}`
          }}
          aria-label="Open filters"
        >
          {/* Filter Icon - Three horizontal lines with circles (slider icon) */}
          <svg 
            className="w-5 h-5 md:w-6 md:h-6 text-gray-500" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            {/* Top line */}
            <line x1="3" y1="7" x2="21" y2="7" strokeLinecap="round"/>
            <circle cx="6" cy="7" r="2" fill="currentColor"/>
            
            {/* Middle line */}
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            
            {/* Bottom line */}
            <line x1="3" y1="17" x2="21" y2="17" strokeLinecap="round"/>
            <circle cx="18" cy="17" r="2" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Filter Dropdown */}
      <FilterDropdown
        isOpen={isFilterOpen}
        onClose={handleCloseFilter}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
};

export default SearchBar;

