"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToastAction } from "@/components/ui/toast"
import api from "@/lib/api"
import { Plus, Trash2 } from "lucide-react"
import { SOCIAL_PLATFORMS, SocialIcon, getSocialPlatform, normalizeSocialUrl } from "@/components/bio/social-icons"

interface SocialLink {
    platform: string
    url: string
}

interface SocialLinksEditorProps {
    socialLinks: SocialLink[]
}

export function SocialLinksEditor({ socialLinks: initialLinks }: SocialLinksEditorProps) {
    const [links, setLinks] = useState<SocialLink[]>(initialLinks || [])
    const [showPlatformPicker, setShowPlatformPicker] = useState(false)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (socialLinks: SocialLink[]) => {
            const normalized = socialLinks.map((s) => ({
                ...s,
                url: normalizeSocialUrl(s.url, s.platform),
            }))
            await api.patch("/bio", { socialLinks: normalized })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bio"] })
        },
        onError: () => {
            toast({ variant: "destructive", title: "Failed to save social links" })
        }
    })

    const addPlatform = (platformId: string) => {
        if (links.some(l => l.platform === platformId)) {
            toast({ variant: "destructive", title: "Platform already added" })
            return
        }
        const updated = [...links, { platform: platformId, url: "" }]
        setLinks(updated)
        setShowPlatformPicker(false)
    }

    const updateUrl = (index: number, url: string) => {
        const updated = [...links]
        updated[index].url = url
        setLinks(updated)
    }

    const removeLink = (index: number) => {
        const removed = links[index]
        const updated = links.filter((_, i) => i !== index)
        setLinks(updated)
        mutation.mutate(updated)

        const platform = getSocialPlatform(removed.platform)
        toast({
            title: `${platform?.label || removed.platform} removed`,
            action: (
                <ToastAction
                    altText="Undo removal"
                    onClick={() => {
                        const restored = [...updated]
                        restored.splice(index, 0, removed)
                        setLinks(restored)
                        mutation.mutate(restored)
                    }}
                >
                    Undo
                </ToastAction>
            ),
        })
    }

    const saveLinks = () => {
        mutation.mutate(links)
    }

    // Available platforms (not yet added)
    const availablePlatforms = SOCIAL_PLATFORMS.filter(
        p => !links.some(l => l.platform === p.id)
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                    Add your social media profiles to display on your bio page. Changes save automatically.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Links */}
                {links.length > 0 && (
                    <ul className="space-y-3 list-none p-0 m-0">
                        {links.map((link, index) => {
                            const platform = getSocialPlatform(link.platform)
                            return (
                                <li
                                    key={link.platform}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                                >
                                    <span className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-md bg-muted text-muted-foreground">
                                        <SocialIcon platform={link.platform} className="h-4 w-4" ariaHidden />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <Label className="text-xs text-muted-foreground mb-1 block">
                                            {platform?.label}
                                        </Label>
                                        <Input
                                            value={link.url}
                                            onChange={(e) => updateUrl(index, e.target.value)}
                                            onBlur={saveLinks}
                                            placeholder={platform?.placeholder}
                                            className="h-8 text-sm"
                                            aria-label={`${platform?.label} URL`}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeLink(index)}
                                        aria-label={`Remove ${platform?.label}`}
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </li>
                            )
                        })}
                    </ul>
                )}

                {/* Empty State */}
                {links.length === 0 && !showPlatformPicker && (
                    <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">No social links added yet.</p>
                        <p className="text-xs mt-1">Click the button below to add your first social link.</p>
                    </div>
                )}

                {/* Platform Picker */}
                {showPlatformPicker && availablePlatforms.length > 0 && (
                    <div className="border rounded-lg p-3">
                        <Label className="text-sm font-medium mb-2 block">Choose a platform</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availablePlatforms.map(platform => (
                                <Button
                                    key={platform.id}
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2 h-9"
                                    onClick={() => addPlatform(platform.id)}
                                >
                                    <SocialIcon platform={platform.id} className="h-4 w-4" ariaHidden />
                                    <span className="text-xs">{platform.label}</span>
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setShowPlatformPicker(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Add Button */}
                {!showPlatformPicker && availablePlatforms.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowPlatformPicker(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                        Add Social Link
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
