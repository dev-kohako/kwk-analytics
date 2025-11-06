"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { RemoteMultiSelect } from "./RemoteMultiSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type Filter = {
  field: string;
  op: "=" | "!=" | ">" | "<" | ">=" | "<=" | "in" | "between";
  value: string | number | boolean | null | string[];
};

type Props = {
  filters: Filter[];
  setFilters: (updater: ((prev: Filter[]) => Filter[]) | Filter[]) => void;
};

const FIELDS: {
  key: string;
  label: string;
  kind: "text" | "number" | "enum" | "boolean";
}[] = [
  { key: "channel", label: "Canal", kind: "enum" },
  { key: "delivery_region", label: "Região", kind: "enum" },
  { key: "product", label: "Produto", kind: "enum" },
];

const OPS_BY_KIND: Record<
  "text" | "number" | "enum" | "boolean",
  Filter["op"][]
> = {
  text: ["=", "!="],
  number: ["=", "!=", ">", "<", ">=", "<="],
  enum: ["in", "=", "!="],
  boolean: ["=", "!="],
};

export function FilterBuilder({ filters, setFilters }: Props) {
  function update(idx: number, patch: Partial<Filter>) {
    setFilters((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );
  }

  function add() {
    setFilters((prev) => [...prev, { field: "channel", op: "in", value: [] }]);
  }

  function remove(idx: number) {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  }

  const remotes = {
    channel: useFilterOptions("channel", false),
    delivery_region: useFilterOptions("delivery_region", false),
    product: useFilterOptions("product", false),
  };

  return (
    <Card className="p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium -mt-4">Filtros</h3>
        <Button variant="outline" size="sm" onClick={add}>
          + Adicionar filtro
        </Button>
      </div>

      <div className="grid gap-3">
        {filters.map((f, idx) => {
          const meta = FIELDS.find((x) => x.key === f.field) ?? FIELDS[0];
          const ops = OPS_BY_KIND[meta.kind];
          const remote = remotes[f.field as keyof typeof remotes] ?? null;

          return (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start"
            >
              <Select
                aria-label="Campo"
                value={f.field}
                onValueChange={(value) => update(idx, { field: value })}
              >
                <SelectTrigger className="sm:col-span-3 border rounded-md p-2 h-10 w-full">
                  <SelectValue placeholder="Campo" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                aria-label="Operador"
                value={f.op}
                onValueChange={(value) =>
                  update(idx, { op: value as Filter["op"] })
                }
              >
                <SelectTrigger className="sm:col-span-3 border rounded-md p-2 h-10 w-full">
                  <SelectValue placeholder="Operador" />
                </SelectTrigger>
                <SelectContent>
                  {ops.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="sm:col-span-5">
                {meta.kind === "enum" ? (
                  <RemoteMultiSelect
                    label={undefined}
                    placeholder="Selecione..."
                    values={Array.isArray(f.value) ? (f.value as string[]) : []}
                    onChange={(vals) => update(idx, { value: vals })}
                    remote={remote!}
                  />
                ) : meta.kind === "number" ? (
                  <input
                    type="number"
                    className="w-full border rounded-md p-2 h-10"
                    value={typeof f.value === "number" ? f.value : ""}
                    onChange={(e) =>
                      update(idx, { value: Number(e.target.value) })
                    }
                    placeholder="0"
                  />
                ) : meta.kind === "boolean" ? (
                  <select
                    className="w-full border rounded-md p-2 h-10"
                    value={String(f.value ?? "")}
                    onChange={(e) =>
                      update(idx, { value: e.target.value === "true" })
                    }
                  >
                    <option value="">—</option>
                    <option value="true">Verdadeiro</option>
                    <option value="false">Falso</option>
                  </select>
                ) : (
                  <input
                    className="w-full border rounded-md p-2 h-10"
                    value={
                      typeof f.value === "string" ? (f.value as string) : ""
                    }
                    onChange={(e) => update(idx, { value: e.target.value })}
                    placeholder="Digite..."
                  />
                )}
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
