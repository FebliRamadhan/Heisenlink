"use client"

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { DEFAULT_COLORS, AXIS_TEXT, GRID_LINE, SURFACE } from "@/components/dashboard/widgets/palette"

interface ClicksChartProps {
    data: { date: string; clicks: number }[]
    className?: string
}

const SERIES = DEFAULT_COLORS[0]
const tick = { fontSize: 12, fill: AXIS_TEXT }

export function ClicksChart({ data, className }: ClicksChartProps) {
    const chartData = [...(data || [])]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item) => ({
            ...item,
            formattedDate: new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
            clicks: Number(item.clicks),
        }))

    return (
        <section className={cn("rounded-lg border bg-card p-5", className)}>
            <h2 className="font-medium">Clicks over time</h2>
            {chartData.length === 0 ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data available</div>
            ) : chartData.length === 1 ? (
                // One day is a figure, not a trend: a lone point on an axis reads as nothing.
                <div className="flex h-[280px] flex-col justify-center">
                    <p className="text-4xl font-semibold tracking-tight tabular-nums">{chartData[0].clicks.toLocaleString("id-ID")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">clicks on {chartData[0].formattedDate}. The trend appears once there are two days of data.</p>
                </div>
            ) : (
                <div className="mt-4 h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke={GRID_LINE} vertical={false} />
                            <XAxis dataKey="formattedDate" tick={tick} tickLine={false} axisLine={{ stroke: GRID_LINE }} minTickGap={24} />
                            <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ stroke: AXIS_TEXT, strokeDasharray: "3 3" }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="clicks"
                                name="Clicks"
                                stroke={SERIES}
                                strokeWidth={2}
                                fill={SERIES}
                                fillOpacity={0.08}
                                dot={false}
                                activeDot={{ r: 5, stroke: SURFACE, strokeWidth: 2 }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    )
}
