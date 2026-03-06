'use client';

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
import type { UserProfile } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { QuoteLimitsForm } from '@/components/quote-limits-form';

function formatDate(date: Date | Timestamp | undefined) {
    if (!date) return 'N/A';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function AdminPage() {
  const firestore = useFirestore();
  const { t } = useTranslation();

  // Note: This query will ONLY work if the logged-in user has the 'admin' role,
  // thanks to the Firestore security rules.
  const usersQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'userProfiles'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: users, isLoading, error } = useCollection<UserProfile>(usersQuery);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">{t('admin_page.title')}</h1>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
            <CardHeader>
            <CardTitle>{t('admin_page.card_title')}</CardTitle>
            <CardDescription>{t('admin_page.card_description')}</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('admin_page.table_email')}</TableHead>
                    <TableHead>{t('admin_page.table_business_name')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('admin_page.table_created_at')}</TableHead>
                    <TableHead>{t('admin_page.table_role')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                        {t('admin_page.loading')}
                        </TableCell>
                    </TableRow>
                    )}
                    {!isLoading && users && users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.businessName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                        {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                        {user.role === 'admin' && (
                            <Badge variant="destructive" className="gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            Admin
                            </Badge>
                        )}
                        </TableCell>
                    </TableRow>
                    ))}
                    {!isLoading && (!users || users.length === 0) && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                            {error ? t('admin_page.access_denied') : t('admin_page.no_users')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
        <div className="lg:col-span-2">
            <QuoteLimitsForm />
        </div>
      </div>
    </main>
  );
}
