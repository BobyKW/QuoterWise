'use client';

import {
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Client } from '@/lib/types';
import { useCollection, useFirestore, useUser, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ClientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/clients`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const performDelete = () => {
    if (!user || !clientToDelete) return;
    const clientRef = doc(firestore, `userProfiles/${user.uid}/clients/${clientToDelete.id}`);
    deleteDocumentNonBlocking(clientRef);
    toast({ title: "Client deleted", description: `Client "${clientToDelete.companyName}" has been deleted.` });
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Clients</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/clients/new">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Client
                </span>
              </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>Manage your clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading clients...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && clients && clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.companyName}</TableCell>
                      <TableCell>{client.contactName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {client.email}
                      </TableCell>
                       <TableCell className="hidden sm:table-cell">
                        {client.phone}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleDeleteClick(client)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!clients || clients.length === 0) && (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center">
                          No clients found. Create one to get started.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client "{clientToDelete?.companyName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
