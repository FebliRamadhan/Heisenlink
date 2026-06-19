"use client";

import { Lock } from "lucide-react";
import type { WidgetAggregation, WidgetData } from "@/types";
import { formatMetric } from "./palette";

interface SimpleProps {
  data: WidgetData;
}

const AGG_LABEL: Record<WidgetAggregation, string> = {
  COUNT: "Total",
  DISTRIBUTION: "",
  AVERAGE: "Average",
  SUM: "Sum",
  MIN: "Minimum",
  MAX: "Maximum",
  OVER_TIME: "",
};

export const KpiWidget = ({
  data,
  aggregation,
}: SimpleProps & { aggregation: WidgetAggregation }) => (
  <div className="flex h-full min-h-[120px] flex-col items-center justify-center">
    <div className="text-4xl font-bold tabular-nums">
      {formatMetric(data.value)}
    </div>
    <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
      {AGG_LABEL[aggregation] || "Total"}
    </div>
  </div>
);

export const TableWidget = ({ data }: SimpleProps) => {
  if (data.redacted) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Lock className="h-5 w-5" />
        <span>
          {data.totalAnswered ?? 0} responses hidden to protect respondent
          privacy
        </span>
      </div>
    );
  }
  const rows = data.rows ?? [];
  if (rows.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
        No responses yet
      </div>
    );
  }
  return (
    <ul className="max-h-full space-y-1 overflow-auto pr-1 text-sm">
      {rows.map((row, i) => (
        <li key={i} className="rounded border bg-muted/40 px-2 py-1">
          {row}
        </li>
      ))}
    </ul>
  );
};

/** Lightweight word "cloud": font size scales with frequency. No external dep. */
export const WordCloudWidget = ({ data }: SimpleProps) => {
  const words = data.words ?? [];
  if (words.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
        No responses yet
      </div>
    );
  }
  const max = Math.max(...words.map((w) => w.count));
  const min = Math.min(...words.map((w) => w.count));
  const sizeFor = (count: number) => {
    if (max === min) return 16;
    return 12 + Math.round(((count - min) / (max - min)) * 22);
  };
  return (
    <div className="flex h-full flex-wrap content-start items-center gap-x-3 gap-y-1 overflow-auto">
      {words.map((w) => (
        <span
          key={w.word}
          title={`${w.word}: ${w.count}`}
          style={{ fontSize: sizeFor(w.count) }}
          className="font-medium leading-tight text-foreground/80"
        >
          {w.word}
        </span>
      ))}
    </div>
  );
};
