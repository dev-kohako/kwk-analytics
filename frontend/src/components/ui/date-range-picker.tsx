"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DialogOverlay } from "@radix-ui/react-dialog";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<DateRange | undefined>(value);
  const [month, setMonth] = React.useState<Date>(value?.from ?? new Date());
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setRange(value);
    if (value?.from) setMonth(value.from);
  }, [value]);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next);
  };

  const handleApply = () => {
    if (range?.from && range?.to) {
      onChange?.(range);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setRange(undefined);
    onChange?.(undefined);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full md:w-[260px] justify-start text-left font-normal bg-background",
            !range && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "dd MMM yyyy", { locale: ptBR })} -{" "}
                {format(range.to, "dd MMM yyyy", { locale: ptBR })}
              </>
            ) : (
              format(range.from, "dd MMM yyyy", { locale: ptBR })
            )
          ) : (
            <span>Escolha o período</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <DialogContent
          className={cn(
            "p-0 sm:max-w-[600px] bg-background border border-border shadow-2xl rounded-2xl overflow-hidden",
            "flex flex-col"
          )}
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-border bg-muted/30">
            <DialogTitle className="text-lg font-semibold">
              Selecione o período
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Fechar"
              className="rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <div className="flex-1 flex justify-center items-center p-6 sm:p-8">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={isMobile ? 1 : 2}
              locale={ptBR}
              className={cn(
                "rounded-md border border-border bg-background h-[325px]",
                "shadow-sm p-4 sm:p-2"
              )}
            />
          </div>

          <Separator className="opacity-30" />

          <DialogFooter className="flex justify-end gap-3 p-4 border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1 sm:flex-none sm:px-6"
            >
              Limpar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!range?.from || !range?.to}
              className="flex-1 sm:flex-none sm:px-6"
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
