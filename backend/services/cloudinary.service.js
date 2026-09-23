import { uploadToLocal, deleteFromLocal, isLocalConfigured } from './localStorage.service.js';

/**
 * Storage Service (Migrated from Cloudinary to VPS Local Storage with Sharp)
 * Maintains 100% API compatibility with existing controllers.
 */

/**
 * Upload image to local VPS storage with Sharp compression
 * @param {Buffer|File|string} file - Image file buffer, multer file, base64 string, or filepath
 * @param {Object} options - Upload options (folder, width, height, quality)
 * @returns {Promise<Object>} Compatible result object { secure_url, url, public_id, bytes, format }
 */
export const uploadImage = async (file, options = {}) => {
  return uploadToLocal(file, options);
};

/**
 * Delete image from local VPS storage
 * @param {string} publicId - Image public ID or /uploads path
 * @returns {Promise<Object>} Deletion result
 */
export const deleteImage = async (publicId) => {
  return deleteFromLocal(publicId);
};

/**
 * Check if storage service is configured
 * Always returns true for VPS Local Storage
 * @returns {boolean}
 */
export const isConfigured = () => {
  return isLocalConfigured();
};

export default {
  uploadImage,
  deleteImage,
  isConfigured,
};
