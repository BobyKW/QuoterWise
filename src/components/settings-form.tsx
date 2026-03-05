'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const settingsFormSchema = z.object({
  businessName: z.string().min(1, 'Business name is required.'),
  taxId: z.string().optional(),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  country: z.string().min(1, 'Country is required.'),
  phone: z.string().min(1, 'Phone is required.'),
  logoUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  defaultTerms: z.string().min(1, 'Default terms are required.'),
  currency: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      businessName: '',
      taxId: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      logoUrl: '',
      defaultTerms: '',
      currency: 'EUR',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset(userProfile);
    }
  }, [userProfile, form]);

  const onSubmit = (data: SettingsFormValues) => {
    if (!user || !userProfileRef) {
      console.error("User or user profile reference not available.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save settings. Please try again.",
      });
      return;
    }

    const profileData = {
      ...data,
      id: user.uid,
      email: user.email,
      updatedAt: serverTimestamp(),
      ...(userProfile ? {} : { createdAt: serverTimestamp(), nextQuoteNumber: 1 }),
    };

    setDocumentNonBlocking(userProfileRef, profileData, { merge: true });

    toast({
      title: t('toasts.settings_saved_title'),
      description: t('toasts.settings_saved_description'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
         <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <FormLabel>{t('settings_page.language')}</FormLabel>
              <Select
                value={i18n.language}
                onValueChange={(value) => i18n.changeLanguage(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                  {t('settings_page.language_description')}
              </p>
            </div>
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t('settings_page.currency')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings_form.currency_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('settings_page.currency_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings_form.business_name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('settings_form.business_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('settings_form.tax_id')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('settings_form.tax_id_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings_form.address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('settings_form.address_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('settings_form.city')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('settings_form.city_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('settings_form.country')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('settings_form.country_placeholder')} {...field} />
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
                <FormLabel>{t('settings_form.phone')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('settings_form.phone_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('settings_form.logo_url')}</FormLabel>
                <FormControl>
                    <Input type="url" placeholder={t('settings_form.logo_url_placeholder')} {...field} />
                </FormControl>
                <FormDescription>
                    {t('settings_form.logo_url_description')}
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="defaultTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('settings_form.default_terms')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('settings_form.default_terms_placeholder')}
                  className="resize-y min-h-[100px]"
                  {...field}
                />
              </FormControl>
               <FormDescription>
                    {t('settings_form.default_terms_description')}
                </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('settings_form.saving') : t('settings_form.save_settings')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
