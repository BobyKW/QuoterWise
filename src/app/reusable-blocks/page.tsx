'use client';

import {
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ReusableBlock, UserProfile } from '@/lib/types';
import { useCollection, useFirestore, useUser, useMemoFirebase, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useQuoteLimits } from '@/hooks/use-quote-limits';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export default function ReusableBlocksPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [blockToDelete, setBlockToDelete] = React.useState<ReusableBlock | null>(null);

  const { limits, isLoading: isLoadingLimits, isPro } = useQuoteLimits();

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const blocksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `userProfiles/${user.uid}/reusableBlocks`),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: blocks, isLoading: isLoadingBlocks } = useCollection<ReusableBlock>(blocksQuery);

  const isLoading = isLoadingBlocks || isLoadingLimits;

  const blockCount = blocks?.length || 0;
  const isAnonymous = user?.isAnonymous ?? true;
  const blockLimit = isAnonymous ? limits.anonymousBlockLimit : limits.registeredBlockLimit;
  const limitReached = !isPro && blockCount >= blockLimit;

  const handleDeleteClick = (block: ReusableBlock) => {
    setBlockToDelete(block);
    setIsDeleteDialogOpen(true);
  };

  const performDelete = () => {
    if (!user || !blockToDelete) return;
    const blockRef = doc(firestore, `userProfiles/${user.uid}/reusableBlocks/${blockToDelete.id}`);
    deleteDocumentNonBlocking(blockRef);
    toast({ 
        title: t('toasts.block_deleted_title'),
        description: t('toasts.block_deleted_description', { blockName: blockToDelete.name })
    });
    setIsDeleteDialogOpen(false);
    setBlockToDelete(null);
  };

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">{t('reusable_blocks_page.title')}</h1>
          <div className="ml-auto flex items-center gap-2">
            {limitReached ? (
              <Tooltip>
                <TooltipTrigger>
                  <Button size="sm" className="h-8 gap-1" disabled>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      {t('reusable_blocks_page.new_block')}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAnonymous ? t('reusable_blocks_page.anonymous_limit_reached', { count: blockLimit }) : t('reusable_blocks_page.registered_limit_reached', { count: blockLimit })}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link href="/reusable-blocks/new">
                <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    {t('reusable_blocks_page.new_block')}
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('reusable_blocks_page.card_title')}</CardTitle>
            <CardDescription>{t('reusable_blocks_page.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reusable_blocks_page.table_name')}</TableHead>
                    <TableHead>{t('reusable_blocks_page.table_concept')}</TableHead>
                    <TableHead className="text-right">{t('reusable_blocks_page.table_price')}</TableHead>
                    <TableHead>
                      <span className="sr-only">{t('reusable_blocks_page.table_actions')}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t('reusable_blocks_page.loading')}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && blocks && blocks.map((block) => (
                    <TableRow key={block.id}>
                      <TableCell className="font-medium">{block.name}</TableCell>
                      <TableCell>{block.concept}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(block.unitPrice, userProfile?.currency || 'EUR', i18n.language)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('reusable_blocks_page.table_actions')}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/reusable-blocks/${block.id}/edit`}>{t('reusable_blocks_page.actions_edit')}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleDeleteClick(block)}
                            >
                              {t('reusable_blocks_page.actions_delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!blocks || blocks.length === 0) && (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center">
                          {t('reusable_blocks_page.no_blocks')}
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reusable_blocks_page.delete_dialog_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reusable_blocks_page.delete_dialog_description', { blockName: blockToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlockToDelete(null)}>{t('reusable_blocks_page.delete_dialog_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
            >
              {t('reusable_blocks_page.delete_dialog_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
