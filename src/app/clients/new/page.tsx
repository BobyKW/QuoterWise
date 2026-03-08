'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClientForm } from '@/components/client-form';
import { useTranslation } from 'react-i18next';

export default function NewClientPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">{t('new_client_page.title')}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('new_client_page.card_title')}</CardTitle>
            <CardDescription>{t('new_client_page.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
