"use client"

import { Card } from "@/components/ui/card"
import { themes } from "@/src/constants/themes" // Import theme constants from src
import { cn } from "@/lib/utils"
// We need to import the themes object. Since src is in root, we can alias or relative import.
// TS config has @ -> ./
// So @/src/constants/themes is valid if src is in root.
// Or just copy definitions if imports fail.
// Let's assume alias works or relative.

// Wait, standard nextjs setup usually has src/app or app/. Only one.
// Here we have src/ (backend) and app/ (frontend nextjs) in root.
// My tsconfig has paths: "@/*": ["./*"]
// So "@/src" should work.

interface BioPreviewProps {
    bioPage: any
}

// Temporary theme map until I verify import
const THEMES: Record<string, any> = {
    light: { background: '#ffffff', text: '#1f2937' },
    dark: { background: '#1f2937', text: '#f9fafb' },
    gradient: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
    ocean: { background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)', text: '#ffffff' },
    // ... others
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
                        <p className="text-sm opacity-90 max-w-[280px]">{bioPage.bio}</p>
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
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
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
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
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

