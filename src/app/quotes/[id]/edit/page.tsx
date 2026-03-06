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

  const quoteRef = useMemoFirebase(() => {
    if (!quoteId || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/quotes/${quoteId}`);
  }, [quoteId, user, firestore]);
  const { data: quote, isLoading: isQuoteLoading } = useDoc<Quote>(quoteRef);

  const sectionsQuery = useMemoFirebase(() => {
    if (!quoteId || !user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections`), orderBy('order'));
  }, [quoteId, user, firestore]);
  const { data: sections, isLoading: areSectionsLoading } = useCollection<QuoteSection>(sectionsQuery);
  
  const firstSectionId = sections?.[0]?.id;
  const itemsQuery = useMemoFirebase(() => {
    if (!quoteId || !user || !firstSectionId) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections/${firstSectionId}/items`), orderBy('order'));
  }, [quoteId, user, firestore, firstSectionId]);
  const { data: items, isLoading: areItemsLoading } = useCollection<QuoteItem>(itemsQuery);

  useEffect(() => {
    if (quote && items) {
      setComposedQuote({ ...quote, items });
    }
  }, [quote, items]);

  const isLoading = isQuoteLoading || areSectionsLoading || areItemsLoading;

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
          {(isLoading && !composedQuote) && <QuoteFormSkeleton />}
          {!isLoading && composedQuote && <QuoteForm quote={composedQuote} />}
          {!isLoading && !quote && <p>Quote not found.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
