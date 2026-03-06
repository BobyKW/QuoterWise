'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QuoteForm } from '@/components/quote-form';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { Quote, QuoteSection, QuoteItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

function QuoteFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/5" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        </div>
    )
}


export default function EditQuotePage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [composedQuote, setComposedQuote] = useState<(Quote & { items: QuoteItem[] }) | null>(null);

  const quoteId = id as string;

  // 1. Fetch main quote doc. It might have an 'items' array (old model)
  const quoteRef = useMemoFirebase(() => {
    if (!quoteId || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/quotes/${quoteId}`);
  }, [quoteId, user, firestore]);
  const { data: quote, isLoading: isQuoteLoading } = useDoc<Quote & { items?: QuoteItem[] }>(quoteRef);

  // 2. Fetch sections (new model)
  const sectionsQuery = useMemoFirebase(() => {
    if (!quoteId || !user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections`), orderBy('order'));
  }, [quoteId, user, firestore]);
  const { data: sections, isLoading: areSectionsLoading } = useCollection<QuoteSection>(sectionsQuery);
  
  // 3. Fetch items from the first section (new model)
  const firstSectionId = sections?.[0]?.id;
  const itemsQuery = useMemoFirebase(() => {
    if (!firstSectionId || !user) return null; // Important: Only query if section exists
    return query(collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections/${firstSectionId}/items`), orderBy('order'));
  }, [quoteId, user, firestore, firstSectionId]);
  const { data: newModelItems, isLoading: areItemsLoading } = useCollection<QuoteItem>(itemsQuery);

  useEffect(() => {
    // This effect runs when the quote data or new model item data changes.
    // It constructs the final quote object to be passed to the form.
    if (quote) {
      // Prioritize items from the new data model (subcollections).
      if (newModelItems) {
        setComposedQuote({ ...quote, items: newModelItems });
      } 
      // Fallback for old data model: items stored as an array on the quote document.
      else if (quote.items && Array.isArray(quote.items)) {
        setComposedQuote(quote);
      }
      // If no items are found in either model, but the quote exists, prepare an empty form.
      else if (!areSectionsLoading && !areItemsLoading) {
         setComposedQuote({ ...quote, items: [] });
      }
    }
  }, [quote, newModelItems, areSectionsLoading, areItemsLoading]);

  // The page is loading if the main quote is loading, or if the dependent data (sections/items) is loading.
  const isLoading = isQuoteLoading || (!composedQuote && (areSectionsLoading || areItemsLoading));

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Edit Quote</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Quote {quote?.quoteNumber}</CardTitle>
          <CardDescription>Update the details of your quote.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <QuoteFormSkeleton />}
          {!isLoading && composedQuote && <QuoteForm quote={composedQuote} />}
          {!isLoading && !composedQuote && <p>Quote not found.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
