import { Timestamp } from 'firebase/firestore';

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
  id?: string;
  concept: string;
  description: string;
  quantity: number;
  unit: string; // h, ud, m2, etc.
  unitPrice: number;
  taxRate: number; // percentage
};

// This will be the shape of the data in Firestore
export type QuoteDocument = {
  userId: string;
  quoteNumber: string;
  clientName: string;
  createdAt: Timestamp;
  status: QuoteStatus;
  total: number;
  items: QuoteItem[];
};

// This will be the shape of the data in the app, with the id
export type Quote = QuoteDocument & {
  id: string;
};
