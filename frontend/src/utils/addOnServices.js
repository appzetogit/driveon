/**
 * Add-on Services Utility
 * Manages add-on services prices in localStorage (frontend only)
 */

const STORAGE_KEY = 'addon_services_prices';

// Default prices
const DEFAULT_PRICES = {
  driver: 500,
  bodyguard: 1000,
  gunmen: 1500,
  bouncer: 800,
};

/**
 * Get all add-on services prices
 * @returns {Object} Prices object with service keys and values
 */
export const getAddOnServicesPrices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all services have prices
      return { ...DEFAULT_PRICES, ...parsed };
    }
  } catch (error) {
    console.error('Error reading add-on services prices:', error);
  }
  return DEFAULT_PRICES;
};

/**
 * Update add-on service price
 * @param {string} serviceKey - Service key (driver, bodyguard, gunmen, bouncer)
 * @param {number} price - New price
 */
export const updateAddOnServicePrice = (serviceKey, price) => {
  try {
    const currentPrices = getAddOnServicesPrices();
    currentPrices[serviceKey] = parseFloat(price) || 0;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPrices));
    return true;
  } catch (error) {
    console.error('Error updating add-on service price:', error);
    return false;
  }
};

/**
 * Update all add-on services prices
 * @param {Object} prices - Object with service keys and prices
 */
export const updateAllAddOnServicesPrices = (prices) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
    return true;
  } catch (error) {
    console.error('Error updating all add-on services prices:', error);
    return false;
  }
};

/**
 * Get price for a specific service
 * @param {string} serviceKey - Service key
 * @returns {number} Price
 */
export const getServicePrice = (serviceKey) => {
  const prices = getAddOnServicesPrices();
  return prices[serviceKey] || 0;
};

/**
 * Calculate total price for add-on services
 * @param {Object} quantities - Object with service keys and quantities
 * @returns {number} Total price
 */
export const calculateAddOnServicesTotal = (quantities) => {
  const prices = getAddOnServicesPrices();
  let total = 0;
  
  Object.keys(quantities).forEach((serviceKey) => {
    const quantity = quantities[serviceKey] || 0;
    const price = prices[serviceKey] || 0;
    total += quantity * price;
  });
  
  return total;
};

/**
 * Reset to default prices
 */
export const resetToDefaultPrices = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRICES));
    return true;
  } catch (error) {
    console.error('Error resetting prices:', error);
    return false;
  }
};

