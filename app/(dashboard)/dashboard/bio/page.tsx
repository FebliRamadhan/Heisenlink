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
import { Loader2 } from "lucide-react"

const bioPageSchema = z.object({
    title: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    slug: z.string().min(3).max(50).optional(),
    theme: z.string().optional(),
    isPublished: z.boolean().optional(),
})

export default function BioPage() {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: bioPage, isLoading } = useQuery({
        queryKey: ["bio"],
        queryFn: async () => {
            const res = await api.get("/bio")
            return res.data.data
        },
    })

    // We need to use reset in useEffect when data loads if we want to populate form
    // But standard way is passing defaultValues to useForm
    // Since useForm is hook, we need it at top level.
    // We can wrap form in component or handle loading state.

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 pt-6 h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex h-full gap-6">
                <div className="flex-1 overflow-y-auto pr-2 pb-20">
                    <div className="flex items-center justify-between space-y-2 mb-6">
                        <h2 className="text-3xl font-bold tracking-tight">Bio Page</h2>
                    </div>

                    <BioForm bioPage={bioPage} />
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

function BioForm({ bioPage }: { bioPage: any }) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({ title: "Bio page updated" })
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to update" })
        }
    })

    const onSubmit = (values: z.infer<typeof bioPageSchema>) => {
        mutation.mutate(values)
    }

    const onThemeChange = (theme: string) => {
        form.setValue("theme", theme, { shouldDirty: true })
        // Auto save on theme change?
        mutation.mutate({ ...form.getValues(), theme })
    }

    return (
        <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            Update your public profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form className="space-y-4" onBlur={form.handleSubmit(onSubmit)}>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Page Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending}>
                                    Save Changes
                                </Button>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Page Settings</CardTitle>
                        <CardDescription>
                            Manage your bio page settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Slug</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="text-muted-foreground mr-2">linkhub.com/bio/</span>
                                                    <Input {...field} className="max-w-[200px]" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                                        // trigger save immediately
                                                        onSubmit({ ...form.getValues(), isPublished: checked })
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={mutation.isPending}>
                                    Save Settings
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
