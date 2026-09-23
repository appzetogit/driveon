import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdKeyboardArrowDown, MdCheck } from 'react-icons/md';
import { premiumColors } from '../../theme/colors';

const ThemedDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  width = "w-full",
  position = "down",
  onOpen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    if (!options || options.length === 0) return value;

    if (typeof options[0] === 'string') {
      // If options are strings
      return value;
    }

    // If options are objects
    const found = options.find(opt => opt.value === value || opt === value);
    if (!found) return value;

    return found.label || found.value;
  };

  return (
    <div className={`relative ${width} ${className}`} ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => {
          if (!isOpen && onOpen) {
            onOpen();
          }
          setIsOpen(!isOpen);
        }}
        className={`
          w-full flex items-center justify-between px-4 py-2 bg-white 
          border border-gray-200 rounded-xl shadow-sm hover:border-gray-300
          transition-colors text-sm font-bold text-gray-700
          focus:outline-none focus:ring-2 focus:ring-opacity-50
        `}
        style={{
          borderColor: isOpen ? premiumColors.primary.DEFAULT : ''
        }}
      >
        <span className="truncate">{getDisplayValue()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 text-gray-400"
        >
          <MdKeyboardArrowDown size={20} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === 'up' ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'up' ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ${position === 'up' ? 'bottom-full mb-2' : 'mt-2'}`}
          >
            <div className="py-1 max-h-60 overflow-y-auto">
              {options.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : (option.label || option.value);
                const isSelected = value === optionValue;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(optionValue)}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                      ${isSelected
                        ? 'text-white'
                        : 'text-gray-700 hover:bg-gray-50'}
                    `}
                    style={{
                      backgroundColor: isSelected ? premiumColors.primary.DEFAULT : undefined
                    }}
                  >
                    <span className="font-medium">{optionLabel}</span>
                    {isSelected && <MdCheck size={16} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemedDropdown;
