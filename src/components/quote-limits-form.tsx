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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { AppConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from 'react-i18next';

const limitsFormSchema = z.object({
  anonymousQuoteLimit: z.coerce.number().min(0, 'Must be a positive number.'),
  registeredQuoteLimit: z.coerce.number().min(0, 'Must be a positive number.'),
});

type LimitsFormValues = z.infer<typeof limitsFormSchema>;

export function QuoteLimitsForm() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const limitsRef = useMemoFirebase(() => doc(firestore, 'appConfig/limits'), [firestore]);
  const { data: limits, isLoading } = useDoc<AppConfig>(limitsRef);

  const form = useForm<LimitsFormValues>({
    resolver: zodResolver(limitsFormSchema),
    defaultValues: {
      anonymousQuoteLimit: 2,
      registeredQuoteLimit: 7,
    },
  });

  useEffect(() => {
    if (limits) {
      form.reset(limits);
    }
  }, [limits, form]);

  const onSubmit = (data: LimitsFormValues) => {
    if (!limitsRef) return;
    
    setDocumentNonBlocking(limitsRef, data, { merge: true });

    toast({
      title: t('toasts.limits_saved_title'),
      description: t('toasts.limits_saved_description'),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
        </CardHeader>
        <CardContent className="space-y-8">
           <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
     <Card>
        <CardHeader>
          <CardTitle>{t('admin_page.quote_limits_title')}</CardTitle>
          <CardDescription>{t('admin_page.quote_limits_description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="anonymousQuoteLimit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('quote_limits_form.anonymous_label')}</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="registeredQuoteLimit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('quote_limits_form.registered_label')}</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('quote_limits_form.saving_button') : t('quote_limits_form.save_button')}
                </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}

    