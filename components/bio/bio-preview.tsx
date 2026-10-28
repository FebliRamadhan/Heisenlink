"use client"

import { themes as themeConstants } from "@/src/constants/themes"
import { SocialIcon, getSocialLabel, normalizeSocialUrl } from "@/components/bio/social-icons"

interface BioPreviewProps {
    bioPage: any
}

const THEMES: Record<string, { background: string; text: string; textSecondary: string; card: string }> = {}
for (const [key, value] of Object.entries(themeConstants)) {
    const t = value as any
    THEMES[key] = { background: t.background, text: t.text, textSecondary: t.textSecondary, card: t.cardBackground }
}

export function BioPreview({ bioPage }: BioPreviewProps) {
    const theme = THEMES[bioPage.theme] || THEMES.panrb

    return (
        <div className="mockup-phone border-gray-300 dark:border-gray-700 border-[8px] rounded-[2.5rem] h-[700px] w-[350px] overflow-hidden shadow-xl relative bg-black">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-xl z-20" aria-hidden="true"></div>
            <div
                className="h-full w-full overflow-y-auto"
                style={{
                    background: theme.background,
                    color: theme.text,
                    ["--bio-surface-bg" as string]: theme.card,
                    ["--bio-surface-bg-strong" as string]: theme.card,
                    ["--bio-surface-border" as string]: "color-mix(in srgb, currentColor 16%, transparent)",
                }}
            >
                <div className="flex flex-col items-center pt-12 pb-8 px-6 space-y-4">
                    <div className="bio-surface w-24 h-24 rounded-full overflow-hidden">
                        {bioPage.avatarUrl ? (
                            <img
                                src={bioPage.avatarUrl}
                                alt={bioPage.title ? `${bioPage.title} profile picture` : "Profile picture"}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold" aria-hidden="true">
                                {bioPage.title?.[0] || "?"}
                            </div>
                        )}
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-xl font-bold font-heading text-balance">{bioPage.title}</h1>
                        {bioPage.bio && (
                            <p className="text-sm max-w-[280px] line-clamp-3 text-pretty" style={{ color: theme.textSecondary }}>{bioPage.bio}</p>
                        )}
                    </div>

                    {/* Social Links Icons */}
                    {bioPage.socialLinks?.length > 0 && (
                        <ul className="flex flex-wrap gap-3 justify-center list-none p-0 m-0" aria-label="Social profiles">
                            {bioPage.socialLinks.filter((s: any) => s.url).map((social: any) => {
                                const label = getSocialLabel(social.platform)
                                const href = normalizeSocialUrl(social.url, social.platform)
                                return (
                                    <li key={social.platform}>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bio-surface w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-[var(--motion-base)] hover:opacity-85"
                                            aria-label={`${label} (opens in new tab)`}
                                        >
                                            <SocialIcon platform={social.platform} className="h-4 w-4" ariaHidden />
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    <ul className="w-full space-y-3 mt-6 list-none p-0 m-0">
                        {bioPage.links?.filter((l: any) => l.isVisible).map((link: any, idx: number) => (
                            <li key={link.id}>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={
                                        idx === 0
                                            ? "bio-surface-strong block w-full p-4 rounded-xl text-center font-medium transition-opacity duration-[var(--motion-base)] hover:opacity-85 active:scale-95"
                                            : "bio-surface block w-full p-4 rounded-xl text-center font-medium transition-opacity duration-[var(--motion-base)] hover:opacity-85 active:scale-95"
                                    }
                                >
                                    {link.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
