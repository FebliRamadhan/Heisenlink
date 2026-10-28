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
  LabelList,
} from "recharts";
import type { WidgetConfig, WidgetData } from "@/types";
import { colorAt, AXIS_TEXT, GRID_LINE, SURFACE } from "./palette";

interface ChartProps {
  data: WidgetData;
  config?: WidgetConfig | null;
}

const EmptyState = () => (
  <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-muted-foreground">
    No responses yet
  </div>
);

const tick = { fontSize: 12, fill: AXIS_TEXT };
const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  },
  itemStyle: { color: "hsl(var(--foreground))" },
  cursor: { fill: "hsl(var(--muted))" },
};

/**
 * One variable's categories: a single hue (the axis already names each bar), unless the
 * widget's config supplies its own colours. Categories run horizontally so long labels read
 * whole; a scale histogram stays vertical because its categories are short numbers.
 */
export const BarWidget = ({
  data,
  config,
  vertical = false,
}: ChartProps & { vertical?: boolean }) => {
  const items = data.items ?? [];
  if (items.length === 0) return <EmptyState />;
  const fillFor = (i: number) =>
    config?.colors?.length ? colorAt(config.colors, i) : colorAt(undefined, 0);

  if (vertical) {
    return (
      <ResponsiveContainer width="100%" height="100%" minHeight={180}>
        <BarChart data={items} margin={{ top: 20, right: 8, left: -20, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid stroke={GRID_LINE} vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: GRID_LINE }} />
          <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="value" name="Responses" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {items.map((_, i) => (
              <Cell key={i} fill={fillFor(i)} />
            ))}
            <LabelList dataKey="value" position="top" fontSize={12} fill={AXIS_TEXT} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <BarChart data={items} layout="vertical" margin={{ top: 4, right: 32, left: 0, bottom: 4 }} barCategoryGap="24%">
        <XAxis type="number" hide allowDecimals={false} domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tick={tick}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" name="Responses" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {items.map((_, i) => (
            <Cell key={i} fill={fillFor(i)} />
          ))}
          <LabelList dataKey="value" position="right" fontSize={12} fill={AXIS_TEXT} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Parts of a whole: categorical slots in fixed order, a 2px surface gap between slices. */
export const PieWidget = ({
  data,
  config,
  donut = false,
}: ChartProps & { donut?: boolean }) => {
  const items = data.items ?? [];
  if (items.length === 0) return <EmptyState />;
  const total = items.reduce((n, it) => n + (Number(it.value) || 0), 0);
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <PieChart>
        <Pie
          data={items}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius="75%"
          innerRadius={donut ? "50%" : 0}
          stroke={SURFACE}
          strokeWidth={2}
          isAnimationActive={false}
        >
          {items.map((_, i) => (
            <Cell key={i} fill={colorAt(config?.colors, i)} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string, _entry, i: number) => {
            const v = Number(items[i]?.value) || 0;
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            return (
              <span style={{ color: "hsl(var(--foreground))" }}>
                {value} <span style={{ color: AXIS_TEXT }}>{v} ({pct}%)</span>
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const LineWidget = ({ data, config }: ChartProps) => {
  const series = data.series ?? [];
  if (series.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={180}>
      <LineChart data={series} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_LINE} vertical={false} />
        <XAxis dataKey="x" tick={tick} tickLine={false} axisLine={{ stroke: GRID_LINE }} />
        <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="y"
          name="Responses"
          stroke={colorAt(config?.colors, 0)}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
