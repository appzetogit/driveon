import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { compressImage } from '../utils/imageOptimizer.js';
import { uploadToLocal, deleteFromLocal, PUBLIC_UPLOADS_DIR } from '../services/localStorage.service.js';

async function runTest() {
  console.log('🧪 Starting Sharp Image Compression & Local Storage Pipeline Test...\n');

  // 1. Create a large synthetic JPEG image buffer (1800x1200)
  console.log('1️⃣ Generating 1800x1200 test image buffer...');
  const testBuffer = await sharp({
    create: {
      width: 1800,
      height: 1200,
      channels: 3,
      background: { r: 220, g: 80, b: 50 },
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer();

  const originalSizeKb = (testBuffer.length / 1024).toFixed(2);
  console.log(`   Generated Raw Buffer Size: ${originalSizeKb} KB`);

  // 2. Test Sharp Compressor
  console.log('2️⃣ Running compressImage() with car profile...');
  const compressed = await compressImage(testBuffer, { folder: 'driveon/cars' });
  const compressedSizeKb = (compressed.compressedSize / 1024).toFixed(2);
  console.log(`   Compressed Output: ${compressedSizeKb} KB, Format: ${compressed.extension}, MIME: ${compressed.mimeType}`);

  if (compressed.compressedSize >= testBuffer.length) {
    throw new Error('Compression did not reduce size!');
  }
  console.log('   ✅ Compression successful! Size reduction achieved.');

  // 3. Test uploadToLocal
  console.log('\n3️⃣ Running uploadToLocal() with Multer-style file object...');
  const mockMulterFile = {
    buffer: testBuffer,
    originalname: 'test-car.jpg',
    mimetype: 'image/jpeg',
  };

  const uploadResult = await uploadToLocal(mockMulterFile, { folder: 'driveon/cars' });
  console.log('   Upload Result:', uploadResult);

  if (!uploadResult.secure_url || !uploadResult.secure_url.startsWith('/uploads/driveon/cars/')) {
    throw new Error('Invalid upload secure_url returned');
  }

  const savedFilePath = path.join(PUBLIC_UPLOADS_DIR, uploadResult.secure_url.replace(/^\/uploads\//, ''));
  if (!fs.existsSync(savedFilePath)) {
    throw new Error(`Saved file not found on disk at: ${savedFilePath}`);
  }
  console.log(`   ✅ File verified on disk: ${savedFilePath}`);

  // 4. Test deleteFromLocal
  console.log('\n4️⃣ Testing deleteFromLocal()...');
  const deleteResult = await deleteFromLocal(uploadResult.secure_url);
  console.log('   Delete Result:', deleteResult);

  if (fs.existsSync(savedFilePath)) {
    throw new Error('File was not deleted by deleteFromLocal');
  }
  console.log('   ✅ File successfully deleted from disk.');

  console.log('\n🎉 ALL PIPELINE TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('❌ Pipeline test failed:', err);
  process.exit(1);
});
