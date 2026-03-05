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
        title: "Bloque Actualizado",
        description: `El bloque "${data.name}" se ha actualizado correctamente.`,
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
        title: "Bloque Creado",
        description: `El bloque "${data.name}" se ha creado correctamente.`,
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
                <FormLabel>Nombre del Bloque</FormLabel>
                <FormControl>
                <Input placeholder="Ej: Diseño de Landing Page" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <Separator/>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">Detalles del Concepto</h3>
             <FormField
                control={form.control}
                name="concept"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Concepto</FormLabel>
                    <FormControl>
                    <Input placeholder="Ej: Desarrollo de página de aterrizaje" {...field} />
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Descripción detallada del servicio o producto..."
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
                        <FormLabel>Cantidad</FormLabel>
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
                        <FormLabel>Unidad</FormLabel>
                        <FormControl>
                        <Input placeholder="ud, h, m2" {...field} />
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
                        <FormLabel>Precio Unitario</FormLabel>
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
                        <FormLabel>Impuesto (%)</FormLabel>
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
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : (block ? 'Guardar Cambios' : 'Guardar Bloque')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
