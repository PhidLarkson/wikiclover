/**
 * Accessibility Context - Provides a11y settings throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AccessibilitySettings {
    reduceMotion: boolean
    highContrast: boolean
    largeText: boolean
    dyslexiaFont: boolean
}

interface AccessibilityContextType {
    settings: AccessibilitySettings
    updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void
    resetSettings: () => void
}

const STORAGE_KEY = 'clover_accessibility'

const defaultSettings: AccessibilitySettings = {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    dyslexiaFont: false
}

function getStoredSettings(): AccessibilitySettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) }
        }
    } catch { /* ignore */ }

    // Check system preferences for reduce motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        return { ...defaultSettings, reduceMotion: true }
    }

    return defaultSettings
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>(getStoredSettings)

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement

        // Reduce motion
        if (settings.reduceMotion) {
            root.classList.add('reduce-motion')
        } else {
            root.classList.remove('reduce-motion')
        }

        // High contrast
        if (settings.highContrast) {
            root.classList.add('high-contrast')
        } else {
            root.classList.remove('high-contrast')
        }

        // Large text
        if (settings.largeText) {
            root.classList.add('large-text')
        } else {
            root.classList.remove('large-text')
        }

        // Dyslexia Font
        if (settings.dyslexiaFont) {
            root.classList.add('dyslexia-font')
        } else {
            root.classList.remove('dyslexia-font')
        }

        // Store settings
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }, [settings])

    const updateSetting = <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const resetSettings = () => setSettings(defaultSettings)

    return (
        <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
            {children}
        </AccessibilityContext.Provider>
    )
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext)
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider')
    }
    return context
}
