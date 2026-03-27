"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PremiumDatePickerProps {
  label: string;
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function PremiumDatePicker({
  label,
  value,
  onChange,
  className,
  placeholder = "Pick a date",
}: PremiumDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  );

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setDate(today);
    onChange(format(today, "yyyy-MM-dd"));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    onChange("");
  };

  // Keep internal state in sync with prop for external changes
  React.useEffect(() => {
    if (value) {
      setDate(parse(value, "yyyy-MM-dd", new Date()));
    } else {
      setDate(undefined);
    }
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full flex items-center justify-start pl-11 pr-4 h-[56px] bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 hover:border-indigo-100 transition-all font-medium group text-sm relative",
              !date && "text-slate-400"
            )}
          >
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <span className="truncate">
              {date ? format(date, "dd-MM-yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
            className="w-auto p-0 rounded-[24px] border border-slate-100 shadow-2xl overflow-hidden bg-white" 
            align="start"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className="p-3"
          />
          <div className="flex border-t border-slate-50 p-2 bg-slate-50/50 gap-2">
            <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 text-[10px] font-black uppercase tracking-tighter hover:bg-indigo-50 hover:text-indigo-600 rounded-xl"
                onClick={handleToday}
            >
                TODAY
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 text-[10px] font-black uppercase tracking-tighter hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                onClick={handleClear}
            >
                CLEAR
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
