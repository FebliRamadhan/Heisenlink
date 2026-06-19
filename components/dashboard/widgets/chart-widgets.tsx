"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { WidgetConfig, WidgetData } from "@/types";
import { colorAt, DEFAULT_COLORS } from "./palette";

interface ChartProps {
  data: WidgetData;
  config?: WidgetConfig | null;
}

const EmptyState = () => (
  <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-muted-foreground">
    No responses yet
  </div>
);

/** Bar + scale histogram share a vertical-bar rendering over { items }. */
export const BarWidget = ({ data, config }: ChartProps) => {
  const items = data.items ?? [];
  if (items.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <BarChart
        data={items}
        margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={48}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {items.map((_, i) => (
            <Cell key={i} fill={colorAt(config?.colors, i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const PieWidget = ({
  data,
  config,
  donut = false,
}: ChartProps & { donut?: boolean }) => {
  const items = data.items ?? [];
  if (items.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <PieChart>
        <Pie
          data={items}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius="80%"
          innerRadius={donut ? "50%" : 0}
          paddingAngle={items.length > 1 ? 2 : 0}
        >
          {items.map((_, i) => (
            <Cell key={i} fill={colorAt(config?.colors, i)} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const LineWidget = ({ data, config }: ChartProps) => {
  const series = data.series ?? [];
  if (series.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <LineChart
        data={series}
        margin={{ top: 8, right: 12, left: -16, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="x" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="y"
          stroke={colorAt(config?.colors, 0) || DEFAULT_COLORS[0]}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
