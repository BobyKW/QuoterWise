import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseAdmin() {
  if (!app) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('Firebase service account not found in environment variables. Please ensure FIREBASE_SERVICE_ACCOUNT is set.');
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error during Firebase Admin init.';
      console.error(`Failed to parse or initialize Firebase Admin SDK: ${errorMessage}`);
      throw new Error(`Failed to initialize Firebase Admin SDK: ${errorMessage}`);
    }
  }

  return {
    auth: admin.auth(app),
    firestore: admin.firestore(app),
  };
}
