/**
 * Wikimedia OAuth 2.0 Authentication with PKCE
 * 
 * For PUBLIC clients (no secret, uses PKCE code challenge)
 */

const WIKIMEDIA_AUTH_BASE = 'https://meta.wikimedia.org/w/rest.php/oauth2' // Basic OAuth & API configuration
export const WIKIMEDIA_API_BASE = 'https://commons.wikimedia.org/w/api.php'

const STORAGE_KEYS = {
    ACCESS_TOKEN: 'wikicommons_access_token',
    REFRESH_TOKEN: 'wikicommons_refresh_token',
    TOKEN_EXPIRY: 'wikicommons_token_expiry',
    CODE_VERIFIER: 'wikicommons_code_verifier',
    USER_INFO: 'wikicommons_user_info',
} as const

export interface WikimediaUser {
    id: number
    username: string
    editcount?: number
    registration?: string
}

export interface TokenResponse {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
}

// PKCE helpers
function generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return base64URLEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return base64URLEncode(new Uint8Array(hash))
}

function base64URLEncode(buffer: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i])
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Build the Wikimedia OAuth authorization URL with PKCE
 */
export async function buildAuthUrl(): Promise<string> {
    const clientId = import.meta.env.VITE_WIKIMEDIA_CLIENT_ID
    // Dynamic redirect URI based on current origin - fixes localhost vs production issues
    const redirectUri = `${window.location.origin}/auth/callback`

    if (!clientId) {
        throw new Error('VITE_WIKIMEDIA_CLIENT_ID is not configured')
    }

    // Generate and store PKCE verifier
    const codeVerifier = generateCodeVerifier()
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        scope: 'basic createeditmovepage uploadfile',
    })

    return `${WIKIMEDIA_AUTH_BASE}/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token (PKCE flow)
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const clientId = import.meta.env.VITE_WIKIMEDIA_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/callback`
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER)

    if (!codeVerifier) {
        throw new Error('Code verifier not found. Please restart the login process.')
    }

    const response = await fetch(`${WIKIMEDIA_AUTH_BASE}/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
    }

    const tokenData: TokenResponse = await response.json()
    storeTokens(tokenData)
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
    return tokenData
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<TokenResponse | null> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    const clientId = import.meta.env.VITE_WIKIMEDIA_CLIENT_ID

    if (!refreshToken) return null

    try {
        const response = await fetch(`${WIKIMEDIA_AUTH_BASE}/access_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
            }),
        })

        if (!response.ok) {
            clearTokens()
            return null
        }

        const tokenData: TokenResponse = await response.json()
        storeTokens(tokenData)
        return tokenData
    } catch {
        clearTokens()
        return null
    }
}

function storeTokens(tokenData: TokenResponse): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token)
    const expiry = Date.now() + tokenData.expires_in * 1000
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString())
}

export function clearTokens(): void {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER)
}

export async function getAccessToken(): Promise<string | null> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
    if (!token) return null
    if (expiry && Date.now() > parseInt(expiry, 10) - 300000) {
        const refreshed = await refreshAccessToken()
        return refreshed?.access_token || null
    }
    return token
}

export function isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
}

export function getStoredUserInfo(): WikimediaUser | null {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    return stored ? JSON.parse(stored) : null
}

export async function fetchUserInfo(): Promise<WikimediaUser | null> {
    const token = await getAccessToken()
    if (!token) return null

    try {
        const res = await fetch(`${WIKIMEDIA_API_BASE}?action=query&meta=userinfo&uiprop=editcount|registration&format=json&origin=*`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const userinfo = data.query?.userinfo
        if (userinfo?.id) {
            const user: WikimediaUser = {
                id: userinfo.id,
                username: userinfo.name,
                editcount: userinfo.editcount,
                registration: userinfo.registration,
            }
            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
            return user
        }
    } catch (err) {
        console.error('Failed to fetch user info:', err)
    }
    return null
}

export async function login(): Promise<void> {
    const authUrl = await buildAuthUrl()
    window.location.href = authUrl
}

export function logout(): void {
    clearTokens()
}
