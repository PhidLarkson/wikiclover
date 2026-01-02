/**
 * Feed Page - Persists position across refresh, loads more content
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import MediaStack from '@/components/MediaStack'
import Header from '@/components/Header'
import { getFeaturedPictures, getRecentUploads, getNearbyMedia, type MediaFile } from '@/lib/wikimedia-api'

type FeedMode = 'featured' | 'recent' | 'nearby'

interface TabState {
    media: MediaFile[]
    index: number
    continueToken?: string
    seenIds: Set<number>
}

const STORAGE_KEY = 'wikicommons_feed_state'

function loadPersistedState(): Record<FeedMode, TabState> {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            // Only restore index, not media (will reload fresh)
            return {
                featured: { media: [], index: parsed.featured?.index || 0, seenIds: new Set() },
                recent: { media: [], index: parsed.recent?.index || 0, seenIds: new Set() },
                nearby: { media: [], index: parsed.nearby?.index || 0, seenIds: new Set() },
            }
        }
    } catch { }
    return {
        featured: { media: [], index: 0, seenIds: new Set() },
        recent: { media: [], index: 0, seenIds: new Set() },
        nearby: { media: [], index: 0, seenIds: new Set() }
    }
}

function savePersistedState(state: Record<FeedMode, TabState>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        featured: { index: state.featured.index },
        recent: { index: state.recent.index },
        nearby: { index: state.nearby.index },
    }))
}

export default function Feed() {

    const [mode, setMode] = useState<FeedMode>('featured')
    const [isLoading, setIsLoading] = useState(true)
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

    const [tabStates, setTabStates] = useState<Record<FeedMode, TabState>>(loadPersistedState)

    const loadedRef = useRef<Set<FeedMode>>(new Set())

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { },
                { timeout: 10000 }
            )
        }
    }, [])

    const loadMedia = useCallback(async (feedMode: FeedMode, append = false) => {
        setIsLoading(true)
        try {
            const limit = 50
            let data: MediaFile[]

            switch (feedMode) {
                case 'featured': data = await getFeaturedPictures(limit); break
                case 'recent': data = await getRecentUploads(limit); break
                case 'nearby': data = await getNearbyMedia(location?.lat || 5.6, location?.lng || -0.2, limit); break
                default: data = await getFeaturedPictures(limit)
            }

            setTabStates(prev => {
                const existing = prev[feedMode].media
                const filtered = data.filter(d => !existing.some(m => m.pageid === d.pageid))
                const newState = {
                    ...prev,
                    [feedMode]: {
                        ...prev[feedMode],
                        media: append ? [...existing, ...filtered] : data,
                    }
                }
                savePersistedState(newState)
                return newState
            })
        } catch { /* ignore */ }
        finally { setIsLoading(false) }
    }, [location])

    useEffect(() => {
        if (!loadedRef.current.has(mode)) {
            loadedRef.current.add(mode)
            loadMedia(mode)
        }
    }, [mode, loadMedia])

    const handleIndexChange = useCallback((index: number) => {
        setTabStates(prev => {
            const newState = { ...prev, [mode]: { ...prev[mode], index } }
            savePersistedState(newState)
            return newState
        })
    }, [mode])

    const handleLoadMore = useCallback(() => {
        if (!isLoading) loadMedia(mode, true)
    }, [mode, isLoading, loadMedia])

    const currentState = tabStates[mode]

    return (
        <div className="feed">
            <Header />

            <div className="tabs">
                {(['featured', 'recent', 'nearby'] as FeedMode[]).map(m => (
                    <button key={m} className={`tab ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>
                        {m === 'featured' && <svg width="16" height="16" viewBox="0 0 24 24" fill={mode === m ? 'var(--accent)' : 'none'} stroke={mode === m ? 'var(--accent)' : 'currentColor'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                        {m === 'recent' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mode === m ? 'var(--accent)' : 'currentColor'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        {m === 'nearby' && <svg width="16" height="16" viewBox="0 0 24 24" fill={mode === m ? 'var(--accent)' : 'none'} stroke={mode === m ? 'var(--accent)' : 'currentColor'} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                    </button>
                ))}
            </div>

            <MediaStack
                media={currentState.media}
                startIndex={currentState.index}
                onIndexChange={handleIndexChange}
                onLoadMore={handleLoadMore}
                isLoading={isLoading}
            />

            <style>{`
        .feed { display: flex; flex-direction: column; height: 100%; background: var(--bg); overflow: hidden; }
        .hdr { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; }
        .hb { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
        .logo { display: block; }
        
        .tabs { display: flex; justify-content: center; gap: 6px; padding: 0 16px 4px; }
        .tab { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--text-muted); }
        .tab.on { background: rgba(255,255,255,0.05); }
      `}</style>
        </div>
    )
}
