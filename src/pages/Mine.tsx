/**
 * Mine Page - Clean drafts/uploads
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getDrafts, deleteDraft, type Draft } from '@/lib/drafts'
import { getUserUploads, getUserStats, type MediaFile } from '@/lib/wikimedia-api'

type Tab = 'drafts' | 'uploads'

import MediaDetail from '@/components/MediaDetail'
import Header from '@/components/Header'

type SortOrder = 'newest' | 'oldest' | 'az'

export default function Mine() {
    const navigate = useNavigate()
    const { user, isLoggedIn } = useAuth()
    const [tab, setTab] = useState<Tab>('drafts')
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
    const [drafts, setDrafts] = useState<Draft[]>([])
    const [uploads, setUploads] = useState<MediaFile[]>([])
    const [stats, setStats] = useState<{ total: number; uploads: number } | null>(null)
    const [showTooltip, setShowTooltip] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [continueToken, setContinueToken] = useState<string | undefined>(undefined)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [detailItem, setDetailItem] = useState<MediaFile | null>(null)
    const observer = useRef<IntersectionObserver | null>(null)

    useEffect(() => { setDrafts(getDrafts()) }, [])

    const loadUploads = useCallback(async (token?: string) => {
        if (!user?.username || !isLoggedIn) return
        try {
            const isInitial = !token
            if (isInitial) setLoading(true)
            else setLoadingMore(true)

            const res = await getUserUploads(user.username, 30, token)

            setUploads(prev => isInitial ? res.data : [...prev, ...res.data])
            setContinueToken(res.continueToken)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [user, isLoggedIn])

    useEffect(() => {
        if (tab === 'uploads') {
            // Load initial uploads if empty or if switching back
            if (uploads.length === 0) loadUploads()
        }
    }, [tab, loadUploads, uploads.length])

    // Fetch upload count immediately
    useEffect(() => {
        if (isLoggedIn && user?.username) {
            getUserStats(user.username).then(setStats)
        }
    }, [isLoggedIn, user?.username])

    const toggleStatsTooltip = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowTooltip(!showTooltip)
    }

    // Close tooltip on clicking elsewhere
    useEffect(() => {
        if (showTooltip) {
            const close = () => setShowTooltip(false)
            window.addEventListener('click', close)
            return () => window.removeEventListener('click', close)
        }
    }, [showTooltip])

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && continueToken) {
                loadUploads(continueToken)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, loadingMore, continueToken, loadUploads])

    const confirmDelete = () => {
        if (deleting) {
            deleteDraft(deleting)
            setDrafts(getDrafts())
            setDeleting(null)
        }
    }

    const handleUploadDraft = (draft: Draft) => {
        navigate('/upload', { state: { draftId: draft.id } })
    }

    const getSortedData = () => {
        if (tab === 'drafts') {
            return [...drafts].sort((a, b) => {
                const timeA = a.timestamp || 0
                const timeB = b.timestamp || 0
                if (sortOrder === 'newest') return timeB - timeA
                if (sortOrder === 'oldest') return timeA - timeB
                return 0
            })
        }
        return [...uploads].sort((a, b) => {
            const timeA = new Date(a.imageinfo?.[0]?.timestamp || 0).getTime()
            const timeB = new Date(b.imageinfo?.[0]?.timestamp || 0).getTime()
            if (sortOrder === 'newest') return timeB - timeA
            if (sortOrder === 'oldest') return timeA - timeB
            if (sortOrder === 'az') return a.title.localeCompare(b.title)
            return 0
        })
    }

    const sortedItems = getSortedData()

    return (
        <div className="mine">
            <Header />

            {/* User Profile Header */}
            <div className="profile-header">
                {isLoggedIn ? (
                    <>
                        <h1>{user?.username}</h1>
                        <div className="stats">
                            <div className="stat" onClick={toggleStatsTooltip}>
                                <b>{stats ? stats.total : uploads.length}</b>
                                <span>Contributions</span>

                                {showTooltip && stats && (
                                    <div className="stat-tooltip" onClick={e => e.stopPropagation()}>
                                        <div className="tooltip-row">
                                            <span>Total</span>
                                            <b>{stats.total}</b>
                                        </div>
                                        <div className="tooltip-divider" />
                                        <div className="tooltip-row">
                                            <span>Uploads</span>
                                            <b>{stats.uploads >= 500 ? '500+' : stats.uploads}</b>
                                        </div>
                                        <div className="tooltip-row">
                                            <span>Other Edits</span>
                                            <b>{Math.max(0, stats.total - stats.uploads)}</b>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="stat">
                                <b>{drafts.length}</b>
                                <span>Drafts</span>
                            </div>
                        </div>
                        <a href={`https://commons.wikimedia.org/wiki/User:${user?.username}`} target="_blank" rel="noreferrer" className="view-profile">
                            View on Wikimedia Commons
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </a>
                    </>
                ) : (
                    <div className="guest-header glass-card">
                        <div className="welcome-content">
                            <h1>Welcome to Clover</h1>
                            <p>Capture, share, and contribute to the world's largest open media repository.</p>
                            <button className="login-btn-large" onClick={() => navigate('/login')}>
                                Log In to Contribute
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="tabs">
                <button className={tab === 'drafts' ? 'on' : ''} onClick={() => setTab('drafts')}>
                    <span>Drafts</span>
                </button>
                <button className={tab === 'uploads' ? 'on' : ''} onClick={() => setTab('uploads')} disabled={!isLoggedIn}>
                    <span>Gallery</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <button
                    className="filter-pill"
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {sortOrder === 'newest' ? <path d="M3 6h18M3 12h12M3 18h6" /> : <path d="M3 6h6M3 12h12M3 18h18" />}
                    </svg>
                    {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </button>
            </div>

            {
                tab === 'drafts' && (
                    <div className="grid">
                        {sortedItems.length === 0 ? (
                            <div className="emp">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /></svg>
                                <p>No drafts</p>
                            </div>
                        ) : (sortedItems as Draft[]).map(d => (
                            <div key={d.id} className="item" onClick={() => isLoggedIn && handleUploadDraft(d)}>
                                <img src={d.imageData} alt="" />
                                <button className="del" onClick={(e) => { e.stopPropagation(); setDeleting(d.id); }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                                {isLoggedIn && (
                                    <button className="up" onClick={(e) => { e.stopPropagation(); handleUploadDraft(d); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            }

            {
                tab === 'uploads' && (
                    <div className="grid">
                        {(sortedItems as MediaFile[]).map((u, i) => (
                            <div
                                key={`${u.pageid}-${i}`}
                                ref={i === uploads.length - 1 ? lastElementRef : null}
                                className="item"
                                onClick={() => setDetailItem(u)}
                            >
                                <img src={u.imageinfo?.[0]?.thumburl} alt="" />
                            </div>
                        ))}

                        {loading && <div className="loading-overlay"><div className="spinner" /></div>}
                        {loadingMore && <div className="emp"><div className="spinner small" /></div>}

                        {!loading && uploads.length === 0 && (
                            <div className="emp">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                <p>No uploads yet</p>
                            </div>
                        )}
                    </div>
                )
            }

            {
                detailItem && detailItem.imageinfo?.[0] && (
                    <MediaDetail
                        item={detailItem}
                        onClose={() => setDetailItem(null)}
                    />
                )
            }

            {/* Delete modal */}
            {
                deleting && (
                    <div className="modal-overlay" onClick={() => setDeleting(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            <p>Delete this draft?</p>
                            <div className="modal-btns">
                                <button className="cancel" onClick={() => setDeleting(null)}>Cancel</button>
                                <button className="confirm" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
        .mine { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
        
        .profile-header {
            padding: 10px 24px 24px;
            display: flex; flex-direction: column; gap: 12px;
            background: transparent;
        }
        .profile-header h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); margin: 0; }
        
        .stats { display: flex; gap: 24px; }
        .stat { position: relative; display: flex; flex-direction: column; cursor: pointer; }
        .stat b { font-size: 18px; font-weight: 600; color: var(--text); }
        .stat span { font-size: 13px; color: var(--text-muted); }

        .stat-tooltip {
            position: absolute;
            top: 120%;
            left: 0;
            min-width: 220px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 16px;
            z-index: 100;
            box-shadow: 0 4px 24px rgba(0,0,0,0.6);
            animation: fadeScale 0.2s ease-out;
            cursor: default;
        }
        .stat-tooltip::after {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 20px;
            border: 6px solid transparent;
            border-bottom-color: #1a1a1a;
        }
        
        .tooltip-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .tooltip-row:last-child { margin-bottom: 0; }
        .tooltip-row span { color: #888; font-weight: 500; }
        .tooltip-row b { color: #fff; font-weight: 600; font-family: monospace; }
        
        .tooltip-divider {
            height: 1px;
            background: #333;
            margin: 12px 0;
        }
        
        @keyframes fadeScale {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .view-profile {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 14px; color: var(--accent); text-decoration: none;
            margin-top: 4px; font-weight: 500;
        }
        
        .guest-header { width: 100%; }
        .glass-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px;
            padding: 30px 20px;
            margin-top: 10px;
        }
        .welcome-content { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; }
        .welcome-content h1 { font-size: 24px; font-weight: 700; color: var(--text); margin: 0; letter-spacing: -0.5px; }
        .welcome-content p { font-size: 15px; line-height: 1.5; color: var(--text-secondary); max-width: 280px; margin: 0; }
        
        .loading, .loading-more { width: 100%; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .login-btn-large {
            width: 100%; max-width: 240px; padding: 16px;
            background: var(--accent); color: var(--black);
            border-radius: 16px; font-weight: 600; font-size: 16px;
            box-shadow: 0 4px 20px rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.3);
            transition: transform 0.2s;
        }
        .login-btn-large:active { transform: scale(0.98); }
        
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

        .filter-bar { 
            padding: 0 24px 16px; display: flex; gap: 8px; 
        }
        .filter-pill {
            background: rgba(255,255,255,0.05); color: var(--text-muted);
            border: 1px solid transparent; padding: 6px 12px; border-radius: 20px;
            font-size: 13px; font-weight: 500; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
        }
        .filter-pill:hover { background: rgba(255,255,255,0.1); color: var(--text); }
        
        .grid { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; padding: 0; overflow-y: auto; }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 20px; } }
        
        .item { position: relative; aspect-ratio: 1; background: #1a1a1a; cursor: pointer; transition: transform 0.1s; }
        .item:active { transform: scale(0.98); }
        .item img { width: 100%; height: 100%; object-fit: cover; }
        
        .del, .up { position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .del { top: 8px; right: 8px; }
        .up { bottom: 8px; right: 8px; background: var(--accent); color: var(--black); }
        .item:hover .del, .item:hover .up { opacity: 1; }
        
        .emp { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: var(--text-muted); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
        .modal { background: var(--bg-card); border-radius: 20px; padding: 24px; text-align: center; max-width: 280px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .modal svg { color: #ef4444; margin-bottom: 12px; }
        .modal p { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 24px; }
        .modal-btns { display: flex; gap: 12px; }
        .modal-btns button { flex: 1; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 14px; }
        .cancel { background: var(--border); color: var(--text); }
        .confirm { background: #ef4444; color: #fff; }
      `}</style>
        </div>
    )
}
