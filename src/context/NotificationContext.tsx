import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getNotifications, markNotificationRead, type WikiNotification } from '@/lib/wikimedia-api'

interface NotificationContextType {
    notifications: WikiNotification[]
    unreadCount: number
    isLoading: boolean
    markAsRead: (id: string) => Promise<void>
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn } = useAuth()
    const [notifications, setNotifications] = useState<WikiNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    // Helper to get token safely (since useAuth doesn't expose getToken directly, we use the storage function or need to export getAccessToken from wikimedia-auth)
    // Actually, wikimedia-api functions need the token passed. 
    // We should probably rely on `getAccessToken` from `wikimedia-auth` being available or import it.
    // Let's import `getAccessToken` from `wikimedia-auth` here as well, similar to AuthContext.

    // Waiting for dynamic import or just standard import. 
    // I'll assume I can import `getAccessToken` from `lib/wikimedia-auth`.
    // Checking previous file view of `wikimedia-auth.ts`, `getAccessToken` IS exported.

    // However, I need to fetch it inside the effect. 

    const fetchNotifs = useCallback(async () => {
        if (!isLoggedIn) {
            setNotifications([])
            setUnreadCount(0)
            return
        }

        // We need to dynamically import or just use the imported function
        const { getAccessToken } = await import('@/lib/wikimedia-auth')
        const token = await getAccessToken()

        if (!token) return

        setIsLoading(true)
        try {
            const { list, count } = await getNotifications(token)
            setNotifications(list)
            setUnreadCount(count)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [isLoggedIn])

    // Initial load and polling
    useEffect(() => {
        fetchNotifs()

        if (isLoggedIn) {
            const interval = setInterval(fetchNotifs, 60000) // 60s poll
            return () => clearInterval(interval)
        }
    }, [fetchNotifs, isLoggedIn])

    const markAsRead = async (id: string) => {
        const { getAccessToken } = await import('@/lib/wikimedia-auth')
        const token = await getAccessToken()
        if (!token) return

        // Optimistic update - Mark as read locally without removing
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: new Date().toISOString() } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))

        const success = await markNotificationRead(id, token)
        if (!success) {
            // Revert if failed (simple revert: refresh)
            fetchNotifs()
        }
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, markAsRead, refreshNotifications: fetchNotifs }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within NotificationProvider')
    return context
}
