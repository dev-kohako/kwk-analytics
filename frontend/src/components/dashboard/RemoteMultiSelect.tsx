"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type RemoteState = {
  load: (q?: string) => Promise<void>;
  loading: boolean;
  options: string[];
  error?: Error | null;
} | null;

type Props = {
  label?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  remote: RemoteState;
  className?: string;
};

export function RemoteMultiSelect({
  label,
  placeholder = "Selecionar...",
  values,
  onChange,
  remote,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const isLoading = remote?.loading ?? false;
  const options = remote?.options ?? [];
  const hasError = !!remote?.error;

  function toggle(v: string) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }

  if (!remote) {
    return (
      <div className="border rounded-md p-2 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Erro ao carregar opções
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={hasError}
          >
            <div className="truncate">
              {values.length > 0 ? (
                values.join(", ")
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        {!hasError && (
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar..."
                onValueChange={(q) => remote.load(q)}
                onFocus={() => remote.load()}
              />
              {isLoading && options.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <>
                  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-56 overflow-auto">
                    {options.map((opt) => {
                      const selected = values.includes(opt);
                      return (
                        <CommandItem
                          key={opt}
                          value={opt}
                          onSelect={() => toggle(opt)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {opt}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        )}

        {hasError && (
          <PopoverContent className="p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Falha ao carregar dados
          </PopoverContent>
        )}
      </Popover>

      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="text-xs bg-muted px-2 py-0.5 rounded-md border"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
