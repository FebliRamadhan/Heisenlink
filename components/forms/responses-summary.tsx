"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#e879f9", "#f87171"]

interface QuestionSummary {
    question: { id: string; title: string; type: string }
    kind: "choice" | "scale" | "text" | "file"
    totalAnswered: number
    average?: number | null
    distribution?: { label?: string; optionId?: string; value?: number; count: number }[]
    samples?: string[]
}

interface SummaryData {
    title: string
    responseCount: number
    summaries: QuestionSummary[]
}

export function ResponsesSummary({ data }: { data: SummaryData }) {
    if (!data.summaries.length) {
        return <p className="text-muted-foreground">No questions to summarize.</p>
    }

    return (
        <div className="space-y-4">
            {data.summaries.map((s) => (
                <Card key={s.question.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{s.question.title || "Untitled question"}</CardTitle>
                        <CardDescription>{s.totalAnswered} response(s)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(s.kind === "choice" || s.kind === "scale") && s.distribution && s.distribution.length > 0 && (
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={s.distribution.map((d) => ({
                                            name: d.label ?? (d.value !== undefined ? String(d.value) : d.optionId ?? ""),
                                            count: d.count,
                                        }))}
                                        layout="vertical"
                                        margin={{ left: 16, right: 16 }}
                                    >
                                        <XAxis type="number" allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count">
                                            {s.distribution.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {s.kind === "scale" && s.average != null && (
                                    <p className="text-sm text-muted-foreground mt-2">Average: {s.average.toFixed(2)}</p>
                                )}
                            </div>
                        )}

                        {s.kind === "text" && (
                            <ul className="space-y-1 text-sm">
                                {(s.samples || []).map((sample, i) => (
                                    <li key={i} className="rounded border bg-muted/30 px-3 py-1.5">{sample}</li>
                                ))}
                                {!s.samples?.length && <li className="text-muted-foreground">No answers yet.</li>}
                            </ul>
                        )}

                        {s.kind === "file" && (
                            <p className="text-sm text-muted-foreground">{s.totalAnswered} file(s) uploaded.</p>
                        )}

                        {(s.kind === "choice") && !s.distribution?.length && (
                            <p className="text-sm text-muted-foreground">No answers yet.</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
