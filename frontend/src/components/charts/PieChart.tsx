"use client";

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type PieChartProps = {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
};

const defaultColors = [
  "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa",
  "#f472b6", "#38bdf8", "#facc15", "#22d3ee",
];

export function PieChart({
  data,
  nameKey,
  valueKey,
  colors = defaultColors,
  height = 300,
}: PieChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RePieChart>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Legend />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}
