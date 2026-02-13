import { redirect } from "next/navigation"
import { BioPreview } from "@/components/bio/bio-preview"
import { ConfirmationPage } from "@/components/public/confirmation-page"

// SSR must use internal URL (Docker network) to reach backend directly
// NOT the public URL which routes back through nginx → frontend (loop!)
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

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
    const THEMES: Record<string, any> = {
        light: { background: '#ffffff', text: '#1f2937' },
        dark: { background: '#1f2937', text: '#f9fafb' },
        gradient: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
        ocean: { background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)', text: '#ffffff' },
        sunset: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#ffffff' },
        forest: { background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', text: '#ffffff' },
        midnight: { background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', text: '#ffffff' },
        rose: { background: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)', text: '#1f2937' },
        neon: { background: '#0a0a0a', text: '#39ff14' },
        minimal: { background: '#fafafa', text: '#333333' },
        aurora: { background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #7209b7 100%)', text: '#ffffff' },
        candy: { background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #feada6 100%)', text: '#4a154b' },
        corporate: { background: '#1a1a2e', text: '#e0e0e0' },
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
                    <p className="text-lg opacity-90">{bioPage.bio}</p>
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
                Powered by Heisenlink 🧪
            </div>
        </div>
    )
}
