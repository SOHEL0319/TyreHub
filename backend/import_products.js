const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

async function importProducts() {
  try {
    console.log('Initializing Firebase Admin...');
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a'
    });
    const db = getFirestore(app);

    // 1. Connection Test
    console.log('Testing Firestore connection...');
    const collections = await db.listCollections();
    console.log('Firestore connected successfully. Existing collections:', collections.map(c => c.id));

    // 2. Load JSON
    const jsonPath = path.resolve(__dirname, '../tyrehub_firestore_products_100.json');
    console.log(`Loading data from ${jsonPath}...`);
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Data file not found at ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const products = data.products || data;

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('No products found in the JSON file.');
    }

    console.log(`Found ${products.length} products to import.`);

    // 3. Upsert Logic
    const batchSize = 50;
    let batch = db.batch();
    let count = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // Use productId as unique key. Fallback to sku if productId is missing
      const docId = product.productId || product.sku;
      if (!docId) {
        console.warn(`Product at index ${i} has no productId or sku. Skipping.`);
        continue;
      }

      const docRef = db.collection('products').doc(docId);
      // Upsert: merge true prevents overriding fields not in the JSON, but updates the rest.
      batch.set(docRef, product, { merge: true });
      count++;

      if (count % batchSize === 0 || i === products.length - 1) {
        await batch.commit();
        console.log(`Successfully committed batch of ${count % batchSize === 0 ? batchSize : count % batchSize} products.`);
        batch = db.batch(); // Create a new batch
      }
    }

    console.log(`\nImport Complete! Successfully upserted ${count} products.`);
    process.exit(0);

  } catch (err) {
    console.error('\nERROR:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

importProducts();
