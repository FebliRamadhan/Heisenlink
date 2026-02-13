"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useQueryClient } from "@tanstack/react-query" // Added import
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useState } from "react"
import { Loader2 } from "lucide-react"

// Reserved aliases that conflict with app routes — must match backend shortcode.js
const RESERVED_ALIASES = new Set([
    'api', 'admin', 'login', 'logout', 'register', 'settings', 'dashboard',
    'analytics', 'bio', 'health', 'forbidden', 'link-expired', 'link-inactive',
    'not-found', 'too-many-requests', 'error', 'loading', 'static', 'public',
    'assets', 'images', 'css', 'js', 'favicon', '_next', '_error', '_app',
    'auth', 'signup', 'reset-password', 'verify', 'callback', 'redirect',
    'sitemap', 'robots', 'manifest',
])

const formSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
    alias: z.string()
        .min(3, "Alias must be at least 3 characters")
        .refine(val => !RESERVED_ALIASES.has(val.toLowerCase()), {
            message: "This alias is reserved and cannot be used",
        })
        .optional()
        .or(z.literal("")),
    title: z.string().optional(),
    password: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    showConfirmation: z.boolean().optional(),
    isActive: z.boolean().optional(),
})

type LinkFormValues = z.infer<typeof formSchema>

interface LinkFormProps {
    initialData?: LinkFormValues & { id: string }
}

export function LinkForm({ initialData }: LinkFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<LinkFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            url: "",
            alias: "",
            title: "",
            password: "",
            startsAt: "",
            expiresAt: "",
            showConfirmation: false,
            isActive: true,
        },
    })

    const onSubmit = async (data: LinkFormValues) => {
        setIsLoading(true)
        try {
            // Sanitize payload: remove empty strings for optional fields
            const payload = { ...data }
            if (payload.password === "") delete payload.password
            if (payload.alias === "") delete payload.alias

            if (initialData) {
                await api.patch(`/links/${initialData.id}`, payload)
                toast({ title: "Link updated" })
            } else {
                await api.post("/links", payload)
                toast({ title: "Link created" })
            }

            // Invalidate cache to force re-fetch
            await queryClient.invalidateQueries({ queryKey: ["links"] })

            router.push("/dashboard/links")
            router.refresh()
        } catch (error: any) {
            const errorData = error.response?.data?.error

            if (errorData?.code === 'VALIDATION_ERROR' && errorData.details) {
                errorData.details.forEach((err: any) => {
                    form.setError(err.field as keyof LinkFormValues, {
                        type: "server",
                        message: err.message,
                    })
                })

                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please check the highlighted fields.",
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: errorData?.message || "Something went wrong",
                })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Destination URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/long-url" {...field} />
                            </FormControl>
                            <FormDescription>
                                The long URL you want to shorten.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="alias"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Custom Alias (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="my-custom-link" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Leave empty for auto-generated code.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Marketing Campaign 2024" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Password Protection */}
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password Protection (Optional)</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                                Visitors must enter this password to access the link
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Scheduling Section */}
                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-medium">Link Scheduling</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="startsAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Link will only work after this date
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="expiresAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Link will stop working after this date
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Confirmation Page Toggle */}
                <FormField
                    control={form.control}
                    name="showConfirmation"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Confirmation Page</FormLabel>
                                <FormDescription>
                                    Show a preview page before redirecting visitors.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Status</FormLabel>
                                <FormDescription>
                                    Disable to temporarily stop redirecting.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Save Changes" : "Create Link"}
                </Button>
            </form>
        </Form>
    )
}
