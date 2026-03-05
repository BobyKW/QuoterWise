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

const clientFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  contactName: z.string().min(1, 'Contact name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
  address: z.string().min(1, 'Address is required.'),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export function ClientForm({ client, onSuccess, onCancel }: { client?: Client, onSuccess?: () => void, onCancel?: () => void }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

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
        title: "Client Updated",
        description: `${data.companyName} has been successfully updated.`,
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
        title: "Client Created",
        description: `${data.companyName} has been successfully created.`,
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
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corporation" {...field} />
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
                <FormLabel>Contact Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@acme.com" {...field} />
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
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 987-6543" {...field} />
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Innovation Drive, Tech City, USA"
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
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : (client ? 'Save Changes' : 'Save Client')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
