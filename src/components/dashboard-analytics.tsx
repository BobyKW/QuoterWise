'use client';

import { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval } from 'date-fns';
import type { Quote } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>{t('dashboard_analytics.pick_a_date')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DashboardAnalytics({ quotes }: { quotes: Quote[] }) {
  const { t } = useTranslation();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `userProfiles/${user.uid}`);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.currency || 'EUR' }).format(amount);


  const chartData = useMemo(() => {
    if (!quotes) return [];
    
    const filteredQuotes = quotes.filter(quote => {
        if (!quote.issueDate) return false;
        const quoteDate = quote.issueDate.toDate();
        return date?.from && date?.to && isWithinInterval(quoteDate, { start: date.from, end: date.to });
    });

    const groupedByDay = filteredQuotes.reduce((acc, quote) => {
        const day = format(quote.issueDate.toDate(), 'yyyy-MM-dd');
        if (!acc[day]) {
            acc[day] = { date: format(quote.issueDate.toDate(), 'MMM d'), created: 0, sent: 0, accepted: 0, revenue: 0 };
        }
        acc[day].created += 1;
        if (quote.status === 'sent' || quote.status === 'accepted') {
            acc[day].sent += 1;
        }
        if (quote.status === 'accepted') {
            acc[day].accepted += 1;
            acc[day].revenue += quote.finalTotal;
        }
        return acc;
    }, {} as Record<string, { date: string; created: number; sent: number; accepted: number, revenue: number }>);
    
    const sortedData = Object.values(groupedByDay).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedData;
  }, [quotes, date]);
  
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.revenue, 0);
  }, [chartData]);

  return (
    <div className="grid gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('dashboard_analytics.title')}</CardTitle>
              <CardDescription>{t('dashboard_analytics.description')}</CardDescription>
            </div>
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>
        </CardHeader>
        <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="created" name={t('dashboard_analytics.created')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="accepted" name={t('dashboard_analytics.accepted')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>{t('dashboard_analytics.revenue_title')}</CardTitle>
            <CardDescription>{t('dashboard_analytics.revenue_description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)}/>
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            formatter={(value, name) => {
                                if (name === t('dashboard_analytics.revenue')) return formatCurrency(value as number);
                                return value;
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" name={t('dashboard_analytics.revenue')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]}/>
                        <Bar yAxisId="right" dataKey="accepted" name={t('dashboard_analytics.accepted_quotes')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-2xl font-bold mt-4">
                {t('dashboard_analytics.total_revenue')}: {formatCurrency(totalRevenue)}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
