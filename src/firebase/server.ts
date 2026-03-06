import * as admin from 'firebase-admin';

// Re-using the same config is fine for the admin SDK.
import { firebaseConfig } from '@/firebase/config';

// Ensure the service account is available in environment variables
// Vercel handles this with its environment variable settings.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }
  
  if (!serviceAccount) {
    throw new Error('Firebase service account not found in environment variables.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
}
