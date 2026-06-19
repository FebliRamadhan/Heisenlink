"use client"

export interface StepItem {
    label: string
    sub?: string
    status: "done" | "active" | "todo" | "disabled"
}

interface FormSidebarProps {
    steps: StepItem[]
    overallPct: number
    onJump: (index: number) => void
    savedAt: number | null
    onReset: () => void
}

function CheckIcon() {
    return (
        <svg className="f-ck" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ opacity: 1, transform: "none", width: 14, height: 14 }}>
            <path d="M3 8.4l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

/** Sticky sidebar stepper for the public form wizard (design/ handoff). */
export function FormSidebar({ steps, overallPct, onJump, savedAt, onReset }: FormSidebarProps) {
    return (
        <aside className="f-side">
            <div className="f-side-card">
                <div className="f-side-head">
                    <span className="f-ttl">Progres</span>
                    <span className="f-pct">{Math.round(overallPct)}%</span>
                </div>
                {steps.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        className={"f-step" + (s.status === "active" ? " active" : s.status === "done" ? " done" : "")}
                        disabled={s.status === "disabled"}
                        onClick={() => onJump(i)}
                    >
                        <span className="f-num" aria-hidden="true">
                            {s.status === "done" ? <CheckIcon /> : String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="f-meta">
                            <span className="f-lbl">{s.label}</span>
                            {s.sub && <span className="f-sub">{s.sub}</span>}
                        </span>
                    </button>
                ))}
                <div className="f-side-foot">
                    <span className="f-save-dot" aria-hidden="true" />
                    {savedAt ? "Tersimpan otomatis" : "Jawaban tersimpan di perangkat"}
                </div>
            </div>
            <button type="button" className="f-reset" onClick={onReset}>Mulai ulang formulir</button>
        </aside>
    )
}
