"use client";

import { cn, useIsMobile } from "@/lib/utils";
import { is } from "date-fns/locale";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type LineChartProps = {
  data: any[];
  xKey: string;
  lines: { key: string; name?: string; color?: string }[];
  height?: number;
  title?: string;
};

export function LineChart({
  data,
  xKey,
  lines,
  height = 300,
  title,
}: LineChartProps) {
  const isMobile = useIsMobile();

  const safeData = data && data.length > 0 ? data : [{ [xKey]: "—", value: 0 }];

  return (
    <div className="w-full space-y-2">
      {title && (
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      )}

      <ResponsiveContainer
        width={isMobile ? "120%" : "103%"}
        height={isMobile ? 220 : height}
        className={cn("**:outline-none focus:outline-none overflow-hidden", 
          isMobile ? "translate-x-[-13%]" : "translate-x-[-2%]"
        )}
      >
        <ReLineChart
          data={safeData}
          margin={{
            top: 32,
            right: isMobile ? 12 : 32,
            left: 8,
            bottom: isMobile ? 24 : 32,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey={xKey}
            hide 
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={isMobile ? 10 : 12}
            tickMargin={8}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(v: number) => `${v.toFixed(1)} min`}
            labelFormatter={(label) => `Região: ${label}`}
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            cursor={{ strokeDasharray: "3 3", strokeWidth: 1.2 }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            className={cn(
              isMobile && "translate-x-20",
            )}
            wrapperStyle={{
              paddingTop: 8,
              paddingLeft: isMobile ? 48 : 0,
              fontSize: isMobile ? 10 : 12,
            }}
          />
          {lines.map((line, i) => (
            <Line
              key={i}
              type="monotone"
              dataKey={line.key}
              stroke={line.color || (i % 2 === 0 ? "#60a5fa" : "#34d399")}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
              name={line.name}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
