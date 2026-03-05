import type { Quote, User } from '@/lib/types';

export const mockUser: User = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  initials: 'JD',
};

export const mockQuotes: Quote[] = [
  {
    id: '1',
    quoteNumber: '2024-0001',
    clientName: 'Acme Corporation',
    createdAt: '2024-07-15',
    status: 'sent',
    total: 1250.0,
  },
  {
    id: '2',
    quoteNumber: '2024-0002',
    clientName: 'Stark Industries',
    createdAt: '2024-07-18',
    status: 'accepted',
    total: 5400.75,
  },
  {
    id: '3',
    quoteNumber: '2024-0003',
    clientName: 'Wayne Enterprises',
    createdAt: '2024-07-20',
    status: 'draft',
    total: 800.0,
  },
  {
    id: '4',
    quoteNumber: '2024-0004',
    clientName: 'Cyberdyne Systems',
    createdAt: '2024-07-21',
    status: 'negotiating',
    total: 21500.0,
  },
  {
    id: '5',
    quoteNumber: '2024-0005',
    clientName: 'Ollivanders Wand Shop',
    createdAt: '2024-07-22',
    status: 'rejected',
    total: 350.5,
  },
  {
    id: '6',
    quoteNumber: '2024-0006',
    clientName: 'Gekko & Co',
    createdAt: '2024-06-10',
    status: 'expired',
    total: 10000.0,
  },
];
