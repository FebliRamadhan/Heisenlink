import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { FormRenderer } from "@/components/public/form-renderer"
import type { PublicForm } from "@/types"

// SSR must use internal URL (Docker network) to reach backend directly.
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function fetchForm(slug: string): Promise<PublicForm | null> {
    try {
        const res = await fetch(`${API_URL}/api/forms/public/${slug}`, {
            next: { revalidate: 60, tags: [`form:${slug}`] },
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.data as PublicForm
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const form = await fetchForm(params.slug)
    if (!form) return { title: "Form not found - Heisenlink" }
    return {
        title: `${form.title} - Heisenlink`,
        description: form.description || "Fill out this form",
        openGraph: { title: form.title, description: form.description || undefined, type: "website" },
    }
}

export default async function PublicFormPage({ params }: { params: { slug: string } }) {
    const form = await fetchForm(params.slug)
    if (!form) notFound()

    const isClosed =
        !form.acceptingResponses || (form.closesAt ? new Date(form.closesAt).getTime() < Date.now() : false)

    return (
        <main style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 28px 80px" }}>
            {isClosed ? (
                <div className="f-card" style={{ maxWidth: 640, margin: "40px auto" }}>
                    <div className="f-track"><div className="f-fill" style={{ width: "100%" }} /></div>
                    <div className="f-done" style={{ padding: "48px 40px" }}>
                        <h2>{form.title}</h2>
                        <p>{form.closedMessage || "Formulir ini sudah tidak menerima tanggapan."}</p>
                    </div>
                </div>
            ) : (
                <FormRenderer form={form} />
            )}
        </main>
    )
}
