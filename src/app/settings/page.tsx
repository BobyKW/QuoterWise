'use client';

import { SettingsForm } from '@/components/settings-form';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">{t('settings_page.title')}</h1>
        </div>
        <SettingsForm />
      </div>
    </main>
  );
}
