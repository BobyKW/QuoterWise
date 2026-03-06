'use server';

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

// Initialize Stripe with the secret key from environment variables.
// IMPORTANT: Set STRIPE_SECRET_KEY in your Firebase App Hosting environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// IMPORTANT: Set STRIPE_WEBHOOK_SECRET in your Firebase App Hosting environment.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Firebase Admin SDK.
// It automatically uses the service account credentials from the App Hosting environment.
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Handles incoming webhooks from Stripe.
 * @param request The Next.js request object.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe.
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle the specific webhook event.
  try {
    switch (event.type) {
      // --- Subscription Created or Updated ---
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          const customerEmail = await getCustomerEmail(session.customer);
          if (customerEmail) {
            await updateUserSubscriptionStatus(customerEmail, 'active');
            console.log(`Subscription activated for ${customerEmail}`);
          }
        }
        break;
      }

      // --- Subscription Canceled or Payment Failed ---
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerEmail = await getCustomerEmail(subscription.customer);
        if (customerEmail) {
          await updateUserSubscriptionStatus(customerEmail, 'inactive');
          console.log(`Subscription deactivated for ${customerEmail}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    return new Response('Webhook handler failed. View logs.', { status: 500 });
  }

  // Acknowledge receipt of the event.
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

/**
 * Retrieves the email address of a Stripe customer.
 * @param customerId The ID of the Stripe customer.
 */
async function getCustomerEmail(
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string | null> {
  if (typeof customerId !== 'string') {
    return null;
  }
  try {
    const customer = (await stripe.customers.retrieve(
      customerId
    )) as Stripe.Customer;
    return customer.email;
  } catch (error) {
    console.error(
      `Could not retrieve customer email for ID: ${customerId}`,
      error
    );
    return null;
  }
}

/**
 * Updates the subscription status for a user in Firestore.
 * @param email The user's email address.
 * @param status The new subscription status.
 */
async function updateUserSubscriptionStatus(
  email: string,
  status: 'active' | 'inactive'
): Promise<void> {
  if (!email) return;

  const userQuery = db
    .collection('userProfiles')
    .where('email', '==', email)
    .limit(1);
  const userSnapshot = await userQuery.get();

  if (userSnapshot.empty) {
    console.warn(`Webhook received for non-existent user email: ${email}`);
    return;
  }

  const userDocRef = userSnapshot.docs[0].ref;
  await userDocRef.update({ subscriptionStatus: status });
}
