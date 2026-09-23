import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary
 */

/**
 * Upload image to Cloudinary
 * @param {Buffer|File} file - Image file buffer or file object
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadImage = async (file, options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.');
    }

    // Default options
    const uploadOptions = {
      folder: options.folder || 'driveon',
      resource_type: 'image',
      transformation: [
        {
          width: options.width || 800,
          height: options.height || 800,
          crop: 'limit',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
      ...options,
    };

    // Handle different file types
    let uploadResult;

    if (typeof file === 'string') {
      // If file is a base64 data URI or URL
      uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
    } else if (file.buffer) {
      // If file has buffer (from express-fileupload)
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Convert buffer to stream
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } else if (file.path) {
      // If file has path (from express-fileupload temp file)
      uploadResult = await cloudinary.uploader.upload(file.path, uploadOptions);
    } else if (file instanceof Buffer) {
      // If file is a Buffer
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(file);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    } else {
      throw new Error('Invalid file format. Expected string, buffer, path, or Buffer.');
    }

    return uploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (publicId) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
export const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

