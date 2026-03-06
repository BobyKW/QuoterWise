'use server';

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK, but only if it hasn't been initialized already.
// This "lazy initialization" pattern is safe for serverless environments like Vercel.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    throw new Error('Firebase service account not found in environment variables. Please ensure FIREBASE_SERVICE_ACCOUNT is set in Vercel.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // Log the project ID and client email to verify the correct key is being used.
    console.log(`Initializing Firebase Admin with Project ID: ${serviceAccount.project_id} and Client Email: ${serviceAccount.client_email}`);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error during Firebase Admin init.';
    console.error(`Failed to parse or initialize Firebase Admin SDK: ${errorMessage}`);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${errorMessage}`);
  }
}


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Error constructing Stripe event: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Initialize Firebase Admin SDK right before we need it
  try {
    initializeFirebaseAdmin();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown server configuration error';
    console.error("Firebase Admin initialization failed:", errorMessage);
    return new Response(`Webhook handler error: ${errorMessage}`, { status: 500 });
  }
  
  const adminDb = admin.firestore();

  console.log('✅ Success processing Stripe event:', event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.customer_details?.email) {
          throw new Error('Missing user email in checkout session');
        }
        
        console.log(`Processing checkout for ${session.customer_details.email}`);
        
        const usersRef = adminDb.collection('userProfiles');
        const q = usersRef.where('email', '==', session.customer_details.email).limit(1);
        const userSnapshot = await q.get();

        if (userSnapshot.empty) {
          console.error(`No user found with email: ${session.customer_details.email}`);
          break;
        }

        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({ subscriptionStatus: 'active' });
        console.log(`Successfully activated subscription for ${userDoc.id}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

        if (customer.deleted) {
             console.log('Customer object is deleted.');
             break;
        }

        if (!customer.email) {
          throw new Error('Missing user email in customer subscription');
        }
        
        console.log(`Processing subscription deletion for ${customer.email}`);

        const usersRef = adminDb.collection('userProfiles');
        const q = usersRef.where('email', '==', customer.email).limit(1);
        const userSnapshot = await q.get();

        if (userSnapshot.empty) {
          console.error(`No user found with email: ${customer.email}`);
          break;
        }

        const userDoc = userSnapshot.docs[0];
        await userDoc.ref.update({ subscriptionStatus: 'inactive' });
        console.log(`Subscription deactivated for ${userDoc.id}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Webhook handler error:', errorMessage);
     return new Response(`Webhook handler error: ${errorMessage}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
