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
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc, query, orderBy, increment } from 'firebase/firestore';
import type { Quote, QuoteDocument, Client, ReusableBlock, UserProfile } from '@/lib/types';
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

const quoteItemSchema = z.object({
  concept: z.string().min(1, 'Concept is required.'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Must be positive.'),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Must be positive.'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
});

const quoteFormSchema = z.object({
  clientId: z.string().min(1, 'Please select a client.'),
  clientName: z.string().min(1, 'Client name is required.'),
  quoteNumber: z.string().min(1, 'Quote number is required.'),
  createdAt: z.date(),
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
      clientId: '',
      clientName: '',
      quoteNumber: '',
      createdAt: new Date(),
      status: 'draft',
      items: [defaultItem],
    },
  });

  React.useEffect(() => {
    if (quote) {
      form.reset({
        ...quote,
        createdAt: quote.createdAt instanceof Timestamp ? quote.createdAt.toDate() : quote.createdAt,
      });
    } else if (userProfile && form.getValues('quoteNumber') === '') {
        const nextNumber = userProfile.nextQuoteNumber || 1;
        const year = new Date().getFullYear();
        const numberStr = String(nextNumber).padStart(4, '0');
        form.setValue('quoteNumber', `Q-${year}-${numberStr}`);
    }
  }, [quote, userProfile, form]);


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

  const total = subtotal + totalTax;

  const onSubmit = (data: QuoteFormValues) => {
    if (!user || !userProfileRef) {
      console.error("No user or profile reference found");
      return;
    }

    const { createdAt, ...restOfData } = data;

    if (quote) {
      const quoteRef = doc(firestore, `userProfiles/${user.uid}/quotes/${quote.id}`);
      const updatedData = {
        ...restOfData,
        userId: user.uid,
        total: total,
        updatedAt: serverTimestamp(),
      };
      updateDocumentNonBlocking(quoteRef, updatedData);
      toast({
        title: "Quote Updated",
        description: `Quote ${data.quoteNumber} has been successfully updated.`,
      });
    } else {
      const quoteData: Omit<QuoteDocument, 'createdAt' | 'updatedAt' | 'total'> = {
        ...restOfData,
        userId: user.uid,
      };
      
      const finalQuoteData = {
          ...quoteData,
          total: total,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      }
      
      const quotesCol = collection(firestore, `userProfiles/${user.uid}/quotes`);
      addDocumentNonBlocking(quotesCol, finalQuoteData);
      updateDocumentNonBlocking(userProfileRef, { nextQuoteNumber: increment(1) });
       toast({
        title: "Quote Created",
        description: `Quote ${data.quoteNumber} has been successfully created.`,
      });
    }
    
    router.push('/quotes');
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                    <FormLabel>Client</FormLabel>
                    <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                        <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Client
                        </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Client</DialogTitle>
                                <DialogDescription>
                                Add a new client to your records. After saving, you can select them from the dropdown.
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
                      <SelectValue placeholder={isLoadingClients ? "Loading..." : "Select a client"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {!isLoadingClients && clients && clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                    ))}
                    {!isLoadingClients && (!clients || clients.length === 0) && (
                        <div className="text-center text-sm text-muted-foreground p-4">
                            No clients found. Click 'New Client' above.
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
                <FormLabel>Quote Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    placeholder={isLoadingProfile ? 'Generating...' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="createdAt"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>Quote Date</FormLabel>
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
                          <span>Pick a date</span>
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">Items</h2>
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
                        <FormLabel>Concept</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Website design" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the service or product..."
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
                      AI
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
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
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="ud, h, m2" {...field} />
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
                        <FormLabel>Unit Price</FormLabel>
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
                        <FormLabel>Tax (%)</FormLabel>
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
                Add Item
            </Button>

            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                    >
                        <Library className="mr-2 h-4 w-4" />
                        Add from Block
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add from Reusable Blocks</DialogTitle>
                    <DialogDescription>
                      Select a block to add it as a new item to your quote.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto p-1">
                    {isLoadingBlocks && <p>Loading blocks...</p>}
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
                                title: `Added "${block.name}"`,
                                description: 'The block has been added to your quote items.'
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
                        <p>No reusable blocks found.</p>
                        <Button variant="link" asChild className="mt-1">
                          <Link href="/reusable-blocks/new">Create your first block</Link>
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
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : (quote ? 'Save Changes' : 'Save Quote')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
