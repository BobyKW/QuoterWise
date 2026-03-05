'use client';

import type { Quote, UserProfile } from '@/lib/types';
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

// NOTE: This formatCurrency is simplified and does not handle i18n currency.
// It matches the one on the quote view page.
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
    const quotePrintRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const generatePdf = async () => {
            const element = quotePrintRef.current;
            if (!element || !quote || isGenerating) return;

            setIsGenerating(true);

            try {
                const { default: jsPDF } = await import('jspdf');
                const { default: html2canvas } = await import('html2canvas');

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
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
    }, [quote, userProfile, toast, onComplete, isGenerating, t]);
    
    if (!quote || !userProfile) return null;

    const subtotal = quote.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const totalTax = quote.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '800px' }}>
            <Card className="p-8" ref={quotePrintRef}>
                <CardContent className="p-0">
                <div className="flex justify-between items-start mb-8">
                    <div>
                    {userProfile?.logoUrl && (
                        <img
                        src={userProfile.logoUrl}
                        alt={`${userProfile.businessName} Logo`}
                        className="h-16 w-auto object-contain mb-4"
                        crossOrigin="anonymous"
                        />
                    )}
                    <h2 className="text-2xl font-bold text-primary">{userProfile?.businessName || 'Your Company'}</h2>
                    <p>{userProfile?.address}</p>
                    <p>{userProfile?.city}, {userProfile?.country}</p>
                    <p>Email: {userProfile?.email}</p>
                    <p>Phone: {userProfile?.phone}</p>
                    </div>
                    <div className="text-right">
                    <h1 className="text-4xl font-bold uppercase text-gray-700">{t('view_quote_page.header_title')}</h1>
                    <p className="text-gray-500">#{quote.quoteNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                    <h3 className="font-semibold mb-2">{t('view_quote_page.billed_to')}</h3>
                    <p className="font-bold">{quote.clientName}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold">{t('view_quote_page.date_of_issue')}:</span> {formatDate(quote.createdAt)}</p>
                    </div>
                </div>

                <table className="w-full mb-8 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="p-2 text-left font-semibold">{t('view_quote_page.table_description')}</th>
                        <th className="p-2 w-24 text-center font-semibold">{t('view_quote_page.table_qty')}</th>
                        <th className="p-2 w-32 text-right font-semibold">{t('view_quote_page.table_unit_price')}</th>
                        <th className="p-2 w-32 text-right font-semibold">{t('view_quote_page.table_total')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {quote.items.map((item, index) => (
                        <tr key={index} className="border-b">
                        <td className="p-2 align-top">
                            <p className="font-semibold">{item.concept}</p>
                            {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.description}</p>}
                        </td>
                        <td className="p-2 text-center align-top">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 text-right align-top">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                
                <div className="flex justify-end mb-8">
                    <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('view_quote_page.subtotal')}</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('view_quote_page.total_tax')}</span>
                        <span>{formatCurrency(totalTax)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>{t('view_quote_page.final_total')}</span>
                        <span>{formatCurrency(quote.total)}</span>
                    </div>
                    </div>
                </div>

                {userProfile?.defaultTerms && (
                    <div>
                        <h3 className="font-semibold mb-2">{t('view_quote_page.terms_conditions')}</h3>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{userProfile.defaultTerms}</p>
                    </div>
                )}

                </CardContent>
            </Card>
        </div>
    );
}
