"use client"

import { RankedList } from "./ranked-list"

interface ReferrerListProps {
    data: { referrer: string; count: number }[]
    className?: string
}

// Shown as a host: the path of a referrer rarely matters, and full URLs crowd the list.
const host = (ref: string) => {
    if (!ref) return "Direct / Unknown"
    try {
        return new URL(ref).host.replace(/^www\./, "")
    } catch {
        return ref
    }
}

export function ReferrerList({ data, className }: ReferrerListProps) {
    return (
        <RankedList
            title="Top traffic sources"
            className={className}
            empty="No data available"
            items={(data || []).map((d, i) => ({ key: `${d.referrer}-${i}`, label: host(d.referrer), value: Number(d.count) }))}
        />
    )
}
