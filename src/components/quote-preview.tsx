'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuotePreviewProps {
  template: 'classic' | 'modern';
  brandColor: string;
}

export function QuotePreview({ template, brandColor }: QuotePreviewProps) {
    const { t } = useTranslation();

    const fakeQuoteData = {
        quoteNumber: '2024-001',
        clientName: 'Innovate Corp.',
        issueDate: 'October 26, 2024',
        items: [
            { concept: t('reusable_block_form.concept_placeholder'), total: 1500 },
            { concept: t('reusable_block_form.block_name_placeholder'), total: 200 },
        ],
        subtotal: 1700,
        tax: 357,
        total: 2057,
    };

  return (
    <div className="bg-white text-black p-4 rounded-md shadow-md w-full h-full text-[8px] leading-tight aspect-[1/1.414] overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className={cn(
          'items-start gap-4 mb-4',
          template === 'classic'
            ? 'flex flex-col'
            : 'flex flex-row justify-between'
        )}
      >
        <div>
          <h2
            className="font-bold text-[14px]"
            style={{ color: brandColor }}
          >
            {t('settings_form.business_name_placeholder')}
          </h2>
          <p className="text-gray-500">{t('settings_form.address_placeholder')}</p>
        </div>
        <div
          className={cn(
            'flex-shrink-0',
            template === 'classic'
              ? 'text-left'
              : 'text-left md:text-right w-full md:w-auto'
          )}
        >
          <h1
            className="text-[18px] font-bold uppercase tracking-tight"
            style={{ color: brandColor }}
          >
            {t('view_quote_page.header_title')}
          </h1>
          <p className="text-gray-500 text-[7px]">#{fakeQuoteData.quoteNumber}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-gray-50 rounded">
        <div>
          <h3 className="font-semibold text-gray-500 mb-1">{t('view_quote_page.billed_to')}</h3>
          <p className="font-bold text-gray-800">{fakeQuoteData.clientName}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="font-semibold text-gray-500">{t('view_quote_page.date_of_issue')}: </span>
            <span className="text-gray-800">{fakeQuoteData.issueDate}</span>
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-grow mb-4">
        <div
          className="font-semibold mb-1 pb-1 border-b text-gray-800 text-[9px]"
          style={{ borderColor: brandColor }}
        >
          {t('view_quote_page.table_description')}
        </div>
        <table className="w-full">
          <tbody>
            {fakeQuoteData.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1">{item.concept}</td>
                <td className="py-1 text-right">$ {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-1/2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('view_quote_page.subtotal')}</span>
            <span className="text-gray-700">$ {fakeQuoteData.subtotal.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-gray-500">{t('view_quote_page.total_tax')}</span>
            <span className="text-gray-700">$ {fakeQuoteData.tax.toFixed(2)}</span>
          </div>
          <div
            className="border-t my-1"
            style={{ borderColor: brandColor }}
          ></div>
          <div className="flex justify-between font-bold text-[10px]">
            <span className="text-gray-900">{t('view_quote_page.final_total')}</span>
            <span style={{ color: brandColor }}>$ {fakeQuoteData.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
