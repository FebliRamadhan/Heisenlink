"use client";

import { useEffect, useMemo, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import type { ComputedWidget, LayoutItem } from "@/types";
import { WidgetRenderer } from "./widget-renderer";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ReactGridLayout = WidthProvider(GridLayout);

const COLS = 12;
const ROW_HEIGHT = 64;

/** Sensible default placement for widgets that have no saved layout yet. */
const defaultLayout = (widgets: ComputedWidget[]): LayoutItem[] =>
  widgets.map((w, i) => ({
    i: w.id,
    x: (i % 2) * 6,
    y: Math.floor(i / 2) * 4,
    w: w.type === "KPI" ? 3 : 6,
    h: w.type === "KPI" ? 2 : 4,
  }));

interface DashboardGridProps {
  widgets: ComputedWidget[];
  layout?: LayoutItem[] | null;
  /** Editable mode renders drag handles + per-widget actions. */
  editable?: boolean;
  onLayoutChange?: (layout: LayoutItem[]) => void;
  renderActions?: (widget: ComputedWidget) => React.ReactNode;
}

export const DashboardGrid = ({
  widgets,
  layout,
  editable = false,
  onLayoutChange,
  renderActions,
}: DashboardGridProps) => {
  // Merge saved layout with any widgets missing a position (newly added).
  const effectiveLayout = useMemo<LayoutItem[]>(() => {
    const saved = new Map((layout ?? []).map((l) => [l.i, l]));
    const fallback = defaultLayout(widgets);
    return widgets.map((w, i) => saved.get(w.id) ?? fallback[i]);
  }, [widgets, layout]);

  // Read-only views stack on narrow screens: a 12-column grid squeezes charts past the edge.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!editable && narrow) {
    const order = [...effectiveLayout].sort((a, b) => a.y - b.y || a.x - b.x);
    const byId = new Map(widgets.map((w) => [w.id, w]));
    return (
      <div className="grid gap-4">
        {order.map((l) => {
          const widget = byId.get(l.i);
          if (!widget) return null;
          return (
            <div key={l.i} style={{ height: Math.max(l.h, 2) * ROW_HEIGHT }}>
              <WidgetRenderer widget={widget} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ReactGridLayout
      className="layout"
      layout={effectiveLayout as Layout[]}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={[16, 16]}
      isDraggable={editable}
      isResizable={editable}
      draggableHandle=".widget-drag-handle"
      onLayoutChange={(l: Layout[]) =>
        onLayoutChange?.(l.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))
      }
    >
      {widgets.map((widget) => (
        <div key={widget.id}>
          <WidgetRenderer
            widget={widget}
            actions={editable ? renderActions?.(widget) : undefined}
          />
        </div>
      ))}
    </ReactGridLayout>
  );
};
