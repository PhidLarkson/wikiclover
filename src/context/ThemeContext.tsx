/**
 * Theme Context
 * 
 * Manages theme (light/dark) and accent color preferences
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
type Accent = 'white' | 'yellow' | 'blue' | 'pink' | 'red' | 'green' | 'orange' | 'creme' | 'gold' | 'purple' | 'indigo' | 'cyan' | 'lime'

interface ThemeContextType {
    theme: Theme
    accent: Accent
    setTheme: (theme: Theme) => void
    setAccent: (accent: Accent) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEYS = {
    THEME: 'wikicommons_theme',
    ACCENT: 'wikicommons_accent',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.THEME)
        return (stored as Theme) || 'dark'
    })

    const [accent, setAccentState] = useState<Accent>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.ACCENT)
        return (stored as Accent) || 'white'
    })

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(STORAGE_KEYS.THEME, theme)
    }, [theme])

    // Apply accent color to document
    useEffect(() => {
        document.documentElement.setAttribute('data-accent', accent)
        localStorage.setItem(STORAGE_KEYS.ACCENT, accent)
    }, [accent])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
    }, [])

    const setAccent = useCallback((newAccent: Accent) => {
        setAccentState(newAccent)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
