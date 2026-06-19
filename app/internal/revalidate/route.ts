import { NextRequest, NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

/**
 * Internal endpoint called by the Express backend after a mutation
 * so Next.js can drop its ISR cache for the affected bio page.
 *
 * Auth: shared secret in `x-revalidate-secret` (must match REVALIDATE_SECRET).
 * Body: { tag?: string, path?: string } — tag preferred for fetch-keyed caches.
 */
export async function POST(req: NextRequest) {
    const expected = process.env.REVALIDATE_SECRET
    if (!expected) {
        return NextResponse.json({ error: "Revalidation not configured" }, { status: 503 })
    }

    const provided = req.headers.get("x-revalidate-secret")
    if (provided !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: { tag?: string; path?: string }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { tag, path } = body
    if (!tag && !path) {
        return NextResponse.json({ error: "tag or path is required" }, { status: 400 })
    }

    if (tag) revalidateTag(tag)
    if (path) revalidatePath(path)

    return NextResponse.json({ revalidated: true, tag, path, now: Date.now() })
}
