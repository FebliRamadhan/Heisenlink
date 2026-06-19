import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardView } from "@/components/public/dashboard-view";
import type { PublicDashboard } from "@/types";

// SSR must use the internal URL (Docker network) to reach the backend directly.
const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

async function fetchDashboard(slug: string): Promise<PublicDashboard | null> {
  try {
    const res = await fetch(`${API_URL}/api/dashboards/public/${slug}`, {
      next: { revalidate: 60, tags: [`dashboard:${slug}`] },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as PublicDashboard;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dashboard = await fetchDashboard(params.slug);
  if (!dashboard) return { title: "Dashboard not found - Heisenlink" };
  return {
    title: `${dashboard.title} - Heisenlink`,
    description: dashboard.description || "Form insights dashboard",
    openGraph: {
      title: dashboard.title,
      description: dashboard.description || undefined,
      type: "website",
    },
  };
}

export default async function PublicDashboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const dashboard = await fetchDashboard(params.slug);
  if (!dashboard) notFound();

  return (
    <main className="min-h-screen bg-muted/20">
      <DashboardView dashboard={dashboard} />
    </main>
  );
}
