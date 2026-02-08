"use client"

import { LinkForm } from "@/components/links/link-form"

export default function CreateLinkPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Create Link</h2>
            </div>
            <div className="grid gap-4 max-w-2xl">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <LinkForm />
                </div>
            </div>
        </div>
    )
}
