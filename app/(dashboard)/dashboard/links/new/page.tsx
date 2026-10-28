"use client"

import { LinkForm } from "@/components/links/link-form"

export default function CreateLinkPage() {
    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Create Link</h1>
            </div>
            <div className="grid gap-4 max-w-2xl">
                <div className="rounded-lg border bg-card p-6 text-card-foreground">
                    <LinkForm />
                </div>
            </div>
        </div>
    )
}
