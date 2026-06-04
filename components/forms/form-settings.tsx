"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import type { Form } from "@/types"

export function FormSettings({ form }: { form: Form }) {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [slug, setSlug] = useState(form.slug)
    const [description, setDescription] = useState(form.description || "")
    const [confirmation, setConfirmation] = useState(form.confirmationMessage || "")
    const [closed, setClosed] = useState(form.closedMessage || "")

    const debouncedSlug = useDebounce(slug.toLowerCase(), 400)
    const slugChanged = debouncedSlug && debouncedSlug !== form.slug

    const slugCheck = useQuery({
        queryKey: ["form-slug-check", debouncedSlug],
        queryFn: async () => {
            const res = await api.get("/forms/slug-check", { params: { slug: debouncedSlug, formId: form.id } })
            return res.data.data as { available: boolean; reason?: string }
        },
        enabled: !!slugChanged,
        staleTime: 30_000,
    })

    const mutation = useMutation({
        mutationFn: async (patch: Partial<Form>) => {
            await api.patch(`/forms/${form.id}`, patch)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form", form.id] }),
        onError: (e: any) =>
            toast({ variant: "destructive", title: "Failed to save", description: e.response?.data?.error?.message }),
    })

    const saveSlug = () => {
        if (slugChanged && slugCheck.data?.available) mutation.mutate({ slug: debouncedSlug })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>General</CardTitle>
                    <CardDescription>Public URL and description shown to respondents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="form-slug">Public URL</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">/f/</span>
                            <Input
                                id="form-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                onBlur={saveSlug}
                                className="max-w-xs"
                                autoComplete="off"
                            />
                        </div>
                        {slugChanged && (
                            <p className={`text-xs ${slugCheck.data?.available ? "text-emerald-600" : "text-destructive"}`}>
                                {slugCheck.isFetching
                                    ? "Checking…"
                                    : slugCheck.data?.available
                                        ? "Available"
                                        : `Unavailable (${slugCheck.data?.reason || "taken"})`}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="form-description">Description</Label>
                        <textarea
                            id="form-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={() => (description || "") !== (form.description || "") && mutation.mutate({ description: description || null })}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Tell respondents what this form is about"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Responses</CardTitle>
                    <CardDescription>Control who can respond and what you collect.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SettingRow
                        label="Accepting responses"
                        description="Turn off to stop new submissions."
                        checked={form.acceptingResponses}
                        onChange={(v) => mutation.mutate({ acceptingResponses: v })}
                    />
                    <SettingRow
                        label="Collect email"
                        description="Ask respondents for their email address."
                        checked={form.collectEmail}
                        onChange={(v) => mutation.mutate({ collectEmail: v })}
                    />
                    <SettingRow
                        label="One response per session"
                        description="Discourage repeat submissions from the same browser."
                        checked={form.oneResponsePerSession}
                        onChange={(v) => mutation.mutate({ oneResponsePerSession: v })}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>Shown after submitting or when the form is closed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm-msg">Confirmation message</Label>
                        <Input
                            id="confirm-msg"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            onBlur={() => mutation.mutate({ confirmationMessage: confirmation || null })}
                            placeholder="Thanks for your response!"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="closed-msg">Closed message</Label>
                        <Input
                            id="closed-msg"
                            value={closed}
                            onChange={(e) => setClosed(e.target.value)}
                            onBlur={() => mutation.mutate({ closedMessage: closed || null })}
                            placeholder="This form is no longer accepting responses."
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SettingRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label>{label}</Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    )
}
