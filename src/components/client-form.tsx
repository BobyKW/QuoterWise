'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import type { Client, ClientDocument } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const getClientFormSchema = (t: TFunction) => z.object({
  companyName: z.string().min(1, t('validation.company_name_required')),
  contactName: z.string().min(1, t('validation.contact_name_required')),
  email: z.string().email(t('validation.email_invalid')),
  phone: z.string().min(1, t('validation.phone_required')),
  address: z.string().min(1, t('validation.address_required')),
});

type ClientFormValues = z.infer<ReturnType<typeof getClientFormSchema>>;

export function ClientForm({ client, onSuccess, onCancel }: { client?: Client, onSuccess?: () => void, onCancel?: () => void }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const clientFormSchema = getClientFormSchema(t);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  React.useEffect(() => {
    if (client) {
      form.reset(client);
    }
  }, [client, form]);

  const onSubmit = (data: ClientFormValues) => {
    if (!user) {
      console.error("No user found");
      return;
    }

    if (client) {
      const clientRef = doc(firestore, `userProfiles/${user.uid}/clients/${client.id}`);
      const updatedData = {
        ...data,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      updateDocumentNonBlocking(clientRef, updatedData);
      toast({
        title: t('toasts.client_updated_title'),
        description: t('toasts.client_updated_description', { clientName: data.companyName }),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clients');
      }
    } else {
      const clientData: Omit<ClientDocument, 'createdAt' | 'updatedAt'> = {
        ...data,
        userId: user.uid,
      };
      
      const finalClientData = {
          ...clientData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      }
      
      const clientsCol = collection(firestore, `userProfiles/${user.uid}/clients`);
      addDocumentNonBlocking(clientsCol, finalClientData);
      toast({
        title: t('toasts.client_created_title'),
        description: t('toasts.client_created_description', { clientName: data.companyName }),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clients');
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('client_form.company_name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('client_form.company_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('client_form.contact_name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('client_form.contact_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('client_form.email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t('client_form.email_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('client_form.phone')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('client_form.phone_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('client_form.address')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('client_form.address_placeholder')}
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onCancel ? onCancel() : router.back()}>
            {t('client_form.cancel')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('client_form.saving') : (client ? t('client_form.save_changes') : t('client_form.save_client'))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
