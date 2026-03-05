'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import type { Quote, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Download, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';

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

export default function OldQuoteViewPage() {
  const { id } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const quotePrintRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const quoteRef = useMemoFirebase(() => {
    if (!id || !user) return null;
    return doc(firestore, `userProfiles/${user.uid}/quotes/${id as string}`);
  }, [id, user, firestore]);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);

  const { data: quote, isLoading: isQuoteLoading } = useDoc<Quote>(quoteRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isQuoteLoading || isProfileLoading;

  const handleDownloadPdf = async () => {
    const element = quotePrintRef.current;
    if (!element || !quote) return;

    setIsDownloading(true);

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
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
            title: "Download Started",
            description: `Quote-${quote.quoteNumber}.pdf is being downloaded.`
        });
    } catch (error) {
        console.error("Error generating PDF", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "An error occurred while generating the PDF."
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card className="text-center">
                <CardHeader>
                    <p>Quote not found.</p>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard">Go back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
  }

  const subtotal = quote.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalTax = quote.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
       <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg md:text-2xl flex-1">
                Quote {quote.quoteNumber}
            </h1>
            <Button variant="outline" asChild>
                <Link href={`/dashboard/quotes/${quote.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                 Download PDF
            </Button>
        </div>

      <Card className="p-8" ref={quotePrintRef}>
        <CardContent className="p-0">
          {/* Header */}
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
              <h1 className="text-4xl font-bold uppercase text-gray-700">QUOTE</h1>
              <p className="text-gray-500">#{quote.quoteNumber}</p>
            </div>
          </div>

          {/* Client Info & Dates */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <h3 className="font-semibold mb-2">Billed To</h3>
              <p className="font-bold">{quote.clientName}</p>
            </div>
            <div className="text-right">
                <p><span className="font-semibold">Date of Issue:</span> {formatDate(quote.createdAt)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-8 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-2 text-left font-semibold">Description</th>
                <th className="p-2 w-24 text-center font-semibold">Qty</th>
                <th className="p-2 w-32 text-right font-semibold">Unit Price</th>
                <th className="p-2 w-32 text-right font-semibold">Total</th>
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
                  <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice, userProfile?.currency)}</td>
                  <td className="p-2 text-right align-top">{formatCurrency(item.quantity * item.unitPrice, userProfile?.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, userProfile?.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tax</span>
                <span>{formatCurrency(totalTax, userProfile?.currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(quote.total, userProfile?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {userProfile?.defaultTerms && (
             <div>
                <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{userProfile.defaultTerms}</p>
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  );
}
