'use server';

import { getFirebaseAdmin } from '@/firebase/server-init';
import type { PublicQuote } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons';
import React from 'react';
import Link from 'next/link';

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

async function getQuoteData(token: string): Promise<PublicQuote | null> {
    try {
        const { firestore } = getFirebaseAdmin();
        const docRef = firestore.collection('publicQuotes').doc(token);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }
        return docSnap.data() as PublicQuote;

    } catch (error) {
        console.error("Error fetching public quote:", error);
        return null;
    }
}


export default async function PublicQuoteViewPage({ params }: { params: { token: string }}) {
    const { token } = params;
    const data = await getQuoteData(token);

    if (!data) {
        notFound();
    }
    
    const { userProfile, quote, sections } = data;

    return (
        <div className="min-h-screen bg-muted/40">
            <main className="max-w-4xl mx-auto flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <Card className="p-4 sm:p-6 md:p-8" id="pdf-content">
                    <div className="p-2 bg-white text-black">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-8">
                        <div>
                        {userProfile.logoUrl && (
                            <img
                            src={userProfile.logoUrl}
                            alt={`${userProfile.businessName} Logo`}
                            className="h-16 w-auto object-contain mb-4"
                            crossOrigin="anonymous"
                            />
                        )}
                        <h2 className="text-2xl font-bold text-gray-900">{userProfile.businessName}</h2>
                        <p className="text-sm text-gray-500 whitespace-pre-line">{userProfile.address}</p>
                        <p className="text-sm text-gray-500">{userProfile.city}, {userProfile.country}</p>
                        <p className="text-sm text-gray-500">Email: {userProfile.email}</p>
                        <p className="text-sm text-gray-500">Phone: {userProfile.phone}</p>
                        </div>
                        <div className="text-left md:text-right w-full md:w-auto flex-shrink-0">
                        <h1 className="text-4xl font-bold uppercase text-gray-800 tracking-tight">QUOTE</h1>
                        <p className="text-gray-500">#{quote.quoteNumber}</p>
                        </div>
                    </div>

                    {/* Client Info & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 p-4 bg-gray-50 rounded-lg">
                        <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">BILLED TO</h3>
                        <p className="font-bold text-gray-800">{quote.clientName}</p>
                        </div>
                        <div className="md:text-right">
                            <p className="text-sm"><span className="font-semibold text-gray-500">Date of Issue:</span> <span className="text-gray-800">{formatDate(quote.issueDate)}</span></p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-6 mb-10">
                        {sections?.map((section, sIndex) => (
                            <div key={sIndex}>
                                <h3 className="font-semibold text-lg mb-2 pb-2 border-b text-gray-800">{section.name}</h3>
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-muted-foreground">
                                            <tr className="border-b border-border">
                                            <th className="p-2 text-left font-medium">Description</th>
                                            <th className="p-2 w-24 text-center font-medium">Qty</th>
                                            <th className="p-2 w-32 text-right font-medium">Unit Price</th>
                                            <th className="p-2 w-32 text-right font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map((item, index) => (
                                            <tr key={index} className="border-b border-border">
                                                <td className="p-3 align-top">
                                                <p className="font-semibold text-foreground">{item.concept}</p>
                                                {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{item.description}</p>}
                                                </td>
                                                <td className="p-3 text-center align-top text-muted-foreground">{item.quantity} {item.unit}</td>
                                                <td className="p-3 text-right align-top text-muted-foreground">{formatCurrency(item.unitPrice, quote.currency)}</td>
                                                <td className="p-3 text-right align-top font-medium text-foreground">{formatCurrency(item.quantity * item.unitPrice, quote.currency)}</td>
                                            </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>


                    {/* Totals */}
                    <div className="flex justify-end mb-10">
                        <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-700">{formatCurrency(quote.subtotal, quote.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Discount</span>
                            <span className="text-gray-700">- {formatCurrency(quote.totalDiscount, quote.currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Tax</span>
                            <span className="text-gray-700">{formatCurrency(quote.totalTax, quote.currency)}</span>
                        </div>
                        <Separator className="my-2 bg-gray-200" />
                        <div className="flex justify-between font-bold text-xl">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatCurrency(quote.finalTotal, quote.currency)}</span>
                        </div>
                        </div>
                    </div>

                    {/* Terms */}
                    {userProfile.defaultTerms && (
                        <div className="border-t pt-6">
                            <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
                            <p className="text-xs text-gray-500 whitespace-pre-wrap">{userProfile.defaultTerms}</p>
                        </div>
                    )}

                    </div>
                </Card>
                <footer className="w-full text-center text-sm text-muted-foreground mt-4">
                    <p>Powered by <Link href="/" className="font-semibold text-primary hover:underline">QuoterWise</Link></p>
                </footer>
            </main>
        </div>
    )
}
