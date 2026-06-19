"use client"

import type { FormQuestion, UploadedFileRef } from "@/types"

const ANSWERABLE_SKIP = new Set(["SECTION", "STATEMENT", "IMAGE"])

function PencilIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11.2 2.6l2.2 2.2-7.4 7.4-2.8.6.6-2.8 7.4-7.4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    )
}

const isEmpty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0)

function sectionLabel(page: FormQuestion[], index: number): string {
    const sec = page.find((q) => q.type === "SECTION")
    return sec?.title || `Bagian ${index + 1}`
}

/** Renders one question's answer as review markup (chips / text / "Belum diisi"). */
function AnswerValue({ q, value }: { q: FormQuestion; value: unknown }) {
    if (isEmpty(value)) return <span className="f-rv empty">Belum diisi</span>

    if (q.type === "CHECKBOXES" && Array.isArray(value)) {
        const labels = (value as string[]).map((id) => q.options?.find((o) => o.id === id)?.label || id)
        return (
            <span className="f-chips">
                {labels.map((l, i) => <span key={i} className="f-chip">{l}</span>)}
            </span>
        )
    }

    if ((q.type === "MULTIPLE_CHOICE" || q.type === "DROPDOWN") && typeof value === "string") {
        return <span className="f-rv">{q.options?.find((o) => o.id === value)?.label || value}</span>
    }

    if (q.type === "FILE_UPLOAD" && Array.isArray(value)) {
        return <span className="f-rv">{(value as UploadedFileRef[]).map((f) => f.name).join(", ")}</span>
    }

    return <span className="f-rv">{String(value)}</span>
}

interface FormReviewProps {
    pages: FormQuestion[][]
    answers: Record<string, unknown>
    onEdit: (pageIndex: number) => void
    collectEmail: boolean
    email: string
    onEmailChange: (v: string) => void
    emailError?: string
    consent: boolean
    onConsentChange: (v: boolean) => void
    consentError?: string
}

export function FormReview({
    pages, answers, onEdit, collectEmail, email, onEmailChange, emailError, consent, onConsentChange, consentError,
}: FormReviewProps) {
    return (
        <div className="f-card-body f-fade">
            {collectEmail && (
                <div className="f-field">
                    <label htmlFor="respondent-email" className="f-label">
                        Email<span className="f-req">*</span>
                    </label>
                    <div className="f-control">
                        <input id="respondent-email" type="email" className={"f-tin" + (emailError ? " bad" : "")}
                            value={email} onChange={(e) => onEmailChange(e.target.value)} style={{ maxWidth: 360 }} />
                    </div>
                    {emailError && <div className="f-err">{emailError}</div>}
                </div>
            )}

            {pages.map((page, pi) => (
                <div key={pi} className="f-rev-group">
                    <div className="f-rg-head">
                        <span className="f-rg-ttl">
                            <span className="f-rg-ix">{String(pi + 1).padStart(2, "0")}</span>
                            {sectionLabel(page, pi)}
                        </span>
                        <button type="button" className="f-edit-link" onClick={() => onEdit(pi)}>
                            <PencilIcon /> Ubah
                        </button>
                    </div>
                    <div className="f-rev-rows">
                        {page.filter((q) => !ANSWERABLE_SKIP.has(q.type)).map((q) => (
                            <div key={q.id} className="f-rev-row">
                                <span className="f-rk">{q.title || "—"}</span>
                                <AnswerValue q={q} value={answers[q.id]} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <label className={"f-consent" + (consent ? " sel" : "")}>
                <input type="checkbox" checked={consent} onChange={(e) => onConsentChange(e.target.checked)}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                <span className={"f-mark box" + (consent ? "" : "")} aria-hidden="true">
                    <svg className="f-ck" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.4l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <span className="f-ctext">
                    Saya menyatakan bahwa informasi yang diisi sudah benar dan dapat dipertanggungjawabkan.
                </span>
            </label>
            {consentError && <div className="f-err" style={{ paddingLeft: 2 }}>{consentError}</div>}
        </div>
    )
}
