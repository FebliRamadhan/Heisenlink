"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { BioLinkList } from "@/components/bio/bio-link-list"
import { BioPreview } from "@/components/bio/bio-preview"
import { ThemeSelector } from "@/components/bio/theme-selector"
import { SocialLinksEditor } from "@/components/bio/social-links-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Camera, Trash2, AlertTriangle, CheckCircle2, XCircle, Save, Cloud } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

const bioPageSchema = z.object({
    title: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/, "URL can only contain lowercase letters, numbers, hyphens, and underscores").optional(),
    theme: z.string().optional(),
    isPublished: z.boolean().optional(),
})

const VALID_TABS = ["content", "links", "appearance", "settings"] as const
type TabKey = (typeof VALID_TABS)[number]

interface SaveState {
    isSaving: boolean
    lastSavedAt: number | null
    errorAt: number | null
}

const initialSaveState: SaveState = { isSaving: false, lastSavedAt: null, errorAt: null }

export default function BioPage() {
    const { data: bioPage, isLoading } = useQuery({
        queryKey: ["bio"],
        queryFn: async () => {
            const res = await api.get("/bio")
            return res.data.data
        },
    })

    const { data: systemInfo } = useQuery({
        queryKey: ["system-info"],
        queryFn: async () => {
            const res = await api.get("/system/info")
            return res.data.data as {
                s3: { enabled: boolean }
                sso: { enabled: boolean }
                ldap: { enabled: boolean }
                revalidate: { enabled: boolean }
            }
        },
        staleTime: 5 * 60_000,
    })

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center" role="status" aria-live="polite">
                <Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span className="sr-only">Loading bio page…</span>
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 pt-6 h-[calc(100vh-4rem)] supports-[height:100dvh]:h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="flex h-full gap-6">
                <div className="flex-1 overflow-y-auto pr-2 pb-20">
                    <BioForm bioPage={bioPage} systemInfo={systemInfo} />
                </div>
                <div className="w-[400px] hidden xl:block border-l pl-6 pt-6">
                    <div className="sticky top-6">
                        <h3 className="text-lg font-medium mb-4">Preview</h3>
                        <BioPreview bioPage={bioPage} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function SaveIndicator({ state }: { state: SaveState }) {
    const [, tick] = useState(0)
    useEffect(() => {
        if (!state.lastSavedAt) return
        const id = setInterval(() => tick((n) => n + 1), 15_000)
        return () => clearInterval(id)
    }, [state.lastSavedAt])

    if (state.isSaving) {
        return (
            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5" role="status" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Saving…
            </span>
        )
    }
    if (state.errorAt && (!state.lastSavedAt || state.errorAt > state.lastSavedAt)) {
        return (
            <span className="text-sm text-destructive inline-flex items-center gap-1.5" role="status" aria-live="polite">
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Save failed
            </span>
        )
    }
    if (state.lastSavedAt) {
        const seconds = Math.max(0, Math.floor((Date.now() - state.lastSavedAt) / 1000))
        const label = seconds < 5 ? "just now" : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`
        return (
            <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5" role="status" aria-live="polite">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Saved {label}
            </span>
        )
    }
    return (
        <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
            Autosave on
        </span>
    )
}

interface SystemInfo {
    s3: { enabled: boolean }
    sso: { enabled: boolean }
    ldap: { enabled: boolean }
    revalidate: { enabled: boolean }
}

function BioForm({ bioPage, systemInfo }: { bioPage: any; systemInfo?: SystemInfo }) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const tabParam = (searchParams.get("tab") || "content") as TabKey
    const activeTab: TabKey = (VALID_TABS as readonly string[]).includes(tabParam) ? tabParam : "content"
    const setActiveTab = useCallback(
        (next: string) => {
            const sp = new URLSearchParams(searchParams.toString())
            if (next === "content") sp.delete("tab")
            else sp.set("tab", next)
            router.replace(`?${sp.toString()}`, { scroll: false })
        },
        [router, searchParams],
    )

    const [saveState, setSaveState] = useState<SaveState>(initialSaveState)
    const markSaving = useCallback(() => setSaveState((s) => ({ ...s, isSaving: true })), [])
    const markSaved = useCallback(() => setSaveState({ isSaving: false, lastSavedAt: Date.now(), errorAt: null }), [])
    const markError = useCallback(() => setSaveState((s) => ({ ...s, isSaving: false, errorAt: Date.now() })), [])

    const form = useForm<z.infer<typeof bioPageSchema>>({
        resolver: zodResolver(bioPageSchema),
        defaultValues: {
            title: bioPage.title,
            bio: bioPage.bio || "",
            slug: bioPage.slug,
            theme: bioPage.theme,
            isPublished: bioPage.isPublished,
        },
    })

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof bioPageSchema>) => {
            await api.patch("/bio", values)
        },
        onMutate: () => markSaving(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            markSaved()
        },
        onError: (error: any) => {
            markError()
            const data = error.response?.data
            const details = data?.error?.details || data?.details
            const detailMsg = Array.isArray(details) ? details[0]?.message : null
            const serverMessage = detailMsg || data?.message || data?.error?.message
            toast({
                variant: "destructive",
                title: "Failed to save",
                description: serverMessage || "Something went wrong",
            })
        },
    })

    const persistProfile = () => {
        const { title, bio } = form.getValues()
        // Skip when nothing actually changed
        if (title === bioPage.title && (bio || "") === (bioPage.bio || "")) return
        mutation.mutate({ title, bio })
    }

    const onThemeChange = (theme: string) => {
        form.setValue("theme", theme, { shouldDirty: true })
        mutation.mutate({ theme })
    }

    return (
        <>
            <header className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <h2 className="text-3xl font-bold tracking-tight">Bio Page</h2>
                <SaveIndicator state={saveState} />
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                    <AvatarUploader
                        avatarUrl={bioPage.avatarUrl}
                        title={bioPage.title}
                        s3Enabled={systemInfo?.s3.enabled ?? true}
                        onSavingChange={(saving) => (saving ? markSaving() : null)}
                        onSaved={markSaved}
                        onError={markError}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Update your public profile information. Changes save automatically when you leave a field.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form className="space-y-4" onBlur={persistProfile}>
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Page Title</FormLabel>
                                                <FormControl>
                                                    <Input {...field} autoComplete="off" maxLength={100} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bio Description</FormLabel>
                                                <FormControl>
                                                    <Input {...field} autoComplete="off" maxLength={500} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <SocialLinksEditor socialLinks={bioPage.socialLinks || []} />
                </TabsContent>

                <TabsContent value="links" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Links</CardTitle>
                            <CardDescription>
                                Add and reorder links on your bio page
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BioLinkList links={bioPage.links || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme</CardTitle>
                            <CardDescription>
                                Choose a visual theme for your page
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ThemeSelector
                                currentTheme={form.watch("theme") || "gradient"}
                                onSelect={onThemeChange}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <SettingsCard
                        bioPage={bioPage}
                        form={form}
                        onSaving={markSaving}
                        onSaved={markSaved}
                        onError={markError}
                    />
                </TabsContent>
            </Tabs>
        </>
    )
}

function SettingsCard({
    bioPage,
    form,
    onSaving,
    onSaved,
    onError,
}: {
    bioPage: any
    form: ReturnType<typeof useForm<z.infer<typeof bioPageSchema>>>
    onSaving: () => void
    onSaved: () => void
    onError: () => void
}) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const slugValue = form.watch("slug") || ""
    const debouncedSlug = useDebounce(slugValue.toLowerCase(), 400)
    const slugChanged = debouncedSlug && debouncedSlug !== bioPage.slug

    const slugCheck = useQuery({
        queryKey: ["bio-slug-check", debouncedSlug],
        queryFn: async () => {
            const res = await api.get("/bio/slug-check", { params: { slug: debouncedSlug } })
            return res.data.data as { available: boolean; reason?: "reserved" | "taken" | "invalid" }
        },
        enabled: !!slugChanged,
        staleTime: 30_000,
    })

    const saveSlug = useMutation({
        mutationFn: async (slug: string) => {
            await api.patch("/bio", { slug })
        },
        onMutate: () => onSaving(),
        onSuccess: () => {
            onSaved()
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({ title: "URL updated", description: "Your bio is now reachable at the new slug." })
        },
        onError: (error: any) => {
            onError()
            const msg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to update URL"
            toast({ variant: "destructive", title: "Could not change URL", description: msg })
        },
    })

    const publishToggle = useMutation({
        mutationFn: async (isPublished: boolean) => {
            await api.patch("/bio", { isPublished })
        },
        onMutate: () => onSaving(),
        onSuccess: () => {
            onSaved()
            queryClient.invalidateQueries({ queryKey: ["bio"] })
        },
        onError: () => onError(),
    })

    const slugStatus = useMemo(() => {
        if (!slugChanged) return null
        if (slugCheck.isFetching) return { kind: "loading" as const }
        if (slugCheck.data?.available) return { kind: "ok" as const }
        const reason = slugCheck.data?.reason
        if (reason === "reserved") return { kind: "warn" as const, msg: "This URL is reserved." }
        if (reason === "taken") return { kind: "warn" as const, msg: "This URL is already taken." }
        if (reason === "invalid") return { kind: "warn" as const, msg: "Use 3–50 lowercase letters, numbers, hyphens, or underscores." }
        return null
    }, [slugChanged, slugCheck.isFetching, slugCheck.data])

    const canSaveSlug = slugChanged && slugStatus?.kind === "ok"
    const [confirmSlug, setConfirmSlug] = useState(false)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Page Settings</CardTitle>
                <CardDescription>
                    Manage your bio page URL and visibility.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL Slug</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground" translate="no">s.menpan.go.id/</span>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                                className="max-w-[220px]"
                                                autoComplete="off"
                                                autoCapitalize="none"
                                                spellCheck={false}
                                                translate="no"
                                                aria-describedby="slug-help"
                                                aria-invalid={slugStatus?.kind === "warn"}
                                            />
                                            <SlugStatusBadge status={slugStatus} />
                                        </div>
                                    </FormControl>
                                    <FormDescription id="slug-help">
                                        Your bio page lives at this URL. Keep it short and memorable.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {slugChanged && slugStatus?.kind === "ok" && (
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
                            >
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <div>
                                    <strong>Heads up:</strong> changing this slug will break any existing links or QR codes
                                    pointing to <code translate="no">/{bioPage.slug}</code>.
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                disabled={!canSaveSlug || saveSlug.isPending}
                                onClick={() => setConfirmSlug(true)}
                            >
                                {saveSlug.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                                        Update URL
                                    </>
                                )}
                            </Button>
                            {slugChanged && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => form.setValue("slug", bioPage.slug)}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="isPublished"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Publish Status</FormLabel>
                                        <FormDescription>
                                            Make your profile public
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked)
                                                publishToggle.mutate(checked)
                                            }}
                                            aria-label="Publish bio page"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            </CardContent>

            <AlertDialog open={confirmSlug} onOpenChange={setConfirmSlug}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change your bio URL?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You&rsquo;re moving from <code translate="no">/{bioPage.slug}</code> to{" "}
                            <code translate="no">/{slugValue}</code>. Anyone using the old URL or QR code will get a not-found page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                saveSlug.mutate(slugValue)
                                setConfirmSlug(false)
                            }}
                        >
                            Yes, change URL
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function SlugStatusBadge({ status }: { status: { kind: "loading" | "ok" | "warn"; msg?: string } | null }) {
    if (!status) return null
    if (status.kind === "loading") {
        return (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1" role="status" aria-live="polite">
                <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Checking…
            </span>
        )
    }
    if (status.kind === "ok") {
        return (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1" role="status">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Available
            </span>
        )
    }
    return (
        <span className="text-xs text-destructive inline-flex items-center gap-1" role="alert">
            <XCircle className="h-3 w-3" aria-hidden="true" />
            {status.msg || "Unavailable"}
        </span>
    )
}

function AvatarUploader({
    avatarUrl,
    title,
    s3Enabled,
    onSavingChange,
    onSaved,
    onError,
}: {
    avatarUrl?: string | null
    title?: string
    s3Enabled: boolean
    onSavingChange: (saving: boolean) => void
    onSaved: () => void
    onError: () => void
}) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [progress, setProgress] = useState<number>(0)
    const [isDragging, setIsDragging] = useState(false)
    const [confirmRemove, setConfirmRemove] = useState(false)
    const dragCounter = useRef(0)

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("avatar", file)
            setProgress(0)
            const res = await api.post("/bio/avatar", formData, {
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded * 100) / event.total))
                    }
                },
            })
            return res.data.data
        },
        onMutate: () => onSavingChange(true),
        onSuccess: () => {
            setPreview(null)
            setProgress(0)
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            onSaved()
            toast({ title: "Profile picture updated" })
        },
        onError: (error: any) => {
            setPreview(null)
            setProgress(0)
            onError()
            const data = error.response?.data
            const msg = data?.error?.message || data?.message || "Upload failed"
            toast({ variant: "destructive", title: "Upload failed", description: msg })
        },
    })

    const removeMutation = useMutation({
        mutationFn: async () => {
            await api.delete("/bio/avatar")
        },
        onMutate: () => onSavingChange(true),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            onSaved()
            toast({ title: "Profile picture removed" })
        },
        onError: () => {
            onError()
            toast({ variant: "destructive", title: "Could not remove picture" })
        },
    })

    const validateFile = useCallback(
        (file: File): boolean => {
            if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
                toast({ variant: "destructive", title: "Unsupported format", description: "Use JPEG, PNG, GIF, or WebP" })
                return false
            }
            if (file.size > 5 * 1024 * 1024) {
                toast({ variant: "destructive", title: "File too large", description: "Maximum size is 5 MB." })
                return false
            }
            return true
        },
        [toast],
    )

    const acceptFile = useCallback(
        (file: File) => {
            if (!validateFile(file)) return
            const reader = new FileReader()
            reader.onload = () => setPreview(reader.result as string)
            reader.readAsDataURL(file)
            uploadMutation.mutate(file)
        },
        [uploadMutation, validateFile],
    )

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        acceptFile(file)
        e.target.value = ""
    }

    const handlePick = () => inputRef.current?.click()

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        dragCounter.current += 1
        if (e.dataTransfer.items?.length) setIsDragging(true)
    }
    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        dragCounter.current = Math.max(0, dragCounter.current - 1)
        if (dragCounter.current === 0) setIsDragging(false)
    }
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
    }
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        dragCounter.current = 0
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) acceptFile(file)
    }

    const displayUrl = preview || avatarUrl || null
    const initial = title?.[0]?.toUpperCase() || "?"
    const altText = title ? `${title} profile picture` : "Profile picture"
    const isPending = uploadMutation.isPending || removeMutation.isPending

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                    Click the avatar or drop an image here to upload (JPEG, PNG, GIF, or WebP, max 5&nbsp;MB).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!s3Enabled && (
                    <div
                        role="alert"
                        className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
                    >
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <div>
                            <strong>Object storage disabled.</strong> Avatar uploads will fail until <code translate="no">S3_ENABLED</code> is configured on the server.
                        </div>
                    </div>
                )}
                <div
                    className={
                        "flex items-center gap-6 rounded-lg border-2 border-dashed p-4 transition-colors duration-[var(--motion-base)] ease-[var(--ease-out)] " +
                        (isDragging
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-border")
                    }
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                    <button
                        type="button"
                        onClick={handlePick}
                        disabled={isPending}
                        className="group relative w-24 h-24 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                        aria-label={avatarUrl ? "Change profile picture" : "Upload profile picture"}
                    >
                        {displayUrl ? (
                            <img
                                src={displayUrl}
                                alt={altText}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl font-semibold text-muted-foreground" aria-hidden="true">{initial}</span>
                        )}
                        {!isPending && (
                            <span
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 flex items-center justify-center transition-opacity duration-[var(--motion-base)] ease-[var(--ease-out)] motion-reduce:transition-none"
                                aria-hidden="true"
                            >
                                <Camera className="h-6 w-6 text-white" />
                            </span>
                        )}
                        {uploadMutation.isPending && (
                            <ProgressRing progress={progress} />
                        )}
                        {removeMutation.isPending && (
                            <span className="absolute inset-0 bg-black/40 flex items-center justify-center" aria-hidden="true">
                                <Loader2 className="h-6 w-6 animate-spin text-white motion-reduce:animate-none" />
                            </span>
                        )}
                    </button>

                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="sr-only"
                            tabIndex={-1}
                            onChange={handleFile}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={handlePick} disabled={isPending} variant="outline" size="sm">
                                {avatarUrl ? "Change" : "Upload"}
                            </Button>
                            {avatarUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmRemove(true)}
                                    disabled={isPending}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                    Remove
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isDragging ? "Drop to upload" : "Drag and drop, or click the avatar."}
                        </p>
                        {uploadMutation.isPending && (
                            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                                Uploading… {progress}%
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>

            <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove profile picture?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your bio page will fall back to the initial of your name. You can upload a new picture any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                removeMutation.mutate()
                                setConfirmRemove(false)
                            }}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function ProgressRing({ progress }: { progress: number }) {
    const radius = 38
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

    return (
        <span
            className="absolute inset-0 flex items-center justify-center bg-black/50"
            role="status"
            aria-live="polite"
        >
            <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
                <circle
                    cx="42"
                    cy="42"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="4"
                />
                <circle
                    cx="42"
                    cy="42"
                    r={radius}
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 42 42)"
                    style={{ transition: "stroke-dashoffset 200ms ease-out" }}
                />
            </svg>
            <span className="absolute text-xs font-semibold text-white">{progress}%</span>
            <span className="sr-only">Uploading {progress} percent</span>
        </span>
    )
}
