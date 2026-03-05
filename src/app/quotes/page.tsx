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
import { Badge } from '@/components/ui/badge';
import type { Quote, QuoteStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useUser, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc } from 'firebase/firestore';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-transparent dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/50 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 border-transparent dark:bg-green-900/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 border-transparent dark:bg-red-900/50 dark:text-red-300',
  negotiating: 'bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/50 dark:text-yellow-300',
  expired: 'bg-purple-100 text-purple-800 border-transparent dark:bg-purple-900/50 dark:text-purple-300',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: Date | Timestamp) {
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function QuotesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [quoteToDelete, setQuoteToDelete] = React.useState<Quote | null>(null);

  const quotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/quotes`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: quotes, isLoading } = useCollection<Quote>(quotesQuery);

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote);
    setIsDeleteDialogOpen(true);
  };

  const performDelete = () => {
    if (!user || !quoteToDelete) return;
    const quoteRef = doc(firestore, `userProfiles/${user.uid}/quotes/${quoteToDelete.id}`);
    deleteDocumentNonBlocking(quoteRef);
    toast({ title: "Quote deleted", description: `Quote "${quoteToDelete.quoteNumber}" has been deleted.` });
    setIsDeleteDialogOpen(false);
    setQuoteToDelete(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Quotes</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/quotes/new">
              <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Quote
                </span>
              </Button>
            </Link>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Quotes</CardTitle>
            <CardDescription>Here are all the quotes you have created.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && quotes && quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.clientName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {quote.createdAt && formatDate(quote.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize',
                            statusStyles[quote.status]
                          )}
                        >
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(quote.total)}</TableCell>
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
                              <Link href={`/quotes/${quote.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotes/${quote.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Coming Soon!', description: 'Duplicating quotes will be available soon.'})}>
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleDeleteClick(quote)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!quotes || quotes.length === 0) && (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center">
                          No quotes found. Create one to get started.
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
              This will permanently delete the quote "{quoteToDelete?.quoteNumber}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuoteToDelete(null)}>Cancel</AlertDialogCancel>
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
