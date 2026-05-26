"use server"

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export type VerifyResult =
    | { ok: true; destinationUrl: string }
    | { ok: false; code: "INVALID_PASSWORD" | "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "TOO_MANY_REQUESTS" | "NETWORK_ERROR"; message: string }

export async function verifyLinkPassword(slug: string, password: string): Promise<VerifyResult> {
    if (!slug || typeof password !== "string" || password.length === 0) {
        return { ok: false, code: "INVALID_PASSWORD", message: "Password wajib diisi." }
    }

    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(slug)}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
            cache: "no-store",
        })

        if (res.ok) {
            const data = await res.json()
            const destinationUrl = data?.data?.destinationUrl
            if (typeof destinationUrl !== "string") {
                return { ok: false, code: "NETWORK_ERROR", message: "Respons backend tidak valid." }
            }
            return { ok: true, destinationUrl }
        }

        if (res.status === 401) {
            return { ok: false, code: "INVALID_PASSWORD", message: "Password salah." }
        }
        if (res.status === 404) {
            return { ok: false, code: "NOT_FOUND", message: "Link tidak ditemukan." }
        }
        if (res.status === 410) {
            return { ok: false, code: "EXPIRED", message: "Link sudah tidak berlaku." }
        }
        if (res.status === 429) {
            return { ok: false, code: "TOO_MANY_REQUESTS", message: "Terlalu banyak percobaan. Coba lagi beberapa saat." }
        }
        return { ok: false, code: "NETWORK_ERROR", message: "Tidak dapat memverifikasi password saat ini." }
    } catch {
        return { ok: false, code: "NETWORK_ERROR", message: "Tidak dapat menghubungi server." }
    }
}
