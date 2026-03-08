'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClientForm } from '@/components/client-form';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

function ClientFormSkeleton() {
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
        </div>
    )
}

export default function EditClientPage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const clientRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/clients/${id as string}`);
  }, [id, user, firestore]);

  const { data: client, isLoading } = useDoc<Client>(clientRef);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('edit_client_page.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('edit_client_page.card_title', { clientName: client?.companyName || t('edit_client_page.default_client_name') })}</CardTitle>
          <CardDescription>{t('edit_client_page.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <ClientFormSkeleton />}
          {!isLoading && client && <ClientForm client={client} />}
          {!isLoading && !client && <p>{t('edit_client_page.not_found')}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
