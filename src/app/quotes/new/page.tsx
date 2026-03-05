'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QuoteForm } from '@/components/quote-form';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Quote } from '@/lib/types';


function LimitReachedView({ isAnonymous, limit }: { isAnonymous: boolean, limit: number }) {
  const { t } = useTranslation();
  return (
    <Card className="text-center">
      <CardHeader className="items-center">
        <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-4">
          <AlertCircle className="h-8 w-8 text-destructive"/>
        </div>
        <CardTitle>{t('new_quote_page.limit_reached_title')}</CardTitle>
        <CardDescription className="max-w-md">
          {isAnonymous 
            ? t('new_quote_page.anonymous_limit_reached', { count: limit }) 
            : t('new_quote_page.registered_limit_reached', { count: limit })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/quotes">{t('new_quote_page.back_to_quotes')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function NewQuoteSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewQuotePage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const firestore = useFirestore();

  const { limits, isLoading: isLoadingLimits } = useQuoteLimits();
  
  const quotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes`));
  }, [user, firestore]);

  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);

  if (isLoadingLimits || isLoadingQuotes || !user) {
    return <NewQuoteSkeleton />;
  }

  const isAnonymous = user.isAnonymous;
  const quoteCount = quotes?.length || 0;
  const quoteLimit = isAnonymous ? limits.anonymousQuoteLimit : limits.registeredQuoteLimit;
  const limitReached = quoteCount >= quoteLimit;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('new_quote_page.title')}</h1>
      </div>
      {limitReached ? (
        <LimitReachedView isAnonymous={isAnonymous} limit={quoteLimit} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('new_quote_page.card_title')}</CardTitle>
            <CardDescription>{t('new_quote_page.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <QuoteForm />
          </CardContent>
        </Card>
      )}
    </main>
  );
}

    