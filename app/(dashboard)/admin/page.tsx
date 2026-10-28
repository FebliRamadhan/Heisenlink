"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart"
import { DeviceChart, BrowserChart, OSChart } from "@/components/dashboard/analytics/breakdown-charts"
import { ReferrerList } from "@/components/dashboard/analytics/referrer-list"
import { Skeleton } from "@/components/ui/skeleton"
import { RankedList } from "@/components/dashboard/analytics/ranked-list"
import { StatStrip } from "@/components/dashboard/overview-stats"

export default function AdminDashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin", "analytics"],
        queryFn: async () => {
            const res = await api.get("/admin/analytics")
            return res.data.data
        },
    })

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
                <Skeleton className="h-[108px] w-full rounded-lg" />
                <Skeleton className="h-[340px] w-full rounded-lg" />
            </div>
        )
    }

    const n = (v?: number) => (v ?? 0).toLocaleString("id-ID")

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
                <p className="mt-1 text-sm text-muted-foreground">Usage across every account.</p>
            </div>

            <StatStrip
                stats={[
                    { label: "Users", value: n(stats?.totalUsers), note: `${n(stats?.activeUsers)} active` },
                    { label: "Links", value: n(stats?.totalLinks), note: "All shortlinks across users" },
                    { label: "Clicks", value: n(stats?.totalClicks), note: `${n(stats?.shortlinkClicks)} shortlink, ${n(stats?.bioLinkClicks)} bio` },
                    { label: "Bio pages", value: n(stats?.totalBioPages), note: "Total bio pages created" },
                ]}
            />

            <ClicksChart data={stats?.clicksByDay || []} />

            <div className="grid gap-4 md:grid-cols-2">
                <RankedList
                    title="Top performing links"
                    description="Across all users"
                    empty="No links yet"
                    items={(stats?.topLinks || []).map((link: any) => ({
                        key: link.id,
                        label: link.title || link.code,
                        sublabel: `by ${link.owner || "unknown"}`,
                        value: Number(link.clickCount) || 0,
                    }))}
                />
                <RankedList
                    title="Top users by links"
                    description="Links created"
                    empty="No users yet"
                    items={(stats?.topUsersByLinks || []).map((user: any) => ({
                        key: user.username,
                        label: user.displayName || user.username,
                        sublabel: `@${user.username}`,
                        value: Number(user.linksCount) || 0,
                    }))}
                />
            </div>

            <ReferrerList data={stats?.referrerBreakdown || []} />

            <div className="grid gap-4 md:grid-cols-3">
                <DeviceChart data={stats?.deviceBreakdown || []} />
                <BrowserChart data={stats?.browserBreakdown || []} />
                <OSChart data={stats?.osBreakdown || []} />
            </div>
        </div>
    )
}
