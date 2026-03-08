'use client';

import {
  MoreHorizontal,
  PlusCircle,
  Loader2,
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
import type { Quote, QuoteStatus, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, writeBatch, getDocs } from 'firebase/firestore';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { QuotePDFDownloader } from '@/components/quote-pdf-downloader';
import { useAuthModal } from '@/hooks/use-auth-modal';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const statusStyles: Record<QuoteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-transparent dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 border-transparent dark:bg-blue-900/50 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 border-transparent dark:bg-green-900/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 border-transparent dark:bg-red-900/50 dark:text-red-300',
  negotiating: 'bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/50 dark:text-yellow-300',
  expired: 'bg-purple-100 text-purple-800 border-transparent dark:bg-purple-900/50 dark:text-purple-300',
};

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
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
  const { t, i18n } = useTranslation();
  const { onOpen } = useAuthModal();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [quoteToDelete, setQuoteToDelete] = React.useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [quoteToDownload, setQuoteToDownload] = React.useState<Quote | null>(null);
  const [isDownloading, setIsDownloading] = React.useState<string | null>(null);

  const { limits, isLoading: isLoadingLimits, isPro } = useQuoteLimits();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);


  const quotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/quotes`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);
  const isLoading = isLoadingLimits || isLoadingQuotes;

  const quoteCount = quotes?.length || 0;
  const isAnonymous = user?.isAnonymous ?? true;
  const quoteLimit = isAnonymous ? limits.anonymousQuoteLimit : limits.registeredQuoteLimit;
  const limitReached = !isPro && quoteCount >= quoteLimit;

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote);
    setIsDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    if (!user || !quoteToDelete) return;
    setIsDeleting(true);

    const quoteRef = doc(firestore, `userProfiles/${user.uid}/quotes/${quoteToDelete.id}`);

    try {
      const batch = writeBatch(firestore);

      const sectionsQuery = query(collection(quoteRef, 'sections'));
      const sectionsSnapshot = await getDocs(sectionsQuery);

      for (const sectionDoc of sectionsSnapshot.docs) {
        const itemsQuery = query(collection(sectionDoc.ref, 'items'));
        const itemsSnapshot = await getDocs(itemsQuery);
        itemsSnapshot.forEach(itemDoc => {
          batch.delete(itemDoc.ref);
        });
        batch.delete(sectionDoc.ref);
      }
      
      batch.delete(quoteRef);

      await batch.commit();

      toast({
        title: t('toasts.quote_deleted_title'),
        description: t('toasts.quote_deleted_description', { quoteNumber: quoteToDelete.quoteNumber })
      });
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        variant: "destructive",
        title: t('toasts.quote_delete_failed_title'),
        description: t('toasts.quote_delete_failed_description')
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleDownloadClick = (quote: Quote) => {
    if (user?.isAnonymous) {
      onOpen();
      return;
    }
    setIsDownloading(quote.id);
    setQuoteToDownload(quote);
  };

  const handleDownloadComplete = () => {
    setQuoteToDownload(null);
    setIsDownloading(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-4">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">{t('quotes_page.title')}</h1>
            <div className="ml-auto flex items-center gap-2">
              {limitReached ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button size="sm" className="h-8 gap-1" disabled>
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {t('quotes_page.new_quote')}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAnonymous ? t('quotes_page.anonymous_limit_reached', { count: quoteLimit }) : t('quotes_page.registered_limit_reached', { count: quoteLimit })}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link href="/quotes/new">
                  <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t('quotes_page.new_quote')}
                    </span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('quotes_page.card_title')}</CardTitle>
              <CardDescription>{t('quotes_page.card_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('quotes_page.table_number')}</TableHead>
                      <TableHead>{t('quotes_page.table_client')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('quotes_page.table_date')}</TableHead>
                      <TableHead>{t('quotes_page.table_status')}</TableHead>
                      <TableHead className="text-right">{t('quotes_page.table_amount')}</TableHead>
                      <TableHead>
                        <span className="sr-only">{t('quotes_page.table_actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {t('quotes_page.loading')}
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
                            {t(`quote_form.status_${quote.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(quote.finalTotal, userProfile?.currency || 'EUR', i18n.language)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('quotes_page.table_actions')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('quotes_page.actions_label')}</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/quotes/${quote.id}`}>{t('quotes_page.actions_view')}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/quotes/${quote.id}/edit`}>{t('quotes_page.actions_edit')}</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: t('quotes_page.toast_coming_soon_title'), description: t('quotes_page.toast_coming_soon_description')})}>
                                {t('quotes_page.actions_duplicate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                  onClick={() => handleDownloadClick(quote)}
                                  disabled={isDownloading === quote.id}
                              >
                                  {isDownloading === quote.id ? t('view_quote_page.downloading') : t('view_quote_page.download_pdf')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDeleteClick(quote)}
                              >
                                {t('quotes_page.actions_delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && (!quotes || quotes.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                            {t('quotes_page.no_quotes')}
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
            <AlertDialogTitle>{t('quotes_page.delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('quotes_page.delete_dialog_description', { quoteNumber: quoteToDelete?.quoteNumber })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuoteToDelete(null)} disabled={isDeleting}>
              {t('quotes_page.delete_dialog_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('quotes_page.delete_dialog_confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {quoteToDownload && userProfile && (
        <QuotePDFDownloader 
            quote={quoteToDownload}
            userProfile={userProfile}
            onComplete={handleDownloadComplete}
        />
      )}
    </>
  );
}
