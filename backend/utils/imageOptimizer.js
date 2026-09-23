import sharp from 'sharp';

/**
 * Folder profiles for image resizing and compression
 */
const FOLDER_PROFILES = {
  'profile-photos': { maxWidth: 800, maxHeight: 800, quality: 80 },
  'crm/staff': { maxWidth: 800, maxHeight: 800, quality: 80 },
  'crm/staff/aadhar': { maxWidth: 1400, maxHeight: 1400, quality: 85 },
  'driveon/cars': { maxWidth: 1400, maxHeight: 900, quality: 80 },
  'driveon/cars/documents': { maxWidth: 1400, maxHeight: 1400, quality: 85 },
  'driveon/banners': { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  'banners': { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  'crm/accidents': { maxWidth: 1400, maxHeight: 1000, quality: 80 },
  'crm/garages': { maxWidth: 1200, maxHeight: 800, quality: 80 },
  'crm/vendors': { maxWidth: 1200, maxHeight: 800, quality: 80 },
  default: { maxWidth: 1200, maxHeight: 1200, quality: 80 },
};

/**
 * Match a folder path to a profile
 */
function getProfile(folder) {
  if (!folder) return FOLDER_PROFILES.default;
  if (FOLDER_PROFILES[folder]) return FOLDER_PROFILES[folder];

  // Try matching substring or key parts
  const cleanFolder = folder.toLowerCase().replace(/^\/+|\/+$/g, '');
  for (const [key, profile] of Object.entries(FOLDER_PROFILES)) {
    if (cleanFolder.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanFolder)) {
      return profile;
    }
  }
  return FOLDER_PROFILES.default;
}

/**
 * High-performance image compressor and optimizer using Sharp
 * @param {Buffer} inputBuffer - Raw image buffer
 * @param {Object} opts - Options including folder, width, height, quality
 * @returns {Promise<{buffer: Buffer, originalSize: number, compressedSize: number, mimeType: string, extension: string}>}
 */
export async function compressImage(inputBuffer, opts = {}) {
  const originalSize = inputBuffer ? inputBuffer.length : 0;
  if (!inputBuffer || originalSize === 0) {
    throw new Error('compressImage: Invalid or empty buffer received');
  }

  if (opts.isVideo || opts.resource_type === 'video') {
    return {
      buffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      mimeType: 'video/mp4',
      extension: 'mp4',
    };
  }

  const profile = getProfile(opts.folder);
  const maxWidth = opts.width || profile.maxWidth;
  const maxHeight = opts.height || profile.maxHeight;
  const quality = opts.quality || profile.quality;

  try {
    const image = sharp(inputBuffer, { failOnError: false });
    const metadata = await image.metadata();

    // Preserve animated GIFs
    if (metadata.format === 'gif' && metadata.pages && metadata.pages > 1) {
      return {
        buffer: inputBuffer,
        originalSize,
        compressedSize: originalSize,
        mimeType: 'image/gif',
        extension: 'gif',
      };
    }

    // Auto rotate based on EXIF and resize while maintaining aspect ratio
    let pipeline = image.rotate(); // auto-rotate based on orientation

    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to optimized modern WebP (supports both opacity & transparency with superior compression)
    // If client explicitly requested jpeg or if format is svg/pdf:
    let outputBuffer;
    let mimeType = 'image/webp';
    let extension = 'webp';

    if (opts.format === 'jpg' || opts.format === 'jpeg') {
      outputBuffer = await pipeline
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else {
      outputBuffer = await pipeline
        .webp({ quality, effort: 4 })
        .toBuffer();
      mimeType = 'image/webp';
      extension = 'webp';
    }

    return {
      buffer: outputBuffer,
      originalSize,
      compressedSize: outputBuffer.length,
      mimeType,
      extension,
    };
  } catch (err) {
    console.warn('⚠️ Sharp optimization skipped or failed, using original buffer:', err.message);
    return {
      buffer: inputBuffer,
      originalSize,
      compressedSize: originalSize,
      mimeType: 'image/jpeg',
      extension: 'jpg',
    };
  }
}
