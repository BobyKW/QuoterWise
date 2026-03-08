'use client';

import { SettingsForm } from '@/components/settings-form';
import { useTranslation } from 'react-i18next';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { User, Mail } from 'lucide-react';
import { EmailSettingsForm } from '@/components/email-settings-form';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('settings_page.title')}</h1>
      </div>
      <div className="max-w-4xl w-full mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              {t('settings_page.profile_tab')}
            </TabsTrigger>
            <TabsTrigger value="email">
               <Mail className="mr-2 h-4 w-4" />
              {t('settings_page.email_tab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <SettingsForm />
          </TabsContent>
          <TabsContent value="email">
            <EmailSettingsForm />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
