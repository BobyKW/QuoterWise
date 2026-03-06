'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { Client, Quote, UserProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Home, FileText } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';

const statusStyles: Record<Quote['status'], string> = {
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

function ClientDetailsSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-2/5" />
                    <Skeleton className="h-4 w-3/5" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-2/3" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ClientViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { t, i18n } = useTranslation();

    const clientRef = useMemoFirebase(() => {
        if (!id || !user) return null;
        return doc(firestore, `userProfiles/${user.uid}/clients/${id as string}`);
    }, [id, user, firestore]);
    const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientRef);
    
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, `userProfiles/${user.uid}`);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const quotesQuery = useMemoFirebase(() => {
        if (!id || !user) return null;
        return query(
            collection(firestore, `userProfiles/${user.uid}/quotes`),
            where('clientId', '==', id as string)
        );
    }, [id, user, firestore]);
    const { data: quotes, isLoading: areQuotesLoading } = useCollection<Quote>(quotesQuery);

    const isLoading = isClientLoading || areQuotesLoading;

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.push('/clients')}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="font-semibold text-lg md:text-2xl truncate">{client?.companyName}</h1>
                <div className="ml-auto">
                    <Button asChild variant="outline">
                        <Link href={`/clients/${id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('client_view_page.edit_client')}
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <ClientDetailsSkeleton />
            ) : !client ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('client_view_page.not_found')}</CardTitle>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('client_view_page.contact_details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="font-semibold text-base">{client.contactName}</div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <span>{client.phone}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <span className="whitespace-pre-line">{client.address}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('client_view_page.quotes_title')}</CardTitle>
                                <CardDescription>{t('client_view_page.quotes_description', { clientName: client.companyName })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                               <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('quotes_page.table_number')}</TableHead>
                                            <TableHead className="hidden md:table-cell">{t('quotes_page.table_date')}</TableHead>
                                            <TableHead>{t('quotes_page.table_status')}</TableHead>
                                            <TableHead className="text-right">{t('quotes_page.table_amount')}</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {quotes && quotes.length > 0 ? quotes.map((quote) => (
                                            <TableRow key={quote.id} className="cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                                                <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
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
                                                <TableCell className="text-right">{formatCurrency(quote.total, userProfile?.currency || 'EUR', i18n.language)}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">
                                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                        <FileText className="h-8 w-8" />
                                                        <p>{t('client_view_page.no_quotes')}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </main>
    )
}
