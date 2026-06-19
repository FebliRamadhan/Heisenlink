// ===========================================
// Heisenlink - SSO Client Utilities (PKCE)
// ===========================================

export interface SsoConfig {
    enabled: boolean
    clientId: string
    authorizeUrl: string
    redirectUri: string
    logoutUrl: string
    scopes: string
}

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

function base64url(buf: Uint8Array): string {
    return btoa(String.fromCharCode(...Array.from(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

export function generateCodeVerifier(): string {
    const buf = new Uint8Array(48)
    crypto.getRandomValues(buf)
    return base64url(buf)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return base64url(new Uint8Array(digest))
}

function generateState(): string {
    const buf = new Uint8Array(24)
    crypto.getRandomValues(buf)
    return base64url(buf)
}

function generateNonce(): string {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    return base64url(buf)
}

// ─── SSO Flow ────────────────────────────────────────────────────────────────

/**
 * Redirect user to SADA SSO login page with PKCE
 */
export async function redirectToSSO(config: SsoConfig): Promise<void> {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()
    const nonce = generateNonce()

    sessionStorage.setItem("sso_code_verifier", verifier)
    sessionStorage.setItem("sso_state", state)

    const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scopes,
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
    })

    window.location.href = `${config.authorizeUrl}?${params}`
}

/**
 * Parse callback URL parameters and validate state
 */
export function parseCallback(): { code: string; codeVerifier: string } {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")

    if (error) {
        const desc = params.get("error_description") ?? error
        throw new Error(`SSO error: ${desc}`)
    }

    const code = params.get("code")
    const state = params.get("state")

    if (!code || !state) {
        throw new Error("Incomplete SSO callback parameters")
    }

    const storedState = sessionStorage.getItem("sso_state")
    if (state !== storedState) {
        throw new Error("State mismatch — possible CSRF attack")
    }

    const codeVerifier = sessionStorage.getItem("sso_code_verifier")
    if (!codeVerifier) {
        throw new Error("Code verifier not found — please restart login")
    }

    // Clean up
    sessionStorage.removeItem("sso_code_verifier")
    sessionStorage.removeItem("sso_state")

    return { code, codeVerifier }
}
