"use client";

import {
  LineChart as ReLineChart,
  BarChart as ReBarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dashboard } from "@/gql/graphql";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { cn, formatCurrency } from "@/lib/utils";

export function DashboardChart({ dashboard }: { dashboard: Dashboard }) {
  const { chartTitle, type, xKey, lines, data, showGrid, showLegend } =
    dashboard.config;

  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const ChartComponent = type === "bar" ? ReBarChart : ReLineChart;

  const safeData =
    Array.isArray(data) && data.length > 0 ? data : [{ [xKey]: "—", value: 0 }];

  const gridColor = isDark ? "#333" : "#e5e7eb";
  const textColor = isDark ? "#e5e7eb" : "#111";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate text-foreground">{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          className={cn(
            "**:outline-none focus:outline-none",
            isMobile ? "translate-x-[-12%]" : "translate-x-[-2%]"
          )}
          width={isMobile ? "113%" : "100%"}
          height={320}
        >
          <ChartComponent
            className="!focus:outline-none"
            data={safeData}
            barGap={6}
            margin={{ top: 24, right: 0, left: 8, bottom: 8 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}

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
              cursor={{
                fill: isDark ? "#37415155" : "#d1d5db55",
              }}
            />

            {showLegend && (
              <Legend
                wrapperStyle={{
                  paddingTop: 12,
                  paddingLeft: isMobile ? 48 : 0,
                  fontSize: isMobile ? 10 : 12,
                }}
              />
            )}

            {Array.isArray(lines) &&
              lines.map((line, idx) =>
                type === "bar" ? (
                  <Bar
                    key={line.key}
                    dataKey={line.key}
                    name={line.name}
                    fill={
                      line.color ||
                      (idx % 2 === 0 ? "#60a5fa" : "#34d399")
                    }
                    radius={[6, 6, 0, 0]}
                  />
                ) : (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.name}
                    stroke={
                      line.color ||
                      (idx % 2 === 0 ? "#60a5fa" : "#34d399")
                    }
                    strokeWidth={2}
                    dot={false}
                  />
                )
              )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
