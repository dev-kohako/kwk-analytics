"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Seleção múltipla por chips.
 *
 * Substitui o `<select multiple>`, que exige ctrl+clique para marcar mais de
 * um item — interação que praticamente ninguém descobre sozinho, e que no
 * celular não existe. Aqui cada opção é um alvo de toque com estado visível.
 */

export type ChipOption = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  options: ChipOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** Descreve o grupo para leitores de tela. */
  ariaLabel: string;
  /** Impede desmarcar o último item, quando a análise exige ao menos um. */
  minOne?: boolean;
  className?: string;
};

export function ChipSelect({
  options,
  selected,
  onChange,
  ariaLabel,
  minOne = false,
  className,
}: Props) {
  const toggle = (value: string) => {
    const isOn = selected.includes(value);

    if (isOn) {
      if (minOne && selected.length === 1) return;
      onChange(selected.filter((v) => v !== value));
      return;
    }

    onChange([...selected, value]);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        const locked = minOne && isOn && selected.length === 1;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            title={option.hint}
            onClick={() => toggle(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isOn
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted",
              locked && "cursor-default opacity-90"
            )}
          >
            {isOn && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
