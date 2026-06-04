"use client"

import { useEffect, useRef, useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { loadDraft, saveDraft, clearDraft, newIdempotencyKey } from "@/lib/form-draft"

interface UseFormAutosaveArgs {
    slug: string
    formVersion?: string
}

interface AutosaveState {
    answers: Record<string, unknown>
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
    page: number
    setPage: React.Dispatch<React.SetStateAction<number>>
    idempotencyKey: string
    /** true once the initial draft (if any) has been restored */
    restored: boolean
    hadDraft: boolean
    savedAt: number | null
    clear: () => void
}

/**
 * Persists in-progress answers + page + a stable idempotencyKey to localStorage
 * (debounced) so a respondent never loses progress on reload, and retries reuse
 * the same key so the server dedups duplicate submits.
 */
export function useFormAutosave({ slug, formVersion }: UseFormAutosaveArgs): AutosaveState {
    const [answers, setAnswers] = useState<Record<string, unknown>>({})
    const [page, setPage] = useState(0)
    const [restored, setRestored] = useState(false)
    const [hadDraft, setHadDraft] = useState(false)
    const [savedAt, setSavedAt] = useState<number | null>(null)
    const keyRef = useRef<string>("")

    // Restore once on mount.
    useEffect(() => {
        const draft = loadDraft(slug, formVersion)
        if (draft) {
            setAnswers(draft.answers || {})
            setPage(draft.page || 0)
            keyRef.current = draft.idempotencyKey
            setHadDraft(Object.keys(draft.answers || {}).length > 0)
        } else {
            keyRef.current = newIdempotencyKey()
        }
        setRestored(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const debouncedAnswers = useDebounce(answers, 500)

    // Persist when answers/page change (after restore).
    useEffect(() => {
        if (!restored || !keyRef.current) return
        saveDraft(slug, { answers: debouncedAnswers, idempotencyKey: keyRef.current, page, formVersion })
        setSavedAt(Date.now())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedAnswers, page, restored])

    const clear = () => {
        clearDraft(slug)
        keyRef.current = newIdempotencyKey()
        setSavedAt(null)
    }

    return {
        answers,
        setAnswers,
        page,
        setPage,
        idempotencyKey: keyRef.current,
        restored,
        hadDraft,
        savedAt,
        clear,
    }
}
