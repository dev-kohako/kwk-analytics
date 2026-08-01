"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  rightSection?: ReactNode;
  className?: string;
  loading?: boolean;
  noPadding?: boolean;
};

export function DashboardCard({
  title,
  subtitle,
  children,
  rightSection,
  className,
  loading = false,
  noPadding = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={cn(
          // Espaçamento único para todo card do produto: px-6, header py-5,
          // conteúdo até pb-6. Antes cada tela usava um padding diferente.
          "flex h-full flex-col gap-0 border border-border/60 bg-card/70 py-0 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md",
          className
        )}
      >
        {(title || rightSection) && (
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-6 py-5">
            <div className="min-w-0 space-y-1">
              {title && (
                <CardTitle className="text-base font-semibold leading-none tracking-tight">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {rightSection && (
              <div className="flex shrink-0 items-center gap-2">
                {rightSection}
              </div>
            )}
          </CardHeader>
        )}

        <CardContent
          className={cn(
            "flex-1 overflow-x-auto",
            noPadding ? "p-0" : "px-6 pb-6 pt-0"
          )}
        >
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
