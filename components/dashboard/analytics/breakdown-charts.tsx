"use client"

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface BreakdownChartProps {
    data: { [key: string]: any; count: number }[]
    dataKey: string
    title: string
}

export function BreakdownChart({ data, dataKey, title }: BreakdownChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                    </div>
                </CardContent>
            </Card>
        )
    }

    const chartData = data.map(item => ({
        name: item[dataKey] || 'Unknown',
        value: item.count
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false} // Hide labels to avoid clutter
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [value, 'Clicks']}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function DeviceChart({ data }: { data: any[] }) {
    return <BreakdownChart data={data} dataKey="device" title="Device Distribution" />
}

export function BrowserChart({ data }: { data: any[] }) {
    return <BreakdownChart data={data} dataKey="browser" title="Browser Distribution" />
}

export function OSChart({ data }: { data: any[] }) {
    return <BreakdownChart data={data} dataKey="os" title="OS Distribution" />
}
