import type { FormQuestion } from "@/types"

/** Server-side cap for form uploads (keep in sync with FORM_MAX_FILE_SIZE). */
export const FORM_MAX_UPLOAD_MB = 20

/** Effective per-file limit for a FILE_UPLOAD question, in MB. */
export const maxUploadMb = (q: FormQuestion): number =>
    Math.min(q.config?.maxSizeMb ?? FORM_MAX_UPLOAD_MB, FORM_MAX_UPLOAD_MB)
