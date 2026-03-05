'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { useTranslation } from 'react-i18next';

export function AuthModal() {
  const { isOpen, onClose } = useAuthModal();
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">{t('auth_modal.title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('auth_modal.description')}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('auth_modal.login_tab')}</TabsTrigger>
            <TabsTrigger value="register">{t('auth_modal.register_tab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <LoginForm onSuccess={onClose} />
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            <RegisterForm onSuccess={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
