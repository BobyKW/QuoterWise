
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
import { useTranslation } from 'react-i18next';

export default function ClientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();

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
    toast({ title: t('toasts.client_deleted_title'), description: t('toasts.client_deleted_description', { clientName: clientToDelete.companyName }) });
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">{t('clients_page.title')}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/clients/new">
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('clients_page.new_client')}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('clients_page.card_title')}</CardTitle>
              <CardDescription>{t('clients_page.card_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('clients_page.table_company')}</TableHead>
                      <TableHead>{t('clients_page.table_contact')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('clients_page.table_email')}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('clients_page.table_phone')}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t('clients_page.table_actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          {t('clients_page.loading')}
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
                              <DropdownMenuLabel>{t('clients_page.actions_label')}</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                  <Link href={`/clients/${client.id}`}>{t('clients_page.actions_view')}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clients/${client.id}/edit`}>{t('clients_page.actions_edit')}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDeleteClick(client)}
                              >
                                {t('clients_page.actions_delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!clients || clients.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                            {t('clients_page.no_clients')}
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clients_page.delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clients_page.delete_dialog_description', { clientName: clientToDelete?.companyName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>{t('clients_page.delete_dialog_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              {t('clients_page.delete_dialog_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
