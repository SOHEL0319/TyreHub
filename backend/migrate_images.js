const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return resolve(downloadImage(response.headers.location)); // Follow redirects
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get image, status code: ${response.statusCode}`));
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', err => reject(err));
  });
}

async function migrateImages() {
  try {
    console.log('Initializing Firebase Admin...');
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a',
      storageBucket: 'tyrehub-d049a.appspot.com'
    });
    const db = getFirestore(app);
    const bucket = getStorage(app).bucket();

    const jsonPath = path.resolve(__dirname, '../tyrehub_firestore_products_100.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const products = data.products || data;

    console.log(`Starting migration for ${products.length} products...`);

    let successCount = 0;
    
    for (const product of products) {
      const docId = product.productId || product.sku;
      if (!docId || !product.image) continue;

      try {
        console.log(`Processing ${docId}... downloading image: ${product.image}`);
        const imageBuffer = await downloadImage(product.image);
        
        const ext = path.extname(new URL(product.image).pathname) || '.jpg';
        const storagePath = `tyres/${docId}/main${ext}`;
        const file = bucket.file(storagePath);
        
        await file.save(imageBuffer, {
          metadata: { contentType: ext === '.png' ? 'image/png' : 'image/jpeg' },
          public: true
        });

        // The public URL format for Firebase Storage
        const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        // Update Firestore
        await db.collection('products').doc(docId).update({
          image: downloadUrl,
          images: [downloadUrl]
        });

        console.log(`✅ ${docId} successfully updated with Firebase Storage URL.`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to process ${docId}:`, err.message);
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nMigration complete. Successfully migrated ${successCount} out of ${products.length} products.`);
    process.exit(0);

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

migrateImages();
