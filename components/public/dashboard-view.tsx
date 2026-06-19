"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import type { PublicDashboard, ComputedWidget } from "@/types";

/** Password gate shown when a public dashboard is protected. */
const PasswordGate = ({
  slug,
  title,
  onUnlock,
}: {
  slug: string;
  title: string;
  onUnlock: (widgets: ComputedWidget[]) => void;
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboards/public/${slug}/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        },
      );
      if (!res.ok) {
        setError(
          res.status === 401 ? "Incorrect password" : "Something went wrong",
        );
        return;
      }
      const json = await res.json();
      onUnlock(json.data.widgets ?? []);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-20 max-w-sm space-y-4 rounded-lg border bg-card p-8 text-center"
    >
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          This dashboard is password protected.
        </p>
      </div>
      <Input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !password}>
        {loading ? "Unlocking…" : "View dashboard"}
      </Button>
    </form>
  );
};

export const DashboardView = ({
  dashboard,
}: {
  dashboard: PublicDashboard;
}) => {
  const [widgets, setWidgets] = useState<ComputedWidget[] | null>(
    dashboard.widgets ?? null,
  );

  if (dashboard.requiresPassword && !widgets) {
    return (
      <PasswordGate
        slug={dashboard.slug}
        title={dashboard.title}
        onUnlock={setWidgets}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{dashboard.title}</h1>
        {dashboard.description && (
          <p className="mt-1 text-muted-foreground">{dashboard.description}</p>
        )}
      </header>
      {widgets && widgets.length > 0 ? (
        <DashboardGrid widgets={widgets} layout={dashboard.layout} />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          This dashboard has no widgets yet.
        </div>
      )}
    </div>
  );
};
