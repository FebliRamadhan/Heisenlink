// ===========================================
// Form Draft persistence (localStorage)
// ===========================================
//
// Saves an in-progress public submission so a respondent never loses answers
// on reload / accidental navigation. Also holds a stable idempotencyKey reused
// across retries so duplicate submits never create duplicate responses.

export interface FormDraft {
    answers: Record<string, unknown>;
    idempotencyKey: string;
    page: number;
    /** form.updatedAt at the time the draft was created — drop if it changed */
    formVersion?: string;
    savedAt: number;
}

const keyFor = (slug: string) => `form-draft:${slug}`;

const genKey = (): string => {
    try {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
    } catch {
        /* fall through */
    }
    return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const newIdempotencyKey = genKey;

export const loadDraft = (slug: string, formVersion?: string): FormDraft | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(keyFor(slug));
        if (!raw) return null;
        const draft = JSON.parse(raw) as FormDraft;
        // Invalidate the draft if the form structure changed since it was saved.
        if (formVersion && draft.formVersion && draft.formVersion !== formVersion) {
            clearDraft(slug);
            return null;
        }
        return draft;
    } catch {
        return null;
    }
};

export const saveDraft = (
    slug: string,
    data: { answers: Record<string, unknown>; idempotencyKey: string; page: number; formVersion?: string }
): void => {
    if (typeof window === 'undefined') return;
    try {
        const draft: FormDraft = { ...data, savedAt: Date.now() };
        window.localStorage.setItem(keyFor(slug), JSON.stringify(draft));
    } catch {
        /* quota / privacy mode — non-fatal */
    }
};

export const clearDraft = (slug: string): void => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(keyFor(slug));
    } catch {
        /* non-fatal */
    }
};
