"use client"

import { QuestionCard } from "./question-card"
import type { Form } from "@/types"

/**
 * Read-only preview of the form as a respondent sees it (Google-Forms-style:
 * accent-bar header, coloured section banners, one card per question). Inputs
 * are disabled. Mirrors components/public/form-renderer.tsx.
 */
export function FormPreview({ form }: { form: Form }) {
    const questions = form.questions || []
    return (
        <div className="mx-auto max-w-2xl space-y-3 rounded-2xl bg-primary/5 p-4 sm:p-6">
            {/* Header card */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-2.5 bg-primary" aria-hidden="true" />
                <div className="space-y-3 p-6 sm:p-8">
                    <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{form.title}</h1>
                    {form.description && <p className="whitespace-pre-line text-muted-foreground">{form.description}</p>}
                    <div className="border-t pt-3 text-sm text-destructive">* Indicates required question</div>
                </div>
            </div>

            {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                    Add questions to see them previewed here.
                </div>
            )}

            {questions.map((q) => (
                <QuestionCard key={q.id} question={q} value={undefined} onChange={() => {}} disabled idPrefix="preview" />
            ))}
        </div>
    )
}
