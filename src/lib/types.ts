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
  subscriptionStatus?: 'active' | 'inactive';
  geminiApiKey?: string;
  emailSubject?: string;
  emailBody?: string;
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

// This represents the data for a single item within a quote.
// It is stored in a subcollection.
export type QuoteItem = {
  id?: string; // The doc ID
  userId: string; // Denormalized for security rules
  quoteId: string; // Denormalized for security rules
  quoteSectionId: string; // Parent section
  concept: string;
  description: string;
  quantity: number;
  unit: string; // h, ud, m2, etc.
  unitPrice: number;
  taxRate: number; // percentage
  lineTotal: number;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// This represents a logical grouping of items within a quote.
export type QuoteSection = {
    id: string; // The doc ID
    userId: string; // Denormalized for security rules
    quoteId: string; // Parent quote
    name: string;
    description: string;
    order: number;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    sectionTotal: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// This will be the shape of the main Quote document in Firestore
// Note: It no longer contains an 'items' array.
export type QuoteDocument = {
  userId: string;
  clientId: string;
  clientName: string; // Denormalized for easy display
  title: string;
  quoteNumber: string;
  issueDate: Timestamp;
  validUntilDate: Timestamp;
  status: QuoteStatus;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  finalTotal: number;
  currency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  shareableLinkToken?: string;
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
  anonymousBlockLimit: number;
  registeredBlockLimit: number;
};

export type PublicQuote = {
    userProfile: {
        businessName: string;
        address: string;
        city: string;
        country: string;
        phone: string;
        email: string;
        logoUrl?: string;
        defaultTerms?: string;
    };
    quote: {
        quoteNumber: string;
        issueDate: Timestamp;
        clientName: string;
        subtotal: number;
        totalDiscount: number;
        totalTax: number;
        finalTotal: number;
        currency: string;
    };
    sections: Array<{
        name: string;
        description: string;
        items: Array<Omit<QuoteItem, 'userId' | 'quoteId' | 'quoteSectionId' | 'createdAt' | 'updatedAt' | 'lineTotal'>>;
    }>;
};
