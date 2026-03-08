'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { es, enUS } from 'date-fns/locale';

interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const { t, i18n } = useTranslation();

  const locale = i18n.language.startsWith('es') ? es : enUS;
  const weekStartsOn = i18n.language.startsWith('es') ? 1 : 0;
  
  const spanishWeekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const formatWeekday = (date: Date) => {
    return spanishWeekdays[date.getDay()];
  };

  const formatters = i18n.language.startsWith('es') ? { formatWeekday } : {};


  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y', { locale })} -{' '}
                  {format(date.to, 'LLL dd, y', { locale })}
                </>
              ) : (
                format(date.from, 'LLL dd, y', { locale })
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
            locale={locale}
            weekStartsOn={weekStartsOn as (0 | 1 | 2 | 3 | 4 | 5 | 6)}
            formatters={formatters}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
