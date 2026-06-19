import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { PasswordPrompt } from "@/components/public/password-prompt"

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export const metadata: Metadata = {
    title: "Link Diproteksi - Heisenlink",
    description: "Masukkan password untuk melanjutkan",
    robots: { index: false, follow: false },
}

export default async function PasswordProtectPage({ params }: { params: { slug: string } }) {
    const { slug } = params

    try {
        const res = await fetch(`${API_URL}/${encodeURIComponent(slug)}/resolve`, { cache: "no-store" })

        if (res.status === 200) {
            redirect(`/${slug}`)
        }
        if (res.status === 404) {
            redirect("/not-found")
        }
        if (res.status === 410) {
            try {
                const errorData = await res.json()
                if (errorData?.error?.code === "EXPIRED") {
                    redirect("/link-expired")
                }
            } catch { }
            redirect("/link-inactive")
        }
        if (res.status === 425) {
            redirect("/not-found")
        }
        if (res.status === 429) {
            redirect("/too-many-requests")
        }
        if (res.status !== 401) {
            redirect("/not-found")
        }
    } catch (e: any) {
        if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e
        redirect("/not-found")
    }

    return <PasswordPrompt slug={slug} />
}
