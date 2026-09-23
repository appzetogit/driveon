import express from 'express';
import http from 'http';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import mediaSyncRoutes from '../routes/mediaSync.routes.js';
import { PUBLIC_UPLOADS_DIR, ensureDirectoryExists } from '../services/localStorage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEndpointsDirectly() {
  console.log('🧪 Testing Media Sync & Uploads Static Serving in isolated Express test server...\n');

  process.env.MEDIA_SYNC_SECRET = 'test_secret_123';

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure public uploads exists
  ensureDirectoryExists(PUBLIC_UPLOADS_DIR);

  // Serve static assets
  app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

  // Mount sync routes
  app.use('/api/internal', mediaSyncRoutes);

  // Start test server on random free port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Isolated test server started on ${baseUrl}`);

  try {
    // 1. Test Sync Route without secret (must return 401)
    console.log('1️⃣ Testing unauthorized sync request...');
    try {
      await axios.post(`${baseUrl}/api/internal/sync-media`, {
        relativeUrl: '/uploads/test/sample.webp',
        fileBase64: 'abc',
      });
      throw new Error('Should have rejected with 401!');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('   ✅ Unauthorized request correctly rejected (401)!');
      } else {
        throw err;
      }
    }

    // 2. Test Sync Route with valid secret
    console.log('2️⃣ Testing valid sync request with image data...');
    const testImageBuffer = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 10, g: 180, b: 90 },
      },
    })
      .webp({ quality: 80 })
      .toBuffer();

    const targetUrl = `/uploads/sync-test/image-${Date.now()}.webp`;

    const syncResponse = await axios.post(
      `${baseUrl}/api/internal/sync-media`,
      {
        relativeUrl: targetUrl,
        fileBase64: testImageBuffer.toString('base64'),
      },
      {
        headers: {
          'x-sync-secret': 'test_secret_123',
        },
      }
    );

    console.log('   Sync API Response:', syncResponse.data);
    if (!syncResponse.data.success) {
      throw new Error('Sync API reported failure');
    }

    // 3. Test static file serving of the synced file
    console.log('3️⃣ Fetching synced image back via GET /uploads...');
    const getResponse = await axios.get(`${baseUrl}${targetUrl}`, {
      responseType: 'arraybuffer',
    });

    if (getResponse.status === 200 && getResponse.data.length === testImageBuffer.length) {
      console.log(`   ✅ Synced image retrieved successfully (${getResponse.data.length} bytes, Status: ${getResponse.status})!`);
    } else {
      throw new Error('Retrieved image size does not match uploaded size!');
    }

    // 4. Clean up test file
    const localPath = path.join(PUBLIC_UPLOADS_DIR, targetUrl.replace(/^\/uploads\//, ''));
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
      console.log('   🧹 Test file cleaned up from disk.');
    }

    console.log('\n🎉 ALL MEDIA SYNC AND STATIC SERVING TESTS PASSED!');
  } finally {
    server.close();
  }
}

testEndpointsDirectly().catch((err) => {
  console.error('❌ Direct endpoints test failed:', err);
  process.exit(1);
});
