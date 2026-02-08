"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { Loader2 } from "lucide-react"

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
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Reusing OverviewStats or custom cards */}
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Users</div>
                    <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                    <div className="text-xs text-muted-foreground">{stats?.activeUsers} active</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Links</div>
                    <div className="text-2xl font-bold">{stats?.totalLinks}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="text-sm font-medium text-muted-foreground">Total Clicks</div>
                    <div className="text-2xl font-bold">{stats?.totalClicks}</div>
                </div>
            </div>
        </div>
    )
}
