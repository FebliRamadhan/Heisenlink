"use client"

import type { FormQuestion, UploadedFileRef } from "@/types"

/* Tiny inline icons ported from design/components.jsx */
function CheckIcon() {
    return (
        <svg className="f-ck" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.4l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function ChevronIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function AlertIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 4.8v4M8 11.1v.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

interface FormFieldProps {
    question: FormQuestion
    value?: unknown
    onChange: (value: unknown) => void
    error?: string
    disabled?: boolean
    idPrefix?: string
    children?: React.ReactNode
}

/**
 * Public-form field renderer in the design/ visual language (choice-cards,
 * .f-tin inputs, char counters). Separate from components/forms/question-field.tsx
 * so the dashboard preview keeps its plain shadcn look. SECTION is NOT handled
 * here — the renderer promotes it to the card head.
 */
export function FormField({ question, value, onChange, error, disabled, idPrefix = "q", children }: FormFieldProps) {
    const id = `${idPrefix}-${question.id}`

    if (question.type === "STATEMENT") {
        return (
            <div className="f-field">
                {question.title && <p className="f-label">{question.title}</p>}
                {question.description && <p className="f-hint">{question.description}</p>}
            </div>
        )
    }

    if (question.type === "IMAGE") {
        const src = question.config?.imageUrl
        return (
            <div className="f-field">
                {question.title && <p className="f-label" style={{ marginBottom: 10 }}>{question.title}</p>}
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={question.config?.alt || question.title || "Image"} style={{ maxWidth: "100%", borderRadius: "var(--f-radius-sm)", border: "1px solid var(--f-border)" }} />
                ) : null}
            </div>
        )
    }

    const options = question.options || []
    const bad = !!error
    const tinClass = "f-tin" + (bad ? " bad" : "")

    return (
        <div className="f-field" data-fid={question.id}>
            <label htmlFor={id} className="f-label">
                {question.title || "Untitled question"}
                {question.isRequired && <span className="f-req" title="Required">*</span>}
            </label>
            {question.description && <p className="f-hint">{question.description}</p>}

            <div className="f-control">
                {question.type === "SHORT_TEXT" && (
                    <input id={id} className={tinClass} type="text" value={(value as string) || ""} disabled={disabled}
                        maxLength={question.config?.maxLength || 255} onChange={(e) => onChange(e.target.value)} />
                )}

                {question.type === "LONG_TEXT" && (
                    <>
                        <textarea id={id} className={tinClass} value={(value as string) || ""} disabled={disabled}
                            maxLength={question.config?.maxLength || undefined} onChange={(e) => onChange(e.target.value)} />
                        {question.config?.maxLength ? (
                            <div className="f-counter">{((value as string) || "").length} / {question.config.maxLength}</div>
                        ) : null}
                    </>
                )}

                {question.type === "MULTIPLE_CHOICE" && (
                    <div className={"f-choices" + (options.length > 4 ? " cols" : "")} role="radiogroup" aria-labelledby={id}>
                        {options.map((opt) => {
                            const sel = value === opt.id
                            return (
                                <label key={opt.id} className={"f-choice" + (sel ? " sel" : "")}>
                                    <input type="radio" name={id} checked={sel} disabled={disabled} onChange={() => onChange(opt.id)}
                                        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                                    <span className="f-mark radio"><span className="f-dotin" /></span>
                                    <span className="f-ctext">{opt.label}</span>
                                </label>
                            )
                        })}
                    </div>
                )}

                {question.type === "CHECKBOXES" && (
                    <div className={"f-choices" + (options.length > 4 ? " cols" : "")}>
                        {options.map((opt) => {
                            const arr = Array.isArray(value) ? (value as string[]) : []
                            const sel = arr.includes(opt.id)
                            return (
                                <label key={opt.id} className={"f-choice" + (sel ? " sel" : "")}>
                                    <input type="checkbox" checked={sel} disabled={disabled}
                                        onChange={() => onChange(sel ? arr.filter((x) => x !== opt.id) : [...arr, opt.id])}
                                        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                                    <span className="f-mark box"><CheckIcon /></span>
                                    <span className="f-ctext">{opt.label}</span>
                                </label>
                            )
                        })}
                    </div>
                )}

                {question.type === "DROPDOWN" && (
                    <div className="f-sel-wrap">
                        <select id={id} className={tinClass} value={(value as string) || ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
                            <option value="" disabled>Pilih…</option>
                            {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                        <span className="f-chev"><ChevronIcon /></span>
                    </div>
                )}

                {question.type === "LINEAR_SCALE" && (
                    <ScaleField id={id} question={question} value={value as number} onChange={onChange} disabled={disabled} />
                )}

                {question.type === "DATE" && (
                    <input id={id} className={tinClass} type="date" value={(value as string) || ""} disabled={disabled}
                        onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 220 }} />
                )}

                {question.type === "TIME" && (
                    <input id={id} className={tinClass} type="time" value={(value as string) || ""} disabled={disabled}
                        onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 220 }} />
                )}

                {question.type === "FILE_UPLOAD" && (
                    <input id={id} className={tinClass} type="file" disabled={disabled}
                        multiple={(question.config?.maxFiles ?? 1) > 1}
                        accept={question.config?.accept?.join(",")}
                        onChange={(e) => onChange(e.target.files)} style={{ maxWidth: 420, padding: "10px 14px" }} />
                )}

                {children}
            </div>

            {bad && <div className="f-err"><AlertIcon />{error}</div>}
        </div>
    )
}

function ScaleField({ id, question, value, onChange, disabled }: {
    id: string
    question: FormQuestion
    value: number
    onChange: (v: number) => void
    disabled?: boolean
}) {
    const min = question.config?.min ?? 1
    const max = question.config?.max ?? 5
    const points: number[] = []
    for (let i = min; i <= max; i += 1) points.push(i)
    return (
        <div id={id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {question.config?.minLabel && <span className="f-csub" style={{ marginTop: 0 }}>{question.config.minLabel}</span>}
            <div className="f-choices" style={{ display: "flex", gap: 8 }}>
                {points.map((p) => {
                    const sel = value === p
                    return (
                        <label key={p} className={"f-choice" + (sel ? " sel" : "")} style={{ padding: "10px 0", width: 46, justifyContent: "center" }}>
                            <input type="radio" name={id} checked={sel} disabled={disabled} onChange={() => onChange(p)}
                                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                            <span className="f-ctext">{p}</span>
                        </label>
                    )
                })}
            </div>
            {question.config?.maxLabel && <span className="f-csub" style={{ marginTop: 0 }}>{question.config.maxLabel}</span>}
        </div>
    )
}
