const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const FALLBACK_MAP = {
  'MRF': '/tyres/mrf-zapper.jpg',
  'CEAT': '/tyres/ceat-zoom.jpg',
  'Apollo Tyres': '/tyres/apollo-alnac.jpg',
  'JK Tyre': '/tyres/jk-levitas.jpg',
  'Bridgestone': '/tyres/bridgestone-turanza.jpg'
};

function getLocalImageUrl(brand, name, category) {
    name = (name || '').toLowerCase();
    
    // MRF
    if (brand === 'MRF') {
        if (name.includes('zapper y')) return '/tyres/mrf-zapper-y.jpg';
        if (name.includes('zapper')) return '/tyres/mrf-zapper-p.jpg';
        return FALLBACK_MAP['MRF'];
    }
    
    // CEAT
    if (brand === 'CEAT') {
        if (name.includes('secura') || name.includes('neo')) return '/tyres/ceat-secura-neo.jpg';
        return FALLBACK_MAP['CEAT'];
    }
    
    // Apollo
    if (brand === 'Apollo Tyres') {
        if (name.includes('actigrip')) return '/tyres/apollo-actigrip-s8.jpg';
        return FALLBACK_MAP['Apollo Tyres'];
    }
    
    // JK Tyre
    if (brand === 'JK Tyre') {
        if (name.includes('blaze')) return '/tyres/jk-blaze-rydr-bf43.jpg';
        return FALLBACK_MAP['JK Tyre'];
    }
    
    // Bridgestone
    if (brand === 'Bridgestone') {
        if (name.includes('ecopia')) return '/tyres/bridgestone-ecopia-ep150.jpg';
        return FALLBACK_MAP['Bridgestone'];
    }

    // Ultimate generic fallback
    return FALLBACK_MAP['MRF'];
}

async function migrateImagesRealModels() {
  try {
    console.log('Initializing Firebase Admin...');
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a'
    });
    const db = getFirestore(app);

    console.log('Fetching products from Firestore...');
    const snapshot = await db.collection('products').get();
    
    if (snapshot.empty) {
        throw new Error("No products found in Firestore!");
    }

    console.log(`Starting accurate model local migration for ${snapshot.size} products...`);
    let successCount = 0;
    
    for (const doc of snapshot.docs) {
      const product = doc.data();
      const docId = doc.id;
      
      const brand = product.brand || 'Generic';
      const name = product.name || '';
      
      const localUrl = getLocalImageUrl(brand, name, product.category);
      const currentUrl = product.image || '';
      
      // If already assigned to this exact model image, skip.
      if (currentUrl === localUrl) {
          continue;
      }

      console.log(`Processing ${docId} (${brand} - ${name})... assigning REAL AI model photo: ${localUrl}`);

      // Update Firestore
      await db.collection('products').doc(docId).update({
        image: localUrl,
        images: [localUrl]
      });
      successCount++;
      
      await new Promise(r => setTimeout(r, 20));
    }

    console.log(`\nMigration complete. Successfully updated ${successCount} products with EXACT REAL model AI-generated photos.`);
    process.exit(0);

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

migrateImagesRealModels();
