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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const defaultEmailBody = `Hello {{clientName}},

Please find attached your quote {{quoteNumber}} for a total of {{finalTotal}}.

You can view the quote online at the following link:
{{quoteLink}}

Please let me know if you have any questions.

Best regards,
{{businessName}}`;


const emailSettingsFormSchema = z.object({
  emailSubject: z.string().min(1, 'Subject is required.'),
  emailBody: z.string().min(1, 'Body is required.'),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsFormSchema>;

export function EmailSettingsForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsFormSchema),
    defaultValues: {
      emailSubject: 'Quote {{quoteNumber}} from {{businessName}}',
      emailBody: defaultEmailBody,
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        emailSubject: userProfile.emailSubject || `Quote {{quoteNumber}} from {{businessName}}`,
        emailBody: userProfile.emailBody || defaultEmailBody,
      });
    }
  }, [userProfile, form]);
  
  if (user?.isAnonymous) {
      return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>{t('settings_page.email_template_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground p-8">{t('settings_page.login_to_configure_email')}</p>
            </CardContent>
        </Card>
      )
  }

  const onSubmit = (data: EmailSettingsFormValues) => {
    if (!user || !userProfileRef) return;

    setDocumentNonBlocking(userProfileRef, data, { merge: true });

    toast({
      title: t('toasts.email_settings_saved_title'),
      description: t('toasts.email_settings_saved_description'),
    });
  };

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
        <CardHeader>
            <CardTitle>{t('settings_page.email_template_title')}</CardTitle>
            <CardDescription>{t('settings_page.email_template_description')}</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="emailSubject"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('settings_page.email_subject_label')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="emailBody"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('settings_page.email_body_label')}</FormLabel>
                            <FormControl>
                            <Textarea
                                className="resize-y min-h-[200px]"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div>
                        <h4 className="font-medium text-sm mb-2">{t('settings_page.available_variables_title')}</h4>
                        <p className="text-sm text-muted-foreground">
                            <code>{'{{clientName}}'}</code>, <code>{'{{quoteNumber}}'}</code>, <code>{'{{finalTotal}}'}</code>, <code>{'{{quoteLink}}'}</code>, <code>{'{{businessName}}'}</code>
                        </p>
                    </div>
                    <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? t('settings_form.saving') : t('settings_form.save_settings')}
                    </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
