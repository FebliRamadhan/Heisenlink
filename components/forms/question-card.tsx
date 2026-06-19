"use client"

import { QuestionField } from "./question-field"
import type { FormQuestion } from "@/types"

interface QuestionCardProps {
    question: FormQuestion
    value?: unknown
    onChange?: (value: unknown) => void
    disabled?: boolean
    error?: string
    idPrefix?: string
    children?: React.ReactNode
}

/**
 * Google-Forms-style wrapper: a SECTION renders as a full-width coloured banner
 * (+ optional description card), every other question sits in its own white
 * card. Shared by the public renderer and the dashboard preview so both stay
 * visually identical.
 */
export function QuestionCard({ question, value, onChange, disabled, error, idPrefix, children }: QuestionCardProps) {
    if (question.type === "SECTION") {
        return <QuestionField question={question} value={undefined} onChange={() => {}} idPrefix={idPrefix} />
    }

    return (
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
            <QuestionField
                question={question}
                value={value}
                onChange={onChange || (() => {})}
                disabled={disabled}
                error={error}
                idPrefix={idPrefix}
            />
            {children}
        </div>
    )
}
