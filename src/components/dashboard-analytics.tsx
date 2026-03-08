'use client';

import { useState, useMemo } from 'react';
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval, eachDayOfInterval } from 'date-fns';
import type { Quote, QuoteStatus } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';

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

const ALL_STATUSES: (QuoteStatus | 'created')[] = ['created', 'draft', 'sent', 'accepted', 'rejected', 'negotiating', 'expired'];

export function DashboardAnalytics({ quotes }: { quotes: Quote[] }) {
  const { t } = useTranslation();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    created: true,
    draft: false,
    sent: false,
    accepted: true,
    rejected: false,
    negotiating: false,
    expired: false,
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
  
  const lineConfig: Record<string, { color: string; label: string }> = {
    created: { color: 'hsl(var(--primary))', label: t('dashboard_analytics.status_created') },
    draft: { color: 'hsl(var(--muted-foreground))', label: t('dashboard_analytics.status_draft') },
    sent: { color: 'hsl(var(--chart-3))', label: t('dashboard_analytics.status_sent') },
    accepted: { color: 'hsl(var(--chart-2))', label: t('dashboard_analytics.status_accepted') },
    rejected: { color: 'hsl(var(--chart-1))', label: t('dashboard_analytics.status_rejected') },
    negotiating: { color: 'hsl(var(--chart-4))', label: t('dashboard_analytics.status_negotiating') },
    expired: { color: 'hsl(var(--chart-5))', label: t('dashboard_analytics.status_expired') },
  };

  const chartData = useMemo(() => {
    if (!quotes || !date?.from || !date?.to) {
      return [];
    }

    const allDays = eachDayOfInterval({ start: date.from, end: date.to });
    const dataMap = new Map<string, any>();

    allDays.forEach(day => {
      const formattedDateKey = format(day, 'yyyy-MM-dd');
      const formattedDateLabel = format(day, 'MMM d');
      const initialData: any = { date: formattedDateLabel, created: 0, revenue: 0 };
      ALL_STATUSES.forEach(status => {
        if(status !== 'created') initialData[status] = 0;
      });
      dataMap.set(formattedDateKey, initialData);
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
        dayData[quote.status] = (dayData[quote.status] || 0) + 1;
        if (quote.status === 'accepted') {
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
            <div className="flex flex-wrap items-center gap-2">
              <DatePickerWithRange date={date} setDate={setDate} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    {t('dashboard_analytics.show_hide_lines')}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('dashboard_analytics.toggle_lines')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_STATUSES.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      className="capitalize"
                      checked={visibleLines[status]}
                      onCheckedChange={(checked) =>
                        setVisibleLines((prev) => ({ ...prev, [status]: !!checked }))
                      }
                    >
                      {t(`dashboard_analytics.status_${status}`)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                      {Object.entries(lineConfig).map(([key, config]) => (
                        <Line
                            key={key}
                            hide={!visibleLines[key as keyof typeof visibleLines]}
                            type="monotone"
                            dataKey={key}
                            name={config.label}
                            stroke={config.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 8 }}
                        />
                      ))}
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
