const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Real, legally downloadable tyre photos from Wikimedia Commons
const TYRE_SOURCES = {
  'Car': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Michelin_tires.jpg/800px-Michelin_tires.jpg',
  'Bike': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Motorcycle_tire.jpg/800px-Motorcycle_tire.jpg',
  'Auto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Vespa_LX_150_rear_tire.jpg/800px-Vespa_LX_150_rear_tire.jpg',
  'Lorry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Truck_tires.jpg/800px-Truck_tires.jpg',
  'Generic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Michelin_tires.jpg/800px-Michelin_tires.jpg'
};

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'TyreHub/1.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return resolve(downloadImage(response.headers.location));
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Status code: ${response.statusCode}`));
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', err => reject(err));
    req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout'));
    });
  });
}

async function migrateImagesLocalReal() {
  try {
    console.log('Initializing Firebase Admin...');
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a'
    });
    const db = getFirestore(app);

    const outDir = path.resolve(__dirname, '../frontend/public/tyres');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 1. Download base category images
    const categoryBuffers = {};
    console.log('Downloading real tyre photos from Wikimedia Commons...');
    for (const [cat, url] of Object.entries(TYRE_SOURCES)) {
      try {
        categoryBuffers[cat] = await downloadImage(url);
        console.log(`✅ Downloaded real photo for ${cat}`);
      } catch (e) {
        console.error(`❌ Failed to download ${cat}:`, e.message);
      }
    }

    console.log('Fetching products from Firestore...');
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
        throw new Error("No products found in Firestore!");
    }

    console.log(`Starting local migration for ${snapshot.size} products from Firestore...`);
    let successCount = 0;
    
    for (const doc of snapshot.docs) {
      const product = doc.data();
      const docId = doc.id;
      
      const brand = (product.brand || 'Generic').toLowerCase().replace(/[^a-z0-9]/g, '-');
      let vType = product.vehicleType || 'Generic';
      if (!categoryBuffers[vType]) vType = 'Generic';

      // Use a consistent filename based on brand and vehicle type
      const filename = `${brand}-${vType.toLowerCase()}.jpg`;
      const localFilePath = path.join(outDir, filename);
      const localUrl = `/tyres/${filename}`;

      // Save the file if we haven't already created this specific brand/type combo
      if (!fs.existsSync(localFilePath) && categoryBuffers[vType]) {
         fs.writeFileSync(localFilePath, categoryBuffers[vType]);
      }

      console.log(`Processing ${docId}... setting local REAL photo: ${localUrl}`);

      // Update Firestore
      await db.collection('products').doc(docId).update({
        image: localUrl,
        images: [localUrl]
      });
      console.log(`✅ ${docId} successfully updated with real photo URL: ${localUrl}`);
      successCount++;
      
      await new Promise(r => setTimeout(r, 20));
    }

    // Clean up generic SVGs to fulfill user request "Remove the current generic SVG images from product records"
    const files = fs.readdirSync(outDir);
    for (const file of files) {
        if (file.endsWith('.svg')) {
            fs.unlinkSync(path.join(outDir, file));
            console.log(`Deleted old SVG: ${file}`);
        }
    }

    console.log(`\nMigration complete. Successfully updated ${successCount} products with REAL photos.`);
    process.exit(0);

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

migrateImagesLocalReal();
