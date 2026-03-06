'use server';

import * as admin from 'firebase-admin';

// Import the project ID from the client-side config to ensure consistency
import { firebaseConfig } from '@/firebase/config';

export function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // Safely parse the service account from environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  // Throw an error if the service account is not found
  if (!serviceAccount) {
    throw new Error('Firebase service account not found in environment variables. Please ensure FIREBASE_SERVICE_ACCOUNT is set in Vercel.');
  }
  
  // Initialize the admin app with credentials and the correct project ID
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId, // Explicitly set the project ID
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}
