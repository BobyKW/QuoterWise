'use server';

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { adminDb, initializeAdminApp } from '@/firebase/server';

// Initialize Stripe with the secret key from environment variables
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
    console.log(`❌ Error message: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Initialize Firebase Admin SDK
  initializeAdminApp();

  console.log('✅ Success:', event.id);

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
        console.log(`Subscription activated for ${userDoc.id}`);
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

  return new Response(null, { status: 200 });
}
