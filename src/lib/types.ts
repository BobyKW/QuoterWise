import { Timestamp } from 'firebase/firestore';

export type User = {
  name: string;
  email: string;
  initials: string;
};

export type UserProfile = {
  id: string;
  email: string;
  businessName: string;
  taxId?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  logoUrl?: string;
  defaultTerms: string;
  nextQuoteNumber?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role?: 'admin';
  currency?: string;
};

// This will be the shape of the data in Firestore
export type ClientDocument = {
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// This will be the shape of the data in the app, with the id
export type Client = ClientDocument & {
  id: string;
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
  clientId: string;
  clientName: string; // Denormalized for easy display
  quoteNumber: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: QuoteStatus;
  total: number;
  items: QuoteItem[];
};

// This will be the shape of the data in the app, with the id
export type Quote = QuoteDocument & {
  id: string;
};

// This will be the shape of the data in Firestore
export type ReusableBlockDocument = {
  userId: string;
  name: string;
  concept: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// This will be the shape of the data in the app, with the id
export type ReusableBlock = ReusableBlockDocument & {
  id: string;
};

export type AppConfig = {
  anonymousQuoteLimit: number;
  registeredQuoteLimit: number;
};

    