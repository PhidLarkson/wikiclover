/**
 * Wikimedia Commons API Client
 * 
 * Provides functions to interact with the MediaWiki Action API
 */

const API_BASE = import.meta.env.VITE_WIKIMEDIA_API_BASE || '/w/api.php'

export interface MediaFile {
    pageid: number
    title: string
    imageinfo?: ImageInfo[]
}

interface ImageInfo {
    url: string
    thumburl?: string
    descriptionurl: string
    size: number
    width: number
    height: number
    mime: string
    timestamp: string
    user: string
    extmetadata?: Record<string, { value: string }>
}

interface ApiResponse {
    query?: {
        pages?: Record<string, MediaFile>
        allimages?: MediaFile[]
        geosearch?: Array<{ pageid: number; title: string; lat: number; lon: number }>
        searchinfo?: { totalhits: number }
        users?: Array<{ name: string; editcount: number }>
        logevents?: Array<any>
    }
    continue?: Record<string, string>
}

async function fetchApi(params: Record<string, string>): Promise<ApiResponse> {
    const url = new URL(API_BASE, window.location.origin)
    Object.entries({ ...params, format: 'json' }).forEach(([k, v]) => {
        url.searchParams.set(k, v)
    })

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
}

/**
 * Get featured pictures from Commons
 */
export async function getFeaturedPictures(limit = 20): Promise<MediaFile[]> {
    const data = await fetchApi({
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: 'Category:Featured_pictures_on_Wikimedia_Commons',
        gcmtype: 'file',
        gcmlimit: limit.toString(),
        gcmsort: 'timestamp',
        gcmdir: 'desc',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|timestamp|user|extmetadata',
        iiurlwidth: '800',
        iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist',
    })

    if (!data.query?.pages) return []
    return Object.values(data.query.pages).filter(p => p.imageinfo?.length)
}

/**
 * Get recent uploads from Commons - uses allimages API for truly fresh content
 * Filters by minimum file size to avoid thumbnails and low-quality uploads
 */
export async function getRecentUploads(limit = 20): Promise<MediaFile[]> {
    // Get newest uploads globally, filtered by minimum size
    const data = await fetchApi({
        action: 'query',
        list: 'allimages',
        aisort: 'timestamp',
        aidir: 'descending',
        ailimit: (limit * 2).toString(), // Get more to filter
        aiprop: 'url|size|mime|timestamp|user',
        aiminsize: '100000', // Min 100KB to filter out thumbnails
    })

    if (!data.query?.allimages) return []

    // Convert allimages format to MediaFile format and filter
    const files = (data.query.allimages as any[])
        .filter((img: { mime?: string }) => img.mime?.startsWith('image/'))
        .slice(0, limit)
        .map((img: { name?: string; url?: string; size?: number; width?: number; height?: number; mime?: string; timestamp?: string; user?: string; descriptionurl?: string }) => ({
            pageid: 0, // allimages doesn't return pageid
            title: `File:${img.name}`,
            imageinfo: [{
                url: img.url || '',
                descriptionurl: img.descriptionurl || '',
                size: img.size || 0,
                width: img.width || 0,
                height: img.height || 0,
                mime: img.mime || '',
                timestamp: img.timestamp || '',
                user: img.user || '',
            }]
        }))

    return files
}

/**
 * Get media near a geographic location using Wikimedia's native geosearch API
 * Uses progressive radius expansion: 1km -> 5km -> 10km
 */
export async function getNearbyMedia(lat: number, lon: number, limit = 20): Promise<MediaFile[]> {
    // Progressive radius expansion for better results
    const radii = [1000, 5000, 10000] // 1km, 5km, 10km (max is 10000m)

    for (const radius of radii) {
        try {
            // Use native geosearch generator to find images by coordinates
            const data = await fetchApi({
                action: 'query',
                generator: 'geosearch',
                ggscoord: `${lat}|${lon}`,
                ggsradius: radius.toString(),
                ggsnamespace: '6', // File namespace
                ggslimit: limit.toString(),
                prop: 'imageinfo|coordinates',
                iiprop: 'url|size|mime|timestamp|user|extmetadata',
                iiurlwidth: '800',
                iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist',
            })

            if (data.query?.pages) {
                const results = Object.values(data.query.pages).filter(p => p.imageinfo?.length)
                if (results.length >= 5) {
                    return results
                }
            }
        } catch (err) {
            console.warn(`[Nearby] Geosearch at ${radius}m failed:`, err)
        }
    }

    // Fallback: Use region/country category search
    return getRegionalFallback(lat, lon, limit)
}

/**
 * Regional fallback when no geotagged images are found nearby
 * Uses coordinate-based region detection
 */
async function getRegionalFallback(lat: number, lon: number, limit: number): Promise<MediaFile[]> {
    // Determine region based on coordinates
    let regionCategory = 'Category:Quality_images'

    // Africa: lat -35 to 37, lon -18 to 52
    if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
        // West Africa (Ghana, Nigeria, etc): lon -18 to 15
        if (lon >= -18 && lon <= 15) {
            regionCategory = 'Category:Quality_images_of_Ghana'
        }
        // East Africa
        else if (lon > 30 && lon <= 52) {
            regionCategory = 'Category:Quality_images_of_Kenya'
        }
        // South Africa
        else if (lat < -20) {
            regionCategory = 'Category:Quality_images_of_South_Africa'
        }
    }

    try {
        const data = await fetchApi({
            action: 'query',
            generator: 'categorymembers',
            gcmtitle: regionCategory,
            gcmtype: 'file',
            gcmlimit: limit.toString(),
            gcmsort: 'timestamp',
            gcmdir: 'desc',
            prop: 'imageinfo',
            iiprop: 'url|size|mime|timestamp|user|extmetadata',
            iiurlwidth: '800',
            iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist',
        })

        if (data.query?.pages) {
            const results = Object.values(data.query.pages).filter(p => p.imageinfo?.length)
            if (results.length > 0) {
                return results
            }
        }
    } catch (err) {
        console.warn('[Nearby] Regional fallback failed:', err)
    }

    // Ultimate fallback: Quality images globally
    const fallbackData = await fetchApi({
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: 'Category:Quality_images',
        gcmtype: 'file',
        gcmlimit: limit.toString(),
        gcmsort: 'timestamp',
        gcmdir: 'desc',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|timestamp|user|extmetadata',
        iiurlwidth: '800',
        iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist',
    })

    if (!fallbackData.query?.pages) return []
    return Object.values(fallbackData.query.pages).filter(p => p.imageinfo?.length)
}

/**
 * Search for media files
 */
/**
 * Search for media files
 */
export async function searchMedia(query: string, limit = 20, continueToken?: number): Promise<PaginatedResponse<MediaFile>> {
    const params: Record<string, string> = {
        action: 'query',
        generator: 'search',
        gsrsearch: `${query} filetype:bitmap`,
        gsrnamespace: '6',
        gsrlimit: limit.toString(),
        prop: 'imageinfo',
        iiprop: 'url|size|mime|timestamp|user|extmetadata',
        iiurlwidth: '800',
        iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist',
    }

    if (continueToken !== undefined) {
        params.gsroffset = continueToken.toString()
    }

    const data = await fetchApi(params)

    // For search, the continue token is gsroffset
    const nextOffset = data.continue?.gsroffset

    if (!data.query?.pages) return { data: [], continueToken: undefined }
    return {
        data: Object.values(data.query.pages).filter(p => p.imageinfo?.length),
        continueToken: nextOffset
    }
}

/**
 * Get exact total upload count for a user using search API
 */
export async function getUserUploadCount(username: string): Promise<number> {
    try {
        const data = await fetchApi({
            action: 'query',
            list: 'users',
            ususers: username,
            usprop: 'editcount'
        })
        return data.query?.users?.[0]?.editcount || 0
    } catch {
        return 0
    }
}

/**
 * Get detailed stats: total edits and upload count
 */
export async function getUserStats(username: string): Promise<{ total: number; uploads: number }> {
    try {
        const [totalRes, uploadsRes] = await Promise.all([
            fetchApi({
                action: 'query',
                list: 'users',
                ususers: username,
                usprop: 'editcount'
            }),
            fetchApi({
                action: 'query',
                list: 'logevents',
                leuser: username,
                leaction: 'upload/upload',
                lelimit: '500', // Cap at 500 for perf, display as "500+" if full
            })
        ])

        const total = totalRes.query?.users?.[0]?.editcount || 0
        const uploads = uploadsRes.query?.logevents?.length || 0

        return { total, uploads }
    } catch {
        return { total: 0, uploads: 0 }
    }
}

/**
 * Get user's uploads
 */
// Helper to handle continue token
export interface PaginatedResponse<T> {
    data: T[]
    continueToken?: string
}

/**
 * Get user's uploads with pagination
 */
export async function getUserUploads(username: string, limit = 50, continueToken?: string): Promise<PaginatedResponse<MediaFile>> {
    const params: Record<string, string> = {
        action: 'query',
        generator: 'allimages',
        gaiuser: username,
        gaisort: 'timestamp',
        gaidir: 'descending',
        gailimit: limit.toString(),
        prop: 'imageinfo',
        iiprop: 'url|size|mime|timestamp|user|extmetadata',
        iiurlwidth: '400',
        iiextmetadatafilter: 'ObjectName|LicenseShortName',
    }

    if (continueToken) {
        params.gaicontinue = continueToken
    }

    const data = await fetchApi(params)

    const media = data.query?.pages ? Object.values(data.query.pages).filter(p => p.imageinfo?.length) : []
    // The API returns continue token in a specific format for each generator
    // For allimages, it's usually continue.gcmcontinue or similar, but for logic simplicity we return the raw continue object's relevant key if present
    const nextToken = data.continue?.gaicontinue

    return { data: media, continueToken: nextToken }
}

/**
 * Get file details by title
 */
export async function getFileDetails(title: string): Promise<MediaFile | null> {
    const data = await fetchApi({
        action: 'query',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|size|mime|timestamp|user|extmetadata',
        iiurlwidth: '1200',
        iiextmetadatafilter: 'ObjectName|LicenseShortName|Artist|ImageDescription|DateTimeOriginal',
    })

    if (!data.query?.pages) return null
    const pages = Object.values(data.query.pages)
    return pages[0]?.imageinfo?.length ? pages[0] : null
}

/**
 * Upload a file to Commons (requires authentication)
 */
export async function uploadFile(
    file: File,
    filename: string,
    description: string,
    accessToken: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
    // First get a CSRF token
    const tokenRes = await fetch(`${API_BASE}?action=query&meta=tokens&format=json`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    const tokenData = await tokenRes.json()
    const csrfToken = tokenData.query?.tokens?.csrftoken

    if (!csrfToken) {
        return { success: false, error: 'Failed to get upload token' }
    }

    const formData = new FormData()
    formData.append('action', 'upload')
    formData.append('filename', filename)
    formData.append('text', description)
    formData.append('file', file)
    formData.append('token', csrfToken)
    formData.append('format', 'json')

    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
    })

    const data = await res.json()

    if (data.upload?.result === 'Success') {
        return { success: true, filename: data.upload.filename }
    }

    return {
        success: false,
        error: data.error?.info || data.upload?.warnings || 'Upload failed'
    }
}

/**
 * Get active campaigns (categories)
 */
export async function getCampaigns(limit = 10): Promise<MediaFile[]> {
    const data = await fetchApi({
        action: 'query',
        generator: 'search',
        gsrsearch: 'Wiki Loves prefix:Category:',
        gsrnamespace: '14', // Category namespace
        gsrlimit: limit.toString(),
        prop: 'categoryinfo',
    })

    if (!data.query?.pages) return []
    // Map standard page structure but we mostly care about titles
    return Object.values(data.query.pages).map(p => ({
        ...p,
        title: p.title.replace('Category:', ''),
        // Mock an image location if we want to fetch a banner later, for now just the title
        imageinfo: []
    }))
}

// --- Social Structure / Notifications ---

export interface WikiNotification {
    id: string
    type: string
    category: string
    timestamp: { utciso8601: string }
    agent: { name: string }
    title: { full: string }
    read?: string // specific timestamp or missing if unread
    revid?: number // Revision ID for linking to diff
}

/**
 * Send a 'thank you' for a specific file (latest revision)
 * Requires fetching the latest revision ID first
 */
export async function sendThankYou(pageId: number, accessToken: string): Promise<boolean> {
    try {
        // 1. Get latest revision ID for the page
        const infoRes = await fetch(`${API_BASE}?action=query&prop=info&pageids=${pageId}&format=json`)
        const infoData = await infoRes.json()
        const page = infoData.query?.pages?.[pageId]

        if (!page?.lastrevid) throw new Error('No revision found')
        const revId = page.lastrevid

        // 2. Get CSRF token
        const tokenRes = await fetch(`${API_BASE}?action=query&meta=tokens&type=csrf&format=json`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        const tokenData = await tokenRes.json()
        const csrfToken = tokenData.query?.tokens?.csrftoken

        if (!csrfToken) throw new Error('No CSRF token')

        // 3. Send thanks
        const params = new URLSearchParams({
            action: 'thank',
            rev: revId.toString(),
            token: csrfToken,
            format: 'json',
            source: 'wikicommons-camera-app'
        })

        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: params
        })

        const data = await res.json()
        if (data.result?.success || data.result?.recipient) return true // Success format varies slightly but 'result' is key
        // echo-thank returns { result: { success: 1, recipient: '...' } }

        return !!data.result
    } catch (e) {
        console.error('Failed to send thanks:', e)
        return false
    }
}

/**
 * Get recent notifications (Echo)
 */
export async function getNotifications(accessToken: string, limit = 20): Promise<{ list: WikiNotification[], count: number }> {
    try {
        const params = new URLSearchParams({
            action: 'query',
            meta: 'notifications',
            notformat: 'model',
            notlimit: limit.toString(),
            // notfilter: '!read', // Removed to show history
            format: 'json'
        })

        const res = await fetch(`${API_BASE}?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })

        const data = await res.json()
        const list = data.query?.notifications?.list || []
        const count = data.query?.notifications?.count || 0 // raw count usually

        return { list, count: typeof count === 'string' ? parseInt(count) : count }
    } catch (e) {
        console.error('Failed to get notifications:', e)
        return { list: [], count: 0 }
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id: string, accessToken: string): Promise<boolean> {
    try {
        // Get CSRF token first (should cache this properly in production but okay for now)
        const tokenRes = await fetch(`${API_BASE}?action=query&meta=tokens&type=csrf&format=json`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        const tokenData = await tokenRes.json()
        const csrfToken = tokenData.query?.tokens?.csrftoken

        if (!csrfToken) return false

        const params = new URLSearchParams({
            action: 'echomarkread',
            list: id,
            token: csrfToken,
            format: 'json'
        })

        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: params
        })

        const data = await res.json()
        return data.query?.echomarkread?.result === 'success'
    } catch {
        return false
    }
}
