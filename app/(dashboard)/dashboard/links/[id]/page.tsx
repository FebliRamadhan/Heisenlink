"use client"

import { LinkForm } from "@/components/links/link-form"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function EditLinkPage({ params }: { params: { id: string } }) {
    const { data: link, isLoading } = useQuery({
        queryKey: ["link", params.id],
        queryFn: async () => {
            const res = await api.get(`/links/${params.id}`)
            return res.data.data
        },
    })

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" />
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Edit Link</h1>
            </div>
            <div className="grid gap-4 max-w-2xl">
                <div className="rounded-lg border bg-card p-6 text-card-foreground">
                    <LinkForm initialData={
                        link ? {
                            id: link.id,
                            url: link.destinationUrl,
                            alias: link.code,
                            title: link.title || "",
                            password: "", // Don't show existing password
                            isActive: link.isActive,
                            expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : undefined
                        } : undefined
                    } />
                </div>
            </div>
        </div>
    )
}
