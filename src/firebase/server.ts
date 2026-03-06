'use server';

import * as admin from 'firebase-admin';

export function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  // Safely parse the service account from environment variables
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  // Throw an error if the service account is not found
  if (!serviceAccountString) {
    throw new Error('Firebase service account not found in environment variables. Please ensure FIREBASE_SERVICE_ACCOUNT is set in Vercel.');
  }

  const serviceAccount = JSON.parse(serviceAccountString);
  
  // Initialize the admin app with credentials.
  // The projectId is automatically read from the service account JSON.
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
