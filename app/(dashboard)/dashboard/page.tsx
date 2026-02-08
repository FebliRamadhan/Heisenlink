"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/links/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Link
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse h-32" />
                    ))}
                </div>
            ) : (
                <OverviewStats
                    totalLinks={analytics?.totalLinks}
                    totalClicks={analytics?.totalClicks}
                    bioLinkClicks={analytics?.bioLinkClicks}
                />
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ClicksChart data={analytics?.clicksByDay || []} />

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Links</CardTitle>
                        <CardDescription>
                            Your most visited links
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics?.topLinks?.map((link: any) => (
                                <div key={link.id} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{link.title || link.code}</p>
                                        <p className="text-xs text-muted-foreground">{link.shortUrl}</p>
                                    </div>
                                    <div className="ml-auto font-medium">+{link.clickCount}</div>
                                </div>
                            ))}
                            {!analytics?.topLinks?.length && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No links created yet
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
