/**
 * User Profile Page
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserUploads, getUserUploadCount, type MediaFile } from '@/lib/wikimedia-api'
import MediaDetail from '@/components/MediaDetail'
import { followProfile, unfollowProfile, isFollowing } from '@/pages/Favorites'
import { useToast } from '@/context/ToastContext'

export default function UserProfile() {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [uploads, setUploads] = useState<MediaFile[]>([])
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [continueToken, setContinueToken] = useState<string | undefined>(undefined)
    const [detailItem, setDetailItem] = useState<MediaFile | null>(null)
    const [following, setFollowing] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)

    const loadData = useCallback(async (token?: string) => {
        if (!username) return
        try {
            const isInitial = !token
            if (isInitial) setLoading(true)
            else setLoadingMore(true)

            const res = await getUserUploads(username, 30, token)

            setUploads(prev => isInitial ? res.data : [...prev, ...res.data])
            setContinueToken(res.continueToken)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [username])

    useEffect(() => {
        setUploads([])
        setContinueToken(undefined)
        loadData()
        if (username) {
            getUserUploadCount(username).then(setTotalCount)
            setFollowing(isFollowing(username))
        }
    }, [loadData, username])

    const handleFollowToggle = () => {
        if (!username) return
        if (following) {
            unfollowProfile(username)
            showToast('Unfollowed ' + username)
        } else {
            followProfile(username)
            showToast('Following ' + username)
        }
        setFollowing(!following)
    }

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && continueToken) {
                loadData(continueToken)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, loadingMore, continueToken, loadData])

    if (!username) return null

    return (
        <div className="profile-page">
            <button className="back-btn floating" onClick={() => navigate(-1)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>

            <div className="profile-header">
                <h1>{username}</h1>
                <div className="stats">
                    <div className="stat">
                        <b>{totalCount !== null ? totalCount : uploads.length}</b>
                        <span>Uploads</span>
                    </div>
                </div>
                <div className="action-row">
                    <button className={`follow-btn ${following ? 'following' : ''}`} onClick={handleFollowToggle}>
                        {following ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                                Following
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                                Follow
                            </>
                        )}
                    </button>
                    <a href={`https://commons.wikimedia.org/wiki/User:${username}`} target="_blank" rel="noreferrer" className="ext-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                </div>
            </div>

            <div className="content">
                <div className="grid">
                    {uploads.map((item, index) => (
                        <div
                            key={`${item.pageid}-${index}`}
                            ref={index === uploads.length - 1 ? lastElementRef : null}
                            className="item"
                            onClick={() => setDetailItem(item)}
                        >
                            <img src={item.imageinfo?.[0]?.thumburl} alt={item.title} loading="lazy" />
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="loading-overlay"><div className="spinner" /></div>
                )}

                {loadingMore && (
                    <div className="loading-more"><div className="spinner small" /></div>
                )}

                {!loading && uploads.length === 0 && (
                    <div className="empty">
                        <p>No public uploads found</p>
                    </div>
                )}
            </div>

            {detailItem && detailItem.imageinfo?.[0] && (
                <MediaDetail
                    item={{
                        title: detailItem.title.replace('File:', '').replace(/_/g, ' '),
                        url: detailItem.imageinfo[0].url || detailItem.imageinfo[0].thumburl || '',
                        thumburl: detailItem.imageinfo[0].thumburl,
                        descriptionurl: detailItem.imageinfo[0].descriptionurl,
                        author: detailItem.imageinfo[0].user
                    }}
                    onClose={() => setDetailItem(null)}
                />
            )}

            <style>{`
                .profile-page { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
                
                .back-btn.floating {
                    position: fixed; top: 16px; left: 16px; z-index: 20;
                    width: 44px; height: 44px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    padding: 0;
                }
                
                .profile-header {
                    margin-top: 60px; /* Space for the floating button */
                    display: flex; flex-direction: column;
                    padding: 0 24px 24px;
                    gap: 12px;
                }
                h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); margin: 0; }
                
                .stats { display: flex; gap: 24px; }
                .stat { display: flex; flex-direction: column; }
                .stat b { font-size: 18px; font-weight: 600; color: var(--text); }
                .stat span { font-size: 13px; color: var(--text-muted); }

                .action-row { display: flex; gap: 10px; margin-top: 8px; }
                
                .follow-btn {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 12px 20px; border-radius: 14px;
                    background: var(--accent); color: var(--accent-fg);
                    font-size: 14px; font-weight: 600;
                    transition: all 0.2s;
                }
                .follow-btn:active { transform: scale(0.98); }
                .follow-btn.following {
                    background: rgba(255,255,255,0.08);
                    color: var(--text-muted);
                }
                
                .ext-btn {
                    width: 48px; height: 48px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.08);
                    border-radius: 14px;
                    color: var(--text-muted);
                    text-decoration: none;
                }
                .ext-btn:hover { background: rgba(255,255,255,0.12); color: var(--text); }

                .content { flex: 1; overflow-y: auto; padding-bottom: 40px; }
                
                .grid { 
                    display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; 
                    padding: 0;
                }
                @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); padding: 20px; gap: 12px; } }
                
                .item { 
                    position: relative; aspect-ratio: 1; 
                    background: var(--bg-card); overflow: hidden; 
                    cursor: pointer;
                }
                .item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
                .item:active img { transform: scale(0.96); }
                
                .loading, .loading-more { display: flex; justify-content: center; padding: 20px; }
                .spinner.small { width: 20px; height: 20px; border-width: 2px; }
                .empty { text-align: center; color: var(--text-muted); padding: 40px; }
            `}</style>
        </div>
    )
}
