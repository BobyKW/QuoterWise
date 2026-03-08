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
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';


const templateSettingsSchema = z.object({
  pdfTemplate: z.enum(['classic', 'modern']).default('modern'),
  brandColor: z.string().optional(),
});

type TemplateSettingsFormValues = z.infer<typeof templateSettingsSchema>;

const templatePreviews = {
    classic: PlaceHolderImages.find(img => img.id === 'template-classic-preview'),
    modern: PlaceHolderImages.find(img => img.id === 'template-modern-preview'),
}

function TemplateSettingsSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-2/5" />
                    <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-2/5" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function TemplatesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<TemplateSettingsFormValues>({
    resolver: zodResolver(templateSettingsSchema),
    defaultValues: {
      pdfTemplate: 'modern',
      brandColor: '#2563eb', // default blue
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        pdfTemplate: userProfile.pdfTemplate || 'modern',
        brandColor: userProfile.brandColor || '#2563eb',
      });
    }
  }, [userProfile, form]);

  const onSubmit = (data: TemplateSettingsFormValues) => {
    if (!user || !userProfileRef) return;

    setDocumentNonBlocking(userProfileRef, data, { merge: true });

    toast({
      title: t('toasts.template_settings_saved_title'),
      description: t('toasts.template_settings_saved_description'),
    });
  };

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <h1 className="font-semibold text-lg md:text-2xl">{t('templates_page.title')}</h1>
            <TemplateSettingsSkeleton />
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('templates_page.title')}</h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('templates_page.layout_title')}</CardTitle>
                    <CardDescription>{t('templates_page.layout_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="pdfTemplate"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-8"
                            >
                            <FormItem className="flex flex-col items-center space-y-2">
                                <FormControl>
                                <RadioGroupItem value="modern" className="sr-only" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer w-full">
                                    <div className={cn("border-2 rounded-lg transition-all overflow-hidden", field.value === 'modern' ? "border-primary ring-2 ring-primary" : "border-muted hover:border-foreground/20")}>
                                        {templatePreviews.modern && <Image src={templatePreviews.modern.imageUrl} alt="Modern Template Preview" width={400} height={565} className="w-full h-auto object-cover aspect-[400/565] rounded-md" />}
                                    </div>
                                    <span className="block w-full p-2 text-center font-medium">{t('templates_page.modern_template')}</span>
                                </FormLabel>
                            </FormItem>
                             <FormItem className="flex flex-col items-center space-y-2">
                                <FormControl>
                                <RadioGroupItem value="classic" className="sr-only" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer w-full">
                                   <div className={cn("border-2 rounded-lg transition-all overflow-hidden", field.value === 'classic' ? "border-primary ring-2 ring-primary" : "border-muted hover:border-foreground/20")}>
                                        {templatePreviews.classic && <Image src={templatePreviews.classic.imageUrl} alt="Classic Template Preview" width={400} height={565} className="w-full h-auto object-cover aspect-[400/565] rounded-md" />}
                                    </div>
                                    <span className="block w-full p-2 text-center font-medium">{t('templates_page.classic_template')}</span>
                                </FormLabel>
                            </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('templates_page.branding_title')}</CardTitle>
                    <CardDescription>{t('templates_page.branding_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="brandColor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('templates_page.brand_color_label')}</FormLabel>
                            <FormControl>
                                <div className="relative flex items-center max-w-xs">
                                <Input type="text" {...field} />
                                <Input type="color" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-1" value={field.value} onChange={field.onChange} />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('templates_page.saving_button') : t('templates_page.save_button')}
                </Button>
            </div>
        </form>
      </Form>
    </main>
  );
}
