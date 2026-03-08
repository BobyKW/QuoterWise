'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';
import type { Quote, Client, UserProfile, QuoteSection, QuoteItem, PublicQuote } from '@/lib/types';

type ActionResponse = {
  success: boolean;
  shareableLink?: string;
  error?: string;
};

export async function sendQuoteEmail(quoteId: string): Promise<ActionResponse> {
  try {
    const { auth, firestore } = getFirebaseAdmin();
    const headersList = headers();
    const token = headersList.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return { success: false, error: 'Authentication token not found.' };
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    if (decodedToken.isAnonymous) {
        return { success: false, error: 'Guest users cannot send quotes.'}
    }

    const batch = firestore.batch();

    const userProfileRef = firestore.collection('userProfiles').doc(userId);
    const quoteRef = userProfileRef.collection('quotes').doc(quoteId);

    const [userProfileSnap, quoteSnap] = await Promise.all([
      userProfileRef.get(),
      quoteRef.get(),
    ]);

    if (!userProfileSnap.exists || !quoteSnap.exists) {
      return { success: false, error: 'User profile or quote not found.' };
    }

    const userProfile = userProfileSnap.data() as UserProfile;
    const quote = quoteSnap.data() as Quote;

    const shareableLinkToken = quote.shareableLinkToken || randomBytes(16).toString('hex');
    const shareableLink = `${process.env.NEXT_PUBLIC_BASE_URL}/view-quote/${shareableLinkToken}`;

    // Fetch all sections and their items
    const sectionsRef = quoteRef.collection('sections');
    const sectionsSnap = await sectionsRef.get();

    const sectionsWithItems = [];
    for (const sectionDoc of sectionsSnap.docs) {
        const sectionData = sectionDoc.data() as QuoteSection;
        const itemsRef = sectionDoc.ref.collection('items');
        const itemsSnap = await itemsRef.get();
        const items = itemsSnap.docs.map(itemDoc => itemDoc.data() as QuoteItem);
        sectionsWithItems.push({ ...sectionData, items });
    }

    // Denormalize data for the public quote document
    const publicQuoteData: PublicQuote = {
      userProfile: {
        businessName: userProfile.businessName,
        address: userProfile.address,
        city: userProfile.city,
        country: userProfile.country,
        phone: userProfile.phone,
        email: userProfile.email,
        logoUrl: userProfile.logoUrl,
        defaultTerms: userProfile.defaultTerms,
      },
      quote: {
        quoteNumber: quote.quoteNumber,
        issueDate: quote.issueDate,
        clientName: quote.clientName,
        subtotal: quote.subtotal,
        totalDiscount: quote.totalDiscount,
        totalTax: quote.totalTax,
        finalTotal: quote.finalTotal,
        currency: quote.currency,
      },
      sections: sectionsWithItems.map(s => ({
        name: s.name,
        description: s.description,
        items: s.items.map(i => ({
            id: i.id,
            concept: i.concept,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            taxRate: i.taxRate,
            order: i.order,
        })),
      })),
    };
    
    const publicQuoteRef = firestore.collection('publicQuotes').doc(shareableLinkToken);
    batch.set(publicQuoteRef, publicQuoteData);

    // Update the original quote
    batch.update(quoteRef, {
      status: 'sent',
      shareableLinkToken: shareableLinkToken,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    
    // Here you would integrate with an email service like SendGrid, Nodemailer, etc.
    // For this example, we'll just log and return the link.
    console.log(`Simulating email send. Shareable Link: ${shareableLink}`);

    return { success: true, shareableLink };
  } catch (error) {
    console.error('Error in sendQuoteEmail action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
