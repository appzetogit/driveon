import express from 'express';
import path from 'path';
import fs from 'fs';
import { PUBLIC_UPLOADS_DIR, ensureDirectoryExists } from '../services/localStorage.service.js';

const router = express.Router();

/**
 * Middleware to authenticate internal sync requests
 */
const verifySyncSecret = (req, res, next) => {
  const configuredSecret = process.env.MEDIA_SYNC_SECRET?.trim();
  const providedSecret = req.headers['x-sync-secret'] || req.headers['x-media-sync-secret'];

  if (!configuredSecret) {
    return res.status(500).json({
      success: false,
      message: 'MEDIA_SYNC_SECRET is not configured on the server',
    });
  }

  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing sync secret',
    });
  }

  next();
};

/**
 * POST /api/internal/sync-media
 * Receives a media file from local development and writes it directly to VPS local storage
 */
router.post('/sync-media', verifySyncSecret, async (req, res) => {
  try {
    const { relativeUrl, fileBase64 } = req.body;

    if (!relativeUrl || !fileBase64) {
      return res.status(400).json({
        success: false,
        message: 'relativeUrl and fileBase64 are required',
      });
    }

    // Sanitize path (strip /uploads/ prefix and prevent directory traversal)
    const cleanRelPath = relativeUrl
      .replace(/^\/+/, '')
      .replace(/^uploads\//, '')
      .replace(/\.\./g, '');

    const targetFilePath = path.join(PUBLIC_UPLOADS_DIR, cleanRelPath);
    const targetDir = path.dirname(targetFilePath);

    ensureDirectoryExists(targetDir);

    const buffer = Buffer.from(fileBase64, 'base64');
    await fs.promises.writeFile(targetFilePath, buffer);

    console.log(`📥 [MEDIA-SYNC] Successfully received and stored ${relativeUrl} (${buffer.length} bytes)`);

    return res.status(200).json({
      success: true,
      message: 'Media synced successfully',
      relativeUrl,
      bytes: buffer.length,
    });
  } catch (error) {
    console.error('❌ [MEDIA-SYNC] Error saving synced media:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save synced media',
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/sync-status
 * Health check for sync capability
 */
router.get('/sync-status', verifySyncSecret, (req, res) => {
  res.json({
    success: true,
    message: 'Media sync endpoint is active',
    uploadsDirExists: fs.existsSync(PUBLIC_UPLOADS_DIR),
  });
});

export default router;
