/**
 * Favorites Page - Grid of liked images
 */

import { useState, useEffect } from 'react'
import MediaDetail from '@/components/MediaDetail'
import Header from '@/components/Header'
import { Link } from 'react-router-dom'
import { getUserUploadCount, getFileDetails, type MediaFile } from '@/lib/wikimedia-api'


interface LikedItem {
    pageid: number
    title: string
    thumburl: string
    descriptionurl: string
    user?: string
    width?: number
    height?: number
}

// Profile/User favorites
export interface FollowedProfile {
    username: string
    followedAt: string
}

const STORAGE_KEY = 'wikicommons_likes_data'
const PROFILES_KEY = 'wikicommons_followed_profiles'

function getLikedItems(): LikedItem[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
        return []
    }
}

function removeLikedItem(pageid: number) {
    const items = getLikedItems().filter(i => i.pageid !== pageid)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

    // Also update the simple likes set
    try {
        const likes = new Set(JSON.parse(localStorage.getItem('wikicommons_likes') || '[]'))
        likes.delete(pageid)
        localStorage.setItem('wikicommons_likes', JSON.stringify([...likes]))
    } catch { /* ignore */ }
}

export function saveLikedItem(item: LikedItem) {
    const items = getLikedItems()
    if (!items.some(i => i.pageid === item.pageid)) {
        items.unshift(item)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
}

// Profile favorites functions
export function getFollowedProfiles(): FollowedProfile[] {
    try {
        return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]')
    } catch {
        return []
    }
}

export function followProfile(username: string) {
    const profiles = getFollowedProfiles()
    if (!profiles.some(p => p.username === username)) {
        profiles.unshift({ username, followedAt: new Date().toISOString() })
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
    }
}

export function unfollowProfile(username: string) {
    const profiles = getFollowedProfiles().filter(p => p.username !== username)
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function isFollowing(username: string): boolean {
    return getFollowedProfiles().some(p => p.username === username)
}

type Tab = 'gallery' | 'creators'

export default function Favorites() {
    const [items, setItems] = useState<LikedItem[]>([])
    const [profiles, setProfiles] = useState<FollowedProfile[]>([])
    const [profileCounts, setProfileCounts] = useState<Record<string, number>>({})
    const [detailItem, setDetailItem] = useState<MediaFile | null>(null)
    const [tab, setTab] = useState<Tab>('gallery')

    useEffect(() => {
        setItems(getLikedItems())
        const profs = getFollowedProfiles()
        setProfiles(profs)

        // Fetch upload counts for all followed profiles
        profs.forEach(async (p) => {
            try {
                const count = await getUserUploadCount(p.username)
                setProfileCounts(prev => ({ ...prev, [p.username]: count }))
            } catch { /* ignore */ }
        })
    }, [])

    const handleUnlike = (pageid: number) => {
        removeLikedItem(pageid)
        setItems(getLikedItems())
        if (detailItem?.pageid === pageid) setDetailItem(null)
    }

    const handleUnfollow = (e: React.MouseEvent, username: string) => {
        e.preventDefault()
        e.stopPropagation()
        unfollowProfile(username)
        setProfiles(getFollowedProfiles())
    }

    const handleItemClick = async (item: LikedItem) => {
        // Construct temporary MediaFile for immediate display
        const tempMedia: MediaFile = {
            pageid: item.pageid,
            title: item.title,
            imageinfo: [{
                url: item.thumburl, // Use thumb as placeholder if full url not available yet
                thumburl: item.thumburl,
                descriptionurl: item.descriptionurl,
                size: 0,
                width: item.width || 0,
                height: item.height || 0,
                mime: 'image/jpeg',
                timestamp: '',
                user: item.user || '',
                // If we have stored metadata, we could populate it here, but sticking to basics first
            }]
        }
        setDetailItem(tempMedia)

        // Fetch full details to get metadata, license, etc.
        try {
            const fullDetails = await getFileDetails(item.title)
            if (fullDetails) {
                setDetailItem(fullDetails)
            }
        } catch (error) {
            console.error('Failed to fetch full details:', error)
        }
    }

    return (
        <div className="fav">
            <Header />

            {/* Section Header */}
            <div className="section-header">
                <h1>Collections</h1>
                <div className="counts">
                    <span className="count-pill">{items.length} images</span>
                    <span className="count-pill">{profiles.length} creators</span>
                </div>
            </div>

            {/* Tabs like Mine page */}
            <div className="tabs">
                <button className={tab === 'gallery' ? 'on' : ''} onClick={() => setTab('gallery')}>
                    <span>Gallery</span>
                </button>
                <button className={tab === 'creators' ? 'on' : ''} onClick={() => setTab('creators')}>
                    <span>Creators</span>
                </button>
            </div>

            {tab === 'gallery' ? (
                <div className="grid">
                    {items.length === 0 ? (
                        <div className="emp">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            <p>No saved images</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.pageid} className="item" onClick={() => handleItemClick(item)}>
                                <img src={item.thumburl} alt={item.title} />
                                <button className="unlike" onClick={(e) => { e.stopPropagation(); handleUnlike(item.pageid) }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="creator-grid">
                    {profiles.length === 0 ? (
                        <div className="emp">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            <p>No followed creators</p>
                        </div>
                    ) : (
                        profiles.map(profile => (
                            <Link key={profile.username} to={`/user/${encodeURIComponent(profile.username)}`} className="creator-card">
                                <div className="creator-info">
                                    <span className="creator-name">{profile.username}</span>
                                    <span className="creator-count">{profileCounts[profile.username] ?? '—'} uploads</span>
                                </div>
                                <button className="x-btn" onClick={(e) => handleUnfollow(e, profile.username)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </Link>
                        ))
                    )}
                </div>
            )}

            {detailItem && (
                <MediaDetail
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                />
            )}

            <style>{`
        .fav { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
        
        .section-header { padding: 10px 24px 20px; text-align: center; }
        .section-header h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); margin: 0 0 8px; }
        .counts { display: flex; justify-content: center; gap: 8px; }
        .count-pill { padding: 4px 10px; background: var(--bg-card); border-radius: 12px; font-size: 12px; color: var(--text-muted); }
        
        .tabs { display: flex; justify-content: center; gap: 20px; padding: 0 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .tabs button { 
            position: relative;
            background: transparent; border: none; color: var(--text-muted); 
            font-size: 15px; font-weight: 500; padding: 8px 0;
        }
        .tabs button.on { color: var(--text); }
        .tabs button.on::after {
            content: ''; position: absolute; bottom: 0; left: 0; right: 0;
            height: 2px; background: var(--accent); border-radius: 2px;
        }
        
        .grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; padding: 0; overflow-y: auto; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 20px; } }
        
        .item { position: relative; aspect-ratio: 1; background: #1a1a1a; cursor: pointer; }
        .item img { width: 100%; height: 100%; object-fit: cover; }
        
        .unlike { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #ff4757; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .item:hover .unlike { opacity: 1; }
        
        .emp { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: var(--text-muted); }
        .emp p { font-size: 15px; margin: 0; }
        
        .creator-grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 16px; overflow-y: auto; }
        @media (min-width: 640px) { .creator-grid { grid-template-columns: repeat(3, 1fr); } }
        
        .creator-card { 
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px; background: var(--bg-card); border-radius: 14px;
            text-decoration: none; color: inherit;
            transition: transform 0.15s, background 0.15s;
        }
        .creator-card:active { transform: scale(0.98); background: rgba(255,255,255,0.08); }
        
        .creator-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .creator-name { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .creator-count { font-size: 12px; color: var(--text-muted); }
        
        .x-btn { 
            width: 28px; height: 28px; border-radius: 50%; 
            background: rgba(255,255,255,0.06); color: var(--text-muted);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .x-btn:hover { background: rgba(255,100,100,0.2); color: #ff6666; }
      `}</style>
        </div>
    )
}
