import * as admin from 'firebase-admin';

// Re-using the same config is fine for the admin SDK.
import { firebaseConfig } from '@/firebase/config';

// Ensure the service account is available in environment variables
// Vercel handles this with its environment variable settings.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let adminApp: admin.app.App;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    adminApp = admin.app();
    return;
  }
  
  if (!serviceAccount) {
    throw new Error('Firebase service account not found in environment variables.');
  }
  
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}

export const adminDb = admin.firestore();
