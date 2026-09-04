const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function testConnection() {
  try {
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: 'tyrehub-d049a'
    });
    
    const db = getFirestore(app);
    const collections = await db.listCollections();
    
    console.log('Firestore connected successfully.');
    console.log('Collections:', collections.map(c => c.id));
    process.exit(0);
  } catch (err) {
    console.error('Error connecting to Firestore:', err);
    process.exit(1);
  }
}

testConnection();
