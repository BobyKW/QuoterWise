'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReusableBlockForm } from '@/components/reusable-block-form';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { ReusableBlock } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

function ReusableBlockFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
        </div>
    )
}

export default function EditReusableBlockPage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const blockRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/reusableBlocks/${id as string}`);
  }, [id, user, firestore]);

  const { data: block, isLoading } = useDoc<ReusableBlock>(blockRef);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('edit_reusable_block_page.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('edit_reusable_block_page.card_title', { blockName: block?.name || t('edit_reusable_block_page.block_fallback') })}</CardTitle>
          <CardDescription>{t('edit_reusable_block_page.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <ReusableBlockFormSkeleton />}
          {!isLoading && block && <ReusableBlockForm block={block} />}
          {!isLoading && !block && <p>{t('edit_reusable_block_page.not_found')}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
