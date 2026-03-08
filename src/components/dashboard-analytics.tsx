'use client';

import { useState, useMemo } from 'react';
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval, eachDayOfInterval } from 'date-fns';
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
            className={cn('w-full md:w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
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
    if (!quotes || !date?.from || !date?.to) {
      return [];
    }

    const allDays = eachDayOfInterval({ start: date.from, end: date.to });
    const dataMap = new Map<string, { date: string; created: number; accepted: number; revenue: number }>();

    allDays.forEach(day => {
      const formattedDateKey = format(day, 'yyyy-MM-dd');
      const formattedDateLabel = format(day, 'MMM d');
      dataMap.set(formattedDateKey, { date: formattedDateLabel, created: 0, accepted: 0, revenue: 0 });
    });

    const filteredQuotes = quotes.filter(quote => {
      if (!quote.issueDate) return false;
      const quoteDate = quote.issueDate.toDate();
      return isWithinInterval(quoteDate, { start: date.from!, end: date.to! });
    });

    filteredQuotes.forEach(quote => {
      const dayKey = format(quote.issueDate.toDate(), 'yyyy-MM-dd');
      const dayData = dataMap.get(dayKey);

      if (dayData) {
        dayData.created += 1;
        if (quote.status === 'accepted') {
          dayData.accepted += 1;
          dayData.revenue += quote.finalTotal;
        }
      }
    });

    return Array.from(dataMap.values());
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
              <CardTitle className="text-xl md:text-2xl">{t('dashboard_analytics.title')}</CardTitle>
              <CardDescription>{t('dashboard_analytics.description')}</CardDescription>
            </div>
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>
        </CardHeader>
        <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`}/>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="created" name={t('dashboard_analytics.created')} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="accepted" name={t('dashboard_analytics.accepted')} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                  </LineChart>
              </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle className="text-xl md:text-2xl">{t('dashboard_analytics.revenue_title')}</CardTitle>
            <CardDescription>{t('dashboard_analytics.revenue_description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        <Line yAxisId="left" type="monotone" dataKey="revenue" name={t('dashboard_analytics.revenue')} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/>
                        <Line yAxisId="right" type="monotone" dataKey="accepted" name={t('dashboard_analytics.accepted_quotes')} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 8 }}/>
                    </LineChart>
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
