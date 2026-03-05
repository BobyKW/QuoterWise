'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QuoteForm } from '@/components/quote-form';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Quote } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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

  const quoteRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/quotes/${id as string}`);
  }, [id, user, firestore]);

  const { data: quote, isLoading } = useDoc<Quote>(quoteRef);

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
          {!isLoading && quote && <QuoteForm quote={quote} />}
          {!isLoading && !quote && <p>Quote not found.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
