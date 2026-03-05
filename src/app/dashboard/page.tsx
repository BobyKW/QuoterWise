'use client';

import Link from 'next/link';
import {
  Button
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase
} from '@/firebase';
import {
  collection,
  query
} from 'firebase/firestore';
import type {
  Quote,
  QuoteStatus
} from '@/lib/types';
import {
  File,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Timer,
  PlusCircle,
  FileText
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const statusCards: {
  status: QuoteStatus,
  label: string,
  icon: React.ElementType,
  color: string
}[] = [{
  status: 'draft',
  label: 'Drafts',
  icon: File,
  color: 'text-gray-500'
}, {
  status: 'sent',
  label: 'Sent',
  icon: Send,
  color: 'text-blue-500'
}, {
  status: 'accepted',
  label: 'Accepted',
  icon: CheckCircle,
  color: 'text-green-500'
}, {
  status: 'rejected',
  label: 'Rejected',
  icon: XCircle,
  color: 'text-red-500'
}, {
  status: 'negotiating',
  label: 'Negotiating',
  icon: MessageSquare,
  color: 'text-yellow-500'
}, {
  status: 'expired',
  label: 'Expired',
  icon: Timer,
  color: 'text-purple-500'
}, ];


function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-6 w-6" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function DashboardPage() {
  const {
    user
  } = useUser();
  const firestore = useFirestore();

  const quotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes`));
  }, [user, firestore]);

  const {
    data: quotes,
    isLoading
  } = useCollection < Quote > (quotesQuery);

  const quoteCounts = React.useMemo(() => {
    const counts = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      negotiating: 0,
      expired: 0,
    };
    if (quotes) {
      for (const quote of quotes) {
        if (quote.status in counts) {
          counts[quote.status]++;
        }
      }
    }
    return counts;
  }, [quotes]);
  
  const totalQuotes = quotes?.length || 0;

  return ( 
    <main className = "flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8" >
      <div className = "flex items-center" >
        <h1 className = "font-semibold text-lg md:text-2xl" > Dashboard </h1> 
        <div className = "ml-auto flex items-center gap-2" >
          <Link href = "/quotes/new" >
            <Button size = "sm" className = "h-8 gap-1" >
              <PlusCircle className = "h-3.5 w-3.5" />
              <span className = "sr-only sm:not-sr-only sm:whitespace-nowrap" >
                New Quote 
              </span> 
            </Button> 
          </Link> 
        </div> 
      </div>
      
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalQuotes}</div>
                </CardContent>
            </Card>
            {statusCards.map(({ status, label, icon: Icon, color }) => (
                <Card key={status}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{quoteCounts[status]}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </main>
  );
}
