import type { WidgetType, WidgetAggregation } from "@/types";

/** Mirrors the backend FORM_LEVEL sentinel in widget-compatibility.js. */
export const FORM_LEVEL = "FORM_LEVEL";

export const WIDGET_LABELS: Record<WidgetType, string> = {
  KPI: "Number (KPI)",
  BAR: "Bar chart",
  PIE: "Pie chart",
  DONUT: "Donut chart",
  LINE: "Line chart",
  SCALE_HISTOGRAM: "Histogram",
  TABLE: "Table",
  WORDCLOUD: "Word cloud",
};

export const AGGREGATION_LABELS: Record<WidgetAggregation, string> = {
  COUNT: "Count",
  DISTRIBUTION: "Distribution",
  AVERAGE: "Average",
  SUM: "Sum",
  MIN: "Minimum",
  MAX: "Maximum",
  OVER_TIME: "Over time",
};
