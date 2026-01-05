import { useEffect } from 'react'
import Header from '@/components/Header'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'

export default function Notifications() {
    const { notifications, unreadCount, isLoading, markAsRead, refreshNotifications } = useNotifications()
    const { isLoggedIn } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    // Redirect to login if not logged in
    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            // Optional: Show toast or just redirect? 
            // Ideally we might want to show a "Login to see notifications" message, 
            // but user usually clicks this from header if logged in (or we show login prompt).
            // However, `Header` shows different icon if logged in? No, same icon usually unless changed.
            // Actually Header logic: `Link to={isLoggedIn ? '/settings' : '/login'}` for settings.
            // But for notifications `Link to="/notifications"`.
            // So if guest clicks it, they come here.
        }
    }, [isLoading, isLoggedIn, navigate])

    // Format timestamp
    const formatDate = (iso: string) => {
        try {
            const date = new Date(iso)
            const now = new Date()
            const isThisYear = date.getFullYear() === now.getFullYear()

            return date.toLocaleDateString(undefined, {
                year: isThisYear ? undefined : 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return iso
        }
    }

    // Helper to get link from notification (not simple as Wiki API returns complex data, 
    // but usually we can link to the title page)
    const getLink = (n: any) => {
        if (n.title?.full) return `/search?q=${encodeURIComponent(n.title.full)}` // Or better: /capture or some detail view?
        // Ideally we want to open a webview or detail page.
        // For now, let's just do nothing or link to generic.
        return '#'
    }

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
                    {notifications.map(n => {
                        const isRead = !!n.read
                        return (
                            <div key={n.id} className={`item ${isRead ? 'read' : 'unread'}`} onClick={() => {
                                // Only mark as read if it is not already read
                                if (!isRead) {
                                    markAsRead(n.id)
                                    if (n.type === 'thank-you-edit') {
                                        showToast('Marked as read')
                                    }
                                }

                                // Prevent redirect for thank-you, welcome/system messages, or User talk pages
                                if (n.type === 'thank-you-edit' || n.type === 'welcome' || n.title?.full?.startsWith('User talk:')) {
                                    return
                                }

                                const link = getLink(n)
                                if (link && link !== '#') navigate(link)
                            }}>
                                <div className="icon-col">
                                    {n.type === 'thank-you-edit' && <span className="type-icon">❤️</span>}
                                    {n.type === 'mention' && <span className="type-icon">💬</span>}
                                    {!['thank-you-edit', 'mention'].includes(n.type) && <span className="type-icon">ℹ️</span>}
                                </div>
                                <div className="details">
                                    <div className="msg">
                                        <span className="agent">{n.agent?.name}</span>
                                        {' '}
                                        {n.type === 'thank-you-edit' ? 'thanked you for your edit on' : n.type === 'welcome' ? 'Welcome to Wikimedia Commons!' : 'notified you about'}
                                        {' '}
                                        {n.type !== 'welcome' && <span className="subj">{n.title?.full}</span>}
                                    </div>
                                    <div className="meta">
                                        <span className="time">{formatDate(n.timestamp?.utciso8601)}</span>
                                    </div>
                                </div>
                                {!isRead && <div className="dot" />}
                            </div>
                        )
                    })}
                </div>
            </div>

            <style>{`
                .page { min-height: 100vh; background: var(--bg); color: var(--text); }
                .content { padding: 0 16px 80px; max-width: 600px; margin: 0 auto; }
                
                .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-top: 8px; }
                h1 { font-size: 24px; font-weight: 700; margin: 0; }
                .mark-read-all { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 500; }
                
                .loading { padding: 40px; display: flex; justify-content: center; }
                
                .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
                .empty .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
                .empty h3 { margin: 0 0 8px; color: var(--text); }
                .refresh-btn { margin-top: 16px; padding: 8px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; color: var(--text); }

                .list { display: flex; flex-direction: column; gap: 12px; }
                .item { 
                    display: flex; gap: 12px; padding: 16px; 
                    background: var(--surface); border-radius: 16px;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                /* Unread: Brighter bg, border, darker text */
                .item.unread { 
                    background: var(--bg-card); 
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .item.unread .msg { color: var(--text); font-weight: 500; }
                
                /* Read: Dimmer, flat */
                .item.read { 
                    opacity: 0.7; 
                    background: transparent;
                    border: 1px solid transparent;
                }
                .item.read .msg { color: var(--text-muted); }

                .item:active { transform: scale(0.98); }

                .icon-col { display: flex; align-items: flex-start; padding-top: 2px; min-width: 24px; }
                
                .details { flex: 1; }
                .msg { font-size: 15px; line-height: 1.4; margin-bottom: 6px; transition: color 0.2s; }
                .agent { font-weight: 700; }
                .subj { font-style: italic; opacity: 0.9; }
                
                .meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted); }
                
                .dot { 
                    width: 10px; height: 10px; 
                    background: var(--accent); 
                    border-radius: 50%; 
                    margin-top: 6px; 
                    box-shadow: 0 0 8px var(--accent);
                }
            `}</style>
        </div>
    )
}
