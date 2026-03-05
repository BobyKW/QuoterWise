'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { useUser } from '@/firebase';
import { LoginForm } from '@/components/login-form';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    // If a real user is already logged in, redirect them.
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Show loading screen while checking user state or if user is not anonymous.
  if (isUserLoading || (user && !user.isAnonymous)) {
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
          <CardTitle className="text-2xl font-bold">{t('login_page.welcome')}</CardTitle>
          <CardDescription>{t('login_page.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <div className="mt-4 p-6 pt-0 text-center text-sm">
          {t('login_page.no_account')}{' '}
          <Link href="/register" className="underline">
            {t('login_page.signup_link')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
