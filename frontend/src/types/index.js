// Type definitions (using JSDoc for now, can convert to TypeScript later)

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} role
 * @property {boolean} profileComplete
 * @property {Object} kyc
 */

/**
 * @typedef {Object} Car
 * @property {string} id
 * @property {string} brand
 * @property {string} model
 * @property {number} seats
 * @property {string} transmission
 * @property {string} fuelType
 * @property {string} color
 * @property {string[]} features
 * @property {number} basePrice
 * @property {number} rating
 * @property {string[]} images
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} carId
 * @property {string} userId
 * @property {Date} pickupDate
 * @property {Date} dropDate
 * @property {string} status
 * @property {number} totalPrice
 * @property {string} paymentType
 */

