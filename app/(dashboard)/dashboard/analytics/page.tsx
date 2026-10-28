"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart"
import { DeviceChart, BrowserChart, OSChart } from "@/components/dashboard/analytics/breakdown-charts"
import { ReferrerList } from "@/components/dashboard/analytics/referrer-list"
import { Skeleton } from "@/components/ui/skeleton"
import { RankedList } from "@/components/dashboard/analytics/ranked-list"
import { useState } from "react"
import { subDays } from "date-fns"
import { DateRange } from "react-day-picker"

export default function AnalyticsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })

    // Format dates for API
    const queryParams = {
        from: date?.from?.toISOString(),
        to: date?.to?.toISOString(),
    }

    const { data: overview, isLoading } = useQuery({
        queryKey: ["analytics", "overview", queryParams],
        queryFn: async () => {
            const res = await api.get("/analytics/overview", { params: queryParams })
            return res.data.data
        },
    })

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Last 30 Days</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[108px] w-full rounded-lg" />
                    <Skeleton className="h-[340px] w-full rounded-lg" />
                </div>
            ) : (
                <div className="space-y-4">
                    <OverviewStats
                        totalLinks={overview?.totalLinks}
                        totalClicks={overview?.totalClicks}
                        bioLinkClicks={overview?.bioLinkClicks}
                    />

                    <ClicksChart data={overview?.clicksByDay || []} />

                    <div className="grid gap-4 md:grid-cols-2">
                        <RankedList
                            title="Top performing links"
                            description="Most clicked links in this period"
                            empty="No clicks in this period"
                            items={(overview?.topLinks || []).map((link: any) => ({
                                key: link.id,
                                label: link.title || link.code,
                                sublabel: `/${link.code}`,
                                value: Number(link.clickCount) || 0,
                                href: `/dashboard/links/${link.id}`,
                            }))}
                        />
                        <ReferrerList data={overview?.referrerBreakdown || []} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <DeviceChart data={overview?.deviceBreakdown || []} />
                        <BrowserChart data={overview?.browserBreakdown || []} />
                        <OSChart data={overview?.osBreakdown || []} />
                    </div>
                </div>
            )}
        </div>
    )
}
