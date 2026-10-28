"use client"

interface OverviewStatsProps {
    totalLinks: number
    totalClicks: number
    bioLinkClicks: number
}

export function StatStrip({ stats }: { stats: { label: string; value: string; note?: string }[] }) {
    return (
        <dl className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card lg:grid-cols-4">
            {stats.map((s, i) => (
                <div
                    key={s.label}
                    className={[
                        "px-5 py-4",
                        i % 2 === 1 ? "border-l" : "",
                        i >= 2 ? "border-t lg:border-t-0" : "",
                        i === 2 ? "lg:border-l" : "",
                    ].join(" ")}
                >
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
                    {s.note && <dd className="mt-1 text-xs text-muted-foreground">{s.note}</dd>}
                </div>
            ))}
        </dl>
    )
}

export function OverviewStats({
    totalLinks = 0,
    totalClicks = 0,
    bioLinkClicks = 0,
}: OverviewStatsProps) {
    const n = (v: number) => v.toLocaleString("id-ID")
    return (
        <StatStrip
            stats={[
                { label: "Links", value: n(totalLinks), note: "Current active shortlinks" },
                { label: "Clicks", value: n(totalClicks), note: "All time link clicks" },
                { label: "Bio clicks", value: n(bioLinkClicks), note: "Clicks from bio page" },
                {
                    label: "Clicks per link",
                    value: totalLinks > 0 ? (totalClicks / totalLinks).toLocaleString("id-ID", { maximumFractionDigits: 1 }) : "0",
                    note: "Average across your links",
                },
            ]}
        />
    )
}
