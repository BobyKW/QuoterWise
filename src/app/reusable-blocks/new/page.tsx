'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReusableBlockForm } from '@/components/reusable-block-form';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReusableBlock } from '@/lib/types';


function LimitReachedView({ isAnonymous, limit }: { isAnonymous: boolean, limit: number }) {
  const { t } = useTranslation();
  return (
    <Card className="text-center">
      <CardHeader className="items-center">
        <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit mb-4">
          <AlertCircle className="h-8 w-8 text-destructive"/>
        </div>
        <CardTitle>{t('new_reusable_block_page.limit_reached_title')}</CardTitle>
        <CardDescription className="max-w-md">
          {isAnonymous 
            ? t('new_reusable_block_page.anonymous_limit_reached', { count: limit }) 
            : t('new_reusable_block_page.registered_limit_reached', { count: limit })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/reusable-blocks">{t('new_reusable_block_page.back_to_blocks')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function NewBlockSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
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
    </div>
  )
}

export default function NewReusableBlockPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const firestore = useFirestore();

  const { limits, isLoading, isPro } = useQuoteLimits();
  
  const blocksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/reusableBlocks`));
  }, [user, firestore]);

  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<ReusableBlock>(blocksQuery);

  if (isLoading || isLoadingBlocks || !user) {
    return <NewBlockSkeleton />;
  }

  const isAnonymous = user.isAnonymous;
  const blockCount = blocks?.length || 0;
  const blockLimit = isAnonymous ? limits.anonymousBlockLimit : limits.registeredBlockLimit;
  const limitReached = !isPro && blockCount >= blockLimit;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">{t('new_reusable_block_page.title')}</h1>
        </div>
        {limitReached ? (
          <LimitReachedView isAnonymous={isAnonymous} limit={blockLimit} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('new_reusable_block_page.card_title')}</CardTitle>
              <CardDescription>{t('new_reusable_block_page.card_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReusableBlockForm />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
