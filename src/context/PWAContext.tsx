import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PWAContextType {
    isInstalled: boolean
    canInstall: boolean
    install: () => Promise<void>
    dismissInstall: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: ReactNode }) {
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if installed
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true
            setIsInstalled(isStandalone)
        }

        checkInstalled()
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setInstallPrompt(null)
        })

        // Capture install prompt
        const handler = (e: Event) => {
            e.preventDefault()
            // Check if dismissed recently (e.g. today)
            const dismissedAt = localStorage.getItem('pwa_dismissed_ts')
            if (dismissedAt) {
                const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
                if (hoursSince < 24) return // Don't show if dismissed in last 24h
            }

            setInstallPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const install = async () => {
        if (!installPrompt) return
        try {
            await installPrompt.prompt()
            const choice = await installPrompt.userChoice
            if (choice.outcome === 'accepted') {
                setInstallPrompt(null)
            }
        } catch (err) {
            console.error('Install error:', err)
        }
    }

    const dismissInstall = () => {
        setInstallPrompt(null)
        localStorage.setItem('pwa_dismissed_ts', Date.now().toString())
    }

    return (
        <PWAContext.Provider value={{
            isInstalled,
            canInstall: !!installPrompt,
            install,
            dismissInstall
        }}>
            {children}
        </PWAContext.Provider>
    )
}

export function usePWA() {
    const context = useContext(PWAContext)
    if (!context) throw new Error('usePWA must be used within PWAProvider')
    return context
}
