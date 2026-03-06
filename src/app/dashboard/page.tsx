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
  QuoteStatus,
  Client,
  ReusableBlock
} from '@/lib/types';
import {
  File,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Timer,
  PlusCircle,
  FileText,
  Users,
  Blocks,
  Library
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


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
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="mt-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-6 mb-2" />
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
            </div>
        </div>
      </>
    );
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const quotesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/quotes`));
  }, [user, firestore]);

  const clientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/clients`));
  }, [user, firestore]);

  const blocksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/reusableBlocks`));
  }, [user, firestore]);

  const {
    data: quotes,
    isLoading: isLoadingQuotes
  } = useCollection < Quote > (quotesQuery);
  
  const {
    data: clients,
    isLoading: isLoadingClients
  } = useCollection < Client > (clientsQuery);

  const {
    data: blocks,
    isLoading: isLoadingBlocks
  } = useCollection < ReusableBlock > (blocksQuery);

  const { limits, isLoading: isLoadingLimits } = useQuoteLimits();

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
  const totalClients = clients?.length || 0;
  const totalBlocks = blocks?.length || 0;
  const isAnonymous = user?.isAnonymous ?? true;

  const quoteLimit = isAnonymous ? limits.anonymousQuoteLimit : limits.registeredQuoteLimit;
  const quoteLimitReached = totalQuotes >= quoteLimit;

  const blockLimit = isAnonymous ? limits.anonymousBlockLimit : limits.registeredBlockLimit;
  const blockLimitReached = totalBlocks >= blockLimit;
  
  const isLoading = isLoadingLimits || isLoadingQuotes || isLoadingClients || isLoadingBlocks;

  const actionCards = [
    {
      href: '/quotes/new',
      title: 'dashboard_page.create_quote_title',
      description: 'dashboard_page.create_quote_desc',
      icon: PlusCircle,
      disabled: quoteLimitReached,
      tooltip: isAnonymous ? t('quotes_page.anonymous_limit_reached', { count: quoteLimit }) : t('quotes_page.registered_limit_reached', { count: quoteLimit })
    },
    {
      href: '/reusable-blocks/new',
      title: 'dashboard_page.create_block_title',
      description: 'dashboard_page.create_block_desc',
      icon: Blocks,
      disabled: blockLimitReached,
      tooltip: isAnonymous ? t('reusable_blocks_page.anonymous_limit_reached', { count: blockLimit }) : t('reusable_blocks_page.registered_limit_reached', { count: blockLimit })
    },
    {
      href: '/clients/new',
      title: 'dashboard_page.add_client_title',
      description: 'dashboard_page.add_client_desc',
      icon: Users,
      disabled: false,
      tooltip: ''
    },
    {
      href: '/templates',
      title: 'dashboard_page.create_template_title',
      description: 'dashboard_page.create_template_desc',
      icon: Library,
      disabled: false,
      tooltip: ''
    },
  ];

  return ( 
    <main className = "flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8" >
      <div className = "flex items-center" >
        <h1 className = "font-semibold text-lg md:text-2xl" > {t('dashboard_page.title')} </h1> 
        <div className = "ml-auto flex items-center gap-2" >
          {quoteLimitReached ? (
              <Tooltip>
                <TooltipTrigger>
                  <Button size="sm" className="h-8 gap-1" disabled>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t('dashboard_page.new_quote')}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAnonymous ? t('quotes_page.anonymous_limit_reached', { count: quoteLimit }) : t('quotes_page.registered_limit_reached', { count: quoteLimit })}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/quotes/new">
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('dashboard_page.new_quote')}
                  </span>
                </Button>
              </Link>
            )}
        </div> 
      </div>
      
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard_page.total_clients')}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{totalClients}</div>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t('dashboard_page.total_quotes')}</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{totalQuotes}</div>
                  </CardContent>
              </Card>
              {statusCards.map(({ status, label, icon: Icon, color }) => (
                  <Card key={status}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t(`dashboard_page.${status}`)}</CardTitle>
                      <Icon className={`h-4 w-4 text-muted-foreground ${color}`} />
                      </CardHeader>
                      <CardContent>
                      <div className="text-2xl font-bold">{quoteCounts[status]}</div>
                      </CardContent>
                  </Card>
              ))}
          </div>

          <div className="mt-8">
            <h2 className="font-semibold text-lg md:text-xl mb-4">{t('dashboard_page.quick_links_title')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {actionCards.map((card, index) => {
                  const cardComponent = (
                      <Card className="hover:bg-accent/50 transition-colors h-full">
                          <CardContent className="pt-6">
                              <card.icon className="h-6 w-6 text-muted-foreground mb-2" />
                              <p className="font-semibold">{t(card.title)}</p>
                              <p className="text-sm text-muted-foreground">{t(card.description)}</p>
                          </CardContent>
                      </Card>
                  );

                  if (card.disabled) {
                      return (
                          <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                  <div className="cursor-not-allowed opacity-50">{cardComponent}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{card.tooltip}</p>
                              </TooltipContent>
                          </Tooltip>
                      );
                  }

                  return (
                      <Link key={index} href={card.href} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                          {cardComponent}
                      </Link>
                  );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
