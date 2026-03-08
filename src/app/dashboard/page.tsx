'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Quote, Client } from '@/lib/types';
import {
  FileText,
  Users,
  Blocks,
  Library,
  PlusCircle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DashboardAnalytics } from '@/components/dashboard-analytics';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


function DashboardSkeleton() {
  return (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-2/5" />
                        <Skeleton className="h-6 w-6" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/3 mb-1" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    </div>
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
  
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.currency || 'EUR' }).format(amount);


  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const { limits, isLoading: isLoadingLimits } = useQuoteLimits();

  const totalQuotes = quotes?.length || 0;
  const totalClients = clients?.length || 0;
  const totalAccepted = quotes?.filter(q => q.status === 'accepted').length || 0;
  const totalRevenue = quotes
    ?.filter(q => q.status === 'accepted')
    .reduce((sum, q) => sum + q.finalTotal, 0) || 0;
  
  const isAnonymous = user?.isAnonymous ?? true;
  const quoteLimit = isAnonymous ? limits.anonymousQuoteLimit : limits.registeredQuoteLimit;
  const quoteLimitReached = totalQuotes >= quoteLimit;

  const isLoading = isLoadingLimits || isLoadingQuotes || isLoadingClients;

  const statCards = [
    { title: t('dashboard_page.total_revenue'), value: formatCurrency(totalRevenue), description: t('dashboard_page.total_revenue_desc'), icon: DollarSign },
    { title: t('dashboard_page.accepted_quotes'), value: `+${totalAccepted}`, description: t('dashboard_page.accepted_quotes_desc'), icon: CheckCircle },
    { title: t('dashboard_page.total_quotes'), value: totalQuotes, description: t('dashboard_page.total_quotes_desc'), icon: FileText },
    { title: t('dashboard_page.total_clients'), value: totalClients, description: t('dashboard_page.total_clients_desc'), icon: Users },
  ]
  
  const actionCards = [
    {
      href: '/quotes/new',
      title: t('dashboard_page.create_quote_title'),
      description: t('dashboard_page.create_quote_desc'),
      icon: PlusCircle,
      disabled: quoteLimitReached,
      tooltip: isAnonymous ? t('quotes_page.anonymous_limit_reached', { count: quoteLimit }) : t('quotes_page.registered_limit_reached', { count: quoteLimit })
    },
    {
      href: '/clients/new',
      title: t('dashboard_page.add_client_title'),
      description: t('dashboard_page.add_client_desc'),
      icon: Users,
      disabled: false,
      tooltip: ''
    },
    {
      href: '/reusable-blocks/new',
      title: t('dashboard_page.create_block_title'),
      description: t('dashboard_page.create_block_desc'),
      icon: Blocks,
      disabled: false, 
      tooltip: ''
    },
    {
      href: '/templates',
      title: t('dashboard_page.create_template_title'),
      description: t('dashboard_page.create_template_desc'),
      icon: Library,
      disabled: false, 
      tooltip: ''
    },
  ];

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="mx-auto w-full max-w-6xl space-y-8">
              <h1 className="font-semibold text-lg md:text-2xl">{t('dashboard_page.title')}</h1>
              <DashboardSkeleton />
            </div>
        </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <h1 className="font-semibold text-2xl md:text-3xl">{t('dashboard_page.title')}</h1>
          <p className="text-muted-foreground text-sm md:text-base">{t('dashboard_page.welcome_back')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(card => (
              <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
              </Card>
          ))}
        </div>
        
        {quotes && quotes.length > 0 && <DashboardAnalytics quotes={quotes} />}

        <div>
              <h2 className="font-semibold text-xl md:text-2xl mb-4">{t('dashboard_page.quick_links_title')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {actionCards.map((card, index) => {
                  const cardComponent = (
                      <Link href={card.disabled ? '#' : card.href} className="block group">
                          <Card className="transition-colors h-full hover:border-primary hover:bg-accent/50">
                              <CardHeader>
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <card.icon className="h-6 w-6" />
                                  </div>
                              </CardHeader>
                              <CardContent>
                                  <p className="font-semibold text-card-foreground">{card.title}</p>
                                  <p className="text-sm text-muted-foreground">{card.description}</p>
                              </CardContent>
                          </Card>
                      </Link>
                  );

                  if (card.disabled) {
                      return (
                          <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                  <div className="cursor-not-allowed opacity-50">{cardComponent}</div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{card.tooltip || t('coming_soon')}</p>
                              </TooltipContent>
                          </Tooltip>
                      );
                  }

                  return <div key={index}>{cardComponent}</div>;
              })}
              </div>
          </div>
        </div>
    </main>
  );
}
