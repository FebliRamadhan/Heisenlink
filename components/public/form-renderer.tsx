"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { QuestionCard } from "@/components/forms/question-card"
import { useFormAutosave } from "@/hooks/use-form-autosave"
import { useFormSubmit } from "@/hooks/use-form-submit"
import { CheckCircle2, Loader2 } from "lucide-react"
import type { PublicForm, FormQuestion, FormAnswerInput, UploadedFileRef } from "@/types"

// Split questions into wizard pages on SECTION boundaries.
function paginate(questions: FormQuestion[]): FormQuestion[][] {
    if (!questions.length) return [[]]
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

const isEmpty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0)

export function FormRenderer({ form }: { form: PublicForm }) {
    const pages = useMemo(() => paginate(form.questions), [form.questions])
    const autosave = useFormAutosave({ slug: form.slug })
    const { answers, setAnswers, page, setPage, idempotencyKey, restored, hadDraft, savedAt, clear } = autosave
    const { submit, submitting, attempt } = useFormSubmit()

    const [email, setEmail] = useState("")
    const [website, setWebsite] = useState("") // honeypot
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [uploading, setUploading] = useState<Record<string, boolean>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    if (!restored) {
        return <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading…</div>
    }

    if (done) {
        return (
            <Card>
                <CardContent className="p-10 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <h1 className="text-2xl font-semibold">Thank you!</h1>
                    <p className="text-muted-foreground">
                        {form.confirmationMessage || "Your response has been recorded."}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const currentQuestions = pages[page] || []
    const isLastPage = page === pages.length - 1

    const setAnswer = (q: FormQuestion, value: unknown) => {
        if (q.type === "FILE_UPLOAD" && value instanceof FileList) {
            void handleUpload(q, value)
            return
        }
        setAnswers((prev) => ({ ...prev, [q.id]: value }))
        if (errors[q.id]) setErrors((e) => ({ ...e, [q.id]: "" }))
    }

    const handleUpload = async (q: FormQuestion, files: FileList) => {
        setUploading((u) => ({ ...u, [q.id]: true }))
        try {
            const refs: UploadedFileRef[] = []
            for (const file of Array.from(files)) {
                const fd = new FormData()
                fd.append("file", file)
                const res = await fetch(`/api/forms/public/${form.slug}/upload`, { method: "POST", body: fd })
                if (!res.ok) throw new Error("upload failed")
                const data = await res.json()
                refs.push(data.data as UploadedFileRef)
            }
            setAnswers((prev) => ({ ...prev, [q.id]: refs }))
            setErrors((e) => ({ ...e, [q.id]: "" }))
        } catch {
            setErrors((e) => ({ ...e, [q.id]: "Upload failed — please try again" }))
        } finally {
            setUploading((u) => ({ ...u, [q.id]: false }))
        }
    }

    const validatePage = (): boolean => {
        const next: Record<string, string> = {}
        currentQuestions.forEach((q) => {
            if (q.type === "SECTION" || q.type === "STATEMENT") return
            if (q.isRequired && isEmpty(answers[q.id])) {
                next[q.id] = "This question is required"
            }
        })
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const goNext = () => {
        if (!validatePage()) return
        setPage((p) => Math.min(p + 1, pages.length - 1))
    }
    const goBack = () => setPage((p) => Math.max(p - 1, 0))

    const onSubmit = async () => {
        if (!validatePage()) return
        if (form.collectEmail && isEmpty(email)) {
            setSubmitError("Please provide your email address.")
            return
        }
        setSubmitError(null)

        const payload: FormAnswerInput[] = Object.entries(answers)
            .filter(([, v]) => !isEmpty(v))
            .map(([questionId, value]) => {
                const q = form.questions.find((x) => x.id === questionId)
                if (q?.type === "FILE_UPLOAD" && Array.isArray(value)) {
                    return { questionId, value }
                }
                return { questionId, value }
            })

        const result = await submit({
            slug: form.slug,
            idempotencyKey,
            answers: payload,
            respondentEmail: form.collectEmail ? email : undefined,
            website,
        })

        if (result.ok) {
            clear() // only clear the draft after the server confirms success
            setDone(true)
        } else {
            // Keep the draft intact so the respondent can retry without losing answers.
            setSubmitError(result.error || "Submission failed. Your answers are saved — please try again.")
        }
    }

    const hasFiles = (q: FormQuestion) => Array.isArray(answers[q.id]) && (answers[q.id] as UploadedFileRef[]).length > 0

    return (
        <div className="space-y-3">
            {/* Restore notice */}
            {hadDraft && (
                <div className="rounded-xl border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
                    We restored your previous answers.
                </div>
            )}

            {/* Header card with coloured accent bar */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="h-2.5 bg-primary" aria-hidden="true" />
                <div className="space-y-3 p-6 sm:p-8">
                    <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{form.title}</h1>
                    {form.description && page === 0 && (
                        <p className="whitespace-pre-line text-muted-foreground">{form.description}</p>
                    )}
                    <div className="border-t pt-3 text-sm text-destructive">* Indicates required question</div>
                    {form.collectEmail && page === 0 && (
                        <div className="space-y-2 pt-1">
                            <Label htmlFor="respondent-email">Email <span className="text-destructive">*</span></Label>
                            <Input id="respondent-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-sm" />
                        </div>
                    )}
                </div>
            </div>

            {/* Wizard progress */}
            {pages.length > 1 && (
                <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${((page + 1) / pages.length) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Section {page + 1} of {pages.length}</p>
                </div>
            )}

            {/* One card per question (SECTION renders as a banner) */}
            {currentQuestions.map((q) => (
                <QuestionCard
                    key={q.id}
                    question={q}
                    value={answers[q.id]}
                    onChange={(v) => setAnswer(q, v)}
                    error={errors[q.id]}
                >
                    {q.type === "FILE_UPLOAD" && uploading[q.id] && (
                        <p className="mt-2 flex items-center text-xs text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading…</p>
                    )}
                    {q.type === "FILE_UPLOAD" && hasFiles(q) && (
                        <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
                            {(answers[q.id] as UploadedFileRef[]).map((f) => <li key={f.url}>{f.name}</li>)}
                        </ul>
                    )}
                </QuestionCard>
            ))}

            {/* Honeypot — hidden from humans */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
                <label>
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
            </div>

            {submitError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-sm">
                    {submitError}
                </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 py-1">
                <div className="flex gap-2">
                    {page > 0 && <Button variant="outline" onClick={goBack} disabled={submitting}>Back</Button>}
                    {!isLastPage ? (
                        <Button onClick={goNext}>Next</Button>
                    ) : (
                        <Button onClick={onSubmit} disabled={submitting}>
                            {submitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {attempt > 1 ? `Retrying (${attempt})…` : "Submitting…"}</>
                            ) : "Submit"}
                        </Button>
                    )}
                </div>
                <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                    {savedAt ? "Saved automatically" : ""}
                </span>
            </div>

            <p className="pb-6 text-center text-xs text-muted-foreground">Powered by Heisenlink</p>
        </div>
    )
}
