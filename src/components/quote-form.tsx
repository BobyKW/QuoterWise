'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Library, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc, query, orderBy, increment, writeBatch } from 'firebase/firestore';
import type { Quote, Client, ReusableBlock, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ClientForm } from '@/components/client-form';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const quoteItemSchema = z.object({
  concept: z.string().min(1, 'Concept is required.'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Must be positive.'),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Must be positive.'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
});

const quoteFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  clientId: z.string().min(1, 'Please select a client.'),
  clientName: z.string().min(1, 'Client name is required.'),
  quoteNumber: z.string().min(1, 'Quote number is required.'),
  issueDate: z.date(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'negotiating', 'expired']),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required.'),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

const defaultItem: z.infer<typeof quoteItemSchema> = {
  concept: '',
  description: '',
  quantity: 1,
  unit: 'ud',
  unitPrice: 0,
  taxRate: 21,
};

export function QuoteForm({ quote }: { quote?: Quote }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = React.useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/clients`),
        orderBy('companyName', 'asc')
    );
  }, [user, firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  
  const blocksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/reusableBlocks`),
        orderBy('name', 'asc')
    );
  }, [user, firestore]);
  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<ReusableBlock>(blocksQuery);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      title: '',
      clientId: '',
      clientName: '',
      quoteNumber: '',
      issueDate: new Date(),
      status: 'draft',
      items: [defaultItem],
    },
  });

  // This effect handles setting initial form values for both new and existing quotes.
  React.useEffect(() => {
    if (quote) {
      // If editing an existing quote, fetch its sections and items and populate the form.
      // This part is complex and would require fetching subcollections.
      // For this hardening refactor, we focus on the CREATE logic.
      // A full EDIT implementation would be a separate, larger task.
      form.reset({
        ...quote,
        issueDate: quote.issueDate instanceof Timestamp ? quote.issueDate.toDate() : quote.issueDate,
        // items would need to be fetched from subcollections here.
      });
       if(!form.getValues('title')){
        form.setValue('title', `Presupuesto para ${quote.clientName}`);
      }
    } else if (form.getValues('quoteNumber') === '' && userProfile) {
      // If creating a new quote for a registered user, generate the next quote number.
      const nextNumber = userProfile.nextQuoteNumber || 1;
      const year = new Date().getFullYear();
      const numberStr = String(nextNumber).padStart(4, '0');
      form.setValue('quoteNumber', `Q-${year}-${numberStr}`);
    } else if (!isLoadingProfile && form.getValues('quoteNumber') === '') {
        // Fallback for anonymous users or if profile is not loaded yet.
        const tempNumber = `DRAFT-${Date.now().toString().slice(-6)}`;
        form.setValue('quoteNumber', tempNumber);
    }
  }, [quote, userProfile, isLoadingProfile, form]);
  
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'clientName' && value.clientName && !form.getValues('title')) {
        form.setValue('title', `Presupuesto para ${value.clientName}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  
  const subtotal = watchItems.reduce(
    (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );

  const totalTax = watchItems.reduce(
    (acc, item) =>
      acc +
      (item.quantity || 0) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100),
    0
  );

  const finalTotal = subtotal + totalTax;

  const onSubmit = async (data: QuoteFormValues) => {
    if (!user) {
      console.error("No user found");
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a quote.' });
      return;
    }

    if (quote) {
        // NOTE: Updating quotes with subcollections is a more complex operation
        // involving fetching existing sections/items, diffing them, and then
        // creating a batch write to update/delete/add as needed.
        // This is a significant feature in itself.
        // For now, we will show a toast message that this is not yet implemented.
        toast({
            title: "Not Implemented",
            description: "Updating existing quotes is not yet supported in this version. Please create a new quote.",
            variant: "destructive"
        });
        return;
    }
    
    // --- CREATE NEW QUOTE LOGIC ---
    const batch = writeBatch(firestore);

    // 1. Create main quote document reference and data
    const quoteCol = collection(firestore, `userProfiles/${user.uid}/quotes`);
    const quoteRef = doc(quoteCol);
    const quoteId = quoteRef.id;

    const quoteData = {
        userId: user.uid,
        clientId: data.clientId,
        clientName: data.clientName,
        title: data.title,
        quoteNumber: data.quoteNumber,
        issueDate: Timestamp.fromDate(data.issueDate),
        validUntilDate: Timestamp.fromDate(new Date(data.issueDate.getTime() + 30 * 24 * 60 * 60 * 1000)), // 30 days validity
        status: data.status,
        subtotal: subtotal,
        totalDiscount: 0,
        totalTax: totalTax,
        finalTotal: finalTotal,
        currency: userProfile?.currency || 'EUR',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(quoteRef, quoteData);

    // 2. Create a single section for all items
    const sectionsCol = collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections`);
    const sectionRef = doc(sectionsCol);
    const sectionId = sectionRef.id;

    const sectionData = {
        userId: user.uid,
        quoteId: quoteId,
        name: 'Conceptos Generales',
        description: 'Lista de productos y servicios incluidos en el presupuesto.',
        order: 1,
        subtotal: subtotal,
        totalDiscount: 0,
        totalTax: totalTax,
        sectionTotal: finalTotal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(sectionRef, sectionData);

    // 3. Create documents for each item in the section's subcollection
    const itemsCol = collection(firestore, `userProfiles/${user.uid}/quotes/${quoteId}/sections/${sectionId}/items`);
    data.items.forEach((item, index) => {
        const itemRef = doc(itemsCol);
        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0) * (1 + (item.taxRate || 0) / 100);
        const itemData = {
            ...item,
            userId: user.uid,
            quoteId: quoteId,
            quoteSectionId: sectionId,
            lineTotal: lineTotal,
            order: index + 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        batch.set(itemRef, itemData);
    });

    // 4. Update the user's nextQuoteNumber
    if (userProfileRef && userProfile) {
      batch.update(userProfileRef, { nextQuoteNumber: increment(1) });
    }

    // 5. Commit the atomic batch write
    try {
        await batch.commit();
        toast({
            title: t('toasts.quote_created_title'),
            description: t('toasts.quote_created_description', { quoteNumber: data.quoteNumber }),
        });
        router.push('/quotes');
    } catch (error) {
        console.error("Error creating quote:", error);
        toast({
            variant: "destructive",
            title: "Error Creating Quote",
            description: "An unexpected error occurred. Please try again."
        });
    }
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.currency || 'EUR' }).format(amount);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('quote_form.title', 'Title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('quote_form.title_placeholder', 'e.g. Bathroom Remodel Project')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                    <FormLabel>{t('quote_form.client')}</FormLabel>
                    <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                        <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('quote_form.new_client')}
                        </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('quote_form.new_client_dialog_title')}</DialogTitle>
                                <DialogDescription>
                                {t('quote_form.new_client_dialog_description')}
                                </DialogDescription>
                            </DialogHeader>
                            <ClientForm 
                                onSuccess={() => setIsClientDialogOpen(false)}
                                onCancel={() => setIsClientDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <Select 
                  onValueChange={(value) => {
                    const selectedClient = clients?.find(c => c.id === value);
                    if (selectedClient) {
                      field.onChange(value);
                      form.setValue('clientName', selectedClient.companyName);
                    }
                  }} 
                  defaultValue={field.value}
                  disabled={isLoadingClients}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClients ? t('quote_form.loading_clients') : t('quote_form.select_client')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {!isLoadingClients && clients && clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                    ))}
                    {!isLoadingClients && (!clients || clients.length === 0) && (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            {t('quote_form.no_clients')}
                        </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quoteNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('quote_form.quote_number')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder={isLoadingProfile ? t('quote_form.generating') : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>{t('quote_form.quote_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('quote_form.pick_date')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>{t('quote_form.status')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('quote_form.select_status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">{t('quote_form.status_draft')}</SelectItem>
                    <SelectItem value="sent">{t('quote_form.status_sent')}</SelectItem>
                    <SelectItem value="accepted">{t('quote_form.status_accepted')}</SelectItem>
                    <SelectItem value="rejected">{t('quote_form.status_rejected')}</SelectItem>
                    <SelectItem value="negotiating">{t('quote_form.status_negotiating')}</SelectItem>
                    <SelectItem value="expired">{t('quote_form.status_expired')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">{t('quote_form.items')}</h2>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <div className="grid md:grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.concept`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-5">
                        <FormLabel>{t('quote_form.concept')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('quote_form.concept_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-5 relative">
                     <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('quote_form.description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('quote_form.description_placeholder')}
                              className="resize-y"
                              {...field}
                            />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" size="sm" variant="outline" className="absolute top-0 right-0 gap-1.5" disabled>
                      <Wand2 className="h-3 w-3" />
                      {t('quote_form.ai_button')}
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quote_form.quantity')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quote_form.unit')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('quote_form.unit_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quote_form.unit_price')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.taxRate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quote_form.tax')}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-right font-medium pt-8">
                     {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0))}
                  </div>

                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(defaultItem)}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('quote_form.add_item')}
            </Button>

            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                    >
                        <Library className="mr-2 h-4 w-4" />
                        {t('quote_form.add_from_block')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t('quote_form.add_from_block_dialog_title')}</DialogTitle>
                    <DialogDescription>
                      {t('quote_form.add_from_block_dialog_description')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto p-1">
                    {isLoadingBlocks && <p>{t('quote_form.loading_blocks')}</p>}
                    {!isLoadingBlocks && blocks && blocks.length > 0 ? (
                      <div className="space-y-2">
                        {blocks.map(block => (
                          <button
                            key={block.id}
                            type="button"
                            className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors border"
                            onClick={() => {
                              append({
                                concept: block.concept,
                                description: block.description || '',
                                quantity: block.quantity,
                                unit: block.unit || '',
                                unitPrice: block.unitPrice,
                                taxRate: block.taxRate,
                              });
                              setIsBlockDialogOpen(false);
                              toast({
                                title: t('toasts.block_added_title', { blockName: block.name }),
                                description: t('toasts.block_added_description')
                              })
                            }}
                          >
                            <p className="font-semibold">{block.name}</p>
                            <p className="text-sm text-muted-foreground">{block.concept}</p>
                            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(block.unitPrice)}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('quote_form.no_blocks_found')}</p>
                        <Button variant="link" asChild className="mt-1">
                          <Link href="/reusable-blocks/new">{t('quote_form.create_first_block')}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
        </div>

        <Separator />
        
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between">
              <span>{t('quote_form.subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('quote_form.total_tax')}</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('quote_form.total')}</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('quote_form.cancel')}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t('quote_form.saving') : (quote ? t('quote_form.save_changes') : t('quote_form.save_quote'))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
