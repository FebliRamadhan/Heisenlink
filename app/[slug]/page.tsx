import { redirect } from "next/navigation"

// This is a Server Component that handles public redirects/bio pages
export default async function PublicPage({ params }: { params: { slug: string } }) {
    const { slug } = params

    // We need to fetch data from our own API
    // Since this is server-side, we should use absolute URL 
    // But wait, the API is on same internal network (localhost:3000)
    // Or we can use `fetch` to `http://localhost:3000/api/bio/${slug}`

    try {
        const res = await fetch(`http://localhost:4000/api/bio/${slug}`, {
            cache: 'no-store' // Always fresh
        })

        if (res.ok) {
            const data = await res.json()
            const bioPage = data.data

            // Render Bio Page
            // We can reuse BioPreview components but they are client components
            // We should create a server-rendered version or use client component

            return <PublicBioView bioPage={bioPage} />
        }
    } catch (e) {
        // Ignore
    }

    // If not bio page, assume shortlink and redirect to backend handler
    // The backend handler is at /:code
    // So we redirect the browser to /api/public/:code? No, /:code is backend route?
    // Our backend is mounted at /api/*
    // But we also have public routes at root / in Express if configured?
    // Let's check `public.routes.js`. It's mounted at `/` in `app.js` likely?
    // Let's check `src/app.js` later. Assumed it is mounted at root `/`.
    // If so, Next.js handles `/` layout.
    // Next.js `rewrites` in `next.config.js` might interfere.
    // We configured `rewrites` for `/api/*` -> `localhost:3000/api/*`.
    // We didn't rewrite `/` to backend.

    // So if Next.js catches this route, it means we must handle it.
    // We can redirect to `http://localhost:3000/${slug}` which is the backend?
    // But browser calls port 3000 usually?
    // If we run `dev:server` on 3000 and `dev:next` on 3001 (default separate ports).
    // Then `rewrites` proxy `/api` to 3000.
    // If we want backend to handle redirects, we must proxy or redirect.
    // Redirecting to `API_URL/${slug}` (backend) works.

    // Let's assume Backend runs on 3000 (port from env or default)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    // Redirect to backend for shortlink processing
    redirect(`${API_URL}/${slug}`)
}

import { BioPreview } from "@/components/bio/bio-preview"

function PublicBioView({ bioPage }: { bioPage: any }) {
    // We can reuse the preview component logic but full screen
    // We should probably strip the "phone frame" for mobile users
    // For now, let's reuse a simple view

    // We need themes map again
    const THEMES: Record<string, any> = {
        light: { background: '#ffffff', text: '#1f2937' },
        dark: { background: '#1f2937', text: '#f9fafb' },
        gradient: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff' },
        ocean: { background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)', text: '#ffffff' },
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
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            {link.title}
                        </a>
                    ))}
                </div>
            </div>

            <div className="mt-12 text-sm opacity-60">
                Powered by LinkHub
            </div>
        </div>
    )
}
