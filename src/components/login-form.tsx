'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: t('errors.login_failed'),
        description: t('errors.enter_email_password'),
      });
      return;
    }
    // This will trigger onAuthStateChanged, which will handle the redirect or UI update.
    initiateEmailSignIn(auth, email, password);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-login">{t('login_page.email_label')}</Label>
        <Input
          id="email-login"
          type="email"
          placeholder={t('login_page.email_placeholder')}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="password-login">{t('login_page.password_label')}</Label>
          <Link href="#" className="ml-auto inline-block text-sm underline">
            {t('login_page.forgot_password')}
          </Link>
        </div>
        <Input
          id="password-login"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        {t('login_page.login_button')}
      </Button>
    </form>
  );
}
