'use client';

import type { Quote, UserProfile, QuoteSection, QuoteItem } from '@/lib/types';
import { useRef, useState, useEffect, FC } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Timestamp, collection, query, orderBy } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

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

const QuoteItemsTablePDF: FC<{ section: QuoteSection; currency: string; }> = ({ section, currency }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const itemsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `userProfiles/${user.uid}/quotes/${section.quoteId}/sections/${section.id}/items`),
            orderBy('order', 'asc')
        );
    }, [user, firestore, section]);

    const { data: items, isLoading } = useCollection<QuoteItem>(itemsQuery);

    if (isLoading) {
        return <tr><td colSpan={4}><Skeleton className="h-24 w-full" /></td></tr>;
    }
    
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <>
            {items.map((item, index) => (
            <tr key={index} className="border-b">
                <td className="p-2 align-top">
                <p className="font-semibold">{item.concept}</p>
                {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.description}</p>}
                </td>
                <td className="p-2 text-center align-top">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="p-2 text-right align-top">{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
            </tr>
            ))}
        </>
    );
};

export function QuotePDFDownloader({
    quote,
    userProfile,
    onComplete,
}: {
    quote: Quote;
    userProfile: UserProfile | null;
    onComplete: () => void;
}) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { user } = useUser();
    const firestore = useFirestore();

    const quotePrintRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const sectionsQuery = useMemoFirebase(() => {
        if (!user || !quote) return null;
        return query(
            collection(firestore, `userProfiles/${user.uid}/quotes/${quote.id}/sections`),
            orderBy('order', 'asc')
        );
    }, [user, firestore, quote]);

    const { data: sections, isLoading: areSectionsLoading } = useCollection<QuoteSection>(sectionsQuery);


    useEffect(() => {
        const generatePdf = async () => {
            if (areSectionsLoading || isGenerating) return;

            const element = quotePrintRef.current;
            if (!element || !quote) return;
            
            setIsGenerating(true);

            try {
                const { default: jsPDF } = await import('jspdf');
                const { default: html2canvas } = await import('html2canvas');

                await new Promise(resolve => setTimeout(resolve, 500));

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
                onComplete();
            }
        };

        generatePdf();
    }, [quote, userProfile, toast, onComplete, isGenerating, t, areSectionsLoading, sections]);
    
    if (!quote || !userProfile) return null;

    const brandColor = userProfile?.brandColor || 'hsl(var(--primary))';
    const template = userProfile?.pdfTemplate || 'modern';

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '800px' }}>
            <Card className="p-8 bg-white" ref={quotePrintRef}>
                <CardContent className="p-0 text-black" style={{ '--brand-color': brandColor } as React.CSSProperties}>
                    <div className={cn("mb-8 items-start gap-8", template === 'classic' ? 'flex flex-col' : 'flex flex-row justify-between')}>
                        <div>
                        {userProfile?.logoUrl && (
                            <img
                            src={userProfile.logoUrl}
                            alt={`${userProfile.businessName} Logo`}
                            className="h-16 w-auto object-contain mb-4"
                            crossOrigin="anonymous"
                            />
                        )}
                        <h2 className="text-2xl font-bold" style={{ color: brandColor }}>{userProfile?.businessName || 'Your Company'}</h2>
                        <p className="text-gray-600">{userProfile?.address}</p>
                        <p className="text-gray-600">{userProfile?.city}, {userProfile?.country}</p>
                        <p className="text-gray-600">Email: {userProfile?.email}</p>
                        <p className="text-gray-600">Phone: {userProfile?.phone}</p>
                        </div>
                        <div className={cn("flex-shrink-0", template === 'classic' ? 'text-left' : 'text-right')}>
                            <h1 className="text-4xl font-bold uppercase" style={{ color: brandColor }}>{t('view_quote_page.header_title')}</h1>
                            <p className="text-gray-500">#{quote.quoteNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                        <div>
                        <h3 className="font-semibold text-gray-500 mb-1">{t('view_quote_page.billed_to')}</h3>
                        <p className="font-bold text-gray-800">{quote.clientName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm"><span className="font-semibold text-gray-500">{t('view_quote_page.date_of_issue')}:</span> {formatDate(quote.issueDate)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {sections?.map(section => (
                            <div key={section.id} className="mb-8">
                                <h3 className="font-semibold text-lg mb-2 pb-2 border-b" style={{ borderColor: brandColor }}>{section.name}</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr>
                                        <th className="p-2 text-left font-semibold text-gray-600">{t('view_quote_page.table_description')}</th>
                                        <th className="p-2 w-24 text-center font-semibold text-gray-600">{t('view_quote_page.table_qty')}</th>
                                        <th className="p-2 w-32 text-right font-semibold text-gray-600">{t('view_quote_page.table_unit_price')}</th>
                                        <th className="p-2 w-32 text-right font-semibold text-gray-600">{t('view_quote_page.table_total')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        <QuoteItemsTablePDF section={section} currency={userProfile?.currency || 'EUR'} />
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                    
                
                    <div className="flex justify-end my-8">
                        <div className="w-full max-w-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('view_quote_page.subtotal')}</span>
                                <span className="text-gray-800">{formatCurrency(quote.subtotal, userProfile?.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('view_quote_page.discount', 'Discount')}</span>
                                <span className="text-gray-800">- {formatCurrency(quote.totalDiscount, userProfile?.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('view_quote_page.total_tax')}</span>
                                <span className="text-gray-800">{formatCurrency(quote.totalTax, userProfile?.currency)}</span>
                            </div>
                            <Separator className="my-2 bg-gray-200" />
                            <div className="flex justify-between font-bold text-lg">
                                <span className="text-gray-900">{t('view_quote_page.final_total')}</span>
                                <span style={{ color: brandColor }}>{formatCurrency(quote.finalTotal, userProfile?.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {userProfile?.defaultTerms && (
                        <div className="border-t pt-4">
                            <h3 className="font-semibold text-gray-700 mb-2">{t('view_quote_page.terms_conditions')}</h3>
                            <p className="text-xs text-gray-500 whitespace-pre-wrap">{userProfile.defaultTerms}</p>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
