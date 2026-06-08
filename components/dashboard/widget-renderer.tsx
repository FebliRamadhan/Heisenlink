"use client";

import type { ComputedWidget } from "@/types";
import { BarWidget, PieWidget, LineWidget } from "./widgets/chart-widgets";
import {
  KpiWidget,
  TableWidget,
  WordCloudWidget,
} from "./widgets/simple-widgets";

/** Pure dispatch: WidgetType -> visualization. Shared by builder preview + public page. */
const WidgetBody = ({ widget }: { widget: ComputedWidget }) => {
  const { type, aggregation, config, data } = widget;
  switch (type) {
    case "KPI":
      return <KpiWidget data={data} aggregation={aggregation} />;
    case "BAR":
    case "SCALE_HISTOGRAM":
      return <BarWidget data={data} config={config} />;
    case "PIE":
      return <PieWidget data={data} config={config} />;
    case "DONUT":
      return <PieWidget data={data} config={config} donut />;
    case "LINE":
      return <LineWidget data={data} config={config} />;
    case "TABLE":
      return <TableWidget data={data} />;
    case "WORDCLOUD":
      return <WordCloudWidget data={data} />;
    default:
      return null;
  }
};

const FALLBACK_TITLES: Record<string, string> = {
  KPI: "Metric",
  BAR: "Bar chart",
  PIE: "Pie chart",
  DONUT: "Donut chart",
  LINE: "Trend",
  SCALE_HISTOGRAM: "Scale distribution",
  TABLE: "Responses",
  WORDCLOUD: "Word frequency",
};

interface WidgetRendererProps {
  widget: ComputedWidget;
  /** Builder shows controls in the header via this slot. */
  actions?: React.ReactNode;
}

/**
 * Card chrome + title + body. Stateless and presentation-only so the same
 * component renders inside the editable grid and on the read-only public page.
 */
export const WidgetRenderer = ({ widget, actions }: WidgetRendererProps) => (
  <div className="flex h-full flex-col rounded-lg border bg-card p-3 shadow-sm">
    <div className="mb-2 flex items-start justify-between gap-2">
      <h3 className="truncate text-sm font-semibold">
        {widget.title || FALLBACK_TITLES[widget.type] || "Widget"}
      </h3>
      {actions}
    </div>
    <div className="min-h-0 flex-1">
      <WidgetBody widget={widget} />
    </div>
  </div>
);
