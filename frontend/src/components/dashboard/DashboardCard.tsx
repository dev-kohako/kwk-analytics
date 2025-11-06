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
          "flex flex-col border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card/70 backdrop-blur-sm",
          className
        )}
      >
        {(title || rightSection) && (
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              {title && (
                <CardTitle className="text-base font-semibold tracking-tight">
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {rightSection && <div className="flex items-center gap-2">{rightSection}</div>}
          </CardHeader>
        )}

        <CardContent
          className={cn(!noPadding && "pt-0 pb-4", "flex-1 overflow-x-auto")}
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
