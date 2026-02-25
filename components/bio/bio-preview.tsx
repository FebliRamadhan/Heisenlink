"use client"

import { Card } from "@/components/ui/card"
import { themes as themeConstants } from "@/src/constants/themes"
import { cn } from "@/lib/utils"

interface BioPreviewProps {
    bioPage: any
}

// Build a preview-friendly THEMES map from the backend theme constants
const THEMES: Record<string, { background: string; text: string }> = {}
for (const [key, value] of Object.entries(themeConstants)) {
    const t = value as any
    THEMES[key] = { background: t.background, text: t.text }
}

export function BioPreview({ bioPage }: BioPreviewProps) {
    const theme = THEMES[bioPage.theme] || THEMES.gradient

    const PLATFORM_ICONS: Record<string, string> = {
        instagram: "📷", twitter: "𝕏", tiktok: "🎵", youtube: "▶️",
        github: "🐙", linkedin: "💼", facebook: "📘", whatsapp: "💬",
        telegram: "✈️", email: "📧", website: "🌐", spotify: "🎧",
    }

    return (
        <div className="mockup-phone border-gray-300 dark:border-gray-700 border-[8px] rounded-[2.5rem] h-[700px] w-[350px] overflow-hidden shadow-xl relative bg-black">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-xl z-20"></div>
            <div
                className="h-full w-full overflow-y-auto"
                style={{ background: theme.background, color: theme.text }}
            >
                <div className="flex flex-col items-center pt-12 pb-8 px-6 space-y-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden bg-muted">
                        {bioPage.avatarUrl ? (
                            <img src={bioPage.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-50">
                                {bioPage.title?.[0] || "?"}
                            </div>
                        )}
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-xl font-bold font-heading">{bioPage.title}</h1>
                        <p className="text-sm opacity-90 max-w-[280px] line-clamp-3">{bioPage.bio}</p>
                    </div>

                    {/* Social Links Icons */}
                    {bioPage.socialLinks?.length > 0 && (
                        <div className="flex flex-wrap gap-3 justify-center">
                            {bioPage.socialLinks.filter((s: any) => s.url).map((social: any) => (
                                <a
                                    key={social.platform}
                                    href={social.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                    }}
                                    title={social.platform}
                                >
                                    {PLATFORM_ICONS[social.platform] || "🔗"}
                                </a>
                            ))}
                        </div>
                    )}

                    <div className="w-full space-y-3 mt-6">
                        {bioPage.links?.filter((l: any) => l.isVisible).map((link: any) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full p-4 rounded-xl text-center font-medium transition-transform hover:scale-[1.02] active:scale-95"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)'
                                }}
                            >
                                {link.title}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
