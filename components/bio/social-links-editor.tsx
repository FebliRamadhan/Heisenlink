"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { Plus, Trash2, GripVertical } from "lucide-react"

const SOCIAL_PLATFORMS = [
    { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/username", icon: "📷" },
    { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username", icon: "𝕏" },
    { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username", icon: "🎵" },
    { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", icon: "▶️" },
    { id: "github", label: "GitHub", placeholder: "https://github.com/username", icon: "🐙" },
    { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username", icon: "💼" },
    { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/username", icon: "📘" },
    { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/628xxx", icon: "💬" },
    { id: "telegram", label: "Telegram", placeholder: "https://t.me/username", icon: "✈️" },
    { id: "email", label: "Email", placeholder: "mailto:you@example.com", icon: "📧" },
    { id: "website", label: "Website", placeholder: "https://yoursite.com", icon: "🌐" },
    { id: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/user/...", icon: "🎧" },
]

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
            await api.patch("/bio", { socialLinks })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bio"] })
            toast({ title: "Social links updated" })
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
        const updated = links.filter((_, i) => i !== index)
        setLinks(updated)
        mutation.mutate(updated)
    }

    const saveLinks = () => {
        mutation.mutate(links)
    }

    const getPlatform = (id: string) => SOCIAL_PLATFORMS.find(p => p.id === id)

    // Available platforms (not yet added)
    const availablePlatforms = SOCIAL_PLATFORMS.filter(
        p => !links.some(l => l.platform === p.id)
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                    Add your social media profiles to display on your bio page
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Links */}
                {links.length > 0 && (
                    <div className="space-y-3">
                        {links.map((link, index) => {
                            const platform = getPlatform(link.platform)
                            return (
                                <div
                                    key={link.platform}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                                >
                                    <span className="text-xl w-8 text-center flex-shrink-0 emoji-icon">
                                        {platform?.icon}
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
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeLink(index)}
                                        aria-label={`Remove ${platform?.label}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
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
                                    <span className="text-base emoji-icon">{platform.icon}</span>
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
                        <Plus className="h-4 w-4 mr-2" />
                        Add Social Link
                    </Button>
                )}

                {/* Save Button */}
                {links.length > 0 && (
                    <Button
                        onClick={saveLinks}
                        disabled={mutation.isPending}
                        className="w-full"
                    >
                        {mutation.isPending ? "Saving..." : "Save Social Links"}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
