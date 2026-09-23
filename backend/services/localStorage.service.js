import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { compressImage } from '../utils/imageOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, '..');
export const PUBLIC_UPLOADS_DIR = path.join(backendRootDir, 'public', 'uploads');

/**
 * Ensure directory exists
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Normalize and extract Buffer from various file input formats
 * (Multer file, Buffer, base64 string, path)
 */
async function extractBuffer(file) {
  if (!file) throw new Error('No file provided for upload');

  // If already a Buffer
  if (Buffer.isBuffer(file)) {
    return { buffer: file, originalName: null };
  }

  // If Multer file object with buffer
  if (file.buffer && Buffer.isBuffer(file.buffer)) {
    return { buffer: file.buffer, originalName: file.originalname };
  }

  // If object with temp path (express-fileupload or multer diskStorage)
  if (file.path && typeof file.path === 'string') {
    const buf = await fs.promises.readFile(file.path);
    return { buffer: buf, originalName: file.originalname || path.basename(file.path) };
  }

  // If string (base64 or data URI)
  if (typeof file === 'string') {
    if (file.startsWith('data:')) {
      const commaIndex = file.indexOf(',');
      if (commaIndex !== -1) {
        const base64Data = file.substring(commaIndex + 1);
        return { buffer: Buffer.from(base64Data, 'base64'), originalName: null };
      }
    }
    // Check if it's a file path
    if (fs.existsSync(file)) {
      const buf = await fs.promises.readFile(file);
      return { buffer: buf, originalName: path.basename(file) };
    }
    // Check if raw base64 string
    try {
      const buf = Buffer.from(file, 'base64');
      return { buffer: buf, originalName: null };
    } catch (e) {
      throw new Error('Unsupported string format for image upload');
    }
  }

  throw new Error('Unsupported file format provided to uploadToLocal');
}

/**
 * Background sync helper: pushes an uploaded file from local development to live VPS
 */
async function pushToLiveServer(relativeUrl, fileBuffer) {
  const liveUrl = process.env.LIVE_SERVER_URL?.trim();
  const syncSecret = process.env.MEDIA_SYNC_SECRET?.trim();

  // Only trigger sync if live server URL is set and we're not running in production on that same domain
  if (!liveUrl || !syncSecret) return;

  // Don't sync to yourself
  if (liveUrl.includes('localhost') || liveUrl.includes('127.0.0.1')) return;

  try {
    const endpoint = `${liveUrl.replace(/\/$/, '')}/api/internal/sync-media`;
    console.log(`📡 [MEDIA-SYNC] Pushing ${relativeUrl} to live VPS (${endpoint})...`);

    const response = await axios.post(
      endpoint,
      {
        relativeUrl,
        fileBase64: fileBuffer.toString('base64'),
      },
      {
        headers: {
          'x-sync-secret': syncSecret,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.success) {
      console.log(`✅ [MEDIA-SYNC] Successfully synced ${relativeUrl} to live VPS.`);
    } else {
      console.warn(`⚠️ [MEDIA-SYNC] Live server returned:`, response.data);
    }
  } catch (err) {
    console.warn(`⚠️ [MEDIA-SYNC] Could not sync ${relativeUrl} to live VPS:`, err.message);
  }
}

/**
 * Upload and compress image to VPS local storage
 * @param {Buffer|Object|string} file - File buffer, multer file, or base64 data URI
 * @param {Object} options - Upload options (folder, width, height, quality, etc.)
 * @returns {Promise<Object>} Compatible result object { secure_url, url, public_id, bytes, format }
 */
export const uploadToLocal = async (file, options = {}) => {
  try {
    const { buffer: rawBuffer } = await extractBuffer(file);

    // Sanitize folder (normalize slashes, avoid directory traversal)
    const rawFolder = options.folder || 'driveon';
    const cleanFolder = rawFolder
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.\./g, '');

    // Compress image using Sharp
    const compressed = await compressImage(rawBuffer, {
      ...options,
      folder: cleanFolder,
    });

    // Ensure target folder exists
    const targetDir = path.join(PUBLIC_UPLOADS_DIR, ...cleanFolder.split('/'));
    ensureDirectoryExists(targetDir);

    // Generate unique filename
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${uniqueId}.${compressed.extension}`;
    const filePath = path.join(targetDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, compressed.buffer);

    // Construct forward-slash relative URL for database
    const relativeUrl = `/uploads/${cleanFolder}/${filename}`;
    const publicId = `${cleanFolder}/${uniqueId}`;

    // If local dev environment, automatically sync to live VPS in the background
    const isDev = process.env.NODE_ENV !== 'production' || process.env.SYNC_TO_LIVE === 'true';
    if (isDev) {
      // Run non-blocking
      setImmediate(() => {
        pushToLiveServer(relativeUrl, compressed.buffer).catch((err) =>
          console.warn('Sync background error:', err.message)
        );
      });
    }

    return {
      secure_url: relativeUrl,
      url: relativeUrl,
      public_id: publicId,
      bytes: compressed.compressedSize,
      format: compressed.extension,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
    };
  } catch (error) {
    console.error('❌ uploadToLocal error:', error);
    throw error;
  }
};

/**
 * Delete image from local storage
 * @param {string} publicIdOrPath - Public ID or relative /uploads path
 * @returns {Promise<{result: string}>}
 */
export const deleteFromLocal = async (publicIdOrPath) => {
  if (!publicIdOrPath || typeof publicIdOrPath !== 'string') {
    return { result: 'not_found' };
  }

  try {
    // If it's a full /uploads path
    let relPath = publicIdOrPath;
    if (relPath.startsWith('/uploads/')) {
      relPath = relPath.replace(/^\/uploads\//, '');
    }

    // Try direct file path
    const directPath = path.join(PUBLIC_UPLOADS_DIR, relPath);
    if (fs.existsSync(directPath)) {
      await fs.promises.unlink(directPath);
      return { result: 'ok' };
    }

    // If public_id without extension was given, try common extensions
    const extensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.mp4'];
    for (const ext of extensions) {
      const testPath = path.join(PUBLIC_UPLOADS_DIR, `${relPath}${ext}`);
      if (fs.existsSync(testPath)) {
        await fs.promises.unlink(testPath);
        return { result: 'ok' };
      }
    }

    return { result: 'not_found' };
  } catch (error) {
    console.warn(`⚠️ deleteFromLocal warning for ${publicIdOrPath}:`, error.message);
    return { result: 'error', error: error.message };
  }
};

/**
 * Check if local storage is configured (always true on VPS)
 */
export const isLocalConfigured = () => true;

export default {
  uploadToLocal,
  deleteFromLocal,
  isLocalConfigured,
  ensureDirectoryExists,
  PUBLIC_UPLOADS_DIR,
};
