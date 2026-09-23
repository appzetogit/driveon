import { useState, useRef, useEffect } from 'react';
import { colors } from '../../theme/colors';

/**
 * CustomSelect Component - Custom dropdown with theme colors
 */
const CustomSelect = ({ value, onChange, options, placeholder = 'Select...' }) => {
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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value: '' };

  return (
    <div ref={selectRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between"
        style={{ 
          borderColor: '#E5E7EB',
          backgroundColor: colors.backgroundSecondary,
          color: colors.textPrimary
        }}
      >
        <span>{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
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

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto"
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderColor: '#E5E7EB',
            top: '100%',
            left: '0',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors"
              style={{
                backgroundColor: value === option.value ? colors.backgroundTertiary : 'transparent',
                color: value === option.value ? colors.backgroundSecondary : colors.textPrimary,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

