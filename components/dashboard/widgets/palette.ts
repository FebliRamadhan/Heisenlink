// Default categorical palette for dashboard charts. Widgets may override via
// their config.colors. Kept here so every widget renders consistently.
export const DEFAULT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#a855f7",
];

export const colorAt = (
  colors: string[] | undefined,
  index: number,
): string => {
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  return palette[index % palette.length];
};

/** Format a numeric KPI value: round floats to 2 decimals, pass integers through. */
export const formatMetric = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};
