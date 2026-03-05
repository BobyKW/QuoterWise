'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // If there's a user (anonymous or real), go to dashboard.
        router.push('/dashboard');
      } else {
        // If there's no user at all, sign in anonymously.
        // The onAuthStateChanged listener will then pick up the new anonymous user,
        // and the next render will redirect to the dashboard.
        initiateAnonymousSignIn(auth);
      }
    }
  }, [user, isUserLoading, router, auth]);

  // Display a loading indicator while checking auth status
  return (
     <div className="flex min-h-screen items-center justify-center">
        <p>{t('loading')}</p>
      </div>
  );
}
