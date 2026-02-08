"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2, Link as LinkIcon, MousePointer, UserCircle } from "lucide-react"

interface OverviewStatsProps {
    totalLinks: number
    totalClicks: number
    bioLinkClicks: number
}

export function OverviewStats({
    totalLinks = 0,
    totalClicks = 0,
    bioLinkClicks = 0,
}: OverviewStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalLinks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Current active shortlinks
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        All time link clicks
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bio Clicks</CardTitle>
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{bioLinkClicks.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Clicks from bio page
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Clicks per link
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
