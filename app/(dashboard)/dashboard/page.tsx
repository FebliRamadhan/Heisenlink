"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { Skeleton } from "@/components/ui/skeleton"
import { RankedList } from "@/components/dashboard/analytics/ranked-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart"

export default function DashboardPage() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ["analytics", "overview"],
        queryFn: async () => {
            const res = await api.get("/analytics/overview")
            return res.data.data
        },
    })

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Your links and how often they are opened.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/links/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Link
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-[108px] w-full rounded-lg" />
            ) : (
                <OverviewStats
                    totalLinks={analytics?.totalLinks}
                    totalClicks={analytics?.totalClicks}
                    bioLinkClicks={analytics?.bioLinkClicks}
                />
            )}

            <div className="grid gap-4 lg:grid-cols-12">
                <ClicksChart data={analytics?.clicksByDay || []} className="lg:col-span-7" />
                <RankedList
                    title="Top links"
                    description="By clicks"
                    className="lg:col-span-5"
                    empty="No links created yet"
                    items={(analytics?.topLinks || []).map((link: any) => ({
                        key: link.id,
                        label: link.title || link.code,
                        sublabel: `/${link.code}`,
                        value: Number(link.clickCount) || 0,
                        href: `/dashboard/links/${link.id}`,
                    }))}
                    footer={
                        <Link href="/dashboard/links" className="rounded-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            All links
                        </Link>
                    }
                />
            </div>
        </div>
    )
}
