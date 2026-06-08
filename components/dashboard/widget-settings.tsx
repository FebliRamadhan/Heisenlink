"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings2, Trash2, GripVertical } from "lucide-react";
import type { ComputedWidget, WidgetType, WidgetAggregation } from "@/types";
import type { WidgetInput } from "@/lib/dashboards-api";
import { WIDGET_LABELS, AGGREGATION_LABELS } from "./widget-meta";

interface WidgetSettingsProps {
  widget: ComputedWidget;
  /** Allowed { type, aggregations } for this widget's data source. */
  allowed: { type: WidgetType; aggregations: WidgetAggregation[] }[];
  onUpdate: (patch: Partial<WidgetInput>) => void;
  onDelete: () => void;
}

/** Drag handle + settings popover shown in a widget header while editing. */
export const WidgetSettings = ({
  widget,
  allowed,
  onUpdate,
  onDelete,
}: WidgetSettingsProps) => {
  const currentTypeEntry = allowed.find((a) => a.type === widget.type);
  const aggregations = currentTypeEntry?.aggregations ?? [widget.aggregation];
  const isText = widget.type === "TABLE";
  const isWordcloud = widget.type === "WORDCLOUD";
  const isOverTime = widget.aggregation === "OVER_TIME";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="widget-drag-handle cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag widget"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              defaultValue={widget.title ?? ""}
              placeholder="Widget title"
              onBlur={(e) => onUpdate({ title: e.target.value || null })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Visualization</Label>
            <Select
              value={widget.type}
              onValueChange={(v) => {
                const entry = allowed.find((a) => a.type === v);
                onUpdate({
                  type: v as WidgetType,
                  aggregation: entry?.aggregations[0],
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((a) => (
                  <SelectItem key={a.type} value={a.type}>
                    {WIDGET_LABELS[a.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {aggregations.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Statistic</Label>
              <Select
                value={widget.aggregation}
                onValueChange={(v) =>
                  onUpdate({ aggregation: v as WidgetAggregation })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aggregations.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AGGREGATION_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isOverTime && (
            <div className="space-y-1.5">
              <Label className="text-xs">Group by</Label>
              <Select
                value={widget.config?.granularity ?? "day"}
                onValueChange={(v) =>
                  onUpdate({
                    config: {
                      ...widget.config,
                      granularity: v as "day" | "week" | "month",
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isWordcloud && (
            <div className="space-y-1.5">
              <Label className="text-xs">Max words</Label>
              <Input
                type="number"
                min={5}
                max={200}
                defaultValue={widget.config?.topN ?? 50}
                onBlur={(e) =>
                  onUpdate({
                    config: { ...widget.config, topN: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}

          {isText && (
            <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 p-2">
              <div className="pr-2">
                <Label className="text-xs font-medium">
                  Show raw text publicly
                </Label>
                <p className="text-[11px] text-amber-700">
                  May expose respondent PII.
                </p>
              </div>
              <Switch
                checked={widget.config?.showRawText ?? false}
                onCheckedChange={(c) =>
                  onUpdate({ config: { ...widget.config, showRawText: c } })
                }
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete widget
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
