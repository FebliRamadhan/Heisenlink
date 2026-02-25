import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { BioPreview } from "@/components/bio/bio-preview"
import { ConfirmationPage } from "@/components/public/confirmation-page"
import { themes as themeConstants } from "@/src/constants/themes"

// SSR must use internal URL (Docker network) to reach backend directly
// NOT the public URL which routes back through nginx → frontend (loop!)
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.SHORTLINK_DOMAIN || 'http://localhost:3000'

/**
 * Dynamic meta tags for bio pages and shortlink confirmation pages.
 * - Bio page: uses title, bio description, and avatar as OG image
 * - Shortlink: uses link title and destination domain info
 * - Fallback: default Heisenlink branding
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = params

    const defaultMeta: Metadata = {
        title: `${slug} - Heisenlink`,
        description: 'Heisenlink - Platform shortlink dan bio page resmi Kementerian PANRB',
        openGraph: {
            title: `${slug} - Heisenlink`,
            description: 'Heisenlink - Platform shortlink dan bio page resmi Kementerian PANRB',
            siteName: 'Heisenlink',
            type: 'website',
            images: [{ url: `${PUBLIC_URL}/og-image.png`, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${slug} - Heisenlink`,
            description: 'Heisenlink - Platform shortlink dan bio page resmi Kementerian PANRB',
            images: [`${PUBLIC_URL}/og-image.png`],
        },
    }

    // Try bio page first
    try {
        const res = await fetch(`${API_URL}/api/bio/${slug}`, { cache: 'no-store' })
        if (res.ok) {
            const data = await res.json()
            const bio = data.data
            const title = bio.title ? `${bio.title} - Heisenlink` : defaultMeta.title as string
            const description = bio.bio || `Kunjungi halaman bio ${bio.title || slug} di Heisenlink`
            const images = bio.avatarUrl
                ? [{ url: bio.avatarUrl.startsWith('http') ? bio.avatarUrl : `${PUBLIC_URL}${bio.avatarUrl}`, width: 400, height: 400 }]
                : [{ url: `${PUBLIC_URL}/og-image.png`, width: 1200, height: 630 }]

            return {
                title,
                description,
                openGraph: {
                    title,
                    description,
                    siteName: 'Heisenlink',
                    type: 'profile',
                    url: `${PUBLIC_URL}/${slug}`,
                    images,
                },
                twitter: {
                    card: bio.avatarUrl ? 'summary' : 'summary_large_image',
                    title,
                    description,
                    images: images.map(i => i.url),
                },
            }
        }
    } catch {
        // Bio check failed, try shortlink below
    }

    // Try shortlink
    try {
        const res = await fetch(`${API_URL}/${slug}/resolve`, { cache: 'no-store' })
        if (res.ok) {
            const data = await res.json()
            const link = data.data
            if (link.showConfirmation && link.title) {
                const title = `${link.title} - Heisenlink`
                let domain = ''
                try { domain = new URL(link.destinationUrl).hostname } catch { }
                const description = domain
                    ? `Menuju ke ${domain} via Heisenlink`
                    : 'Redirect via Heisenlink'

                return {
                    title,
                    description,
                    openGraph: {
                        title,
                        description,
                        siteName: 'Heisenlink',
                        type: 'website',
                        url: `${PUBLIC_URL}/${slug}`,
                        images: [{ url: `${PUBLIC_URL}/og-image.png`, width: 1200, height: 630 }],
                    },
                    twitter: {
                        card: 'summary',
                        title,
                        description,
                        images: [`${PUBLIC_URL}/og-image.png`],
                    },
                }
            }
        }
    } catch {
        // Shortlink check failed
    }

    return defaultMeta
}

// This is a Server Component that handles public redirects/bio pages
export default async function PublicPage({ params }: { params: { slug: string } }) {
    const { slug } = params

    console.log(`[SLUG] Resolving slug="${slug}", API_URL="${API_URL}"`)

    // 1. Check if it's a bio page first
    try {
        const bioUrl = `${API_URL}/api/bio/${slug}`
        console.log(`[SLUG] Checking bio: ${bioUrl}`)
        const res = await fetch(bioUrl, { cache: 'no-store' })
        console.log(`[SLUG] Bio response: ${res.status}`)

        if (res.ok) {
            const data = await res.json()
            const bioPage = data.data
            return <PublicBioView bioPage={bioPage} />
        }
    } catch (e: any) {
        if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e
        console.log(`[SLUG] Bio check failed: ${e.message}`)
    }

    // 2. Try to resolve as shortlink
    try {
        const resolveUrl = `${API_URL}/${slug}/resolve`
        console.log(`[SLUG] Resolving shortlink: ${resolveUrl}`)
        const res = await fetch(resolveUrl, { cache: 'no-store' })
        console.log(`[SLUG] Resolve response: ${res.status}`)

        if (res.ok) {
            const data = await res.json()
            console.log(`[SLUG] Resolve data:`, JSON.stringify(data))
            const linkData = data.data

            // If showConfirmation is enabled, render confirmation page
            if (linkData.showConfirmation) {
                return (
                    <ConfirmationPage
                        destinationUrl={linkData.destinationUrl}
                        title={linkData.title}
                        code={linkData.code}
                    />
                )
            }

            // Direct redirect
            redirect(linkData.destinationUrl)
        }

        // Handle error responses
        if (res.status === 404) {
            redirect('/not-found')
        }
        if (res.status === 410) {
            // Determine if expired or inactive from error response
            try {
                const errorData = await res.json()
                if (errorData.error?.code === 'EXPIRED') {
                    redirect('/link-expired')
                }
            } catch { }
            redirect('/link-inactive')
        }
        if (res.status === 425) {
            redirect('/not-found')
        }
        if (res.status === 429) {
            redirect('/too-many-requests')
        }
        if (res.status === 401) {
            // Password protected - show not-found for now
            // TODO: implement password entry page
            redirect('/not-found')
        }
    } catch (e: any) {
        // CRITICAL: Next.js redirect() throws NEXT_REDIRECT error internally
        // Must re-throw so Next.js can handle the redirect
        if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e
        // API unreachable - show not-found
        console.error(`[slug] resolve failed for ${slug}:`, e)
    }

    // Final fallback
    redirect('/not-found')
}

function PublicBioView({ bioPage }: { bioPage: any }) {
    // Build THEMES from shared constants for single source of truth
    const THEMES: Record<string, { background: string; text: string }> = {}
    for (const [key, value] of Object.entries(themeConstants)) {
        const t = value as any
        THEMES[key] = { background: t.background, text: t.text }
    }

    const PLATFORM_ICONS: Record<string, string> = {
        instagram: "📷", twitter: "𝕏", tiktok: "🎵", youtube: "▶️",
        github: "🐙", linkedin: "💼", facebook: "📘", whatsapp: "💬",
        telegram: "✈️", email: "📧", website: "🌐", spotify: "🎧",
    }

    const theme = THEMES[bioPage.theme] || THEMES.gradient

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center py-12 px-4"
            style={{ background: theme.background, color: theme.text }}
        >
            <div className="w-full max-w-md space-y-8 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-muted">
                    {bioPage.avatarUrl && (
                        <img src={bioPage.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">{bioPage.title}</h1>
                    <p className="text-lg opacity-90 line-clamp-3">{bioPage.bio}</p>
                </div>

                {/* Social Links */}
                {bioPage.socialLinks?.length > 0 && (
                    <div className="flex flex-wrap gap-3 justify-center">
                        {bioPage.socialLinks.filter((s: any) => s.url).map((social: any) => (
                            <a
                                key={social.platform}
                                href={social.url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
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

                <div className="w-full space-y-4">
                    {bioPage.links?.map((link: any) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full p-4 rounded-xl text-center font-bold text-lg transition-transform hover:scale-[1.02]"
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
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

            <div className="mt-12 text-sm opacity-60">
                Powered by <span className="font-semibold">Biro DATIN</span> — Kementerian PANRB
            </div>
        </div>
    )
}
