import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { type MediaFile, sendThankYou } from '@/lib/wikimedia-api'
import { useAuth } from '@/context/AuthContext'
import { getAccessToken } from '@/lib/wikimedia-auth'
import { saveLikedItem } from '@/pages/Favorites'

interface Props {
    item: MediaFile
    onClose: () => void
}

export default function MediaDetail({ item, onClose }: Props) {
    const { showToast } = useToast()
    const { user } = useAuth()

    // State for social interactions
    const [likes, setLikes] = useState<Set<number>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('wikicommons_likes') || '[]')) }
        catch { return new Set() }
    })
    const [thankedIds, setThankedIds] = useState<Set<number>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('wikicommons_thanked') || '[]')) }
        catch { return new Set() }
    })

    const info = item.imageinfo?.[0]
    const liked = likes.has(item.pageid)
    const thanked = thankedIds.has(item.pageid)

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleDownload = async () => {
        if (!info) return
        try {
            const response = await fetch(info.url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = item.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50) + '.jpg'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (e) {
            window.open(info.url, '_blank')
        }
    }

    const handleShare = async () => {
        if (!info) return
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `Check out this image on WikiClover: ${item.title}`,
                    url: info.descriptionurl
                })
            } catch (error) { }
        } else {
            try {
                await navigator.clipboard.writeText(info.descriptionurl)
                showToast('Link copied to clipboard')
            } catch (err) {
                showToast('Failed to copy link')
            }
        }
    }

    const handleThanks = async () => {
        if (!user) {
            showToast('Please login to send thanks')
            return
        }
        if (info && info.user === user.username) {
            showToast('You cannot thank yourself!')
            return
        }
        if (thanked) return

        // Optimistic UI
        setThankedIds(prev => {
            const next = new Set(prev).add(item.pageid)
            localStorage.setItem('wikicommons_thanked', JSON.stringify([...next]))
            return next
        })
        showToast(`Sent thanks to ${info?.user}!`)

        const token = await getAccessToken()
        if (token) {
            await sendThankYou(item.pageid, token)
        }
    }

    const toggleBookmark = () => {
        if (!info) return
        setLikes(prev => {
            const next = new Set(prev)
            if (next.has(item.pageid)) {
                next.delete(item.pageid)
                showToast('Removed from Bookmarks')
            } else {
                next.add(item.pageid)
                // Save specific fields for offline/quick access
                saveLikedItem({
                    pageid: item.pageid,
                    title: item.title,
                    thumburl: info.thumburl || info.url,
                    descriptionurl: info.descriptionurl,
                    user: info.user,
                    width: info.width,
                    height: info.height
                })
                showToast('Saved to Bookmarks')
            }
            localStorage.setItem('wikicommons_likes', JSON.stringify([...next]))
            return next
        })
    }

    if (!info) return null

    // Extract metadata
    const meta = info.extmetadata || {}
    const description = meta.ImageDescription?.value?.replace(/<[^>]*>?/gm, '') || ''
    const date = meta.DateTimeOriginal?.value || meta.DateTime?.value || info.timestamp
    const displayDate = date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''
    const categories = meta.Categories?.value?.split('|').map(c => c.trim()) || []
    const license = meta.LicenseShortName?.value || 'Unknown'

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="detail-glass" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="img-container">
                    <img src={info.url || info.thumburl} alt={item.title} />
                </div>

                <div className="info-sheet">
                    <div className="handle" />

                    <div className="source-badge">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/20px-Commons-logo.svg.png" alt="Commons" />
                        <span>Wikimedia Commons</span>
                    </div>

                    <h3>{item.title.replace('File:', '').replace(/_/g, ' ')}</h3>

                    <div className="meta-row">
                        {info.user && (
                            <Link to={`/user/${encodeURIComponent(info.user)}`} className="pill user" onClick={onClose}>
                                By {info.user}
                            </Link>
                        )}
                        <span className="pill license">{license}</span>
                        {displayDate && <span className="pill">{displayDate}</span>}
                    </div>

                    {description && (
                        <p className="description">
                            {description.length > 200 ? description.slice(0, 200) + '...' : description}
                        </p>
                    )}

                    {info.user !== user?.username && (
                        <div className="social-actions">
                            <button className={`soc-btn ${thanked ? 'active' : ''}`} onClick={handleThanks}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={thanked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                <span>{thanked ? 'Thanked' : 'Say Thanks'}</span>
                            </button>
                            <button className={`soc-btn ${liked ? 'active' : ''}`} onClick={toggleBookmark}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                                <span>{liked ? 'Saved' : 'Save'}</span>
                            </button>
                        </div>
                    )}

                    <div className="actions">
                        <button onClick={handleDownload} className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></div>
                            <span>Download</span>
                        </button>

                        <button onClick={handleShare} className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg></div>
                            <span>Share</span>
                        </button>

                        <a href={info.descriptionurl} target="_blank" rel="noopener noreferrer" className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></div>
                            <span>Commons</span>
                        </a>
                    </div>

                    {categories.length > 0 && (
                        <div className="categories-list">
                            {categories.slice(0, 3).map((cat, i) => (
                                <span key={i} className="cat-tag">{cat}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
            .detail-overlay {
                position: fixed; inset: 0; z-index: 200;
                background: black;
                display: flex; flex-direction: column;
                animation: fadein 0.3s ease-out;
            }
            .detail-glass {
                flex: 1; display: flex; flex-direction: column; position: relative;
            }
            .close-btn {
                position: absolute; top: 16px; right: 16px; width: 40px; height: 40px;
                border-radius: 50%; background: rgba(0,0,0,0.3); color: white;
                display: flex; align-items: center; justify-content: center; z-index: 10;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            }
            
            .img-container {
                position: absolute; inset: 0;
                display: flex; align-items: center; justify-content: center;
            }
            .img-container img { width: 100%; height: 100%; object-fit: contain; }

            .info-sheet {
                position: absolute; bottom: 0; left: 0; right: 0;
                padding: 60px 24px 40px;
                color: white;
                background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 70%, transparent 100%);
                z-index: 2;
                max-height: 80vh; overflow-y: auto;
            }
            
            .info-sheet::before {
                content: '';
                position: absolute; inset: 0; z-index: -1;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                mask-image: linear-gradient(to top, black 80%, transparent 100%);
                -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);
                pointer-events: none;
            }

            .handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.3); margin: 0 auto 20px; }
            
            .source-badge {
                display: inline-flex; align-items: center; gap: 6px;
                padding: 4px 10px 4px 4px;
                background: rgba(255,255,255,0.15);
                border-radius: 100px;
                font-size: 11px; font-weight: 500; color: white;
                margin-bottom: 12px;
                backdrop-filter: blur(10px);
            }
            .source-badge img { width: 16px; height: 16px; }

            h3 { font-size: 20px; font-weight: 600; margin-bottom: 12px; line-height: 1.3; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
            
            .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
            .pill { font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 100px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); }
            .user { color: rgba(255,255,255,0.9); text-decoration: none; display: inline-flex; }
            .license { background: hsla(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.3); color: #fff; }

            .description { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.8); margin-bottom: 24px; }

            .social-actions { display: flex; gap: 12px; margin-bottom: 24px; }
            .soc-btn {
                flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
                background: rgba(255,255,255,0.1); border-radius: 16px;
                padding: 12px; color: white; border: 1px solid rgba(255,255,255,0.1);
                transition: all 0.2s;
            }
            .soc-btn.active { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3); color: var(--accent); }
            .soc-btn:active { transform: scale(0.98); }

            .actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .action-btn {
                display: flex; flex-direction: column; align-items: center; gap: 8px;
                background: rgba(255,255,255,0.05);
                padding: 16px 12px; border-radius: 20px;
                transition: all 0.2s; text-decoration: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.05);
            }
            .action-btn:active { background: rgba(255,255,255,0.15); transform: scale(0.96); }
            .icon { color: white; display: flex; align-items: center; justify-content: center; }
            .action-btn span { font-size: 12px; font-weight: 500; color: white; }

            .categories-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .cat-tag { font-size: 11px; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }

            @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}
