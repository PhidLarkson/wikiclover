import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'
import { getFileDetails, type WikiNotification } from '@/lib/wikimedia-api'

const NotificationItem = ({ n, markAsRead, navigate }: { n: WikiNotification, markAsRead: (id: string) => void, navigate: any }) => {
    const isRead = !!n.read
    const [thumb, setThumb] = useState<string | null>(null)
    const isFile = n.title?.full?.startsWith('File:')

    useEffect(() => {
        let mounted = true
        if (isFile) {
            getFileDetails(n.title.full).then(file => {
                if (mounted && file?.imageinfo?.[0]?.thumburl) {
                    setThumb(file.imageinfo[0].thumburl)
                } else if (mounted && file?.imageinfo?.[0]?.url) {
                    // Fallback to full url (resize via CSS) if thumb missing
                    setThumb(file.imageinfo[0].url)
                }
            })
        }
        return () => { mounted = false }
    }, [n.title.full, isFile])

    const handleClick = () => {
        if (!isRead) markAsRead(n.id)

        // Navigate to reference
        // If it's a file, we can open it externally for now (safest for "reference page")
        // Or if we have a local viewer.
        if (isFile) {
            // For now, let's open the external Commons page in a new tab as it's a "Reference Page"
            const slug = n.title.full.replace(/ /g, '_')
            window.open(`https://commons.wikimedia.org/wiki/${slug}`, '_blank')
        } else if (n.title?.full?.startsWith('User talk:')) {
            const slug = n.title.full.replace(/ /g, '_')
            window.open(`https://commons.wikimedia.org/wiki/${slug}`, '_blank')
        }
    }

    // Icon based on type
    const renderIcon = () => {
        if (n.type === 'thank-you-edit') {
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        }
        if (n.type === 'mention' || n.type === 'user-talk') {
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        }
        if (n.type === 'welcome') {
            return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        }
        return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
    }

    return (
        <div className={`item ${isRead ? 'read' : 'unread'}`} onClick={handleClick}>
            <div className="icon-col">
                <div className={`type-icon ${n.type}`}>
                    {renderIcon()}
                </div>
            </div>

            <div className="details">
                <div className="msg-row">
                    <span className="agent">{n.agent?.name}</span>
                    <span className="action-text">
                        {n.type === 'thank-you-edit' ? 'thanked you for' :
                            n.type === 'welcome' ? 'welcomed you' :
                                'notified you'}
                    </span>
                </div>

                {/* Reference/Subject Line */}
                {n.title?.full && n.type !== 'welcome' && (
                    <div className="subject-line">
                        <span className="ref-label">RE:</span> {n.title.full}
                    </div>
                )}

                <div className="meta">
                    <span className="time">{new Date(n.timestamp?.utciso8601).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Thumbnail for Media */}
            {thumb && (
                <div className="thumb-col">
                    <img src={thumb} alt="" />
                </div>
            )}

            {!isRead && <div className="dot" />}
        </div>
    )
}

export default function Notifications() {
    const { notifications, unreadCount, isLoading, markAsRead, refreshNotifications } = useNotifications()
    const { isLoggedIn } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            // Logic handled by protected route usually, but for now safe to leave
        }
    }, [isLoading, isLoggedIn, navigate])

    return (
        <div className="page">
            <Header />
            <div className="content">
                <div className="top-bar">
                    <h1>Notifications</h1>
                    {unreadCount > 0 && (
                        <button className="mark-read-all" onClick={() => notifications.forEach(n => markAsRead(n.id))}>
                            Mark all read
                        </button>
                    )}
                </div>

                {isLoading && <div className="loading"><div className="spinner" /></div>}

                {!isLoading && notifications.length === 0 && (
                    <div className="empty">
                        <div className="icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                        <button onClick={refreshNotifications} className="refresh-btn">Refresh</button>
                    </div>
                )}

                <div className="list">
                    {notifications.map(n => (
                        <NotificationItem
                            key={n.id}
                            n={n}
                            markAsRead={markAsRead}
                            navigate={navigate}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                .page { min-height: 100vh; background: var(--bg); color: var(--text); }
                .content { padding: 0 16px 80px; max-width: 600px; margin: 0 auto; }
                
                .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-top: 8px; }
                h1 { font-size: 24px; font-weight: 700; margin: 0; }
                .mark-read-all { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 500; cursor: pointer; }
                
                .loading { padding: 40px; display: flex; justify-content: center; }
                
                .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
                .empty .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
                .empty h3 { margin: 0 0 8px; color: var(--text); }
                .refresh-btn { margin-top: 16px; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; color: var(--text); cursor: pointer; }

                .list { display: flex; flex-direction: column; gap: 12px; }
                .item { 
                    display: flex; gap: 16px; padding: 16px; 
                    background: var(--surface); border-radius: 16px;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                    cursor: pointer;
                    align-items: center;
                }
                
                .item.unread { 
                    background: var(--bg-card); 
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                
                .item.read { opacity: 0.75; background: transparent; }

                .icon-col { display: flex; flex-shrink: 0; }
                .type-icon {
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.05); color: var(--text);
                }
                /* Specific icon colors */
                .type-icon.thank-you-edit { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                .type-icon.mention { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
                
                .details { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
                
                .msg-row { font-size: 15px; line-height: 1.4; color: var(--text); }
                .agent { font-weight: 700; margin-right: 4px; }
                .action-text { color: var(--text-muted); }
                
                .subject-line { 
                    font-size: 13px; color: var(--accent); 
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    font-weight: 500;
                    background: rgba(var(--accent-rgb), 0.05);
                    padding: 2px 8px; border-radius: 4px;
                    align-self: flex-start;
                    max-width: 100%;
                }
                .ref-label { color: var(--text-muted); font-size: 11px; margin-right: 4px; }
                
                .meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: 2px; }
                
                .thumb-col { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #000; }
                .thumb-col img { width: 100%; height: 100%; object-fit: cover; }
                
                .dot { 
                    width: 8px; height: 8px; 
                    background: var(--accent); 
                    border-radius: 50%; 
                    flex-shrink: 0;
                    box-shadow: 0 0 8px var(--accent);
                }
            `}</style>
        </div>
    )
}

