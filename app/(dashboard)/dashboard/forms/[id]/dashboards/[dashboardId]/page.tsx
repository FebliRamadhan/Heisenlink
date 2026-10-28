"use client";

import { useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { dashboardsApi, type WidgetInput } from "@/lib/dashboards-api";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { AddWidgetDialog } from "@/components/dashboard/add-widget-dialog";
import { WidgetSettings } from "@/components/dashboard/widget-settings";
import { DashboardShareDialog } from "@/components/dashboard/dashboard-share-dialog";
import { FORM_LEVEL } from "@/components/dashboard/widget-meta";
import type { ComputedWidget, Form, LayoutItem } from "@/types";

export default function DashboardBuilderPage({
  params,
}: {
  params: { id: string; dashboardId: string };
}) {
  const { id: formId, dashboardId } = params;
  const qc = useQueryClient();
  const { toast } = useToast();
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const formQuery = useQuery<Form>({
    queryKey: ["form", formId],
    queryFn: async () => (await api.get(`/forms/${formId}`)).data.data,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", dashboardId],
    queryFn: () => dashboardsApi.get(dashboardId),
  });
  const dataQuery = useQuery({
    queryKey: ["dashboard-data", dashboardId],
    queryFn: () => dashboardsApi.getData(dashboardId),
  });
  const matrixQuery = useQuery({
    queryKey: ["widget-types"],
    queryFn: () => dashboardsApi.widgetTypes(),
    staleTime: Infinity,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dashboard", dashboardId] });
    qc.invalidateQueries({ queryKey: ["dashboard-data", dashboardId] });
  };
  const onError = () =>
    toast({ variant: "destructive", title: "Something went wrong" });

  const addWidget = useMutation({
    mutationFn: (input: WidgetInput) =>
      dashboardsApi.addWidget(dashboardId, input),
    onSuccess: invalidate,
    onError,
  });
  const updateWidget = useMutation({
    mutationFn: ({
      widgetId,
      patch,
    }: {
      widgetId: string;
      patch: Partial<WidgetInput>;
    }) => dashboardsApi.updateWidget(dashboardId, widgetId, patch),
    onSuccess: invalidate,
    onError,
  });
  const deleteWidget = useMutation({
    mutationFn: (widgetId: string) =>
      dashboardsApi.deleteWidget(dashboardId, widgetId),
    onSuccess: invalidate,
    onError,
  });
  const updateDashboard = useMutation({
    mutationFn: (patch: Parameters<typeof dashboardsApi.update>[1]) =>
      dashboardsApi.update(dashboardId, patch),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["dashboard", dashboardId] }),
    onError,
  });
  const setPassword = useMutation({
    mutationFn: (password: string | null) =>
      dashboardsApi.setPassword(dashboardId, password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", dashboardId] });
      toast({ title: "Password updated" });
    },
    onError,
  });

  const dashboard = dashboardQuery.data;
  const widgets: ComputedWidget[] = dataQuery.data?.widgets ?? [];
  const questions = formQuery.data?.questions ?? [];
  const matrix = matrixQuery.data ?? [];

  const matrixByType = useMemo(
    () => new Map(matrix.map((e) => [e.questionType, e.widgets])),
    [matrix],
  );
  const allowedFor = (widget: ComputedWidget) => {
    const sourceType = widget.questionId
      ? questions.find((q) => q.id === widget.questionId)?.type
      : FORM_LEVEL;
    return (sourceType ? matrixByType.get(sourceType) : undefined) ?? [];
  };

  const saveLayout = (layout: LayoutItem[]) => {
    clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(
      () => updateDashboard.mutate({ layout }),
      600,
    );
  };

  if (dashboardQuery.isLoading || !dashboard) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/forms/${formId}/dashboards`} aria-label="Back to dashboards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Input
            defaultValue={dashboard.title}
            aria-label="Dashboard title"
            className="h-10 min-w-[200px] max-w-md flex-1 border-transparent px-2 text-xl font-semibold shadow-none hover:border-input focus-visible:border-input"
            onBlur={(e) => {
              if (e.target.value && e.target.value !== dashboard.title) {
                updateDashboard.mutate({ title: e.target.value });
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <AddWidgetDialog
            questions={questions}
            matrix={matrix}
            onAdd={(input) => addWidget.mutate(input)}
          />
          <DashboardShareDialog
            dashboard={dashboard}
            publicUrl={dashboard.url}
            onUpdate={(patch) => updateDashboard.mutate(patch)}
            onSetPassword={(pw) => setPassword.mutate(pw)}
          />
        </div>
      </div>

      {widgets.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <p className="font-medium">No widgets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a widget to start visualizing this form&apos;s responses.
          </p>
        </div>
      ) : (
        <DashboardGrid
          widgets={widgets}
          layout={dashboard.layout}
          editable
          onLayoutChange={saveLayout}
          renderActions={(widget) => (
            <WidgetSettings
              widget={widget}
              allowed={allowedFor(widget)}
              onUpdate={(patch) =>
                updateWidget.mutate({ widgetId: widget.id, patch })
              }
              onDelete={() => deleteWidget.mutate(widget.id)}
            />
          )}
        />
      )}
    </div>
  );
}
