"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart"
import { DeviceChart, BrowserChart, OSChart } from "@/components/dashboard/analytics/breakdown-charts"
import { ReferrerList } from "@/components/dashboard/analytics/referrer-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <div className="flex items-center space-x-2">
                    {/* Placeholder for DateRangePicker until implemented */}
                    <div className="text-sm text-muted-foreground mr-4">
                        Last 30 Days
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div>Loading analytics...</div>
            ) : (
                <div className="space-y-4">
                    <OverviewStats
                        totalLinks={overview?.totalLinks}
                        totalClicks={overview?.totalClicks}
                        bioLinkClicks={overview?.bioLinkClicks}
                    />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <ClicksChart data={overview?.clicksByDay || []} />

                        <ReferrerList data={overview?.referrerBreakdown || []} />
                    </div>

                    <Tabs defaultValue="devices" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="devices">Devices</TabsTrigger>
                            <TabsTrigger value="browsers">Browsers</TabsTrigger>
                            <TabsTrigger value="os">OS</TabsTrigger>
                        </TabsList>
                        <TabsContent value="devices" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="col-span-1">
                                    <DeviceChart data={overview?.deviceBreakdown || []} />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="browsers" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="col-span-1">
                                    <BrowserChart data={overview?.browserBreakdown || []} />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="os" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="col-span-1">
                                    <OSChart data={overview?.osBreakdown || []} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Top Performing Links</CardTitle>
                                <CardDescription>
                                    Most clicked links in this period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {overview?.topLinks?.map((link: any, i: number) => (
                                        <div key={link.id} className="flex items-center">
                                            <div className="w-8 font-bold text-muted-foreground">{i + 1}.</div>
                                            <div className="space-y-1 overflow-hidden">
                                                <p className="text-sm font-medium leading-none truncate">{link.title || link.code}</p>
                                            </div>
                                            <div className="ml-auto font-medium">{link.clickCount.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
