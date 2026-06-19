"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { FormField } from "@/components/public/form-field"
import { FormSidebar, type StepItem } from "@/components/public/form-sidebar"
import { FormReview } from "@/components/public/form-review"
import { useFormAutosave } from "@/hooks/use-form-autosave"
import { useFormSubmit } from "@/hooks/use-form-submit"
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

const DISPLAY = new Set(["SECTION", "STATEMENT", "IMAGE"])
const isAnswerable = (q: FormQuestion) => !DISPLAY.has(q.type)
const isEmpty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0)

const sectionOf = (page: FormQuestion[]) => page.find((q) => q.type === "SECTION")
const sectionLabel = (page: FormQuestion[], i: number) => sectionOf(page)?.title || `Bagian ${i + 1}`

function ArrowIcon({ dir = 1 }: { dir?: number }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ transform: dir < 0 ? "rotate(180deg)" : "none" }}>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function FormRenderer({ form }: { form: PublicForm }) {
    const pages = useMemo(() => paginate(form.questions), [form.questions])
    const reviewIndex = pages.length
    const totalSteps = pages.length + 1

    const autosave = useFormAutosave({ slug: form.slug })
    const { answers, setAnswers, page, setPage, idempotencyKey, restored, hadDraft, savedAt, clear } = autosave
    const { submit, submitting, attempt } = useFormSubmit()

    const [email, setEmail] = useState("")
    const [website, setWebsite] = useState("") // honeypot
    const [consent, setConsent] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [emailError, setEmailError] = useState<string>("")
    const [consentError, setConsentError] = useState<string>("")
    const [uploading, setUploading] = useState<Record<string, boolean>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const [refCode, setRefCode] = useState<string>("")

    const cardRef = useRef<HTMLDivElement>(null)

    // On step change: scroll the card into view and focus the first input.
    useEffect(() => {
        if (!restored) return
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        const t = setTimeout(() => {
            cardRef.current?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button.f-choice")?.focus?.()
        }, 360)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, restored])

    if (!restored) {
        return <div className="f-card" style={{ padding: 32, textAlign: "center", color: "var(--f-ink-3)" }}>Memuat…</div>
    }

    // ---- derived state ----
    const pageComplete = (pi: number) =>
        pages[pi].filter((q) => isAnswerable(q) && q.isRequired).every((q) => !isEmpty(answers[q.id]))
    const firstIncomplete = (() => {
        for (let i = 0; i < pages.length; i += 1) if (!pageComplete(i)) return i
        return pages.length
    })()
    const allComplete = firstIncomplete === pages.length
    const furthest = Math.max(firstIncomplete, page === reviewIndex ? pages.length - 1 : page)

    const requiredCounts = pages.map((p) => p.filter((q) => isAnswerable(q) && q.isRequired).length)
    const totalRequired = requiredCounts.reduce((a, b) => a + b, 0)
    const filledRequired = pages.reduce(
        (acc, p) => acc + p.filter((q) => isAnswerable(q) && q.isRequired && !isEmpty(answers[q.id])).length,
        0,
    )
    const overallPct = totalRequired === 0 ? (allComplete ? 100 : 0) : (filledRequired / totalRequired) * 100

    const steps: StepItem[] = pages.map((p, i) => {
        const count = p.filter(isAnswerable).length
        const status: StepItem["status"] =
            page === i ? "active" : pageComplete(i) ? "done" : i > furthest ? "disabled" : "todo"
        return { label: sectionLabel(p, i), sub: `${count} pertanyaan`, status }
    })
    steps.push({
        label: "Tinjau & Kirim",
        sub: "Ringkasan jawaban",
        status: page === reviewIndex ? "active" : allComplete ? "todo" : "disabled",
    })

    // ---- handlers ----
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
            setErrors((e) => ({ ...e, [q.id]: "Unggahan gagal — silakan coba lagi" }))
        } finally {
            setUploading((u) => ({ ...u, [q.id]: false }))
        }
    }

    const validatePage = (pi: number): boolean => {
        const next: Record<string, string> = {}
        pages[pi].forEach((q) => {
            if (!isAnswerable(q)) return
            if (q.isRequired && isEmpty(answers[q.id])) next[q.id] = "Pertanyaan ini wajib diisi."
        })
        setErrors(next)
        if (Object.keys(next).length) {
            setTimeout(() => cardRef.current?.querySelector<HTMLElement>(".f-err")
                ?.closest(".f-field")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60)
            return false
        }
        return true
    }

    const goNext = () => {
        if (!validatePage(page)) return
        setPage((p) => Math.min(p + 1, reviewIndex))
    }
    const goBack = () => setPage((p) => Math.max(p - 1, 0))
    const jumpTo = (i: number) => {
        if (i > furthest && !(i === reviewIndex && allComplete)) return
        setPage(i)
    }

    const resetAll = () => {
        clear()
        setAnswers({})
        setPage(0)
        setEmail("")
        setConsent(false)
        setErrors({})
        setEmailError("")
        setConsentError("")
        setSubmitError(null)
        setDone(false)
    }

    const onSubmit = async () => {
        let ok = true
        if (form.collectEmail && (isEmpty(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            setEmailError("Masukkan email yang valid."); ok = false
        } else setEmailError("")
        if (!consent) { setConsentError("Centang pernyataan ini untuk melanjutkan."); ok = false } else setConsentError("")
        if (!ok) return
        setSubmitError(null)

        const payload: FormAnswerInput[] = Object.entries(answers)
            .filter(([, v]) => !isEmpty(v))
            .map(([questionId, value]) => ({ questionId, value }))

        const result = await submit({
            slug: form.slug,
            idempotencyKey,
            answers: payload,
            respondentEmail: form.collectEmail ? email : undefined,
            website,
        })

        if (result.ok) {
            setRefCode(`REF-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`)
            clear()
            setDone(true)
        } else {
            setSubmitError(result.error || "Pengiriman gagal. Jawaban Anda tersimpan — silakan coba lagi.")
        }
    }

    const hasFiles = (q: FormQuestion) => Array.isArray(answers[q.id]) && (answers[q.id] as UploadedFileRef[]).length > 0

    // ---- success ----
    if (done) {
        return (
            <div className="f-card f-fade">
                <div className="f-done">
                    <div className="f-done-badge" aria-hidden="true">
                        <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8.4l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2>Formulir berhasil dikirim</h2>
                    <p>{form.confirmationMessage || "Terima kasih, jawaban Anda telah kami terima."}</p>
                    <div className="f-done-code">Kode referensi <b>{refCode}</b></div>
                    <div className="f-done-actions">
                        <button type="button" className="f-btn f-btn-ghost" onClick={() => window.print()}>Simpan / Cetak</button>
                        <button type="button" className="f-btn f-btn-primary" onClick={resetAll}>Isi Formulir Baru</button>
                    </div>
                </div>
            </div>
        )
    }

    const onReview = page === reviewIndex
    const currentQuestions = onReview ? [] : pages[page]
    const section = onReview ? null : sectionOf(currentQuestions)
    const isLastContent = page === pages.length - 1

    return (
        <>
            {/* Masthead */}
            <header style={{ marginBottom: 28 }}>
                <span className="f-eyebrow"><span className="f-dot" aria-hidden="true" /> Formulir</span>
                <h1 className="f-h1">{form.title}</h1>
                {form.description && <p className="f-lede">{form.description}</p>}
            </header>

            {hadDraft && (
                <div className="f-side-card" style={{ padding: "10px 14px", marginBottom: 12, fontSize: 13.5, color: "var(--f-ink-2)" }}>
                    Kami memulihkan jawaban Anda sebelumnya.
                </div>
            )}

            <div className="f-layout">
                <FormSidebar steps={steps} overallPct={overallPct} onJump={jumpTo} savedAt={savedAt} onReset={resetAll} />

                <div className="content" style={{ minWidth: 0 }}>
                    {/* Mobile progress bar */}
                    <div className="f-mobile-bar">
                        <div className="f-mb-top">
                            <span className="f-mb-step">{onReview ? "Tinjau & Kirim" : sectionLabel(currentQuestions, page)}</span>
                            <span className="f-mb-pct">{Math.round(overallPct)}%</span>
                        </div>
                        <div className="f-mb-track"><div className="f-mb-fill" style={{ width: `${((page + 1) / totalSteps) * 100}%` }} /></div>
                    </div>

                    <div className="f-card" ref={cardRef}>
                        <div className="f-track"><div className="f-fill" style={{ width: `${((page + 1) / totalSteps) * 100}%` }} /></div>

                        {onReview ? (
                            <>
                                <div className="f-card-head">
                                    <div className="f-kicker"><span className="f-ix">★</span> Langkah akhir</div>
                                    <h2>Periksa kembali jawaban Anda</h2>
                                    <p className="f-desc">Pastikan semua informasi sudah benar sebelum mengirim.</p>
                                </div>
                                <FormReview
                                    pages={pages}
                                    answers={answers}
                                    onEdit={(pi) => setPage(pi)}
                                    collectEmail={form.collectEmail}
                                    email={email}
                                    onEmailChange={(v) => { setEmail(v); if (emailError) setEmailError("") }}
                                    emailError={emailError}
                                    consent={consent}
                                    onConsentChange={(v) => { setConsent(v); if (consentError) setConsentError("") }}
                                    consentError={consentError}
                                />
                            </>
                        ) : (
                            <>
                                <div className="f-card-head">
                                    <div className="f-kicker">
                                        <span className="f-ix">{String(page + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</span> · Bagian
                                    </div>
                                    <h2>{sectionLabel(currentQuestions, page)}</h2>
                                    {section?.description && <p className="f-desc">{section.description}</p>}
                                </div>
                                <div className="f-card-body f-fade" key={page}>
                                    {currentQuestions.filter((q) => q.type !== "SECTION").map((q) => (
                                        <FormField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q, v)} error={errors[q.id]}>
                                            {q.type === "FILE_UPLOAD" && uploading[q.id] && (
                                                <p style={{ marginTop: 8, fontSize: 12.5, color: "var(--f-ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Mengunggah…
                                                </p>
                                            )}
                                            {q.type === "FILE_UPLOAD" && hasFiles(q) && (
                                                <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: 12.5, color: "var(--f-ink-3)", listStyle: "disc" }}>
                                                    {(answers[q.id] as UploadedFileRef[]).map((f) => <li key={f.url}>{f.name}</li>)}
                                                </ul>
                                            )}
                                        </FormField>
                                    ))}
                                </div>
                            </>
                        )}

                        {submitError && (
                            <div className="f-err" style={{ margin: "0 36px 16px", padding: "10px 14px", border: "1px solid var(--f-bad)", borderRadius: "var(--f-radius-sm)", background: "var(--f-bad-tint)" }}>
                                {submitError}
                            </div>
                        )}

                        {/* Footer nav */}
                        <div className="f-nav">
                            <span className="f-left">
                                {onReview ? "Periksa lalu kirim" : `${requiredCounts[page]} pertanyaan wajib di bagian ini`}
                            </span>
                            <span className="f-right">
                                {page > 0 && (
                                    <button type="button" className="f-btn f-btn-ghost" onClick={goBack} disabled={submitting}>
                                        <ArrowIcon dir={-1} /> Kembali
                                    </button>
                                )}
                                {onReview ? (
                                    <button type="button" className="f-btn f-btn-primary" onClick={onSubmit} disabled={submitting}>
                                        {submitting ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> {attempt > 1 ? `Mencoba lagi (${attempt})…` : "Mengirim…"}</>
                                        ) : (<>Kirim Formulir <ArrowIcon /></>)}
                                    </button>
                                ) : (
                                    <button type="button" className="f-btn f-btn-primary" onClick={goNext}>
                                        {isLastContent ? "Tinjau" : "Lanjut"} <ArrowIcon />
                                    </button>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Honeypot — hidden from humans */}
                    <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: "auto", height: 0, width: 0, overflow: "hidden" }}>
                        <label>Website
                            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                        </label>
                    </div>

                    <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--f-ink-3)", margin: "20px 0 0" }}>Powered by Heisenlink</p>
                </div>
            </div>
        </>
    )
}
