"use client"

import { RankedList } from "./ranked-list"

interface BreakdownChartProps {
    data: { [key: string]: any; count: number }[]
    dataKey: string
    title: string
    className?: string
}

/** A handful of categories ranked by count: a list with bars reads better than a pie. */
export function BreakdownChart({ data, dataKey, title, className }: BreakdownChartProps) {
    return (
        <RankedList
            title={title}
            className={className}
            empty="No data available"
            items={(data || []).map((item, i) => ({
                key: `${item[dataKey] ?? "unknown"}-${i}`,
                label: item[dataKey] || "Unknown",
                value: Number(item.count),
            }))}
        />
    )
}

export function DeviceChart({ data, className }: { data: any[]; className?: string }) {
    return <BreakdownChart data={data} dataKey="device" title="Devices" className={className} />
}

export function BrowserChart({ data, className }: { data: any[]; className?: string }) {
    return <BreakdownChart data={data} dataKey="browser" title="Browsers" className={className} />
}

export function OSChart({ data, className }: { data: any[]; className?: string }) {
    return <BreakdownChart data={data} dataKey="os" title="Operating systems" className={className} />
}
