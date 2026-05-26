"use client"

import {
    Instagram,
    Twitter,
    Youtube,
    Github,
    Linkedin,
    Facebook,
    Send,
    Mail,
    Globe,
    Music2,
    MessageCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface SocialPlatform {
    id: string
    label: string
    placeholder: string
    Icon: LucideIcon
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
    { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/username", Icon: Instagram },
    { id: "twitter", label: "X (Twitter)", placeholder: "https://x.com/username", Icon: Twitter },
    { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username", Icon: Music2 },
    { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", Icon: Youtube },
    { id: "github", label: "GitHub", placeholder: "https://github.com/username", Icon: Github },
    { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username", Icon: Linkedin },
    { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/username", Icon: Facebook },
    { id: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/628xxx", Icon: MessageCircle },
    { id: "telegram", label: "Telegram", placeholder: "https://t.me/username", Icon: Send },
    { id: "email", label: "Email", placeholder: "mailto:you@example.com", Icon: Mail },
    { id: "website", label: "Website", placeholder: "https://yoursite.com", Icon: Globe },
    { id: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/user/...", Icon: Music2 },
]

const PLATFORM_MAP: Record<string, SocialPlatform> = Object.fromEntries(
    SOCIAL_PLATFORMS.map((p) => [p.id, p])
)

export function getSocialPlatform(id: string): SocialPlatform | undefined {
    return PLATFORM_MAP[id]
}

export function SocialIcon({
    platform,
    className,
    ariaHidden = false,
}: {
    platform: string
    className?: string
    ariaHidden?: boolean
}) {
    const p = getSocialPlatform(platform)
    const Icon = p?.Icon ?? Globe
    return <Icon className={className} aria-hidden={ariaHidden || undefined} />
}

export function getSocialLabel(platform: string): string {
    return getSocialPlatform(platform)?.label ?? platform
}
