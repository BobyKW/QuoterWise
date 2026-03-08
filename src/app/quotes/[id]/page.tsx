'use client';

import { useParams } from 'next/navigation';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, Timestamp, collection, query, orderBy } from 'firebase/firestore';
import type { Quote, UserProfile, QuoteSection, QuoteItem } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthModal } from '@/hooks/use-auth-modal';

function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('en-US', {
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

const QuoteItemsTable: FC<{ section: QuoteSection; currency: string; }> = ({ section, currency }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { t } = useTranslation();

    const itemsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `userProfiles/${user.uid}/quotes/${section.quoteId}/sections/${section.id}/items`),
            orderBy('order', 'asc')
        );
    }, [user, firestore, section]);

    const { data: items, isLoading } = useCollection<QuoteItem>(itemsQuery);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }
    
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                    <tr className="border-b border-border">
                    <th className="p-2 text-left font-medium">{t('view_quote_page.table_description')}</th>
                    <th className="p-2 w-24 text-center font-medium">{t('view_quote_page.table_qty')}</th>
                    <th className="p-2 w-32 text-right font-medium">{t('view_quote_page.table_unit_price')}</th>
                    <th className="p-2 w-32 text-right font-medium">{t('view_quote_page.table_total')}</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                    <tr key={index} className="border-b border-border">
                        <td className="p-3 align-top">
                        <p className="font-semibold text-foreground">{item.concept}</p>
                        {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{item.description}</p>}
                        </td>
                        <td className="p-3 text-center align-top text-muted-foreground">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-right align-top text-muted-foreground">{formatCurrency(item.unitPrice, currency)}</td>
                        <td className="p-3 text-right align-top font-medium text-foreground">{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default function QuoteViewPage() {
  const { id } = useParams();
  const { user, isUserLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { onOpen } = useAuthModal();
  const { t } = useTranslation();
  const quotePrintRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isAnonymous = user?.isAnonymous ?? true;

  const quoteRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/quotes/${id as string}`);
  }, [id, user, firestore]);
  
  const sectionsQuery = useMemoFirebase(() => {
    if (!id || !user) return null;
    return query(
        collection(firestore, `userProfiles/${user.uid}/quotes/${id as string}/sections`),
        orderBy('order', 'asc')
    );
  }, [id, user, firestore]);


  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);

  const { data: quote, isLoading: isQuoteLoading } = useDoc<Quote>(quoteRef);
  const { data: sections, isLoading: areSectionsLoading } = useCollection<QuoteSection>(sectionsQuery);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isQuoteLoading || isProfileLoading || isUserLoading || areSectionsLoading;

  const handleDownloadPdf = async () => {
    if (isAnonymous) {
        onOpen();
        return;
    }

    const element = quotePrintRef.current;
    if (!element || !quote) return;

    setIsDownloading(true);

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Quote-${quote.quoteNumber}.pdf`);

        toast({
            title: t('toasts.download_started_title'),
            description: t('toasts.download_started_description', { quoteNumber: quote.quoteNumber })
        });
    } catch (error) {
        console.error("Error generating PDF", error);
        toast({
            variant: "destructive",
            title: t('toasts.download_failed_title'),
            description: t('toasts.download_failed_description')
        })
    } finally {
        setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between">
                        <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></div>
                        <div className="space-y-2 text-right"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex justify-end"><Skeleton className="h-20 w-1/3" /></div>
                </CardContent>
            </Card>
        </main>
    )
  }

  if (!quote) {
    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
            <Card className="text-center p-8">
                <CardHeader>
                    <p>{t('view_quote_page.quote_not_found')}</p>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/quotes">{t('view_quote_page.back_to_dashboard')}</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg md:text-2xl flex-1 text-foreground">
                {t('view_quote_page.title', { quoteNumber: quote.quoteNumber })}
            </h1>
            <Button variant="outline" asChild>
                <Link href={`/quotes/${quote.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> {t('view_quote_page.edit')}
                </Link>
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                 {t('view_quote_page.download_pdf')}
            </Button>
        </div>

      <Card className="p-4 sm:p-6 md:p-8" id="pdf-content">
        <div ref={quotePrintRef} className="p-2 bg-white text-black">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-8">
            <div>
              {userProfile?.logoUrl && (
                <img
                  src={userProfile.logoUrl}
                  alt={`${userProfile.businessName} Logo`}
                  className="h-16 w-auto object-contain mb-4"
                  crossOrigin="anonymous"
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900">{userProfile?.businessName || 'Your Company'}</h2>
              <p className="text-sm text-gray-500 whitespace-pre-line">{userProfile?.address}</p>
              <p className="text-sm text-gray-500">{userProfile?.city}, {userProfile?.country}</p>
              <p className="text-sm text-gray-500">{t('view_quote_page.email_label')}: {userProfile?.email}</p>
              <p className="text-sm text-gray-500">{t('view_quote_page.phone_label')}: {userProfile?.phone}</p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto flex-shrink-0">
              <h1 className="text-4xl font-bold uppercase text-gray-800 tracking-tight">{t('view_quote_page.header_title')}</h1>
              <p className="text-gray-500 mt-1">#{quote.quoteNumber}</p>
            </div>
          </div>

          {/* Client Info & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('view_quote_page.billed_to')}</h3>
              <p className="font-bold text-gray-800">{quote.clientName}</p>
            </div>
            <div className="md:text-right">
                <p className="text-sm"><span className="font-semibold text-gray-500">{t('view_quote_page.date_of_issue')}:</span> <span className="text-gray-800">{formatDate(quote.issueDate)}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-6 mb-10">
            {sections?.map(section => (
                <div key={section.id}>
                    <h3 className="font-semibold text-lg mb-2 pb-2 border-b text-gray-800">{section.name}</h3>
                    <QuoteItemsTable section={section} currency={userProfile?.currency || 'EUR'} />
                </div>
            ))}
          </div>


          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('view_quote_page.subtotal')}</span>
                <span className="text-gray-700">{formatCurrency(quote.subtotal, userProfile?.currency)}</span>
              </div>
               <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('view_quote_page.discount')}</span>
                <span className="text-gray-700">- {formatCurrency(quote.totalDiscount, userProfile?.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('view_quote_page.total_tax')}</span>
                <span className="text-gray-700">{formatCurrency(quote.totalTax, userProfile?.currency)}</span>
              </div>
              <Separator className="my-2 bg-gray-200" />
              <div className="flex justify-between font-bold text-xl">
                <span className="text-gray-900">{t('view_quote_page.final_total')}</span>
                <span className="text-gray-900">{formatCurrency(quote.finalTotal, userProfile?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {userProfile?.defaultTerms && (
             <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-2">{t('view_quote_page.terms_conditions')}</h3>
                <p className="text-xs text-gray-500 whitespace-pre-wrap">{userProfile.defaultTerms}</p>
            </div>
          )}

        </div>
      </Card>
    </main>
  );
}
