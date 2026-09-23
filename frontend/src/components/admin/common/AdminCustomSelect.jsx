import { useState, useRef, useEffect } from 'react';
import { colors } from '../../../module/theme/colors';

/**
 * AdminCustomSelect Component
 * Custom dropdown for admin panel matching module theme
 * Dark header with white options list (like second image)
 */
const AdminCustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...',
  label = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value || opt.value === String(value)) || { 
    label: placeholder, 
    value: '' 
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: colors.textPrimary }}>
          {label}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg border flex items-center justify-between text-sm"
        style={{ 
          borderColor: colors.borderMedium,
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.borderLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.borderMedium;
        }}
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: colors.textPrimary }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundColor: colors.backgroundSecondary,
            border: `1px solid ${colors.borderMedium}`,
            top: '100%',
            left: '0',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {/* Header - Light background like image */}
          {label && (
            <div
              className="sticky top-0 px-3 py-2 border-b"
              style={{
                backgroundColor: colors.backgroundPrimary,
                borderBottomColor: colors.borderMedium
              }}
            >
              <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {label}
              </h3>
            </div>
          )}

          {/* Options List */}
          <div className="py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm" style={{ color: colors.textSecondary }}>
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value === option.value || String(value) === String(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{
                      backgroundColor: isSelected ? colors.backgroundTertiary : 'transparent',
                      color: isSelected ? colors.textWhite : colors.textPrimary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = colors.backgroundLight;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomSelect;

