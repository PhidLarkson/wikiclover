/**
 * Wikimedia Commons Upload Service
 * 
 * Handles file uploads to Commons via the API
 */

const API_BASE = '/w/api.php'

/**
 * Get CSRF token required for upload
 */
export async function getCsrfToken(accessToken: string): Promise<string> {
    const params = new URLSearchParams({
        action: 'query',
        meta: 'tokens',
        type: 'csrf',
        format: 'json',
    })

    const res = await fetch(`${API_BASE}?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) throw new Error('Failed to get CSRF token')

    const data = await res.json()
    const token = data.query?.tokens?.csrftoken

    if (!token) throw new Error('CSRF token not found in response')

    return token
}

export interface UploadParams {
    filename: string
    description: string
    source: string
    date: string
    author: string
    license: 'cc-by-sa-4.0' | 'cc-by-4.0' | 'cc0'
    categories: string[]
    location?: string
    depicts?: string[]
}

/**
 * Build the {{Information}} template for file description page
 */
function buildInformationTemplate(params: UploadParams): string {
    const licenseTemplate = {
        'cc-by-sa-4.0': '{{self|cc-by-sa-4.0}}',
        'cc-by-4.0': '{{self|cc-by-4.0}}',
        'cc0': '{{self|cc0}}',
    }[params.license]

    const categories = params.categories
        .filter(c => c.trim())
        .map(c => `[[Category:${c.trim()}]]`)
        .join('\n')

    const locationTemplate = params.location
        ? `\n{{Location|${params.location}}}`
        : ''

    const depictsTemplate = params.depicts && params.depicts.length > 0
        ? `\n{{Depicts|${params.depicts.join('|')}}}`
        : ''

    return `=={{int:filedesc}}==
{{Information
|description={{en|1=${params.description}}}
|date=${params.date}
|source=${params.source}
|author=${params.author}
|permission=
|other versions=
}}${locationTemplate}${depictsTemplate}

=={{int:license-header}}==
${licenseTemplate}

${categories}`
}

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
    const parts = dataURL.split(',')
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const binary = atob(parts[1])
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
}

export interface UploadResult {
    success: boolean
    filename?: string
    url?: string
    error?: string
    warnings?: Record<string, unknown>
}

/**
 * Upload file to Wikimedia Commons
 */
export async function uploadToCommons(
    imageData: string,
    params: UploadParams,
    accessToken: string
): Promise<UploadResult> {
    try {
        // Get CSRF token
        const csrfToken = await getCsrfToken(accessToken)

        // Convert image to blob
        const blob = dataURLtoBlob(imageData)

        // Build form data
        const formData = new FormData()
        formData.append('action', 'upload')
        formData.append('format', 'json')
        formData.append('token', csrfToken)
        formData.append('filename', params.filename)
        formData.append('text', buildInformationTemplate(params))
        formData.append('comment', `Uploaded via WikiCommons Camera: ${params.description.slice(0, 100)}`)
        formData.append('file', blob, params.filename)

        // Make upload request
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
        })

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()

        if (data.error) {
            return {
                success: false,
                error: data.error.info || data.error.code || 'Unknown error',
            }
        }

        if (data.upload?.result === 'Success') {
            return {
                success: true,
                filename: data.upload.filename,
                url: data.upload.imageinfo?.descriptionurl,
            }
        }

        if (data.upload?.result === 'Warning') {
            return {
                success: false,
                error: 'Upload has warnings',
                warnings: data.upload.warnings,
            }
        }

        return {
            success: false,
            error: 'Unexpected response',
        }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Upload failed',
        }
    }
}

/**
 * Search for Commons categories
 */
export async function searchCategories(query: string): Promise<string[]> {
    if (!query || query.length < 2) return []

    const params = new URLSearchParams({
        action: 'opensearch',
        search: `Category:${query}`,
        namespace: '14',
        limit: '10',
        format: 'json',
    })

    try {
        const res = await fetch(`${API_BASE}?${params}`)
        const data = await res.json()

        // OpenSearch returns [query, [titles], [descriptions], [urls]]
        const titles = data[1] || []
        return titles.map((t: string) => t.replace('Category:', ''))
    } catch {
        return []
    }
}
