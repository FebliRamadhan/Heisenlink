"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type {
  FormQuestion,
  WidgetCompatibilityEntry,
  WidgetType,
} from "@/types";
import type { WidgetInput } from "@/lib/dashboards-api";
import { WIDGET_LABELS, FORM_LEVEL } from "./widget-meta";

interface AddWidgetDialogProps {
  questions: FormQuestion[];
  matrix: WidgetCompatibilityEntry[];
  onAdd: (input: WidgetInput) => void;
}

const DISPLAY_ONLY = new Set(["SECTION", "STATEMENT", "IMAGE"]);

export const AddWidgetDialog = ({
  questions,
  matrix,
  onAdd,
}: AddWidgetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string>(FORM_LEVEL);
  const [widgetType, setWidgetType] = useState<WidgetType | "">("");

  const matrixByType = useMemo(
    () => new Map(matrix.map((e) => [e.questionType, e.widgets])),
    [matrix],
  );

  // Resolve the question type for the chosen source, then its allowed widgets.
  const sourceType =
    source === FORM_LEVEL
      ? FORM_LEVEL
      : questions.find((q) => q.id === source)?.type;
  const allowed = (sourceType ? matrixByType.get(sourceType) : undefined) ?? [];

  const reset = () => {
    setSource(FORM_LEVEL);
    setWidgetType("");
  };

  const submit = () => {
    if (!widgetType) return;
    const entry = allowed.find((w) => w.type === widgetType);
    if (!entry) return;
    onAdd({
      questionId: source === FORM_LEVEL ? null : source,
      type: widgetType,
      aggregation: entry.aggregations[0],
    });
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data source</label>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v);
                setWidgetType("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FORM_LEVEL}>
                  Whole form (responses)
                </SelectItem>
                {questions
                  .filter((q) => !DISPLAY_ONLY.has(q.type))
                  .map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title || "Untitled question"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Visualization</label>
            <Select
              value={widgetType}
              onValueChange={(v) => setWidgetType(v as WidgetType)}
              disabled={allowed.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a chart type" />
              </SelectTrigger>
              <SelectContent>
                {allowed.map((w) => (
                  <SelectItem key={w.type} value={w.type}>
                    {WIDGET_LABELS[w.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!widgetType}>
            Add widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
