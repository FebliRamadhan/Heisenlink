"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  BarChart3,
  ExternalLink,
  Trash2,
  Lock,
} from "lucide-react";
import { dashboardsApi } from "@/lib/dashboards-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import type { DashboardListItem } from "@/types";

export default function FormDashboardsPage({
  params,
}: {
  params: { id: string };
}) {
  const formId = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboards", formId],
    queryFn: () => dashboardsApi.listForForm(formId),
  });

  const create = useMutation({
    mutationFn: () => dashboardsApi.create(formId),
    onSuccess: (d) =>
      router.push(`/dashboard/forms/${formId}/dashboards/${d.id}`),
    onError: () =>
      toast({ variant: "destructive", title: "Failed to create dashboard" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => dashboardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboards", formId] }),
    onError: () =>
      toast({ variant: "destructive", title: "Failed to delete dashboard" }),
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/forms/${formId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Dashboards</h2>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {create.isPending ? "Creating…" : "New dashboard"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
          <BarChart3 className="mb-2 h-8 w-8" />
          <p className="font-medium">No dashboards yet</p>
          <p className="text-sm">
            Create a dashboard to visualize this form&apos;s responses.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {data.map((d: DashboardListItem) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <button
                className="flex flex-1 items-center gap-3 text-left"
                onClick={() =>
                  router.push(`/dashboard/forms/${formId}/dashboards/${d.id}`)
                }
              >
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {d.title}
                    {d.hasPassword && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.widgetCount} widget{d.widgetCount === 1 ? "" : "s"} ·{" "}
                    {d.isPublished ? d.visibility.toLowerCase() : "draft"}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-1">
                {d.isPublished && (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove.mutate(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
