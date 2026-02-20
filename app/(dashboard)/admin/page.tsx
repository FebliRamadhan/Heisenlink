"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { ClicksChart } from "@/components/dashboard/analytics/clicks-chart"
import { DeviceChart, BrowserChart, OSChart } from "@/components/dashboard/analytics/breakdown-charts"
import { ReferrerList } from "@/components/dashboard/analytics/referrer-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Users, Link as LinkIcon, MousePointer, UserCheck } from "lucide-react"

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

            {/* Admin-specific stat cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeUsers} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLinks?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            All shortlinks across users
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                        <MousePointer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalClicks?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.shortlinkClicks?.toLocaleString()} shortlink · {stats?.bioLinkClicks?.toLocaleString()} bio
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bio Pages</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBioPages?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total bio pages created
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Clicks Over Time + Referrers */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <ClicksChart data={stats?.clicksByDay || []} />
                <ReferrerList data={stats?.referrerBreakdown || []} />
            </div>

            {/* Device/Browser/OS Breakdowns */}
            <Tabs defaultValue="devices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="devices">Devices</TabsTrigger>
                    <TabsTrigger value="browsers">Browsers</TabsTrigger>
                    <TabsTrigger value="os">OS</TabsTrigger>
                </TabsList>
                <TabsContent value="devices" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="col-span-1">
                            <DeviceChart data={stats?.deviceBreakdown || []} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="browsers" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="col-span-1">
                            <BrowserChart data={stats?.browserBreakdown || []} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="os" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="col-span-1">
                            <OSChart data={stats?.osBreakdown || []} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Top Links + Top Users */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Links</CardTitle>
                        <CardDescription>
                            Most clicked links across all users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topLinks?.map((link: any, i: number) => (
                                <div key={link.id} className="flex items-center">
                                    <div className="w-8 font-bold text-muted-foreground">{i + 1}.</div>
                                    <div className="space-y-1 overflow-hidden flex-1">
                                        <p className="text-sm font-medium leading-none truncate">
                                            {link.title || link.code}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            by {link.owner || "unknown"}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">{link.clickCount?.toLocaleString()}</div>
                                </div>
                            ))}
                            {(!stats?.topLinks || stats.topLinks.length === 0) && (
                                <p className="text-sm text-muted-foreground">No links yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Users by Links</CardTitle>
                        <CardDescription>
                            Users with the most created links
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topUsersByLinks?.map((user: any, i: number) => (
                                <div key={user.username} className="flex items-center">
                                    <div className="w-8 font-bold text-muted-foreground">{i + 1}.</div>
                                    <div className="space-y-1 overflow-hidden flex-1">
                                        <p className="text-sm font-medium leading-none truncate">
                                            {user.displayName || user.username}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            @{user.username}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">{user.linksCount} links</div>
                                </div>
                            ))}
                            {(!stats?.topUsersByLinks || stats.topUsersByLinks.length === 0) && (
                                <p className="text-sm text-muted-foreground">No users yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
