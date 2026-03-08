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
            { 
                concept: t('quote_preview.item1_concept'), 
                description: t('quote_preview.item1_description'),
                qty: '13 ud',
                unitPrice: '$120.00',
                total: '$1,560.00' 
            },
            { 
                concept: t('quote_preview.item2_concept'), 
                description: t('quote_preview.item2_description'),
                qty: '12 h',
                unitPrice: '$30.00',
                total: '$360.00'
            },
        ],
        subtotal: 1920,
        tax: 403.20,
        total: 2323.20,
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
          <p className="font-bold text-gray-800 text-[9px]">{fakeQuoteData.clientName}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="font-semibold text-gray-500">{t('view_quote_page.date_of_issue')}: </span>
            <span className="text-gray-800">{fakeQuoteData.issueDate}</span>
          </p>
        </div>
      </div>

      {/* Items Section */}
      <div className="flex-grow mb-4">
        <h3 className="font-semibold text-[11px] mb-1 pb-1 border-b" style={{ borderColor: brandColor }}>
          {t('quote_form.default_section_name')}
        </h3>
        <div className="flex text-[9px] font-medium text-gray-500 py-1">
          <div className="w-1/2">{t('quote_preview.header_description')}</div>
          <div className="w-[15%] text-center">{t('quote_preview.header_qty')}</div>
          <div className="w-[20%] text-right">{t('quote_preview.header_unit_price')}</div>
          <div className="w-[15%] text-right">{t('quote_preview.header_total')}</div>
        </div>
        <div className='border-b border-gray-200'></div>
        
        <div className="space-y-2 mt-1">
          {fakeQuoteData.items.map((item, i) => (
            <div key={i} className="flex pt-1 border-b border-gray-100 last:border-b-0">
              <div className="w-1/2 pr-2">
                <p className="font-semibold text-[10px] text-gray-800">{item.concept}</p>
                <p className="text-gray-500 leading-snug mt-0.5">{item.description}</p>
              </div>
              <div className="w-[15%] text-center text-gray-600 text-[9px] pt-0.5">{item.qty}</div>
              <div className="w-[20%] text-right text-gray-600 text-[9px] pt-0.5">{item.unitPrice}</div>
              <div className="w-[15%] text-right font-medium text-gray-800 text-[9px] pt-0.5">{item.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mt-auto">
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
