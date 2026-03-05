'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { useUser } from '@/firebase';
import { RegisterForm } from '@/components/register-form';
import { useTranslation } from 'react-i18next';


export default function RegisterPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    // If a user (anonymous or real) is already logged in, redirect them to the dashboard.
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Show loading screen while checking user state or if a user session exists.
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex justify-center mb-4">
            <Logo className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle className="text-2xl font-bold">{t('register_page.title')}</CardTitle>
          <CardDescription>{t('register_page.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <div className="mt-4 p-6 pt-0 text-center text-sm">
          {t('register_page.have_account')}{' '}
          <Link href="/login" className="underline">
            {t('register_page.login_link')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
