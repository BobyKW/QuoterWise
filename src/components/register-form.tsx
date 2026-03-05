'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: t('errors.registration_failed'),
        description: t('errors.enter_email_password'),
      });
      return;
    }
    // This will trigger onAuthStateChanged for account linking/creation.
    initiateEmailSignUp(auth, email, password);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name-register">{t('register_page.name_label')}</Label>
        <Input
          id="name-register"
          placeholder={t('register_page.name_placeholder')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-register">{t('register_page.email_label')}</Label>
        <Input
          id="email-register"
          type="email"
          placeholder={t('register_page.email_placeholder')}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-register">{t('register_page.password_label')}</Label>
        <Input
          id="password-register"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        {t('register_page.create_button')}
      </Button>
    </form>
  );
}
