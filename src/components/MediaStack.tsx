import { useState, useEffect, useRef, useCallback } from 'react'
import { type MediaFile, sendThankYou } from '@/lib/wikimedia-api'
import { getAccessToken } from '@/lib/wikimedia-auth'
import { useAuth } from '@/context/AuthContext'
import { saveLikedItem } from '@/pages/Favorites'
import MediaDetail from './MediaDetail'
import { useToast } from '@/context/ToastContext'

interface Props {
    media: MediaFile[]
    startIndex?: number
    onIndexChange?: (index: number) => void
    onLoadMore?: () => void
    isLoading?: boolean
}

function stripHtml(html: string): string {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100)
}


// ... (keep intervening code if possible, or include it)
// To minimize replacement size, I will only replace the top component logic if I can, but here I need to inject `const { showToast } = useToast()` at step 21. 
// And also replace the button click handlers.
// Actually, I can replace the whole function body or just parts. 
// Let's replace the whole `acts` block and the toast script block.

// WAIT, I sent `MediaStack` content in previous steps. 
// I'll replace the `acts` block first.

// SPLITTING INTO TWO CALLS because `acts` and `script` are far apart.
// This call is for imports (already done) and adding hook.
// WAIT, I need to add `const { showToast } = useToast()` inside the function component.

export default function MediaStack({ media, startIndex = 0, onIndexChange, onLoadMore, isLoading }: Props) {
    const { showToast } = useToast()
    const [idx, setIdx] = useState(startIndex)
    const [likes, setLikes] = useState<Set<number>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('wikicommons_likes') || '[]')) }
        catch { return new Set() }
    })
    const [dragX, setDragX] = useState(0)
    const startX = useRef(0)
    const dragging = useRef(false)
    const [detailItem, setDetailItem] = useState<MediaFile | null>(null)
    const [thankedIds, setThankedIds] = useState<Set<number>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('wikicommons_thanked') || '[]')) }
        catch { return new Set() }
    })
    const { user } = useAuth()

    const handleThanks = async (item: MediaFile) => {
        if (!user) {
            showToast('Please login to send thanks')
            return
        }
        if (item.imageinfo?.[0]?.user === user.username) {
            showToast('You cannot thank yourself!')
            return
        }
        if (thankedIds.has(item.pageid)) return

        // Optimistic UI
        setThankedIds(prev => {
            const next = new Set(prev).add(item.pageid)
            localStorage.setItem('wikicommons_thanked', JSON.stringify([...next]))
            return next
        })
        showToast(`Sent thanks to ${item.imageinfo?.[0]?.user}!`)

        const token = await getAccessToken()
        if (token) {
            const success = await sendThankYou(item.pageid, token)
            if (!success) {
                // Revert only on failure? Or just silently fail?
                // For now, let's keep it optimistic.
            }
        }
    }

    // Sync idx to startIndex, but clamp to valid range
    useEffect(() => {
        const maxIdx = Math.max(0, media.length - 1)
        const validIdx = Math.min(startIndex, maxIdx)
        setIdx(validIdx >= 0 ? validIdx : 0)
    }, [startIndex, media.length])

    const go = useCallback((dir: 1 | -1) => {
        const next = idx + dir
        // If at the end and swiping forward, trigger load more
        if (next >= media.length && dir === 1 && onLoadMore) {
            onLoadMore()
            return
        }
        if (next < 0 || next >= media.length) return
        setIdx(next)
        onIndexChange?.(next)
        // Also trigger preload when 5 items from end
        if (next >= media.length - 5 && onLoadMore) onLoadMore()
    }, [idx, media.length, onLoadMore, onIndexChange])

    // Gentler swipe - 30px threshold instead of 60
    const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; dragging.current = true }
    const onTouchMove = (e: React.TouchEvent) => { if (dragging.current) setDragX((e.touches[0].clientX - startX.current) * 0.5) }
    const onTouchEnd = () => {
        dragging.current = false
        if (Math.abs(dragX) > 30) go(dragX < 0 ? 1 : -1)
        else if (Math.abs(dragX) < 5) {
            // Tap detected
            setDetailItem(media[idx])
        }
        setDragX(0)
    }

    const toggleLike = (item: MediaFile) => {
        const id = item.pageid
        const info = item.imageinfo?.[0]

        setLikes(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
                if (info) {
                    saveLikedItem({ pageid: id, title: item.title, thumburl: info.thumburl || info.url, descriptionurl: info.descriptionurl })
                }
            }
            localStorage.setItem('wikicommons_likes', JSON.stringify([...next]))
            return next
        })
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [go])

    if (media.length === 0 && !isLoading) return <div className="empty"><p>No media</p></div>

    const current = media[idx]
    const info = current?.imageinfo?.[0]
    if (!current || !info) {
        if (isLoading) return <div className="loading-overlay"><div className="spinner" /></div>
        return <div className="empty"><p>No media</p></div>
    }

    const meta = info.extmetadata
    const title = meta?.ObjectName?.value ? stripHtml(meta.ObjectName.value).replace(/_/g, ' ') : current.title.replace('File:', '').replace(/_/g, ' ').replace(/\.[^.]+$/, '')
    const license = (() => {
        const l = stripHtml(meta?.LicenseShortName?.value || '')
        if (l.includes('Public')) return 'PD'
        if (l.includes('CC BY-SA')) return 'CC BY-SA'
        if (l.includes('CC BY')) return 'CC BY'
        if (l.includes('CC')) return 'CC'
        return l.slice(0, 8) || '©'
    })()
    const liked = likes.has(current.pageid)

    return (
        <div className="stack">
            <div className="deck" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClick={() => setDetailItem(current)}>
                {media[idx + 2] && <div className="card bg c3"><img src={media[idx + 2].imageinfo?.[0]?.thumburl} alt="" /></div>}
                {media[idx + 1] && <div className="card bg c2"><img src={media[idx + 1].imageinfo?.[0]?.thumburl} alt="" /></div>}

                <div className="card main" style={{ transform: `translateX(${dragX}px) rotate(${dragX * 0.015}deg)` }}>
                    <img src={info.thumburl || info.url} alt={title} />

                    <div className="top">
                        <span className="user">{info.user}</span>
                        <span className="pill">{license}</span>
                    </div>

                    {/* Blur fade bottom */}
                    <div className="bottom">
                        <p className="title">{title}</p>
                    </div>

                    <div className="acts">
                        {/* Thanks / Heart Button */}
                        <button className={`act ${thankedIds.has(current.pageid) ? 'liked' : ''}`}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleThanks(current);
                            }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={thankedIds.has(current.pageid) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>

                        {/* Bookmark / Favorite Button (was Heart) */}
                        <button className={`act ${liked ? 'liked' : ''}`}
                            onTouchEnd={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(current);
                                showToast(liked ? 'Removed from Bookmarks' : 'Saved to Bookmarks')
                            }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>

                        <button className="act" onTouchEnd={(e) => e.stopPropagation()} onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.share) {
                                navigator.share({ url: info.descriptionurl }).catch(() => {
                                    navigator.clipboard.writeText(info.descriptionurl)
                                    showToast('Link copied')
                                })
                            } else {
                                navigator.clipboard.writeText(info.descriptionurl)
                                showToast('Link copied')
                            }
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {detailItem && detailItem.imageinfo?.[0] && (
                <MediaDetail
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                />
            )}

            <style>{`
                .stack { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 50px 16px 90px; overflow: hidden; }
                .deck { position: relative; width: 100%; max-width: 320px; aspect-ratio: 3/4; cursor: pointer; }
                @media (min-width: 768px) { .deck { max-width: 380px; } }
                @media (min-width: 1024px) { .deck { max-width: 420px; } }
                
                .card { position: absolute; inset: 0; border-radius: 20px; overflow: hidden; background: var(--bg-card); }
                .card img { width: 100%; height: 100%; object-fit: cover; }
                
                .card.bg { pointer-events: none; }
                .card.c3 { transform: translateY(-8px) rotate(3deg); opacity: 0.35; }
                .card.c2 { transform: translateY(-4px) rotate(-1.5deg); opacity: 0.6; }
                .card.main { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transition: transform 0.15s ease-out; }
                
                .top { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center; }
                .user { font-size: 12px; font-weight: 500; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
                .pill { padding: 4px 10px; font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; color: #fff; }
                
                /* Blur fade instead of dark gradient */
                .bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 32px 12px 12px; background: linear-gradient(0deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, transparent 100%); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
                .title { font-size: 13px; font-weight: 500; color: #fff; line-height: 1.35; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
                
                .acts { position: absolute; right: 10px; bottom: 50px; display: flex; flex-direction: column; gap: 8px; }
                .act { width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #fff; display: flex; align-items: center; justify-content: center; transition: transform 0.1s; }
                .act:active { transform: scale(0.9); }
                .act.liked { color: var(--accent); }
        
                .emp { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: var(--text-muted); }
                .empty { 
                    position: fixed; inset: 0; z-index: 50;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; 
                    gap: 16px; color: var(--text-muted); background: var(--bg);
                }
                .ld { display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    )
}

