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
        <main className="min-h-screen bg-primary/5 px-4 py-8">
            <div className="mx-auto max-w-2xl">
                {isClosed ? (
                    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <div className="h-2.5 bg-primary" aria-hidden="true" />
                        <div className="p-8 text-center">
                            <h1 className="mb-2 text-2xl font-semibold">{form.title}</h1>
                            <p className="text-muted-foreground">
                                {form.closedMessage || "This form is no longer accepting responses."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <FormRenderer form={form} />
                )}
            </div>
        </main>
    )
}
