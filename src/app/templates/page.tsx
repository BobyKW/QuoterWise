'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function TemplatesPage() {
  const { t } = useTranslation();
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('templates_page.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('templates_page.card_title')}</CardTitle>
          <CardDescription>{t('templates_page.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t('templates_page.content')}</p>
        </CardContent>
      </Card>
    </main>
  );
}
