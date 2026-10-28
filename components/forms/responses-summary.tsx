"use client"

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

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0)

export function ResponsesSummary({ data }: { data: SummaryData }) {
    if (!data.summaries.length) {
        return <p className="text-muted-foreground">No questions to summarize.</p>
    }

    return (
        <ol className="space-y-4">
            {data.summaries.map((s, qi) => {
                const rows = (s.distribution || []).map((d) => ({
                    name: d.label ?? (d.value !== undefined ? String(d.value) : d.optionId ?? ""),
                    count: d.count,
                }))
                return (
                    <li key={s.question.id} className="rounded-lg border bg-card p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h3 className="font-medium">
                                <span className="mr-2 tabular-nums text-muted-foreground">{qi + 1}.</span>
                                {s.question.title || "Untitled question"}
                            </h3>
                            <p className="text-sm tabular-nums text-muted-foreground">{s.totalAnswered} response(s)</p>
                        </div>

                        {(s.kind === "choice" || s.kind === "scale") && rows.length > 0 && (
                            <>
                                <ul className="mt-4 space-y-2">
                                    {rows.map((r, i) => (
                                        <li key={i} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3rem_3rem] items-center gap-3 text-sm">
                                            <span className="truncate" title={r.name}>{r.name}</span>
                                            <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                                <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${pct(r.count, s.totalAnswered)}%` }} />
                                            </span>
                                            <span className="text-right tabular-nums">{r.count}</span>
                                            <span className="text-right tabular-nums text-muted-foreground">{pct(r.count, s.totalAnswered)}%</span>
                                        </li>
                                    ))}
                                </ul>
                                {s.kind === "scale" && s.average != null && (
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Average <span className="font-medium tabular-nums text-foreground">{s.average.toFixed(2)}</span>
                                    </p>
                                )}
                            </>
                        )}

                        {s.kind === "text" && (
                            <ul className="mt-3 divide-y text-sm">
                                {(s.samples || []).map((sample, i) => (
                                    <li key={i} className="py-2">{sample}</li>
                                ))}
                                {!s.samples?.length && <li className="py-2 text-muted-foreground">No answers yet.</li>}
                            </ul>
                        )}

                        {s.kind === "file" && (
                            <p className="mt-3 text-sm text-muted-foreground">{s.totalAnswered} file(s) uploaded.</p>
                        )}

                        {(s.kind === "choice" || s.kind === "scale") && !rows.length && (
                            <p className="mt-3 text-sm text-muted-foreground">No answers yet.</p>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
