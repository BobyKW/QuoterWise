import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseAdmin() {
  if (!app) {
    // This check is for hot-reloading environments, to prevent re-initializing.
    if (admin.apps.length > 0 && admin.apps[0]) {
      app = admin.apps[0];
    } else {
      try {
        // Standard for Google Cloud environments (App Hosting, Cloud Functions)
        app = admin.initializeApp();
      } catch (e) {
        console.warn(`Default Firebase Admin initialization failed: ${e}. Falling back to service account.`);
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountString) {
          try {
            const serviceAccount = JSON.parse(serviceAccountString);
            if (serviceAccount.private_key) {
              serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            app = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
          } catch (initErr) {
            throw new Error(`Failed to initialize Firebase Admin SDK with service account after default init failed. Error: ${initErr}`);
          }
        } else {
          throw new Error(`Firebase Admin SDK initialization failed. Default credentials failed, and no FIREBASE_SERVICE_ACCOUNT was provided.`);
        }
      }
    }
  }

  return {
    auth: admin.auth(app),
    firestore: admin.firestore(app),
  };
}
