'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Quote, Client, ReusableBlock } from '@/lib/types';
import {
  FileText,
  Users,
  Blocks,
  Library,
  PlusCircle,
  CheckCircle,
  File,
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-6" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-5 w-2/4 mb-1" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
      <div className="lg:col-span-1 space-y-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-6 w-1/4" />
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
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

  const blocksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `userProfiles/${user.uid}/reusableBlocks`));
  }, [user, firestore]);

  const { data: quotes, isLoading: isLoadingQuotes } = useCollection<Quote>(quotesQuery);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);
  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<ReusableBlock>(blocksQuery);
  const { limits, isLoading: isLoadingLimits } = useQuoteLimits();

  const totalQuotes = quotes?.length || 0;
  const totalClients = clients?.length || 0;
  const totalBlocks = blocks?.length || 0;
  const totalAccepted = quotes?.filter(q => q.status === 'accepted').length || 0;
  
  const isAnonymous = user?.isAnonymous ?? true;
  const quoteLimit = isAnonymous ? limits.anonymousQuoteLimit : limits.registeredQuoteLimit;
  const quoteLimitReached = totalQuotes >= quoteLimit;
  const blockLimit = isAnonymous ? limits.anonymousBlockLimit : limits.registeredBlockLimit;
  const blockLimitReached = totalBlocks >= blockLimit;

  const isLoading = isLoadingLimits || isLoadingQuotes || isLoadingClients || isLoadingBlocks;

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
      href: '/reusable-blocks/new',
      title: t('dashboard_page.create_block_title'),
      description: t('dashboard_page.create_block_desc'),
      icon: Blocks,
      disabled: blockLimitReached,
      tooltip: isAnonymous ? t('reusable_blocks_page.anonymous_limit_reached', { count: blockLimit }) : t('reusable_blocks_page.registered_limit_reached', { count: blockLimit })
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
      href: '/templates',
      title: t('dashboard_page.create_template_title'),
      description: t('dashboard_page.create_template_desc'),
      icon: Library,
      disabled: false,
      tooltip: ''
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('dashboard_page.title')}</h1>
        <div className="ml-auto flex items-center gap-2">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg md:text-xl">{t('dashboard_page.quick_links_title')}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                    {actionCards.map((card, index) => {
                        const cardComponent = (
                            <Link href={card.disabled ? '#' : card.href} className="block group">
                                <Card className="transition-colors h-full group-hover:border-primary group-hover:bg-accent">
                                    <CardHeader>
                                        <card.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
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
                                        <p>{card.tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return cardComponent;
                    })}
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>At a Glance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Total Quotes</span>
                            <span className="font-semibold">{totalQuotes}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Total Clients</span>
                            <span className="font-semibold">{totalClients}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Accepted Quotes</span>
                            <span className="font-semibold">{totalAccepted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><File className="h-4 w-4" /> Drafts</span>
                            <span className="font-semibold">{quotes?.filter(q => q.status === 'draft').length || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </main>
  );
}
