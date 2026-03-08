"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        // The container for all the months. We make it relative so we can position the nav bar.
        // We add padding-bottom to make space for the nav bar.
        months: "relative flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 pb-8",

        // Each individual month container
        month: "space-y-4",
        
        // The caption container (e.g., "March 2026")
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        
        // The navigation container (< > buttons)
        // We position it at the bottom of the 'months' container.
        nav: "space-x-1 flex items-center justify-center sm:absolute sm:bottom-1 sm:left-1/2 sm:-translate-x-1/2",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "",
        nav_button_next: "",

        // The table itself
        table: "w-full border-collapse space-y-1",
        // The table head row (weekdays)
        head_row: "", // NO FLEX
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        // A week row
        row: "", // NO FLEX

        // The individual cell (<td>)
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        
        // The button inside the cell (<button>) - CRITICAL FIX
        // We DO NOT use buttonVariants() here because it adds `inline-flex`.
        day: "h-9 w-9 p-0 font-normal rounded-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 aria-selected:opacity-100",
        
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-primary/10 text-primary",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
