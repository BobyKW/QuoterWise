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
import { CalendarIcon, PlusCircle, Trash2, Wand2 } from 'lucide-react';
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
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import type { Quote, QuoteDocument } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const quoteItemSchema = z.object({
  concept: z.string().min(1, 'Concept is required.'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Must be positive.'),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0, 'Must be positive.'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
});

const quoteFormSchema = z.object({
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

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      clientName: '',
      quoteNumber: `Q-${new Date().getFullYear()}-0001`,
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
    }
  }, [quote, form]);


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
    if (!user) {
      console.error("No user found");
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
      const quoteData: Omit<QuoteDocument, 'createdAt' | 'updatedAt'> = {
        ...restOfData,
        userId: user.uid,
        total: total,
      };
      
      const finalQuoteData = {
          ...quoteData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      }
      
      const quotesCol = collection(firestore, `userProfiles/${user.uid}/quotes`);
      addDocumentNonBlocking(quotesCol, finalQuoteData);
       toast({
        title: "Quote Created",
        description: `Quote ${data.quoteNumber} has been successfully created.`,
      });
    }
    
    router.push('/dashboard');
  };


  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
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
                  <Input {...field} />
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

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => append(defaultItem)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
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
