"use client"

import { FormField } from "@/components/public/form-field"
import type { Form, FormQuestion } from "@/types"

// Split questions into section pages — same rule as the public renderer.
function paginate(questions: FormQuestion[]): FormQuestion[][] {
    if (!questions.length) return []
    const hasSection = questions.some((q) => q.type === "SECTION")
    if (!hasSection) return [questions]
    const pages: FormQuestion[][] = []
    let current: FormQuestion[] = []
    questions.forEach((q) => {
        if (q.type === "SECTION" && current.length) {
            pages.push(current)
            current = []
        }
        current.push(q)
    })
    if (current.length) pages.push(current)
    return pages
}


/**
 * Read-only preview of the form as a respondent sees it, in the public form
 * design language (choice-cards, one card per section).
 * One themed card per section. Inputs are inert.
 */
export function FormPreview({ form }: { form: Form }) {
    const questions = form.questions || []
    const pages = paginate(questions)


    return (
        <div className="form-theme form-app-bg" style={{ borderRadius: 20, padding: "26px 22px 36px" }}>
            <header style={{ marginBottom: 22 }}>
                <h1 className="f-h1">{form.title}</h1>
                {form.description && <p className="f-lede">{form.description}</p>}
            </header>

            {questions.length === 0 && (
                <div className="f-card" style={{ padding: 32, textAlign: "center", color: "var(--f-ink-3)" }}>
                    Tambahkan pertanyaan untuk melihat pratinjaunya di sini.
                </div>
            )}

            {pages.map((page, pi) => {
                const section = page.find((q) => q.type === "SECTION")
                const label = section?.title || (pages.length > 1 ? `Bagian ${pi + 1}` : form.title)
                const body = page.filter((q) => q.type !== "SECTION")
                const showHead = pages.length > 1 || !!section
                return (
                    <div key={pi} className="f-card" style={{ marginTop: 16 }}>
                        {showHead && (
                            <div className="f-card-head">
                                <h2>{label}</h2>
                                {pages.length > 1 && <p className="f-count">Bagian {pi + 1} dari {pages.length}</p>}
                                {section?.description && <p className="f-desc">{section.description}</p>}
                            </div>
                        )}
                        <div className="f-card-body" style={{ pointerEvents: "none" }}>
                            {body.map((q) => (
                                <FormField key={q.id} question={q} value={undefined} onChange={() => {}} disabled idPrefix="preview" />
                            ))}
                        </div>
                    </div>
                )
            })}

            <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--f-ink-3)", margin: "20px 0 0" }}>
                * menandai pertanyaan wajib · Powered by Heisenlink
            </p>
        </div>
    )
}
