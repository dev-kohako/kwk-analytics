import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
};

export function formatDateSmart(dateValue: string | number | null | undefined) {
  if (!dateValue) return "—";
  const date =
    typeof dateValue === "number"
      ? new Date(dateValue)
      : new Date(Number(dateValue) || dateValue);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

export const pct = (value: number | null | undefined, digits = 2): string => {
  if (value == null || isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
};

export function getPrevRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);

  const diff = end.getTime() - start.getTime();

  const prevTo = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - diff);

  return {
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
  };
}

/**
 * CSV pensado para abrir direto no Excel em português.
 *
 * Três detalhes que decidem se o arquivo abre legível ou vira uma coluna só de
 * caracteres quebrados: BOM UTF-8 (senão acento vira mojibake), `;` como
 * separador (o Excel pt-BR ignora a vírgula) e decimal com vírgula (senão o
 * número entra como texto e não soma).
 */
const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value).replace(".", ",") : "";
  }

  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function exportToCSV(rows: any[], filename: string) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(";")),
  ].join("\r\n");

  // ﻿ é o BOM que faz o Excel reconhecer o arquivo como UTF-8.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Copia texto para a área de transferência, com fallback para navegador antigo. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
