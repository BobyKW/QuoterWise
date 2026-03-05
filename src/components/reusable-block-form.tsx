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
import type { ReusableBlock, ReusableBlockDocument } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Separator } from './ui/separator';
import { useTranslation } from 'react-i18next';

const reusableBlockFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  concept: z.string().min(1, 'El concepto es obligatorio.'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Debe ser un número positivo.'),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Debe ser un número positivo.'),
  taxRate: z.coerce.number().min(0, 'Debe ser un número positivo.').max(100).optional().default(0),
});

type ReusableBlockFormValues = z.infer<typeof reusableBlockFormSchema>;

export function ReusableBlockForm({ block }: { block?: ReusableBlock }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<ReusableBlockFormValues>({
    resolver: zodResolver(reusableBlockFormSchema),
    defaultValues: {
      name: '',
      concept: '',
      description: '',
      quantity: 1,
      unit: 'ud',
      unitPrice: 0,
      taxRate: 21,
    },
  });

  React.useEffect(() => {
    if (block) {
      form.reset(block);
    }
  }, [block, form]);

  const onSubmit = (data: ReusableBlockFormValues) => {
    if (!user) {
      console.error("No user found");
      return;
    }

    if (block) {
      const blockRef = doc(firestore, `userProfiles/${user.uid}/reusableBlocks/${block.id}`);
      const updatedData = {
        ...data,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };
      updateDocumentNonBlocking(blockRef, updatedData);
      toast({
        title: t('toasts.block_updated_title'),
        description: t('toasts.block_updated_description', { blockName: data.name }),
      });
      router.push('/reusable-blocks');
    } else {
      const blockData: Omit<ReusableBlockDocument, 'createdAt' | 'updatedAt'> = {
        ...data,
        userId: user.uid,
      };
      
      const finalBlockData = {
          ...blockData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      }
      
      const blocksCol = collection(firestore, `userProfiles/${user.uid}/reusableBlocks`);
      addDocumentNonBlocking(blocksCol, finalBlockData);
      toast({
        title: t('toasts.block_created_title'),
        description: t('toasts.block_created_description', { blockName: data.name }),
      });
      router.push('/reusable-blocks');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
            <FormItem>
                <FormLabel>{t('reusable_block_form.block_name')}</FormLabel>
                <FormControl>
                <Input placeholder={t('reusable_block_form.block_name_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <Separator/>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('reusable_block_form.concept_details')}</h3>
             <FormField
                control={form.control}
                name="concept"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('reusable_block_form.concept')}</FormLabel>
                    <FormControl>
                    <Input placeholder={t('reusable_block_form.concept_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('reusable_block_form.description')}</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder={t('reusable_block_form.description_placeholder')}
                        className="resize-y"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('reusable_block_form.quantity')}</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('reusable_block_form.unit')}</FormLabel>
                        <FormControl>
                        <Input placeholder={t('reusable_block_form.unit_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('reusable_block_form.unit_price')}</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('reusable_block_form.tax')}</FormLabel>
                        <FormControl>
                        <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('reusable_block_form.cancel')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('reusable_block_form.saving') : (block ? t('reusable_block_form.save_changes') : t('reusable_block_form.save_block'))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
