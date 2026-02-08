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
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Edit Link</h2>
            </div>
            <div className="grid gap-4 max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
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
