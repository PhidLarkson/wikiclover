/**
 * Drafts Service
 * 
 * Stores captured images locally until user decides to upload
 * Organizes by location and time metadata
 */

export interface Draft {
    id: string
    imageData: string
    timestamp: number
    location?: {
        latitude: number
        longitude: number
        name?: string
    }
    title?: string
    description?: string
    status: 'draft' | 'uploading' | 'uploaded' | 'failed'
}

const STORAGE_KEY = 'wikicommons_drafts'

/**
 * Get all drafts from localStorage
 */
export function getDrafts(): Draft[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

/**
 * Save a new draft
 */
export async function saveDraft(imageData: string): Promise<Draft> {
    const drafts = getDrafts()

    // Get location if available
    let location: Draft['location'] | undefined

    try {
        if ('geolocation' in navigator) {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000
                })
            })

            location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            }

            // Try to get location name via reverse geocoding
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
                )
                const data = await res.json()
                if (data.address) {
                    location.name = data.address.city || data.address.town || data.address.village || data.address.state
                }
            } catch {
                // Ignore geocoding errors
            }
        }
    } catch {
        // Location not available
    }

    const draft: Draft = {
        id: `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        imageData,
        timestamp: Date.now(),
        location,
        status: 'draft'
    }

    drafts.unshift(draft)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))

    return draft
}

/**
 * Update a draft
 */
export function updateDraft(id: string, updates: Partial<Draft>): Draft | null {
    const drafts = getDrafts()
    const index = drafts.findIndex(d => d.id === id)

    if (index === -1) return null

    drafts[index] = { ...drafts[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))

    return drafts[index]
}

/**
 * Delete a draft
 */
export function deleteDraft(id: string): boolean {
    const drafts = getDrafts()
    const filtered = drafts.filter(d => d.id !== id)

    if (filtered.length === drafts.length) return false

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
}

/**
 * Group drafts by location
 */
export function getDraftsByLocation(): Record<string, Draft[]> {
    const drafts = getDrafts()
    const groups: Record<string, Draft[]> = {}

    for (const draft of drafts) {
        const key = draft.location?.name || 'Unknown Location'
        if (!groups[key]) groups[key] = []
        groups[key].push(draft)
    }

    return groups
}

/**
 * Group drafts by date
 */
export function getDraftsByDate(): Record<string, Draft[]> {
    const drafts = getDrafts()
    const groups: Record<string, Draft[]> = {}

    for (const draft of drafts) {
        const date = new Date(draft.timestamp)
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        if (!groups[key]) groups[key] = []
        groups[key].push(draft)
    }

    return groups
}

/**
 * Get drafts count
 */
export function getDraftsCount(): number {
    return getDrafts().length
}
