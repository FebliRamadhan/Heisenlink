// Categorical palette for dashboard charts: the dataviz reference palette, light steps,
// validated on #fff (lightness, chroma, CVD and normal-vision separation all pass).
// Mirrors --chart-1..8 in app/globals.css; hex here because recharts writes SVG
// attributes, where var() does not resolve. Fixed order, never cycled.
export const DEFAULT_COLORS = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

// A ninth category is never a generated hue: everything past slot 8 reads as "other".
export const OTHER_COLOR = "#a3a3a3";

// Recessive chart chrome (axis text, grid) as literal values for the same reason.
export const AXIS_TEXT = "#737373";
export const GRID_LINE = "#e5e5e5";
export const SURFACE = "#ffffff";

export const colorAt = (
  colors: string[] | undefined,
  index: number,
): string => {
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  return palette[index] ?? OTHER_COLOR;
};

/** Format a numeric KPI value: round floats to 2 decimals, pass integers through. */
export const formatMetric = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};
