"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { cn, formatCurrency, useIsMobile } from "@/lib/utils";

type Props = {
  data: any[];
  xKey: string;
  bars: { key: string; name: string; color?: string }[];
  height?: number;
  title?: string;
};

export function BarChart({ data, xKey, bars, height = 320, title }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isMobile = useIsMobile();

  const gridColor = isDark ? "#333" : "#e5e7eb";
  const textColor = isDark ? "#e5e7eb" : "#111";

  const safeData = data && data.length > 0 ? data : [{ [xKey]: "—", value: 0 }];

  return (
    <div className="w-full space-y-2 overflow-hidden">
      {title && (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      )}

      <ResponsiveContainer
        className={cn(
          "**:outline-none focus:outline-none",
          isMobile ? "translate-x-[-12%]" : "translate-x-[-2%]"
        )}
        width={isMobile ? "113%" : "100%"}
        height={height}
      >
        <ReBarChart
          className="!focus:outline-none"
          data={safeData}
          barGap={6}
          margin={{ top: 24, right: 0, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: textColor, fontSize: isMobile ? 10 : 12 }}
            axisLine={{ stroke: gridColor }}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: isMobile ? 10 : 12 }}
            axisLine={{ stroke: gridColor }}
            tickFormatter={(v) => `${v / 1000}k`}
          />
          <Tooltip
            formatter={(v: number, name) => [formatCurrency(v), name]}
            contentStyle={{
              background: "var(--background)",
              border: "",
              borderRadius: "8px",
              color: textColor,
            }}
            labelStyle={{ fontWeight: 600 }}
            cursor={{ fill: isDark ? "#37415155" : "#d1d5db55" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 12, paddingLeft: isMobile ? 48 : 0 , fontSize: isMobile ? 10 : 12 }}
          />
          {bars.map((b, idx) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.color || (idx % 2 === 0 ? "#60a5fa" : "#34d399")}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
