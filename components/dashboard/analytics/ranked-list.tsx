"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export interface RankedItem {
    key: string
    label: string
    sublabel?: string
    value: number
    href?: string
}

/**
 * A ranked breakdown: label, a single-hue bar scaled to the share of the total, the count and
 * the share. Used for traffic sources, devices, browsers, systems and top links; the label
 * and the numbers carry identity, so the bar never needs a second colour.
 */
export function RankedList({
    title,
    description,
    items,
    empty = "No data yet",
    className,
    footer,
}: {
    title: string
    description?: string
    items: RankedItem[]
    empty?: string
    className?: string
    footer?: React.ReactNode
}) {
    const total = items.reduce((n, it) => n + it.value, 0)
    return (
        <section className={cn("rounded-lg border bg-card p-5", className)}>
            <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium">{title}</h2>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
            ) : (
                <ol className="mt-4 space-y-3">
                    {items.map((it) => {
                        const share = total > 0 ? it.value / total : 0
                        const label = (
                            <span className="block truncate text-sm" title={it.label}>{it.label}</span>
                        )
                        return (
                            <li key={it.key}>
                                <div className="flex items-baseline gap-3">
                                    <div className="min-w-0 flex-1">
                                        {it.href ? (
                                            <Link
                                                href={it.href}
                                                className="block rounded-sm hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                {label}
                                            </Link>
                                        ) : label}
                                        {it.sublabel && (
                                            <span className="block truncate font-mono text-xs text-muted-foreground">{it.sublabel}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium tabular-nums">{it.value.toLocaleString("id-ID")}</span>
                                    <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{Math.round(share * 100)}%</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                    <div className="h-full rounded-full bg-chart-1" style={{ width: `${share * 100}%` }} />
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
            {footer && <div className="mt-4 border-t pt-3 text-sm">{footer}</div>}
        </section>
    )
}
