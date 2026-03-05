'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsForm } from '@/components/settings-form';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('settings_page.title')}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings_page.card_title')}</CardTitle>
          <CardDescription>{t('settings_page.card_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </main>
  );
}
