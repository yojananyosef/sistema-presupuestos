"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export function DatePicker({ name, defaultValue, placeholder = "Seleccionar fecha" }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(defaultValue + "T12:00:00") : undefined
  );
  const [open, setOpen] = useState(false);

  const valorHidden = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <div className="relative">
      <input type="hidden" name={name} value={valorHidden} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {date ? format(date, "dd MMM yyyy", { locale: es }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
            locale={es}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={() => setDate(undefined)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
