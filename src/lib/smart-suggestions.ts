/**
 * Smart Suggestions Service
 * 
 * Analyzes image data to provide smart defaults for Title, Description, and Categories.
 * Uses metadata (Date) and basic patterns.
 */

export interface SmartMetaData {
    date?: string
    title?: string
    description?: string
    categories: string[]
    location?: string
}

export async function generateSmartSuggestions(_fileData: string): Promise<SmartMetaData> {
    const suggestions: SmartMetaData = {
        categories: []
    }

    // 1. Extract Date from basic string (if present in specific format)
    // In a real app, we'd parse EXIF. For now, we default to today if not found.
    const today = new Date().toISOString().split('T')[0]
    suggestions.date = today

    // 2. Generate a basic Title Idea
    // We can't see the image content without AI, but we can structure it.
    suggestions.title = `Upload ${today}`

    // 3. Suggest basic categories based on time
    // Example: "Night" if uploaded late? (Rough heuristic)
    const hour = new Date().getHours()
    if (hour < 6 || hour > 20) {
        suggestions.categories.push('Night')
    } else {
        suggestions.categories.push('Daylight')
    }

    // 4. Note: Real location extraction requires an EXIF parsing library like 'exif-js'
    // For now we return empty location.

    return suggestions
}
