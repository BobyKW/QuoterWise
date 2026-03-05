export type User = {
  name: string;
  email: string;
  initials: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'negotiating' | 'expired';

export type QuoteItem = {
  id: string;
  concept: string;
  description: string;
  quantity: number;
  unit: string; // h, ud, m2, etc.
  unitPrice: number;
  taxRate: number; // percentage
};

export type QuoteSection = {
  id: string;
  title: string;
  items: QuoteItem[];
};

export type Quote = {
  id: string;
  quoteNumber: string;
  clientName: string;
  createdAt: string;
  status: QuoteStatus;
  total: number;
};
