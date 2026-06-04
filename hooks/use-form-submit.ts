"use client"

import { useState } from "react"
import type { FormAnswerInput } from "@/types"

interface SubmitArgs {
    slug: string
    idempotencyKey: string
    answers: FormAnswerInput[]
    respondentEmail?: string | null
    website?: string // honeypot
}

interface SubmitResult {
    ok: boolean
    status?: number
    error?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const BACKOFF_MS = [2000, 4000, 8000, 16000]

/**
 * Submits a public form response with retry/backoff on network/5xx errors.
 * The same idempotencyKey is sent on every attempt so the server dedups —
 * a retry after a flaky network never creates a duplicate response.
 */
export function useFormSubmit(apiBase = "/api") {
    const [submitting, setSubmitting] = useState(false)
    const [attempt, setAttempt] = useState(0)

    const submit = async ({ slug, idempotencyKey, answers, respondentEmail, website }: SubmitArgs): Promise<SubmitResult> => {
        setSubmitting(true)
        const body = JSON.stringify({ idempotencyKey, answers, respondentEmail, website })

        try {
            for (let i = 0; i <= BACKOFF_MS.length; i += 1) {
                setAttempt(i + 1)
                try {
                    const res = await fetch(`${apiBase}/forms/public/${slug}/submit`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body,
                    })

                    if (res.ok) return { ok: true, status: res.status }

                    // Client errors (4xx) are terminal — don't retry.
                    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                        const data = await res.json().catch(() => null)
                        return { ok: false, status: res.status, error: data?.error?.message || "Submission rejected" }
                    }

                    // 429 / 5xx: retry with backoff if attempts remain.
                    if (i < BACKOFF_MS.length) {
                        await sleep(BACKOFF_MS[i])
                        continue
                    }
                    const data = await res.json().catch(() => null)
                    return { ok: false, status: res.status, error: data?.error?.message || "Server error, please try again later" }
                } catch (networkErr) {
                    // Network failure: retry with backoff.
                    if (i < BACKOFF_MS.length) {
                        await sleep(BACKOFF_MS[i])
                        continue
                    }
                    return { ok: false, error: "Network error — please check your connection and try again" }
                }
            }
            return { ok: false, error: "Submission failed" }
        } finally {
            setSubmitting(false)
            setAttempt(0)
        }
    }

    return { submit, submitting, attempt }
}
