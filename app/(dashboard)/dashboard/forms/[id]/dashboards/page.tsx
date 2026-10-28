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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/forms/${formId}`} aria-label="Back to form">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
            <p className="mt-1 text-sm text-muted-foreground">Charts over this form&apos;s responses, shareable by link.</p>
          </div>
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {create.isPending ? "Creating…" : "New dashboard"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center">
          <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 font-medium">No dashboards yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a dashboard to visualize this form&apos;s responses.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {data.map((d: DashboardListItem) => (
            <li key={d.id} className="flex items-center gap-4 px-4 py-3">
              <button
                className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  router.push(`/dashboard/forms/${formId}/dashboards/${d.id}`)
                }
              >
                <span className="flex items-center gap-2 font-medium">
                  <span className="truncate">{d.title}</span>
                  {d.hasPassword && (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Password protected" />
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground tabular-nums">
                  {d.widgetCount} widget{d.widgetCount === 1 ? "" : "s"}
                </span>
              </button>
              <span
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.isPublished
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {d.isPublished ? d.visibility.charAt(0) + d.visibility.slice(1).toLowerCase() : "Draft"}
              </span>
              <div className="flex items-center gap-1">
                {d.isPublished && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={d.url} target="_blank" rel="noreferrer" aria-label={`Open ${d.title}`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Delete ${d.title}`}
                  onClick={() => {
                    if (confirm(`Delete "${d.title}"? This cannot be undone.`)) remove.mutate(d.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
