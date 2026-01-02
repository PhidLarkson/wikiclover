/**
 * Language Context - Provides i18n hooks throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SupportedLanguage, SUPPORTED_LANGUAGES, detectLanguage, setLanguage as setStoredLanguage, t as translate } from '@/lib/i18n'

interface LanguageContextType {
    language: SupportedLanguage
    setLanguage: (lang: SupportedLanguage) => void
    t: (key: string) => string
    languages: typeof SUPPORTED_LANGUAGES
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<SupportedLanguage>(detectLanguage)
    const [, forceUpdate] = useState({})

    useEffect(() => {
        // Set HTML lang attribute on mount
        document.documentElement.lang = language
    }, [language])

    const setLanguage = (lang: SupportedLanguage) => {
        setStoredLanguage(lang)
        setLanguageState(lang)
        forceUpdate({}) // Force re-render to update all translations
    }

    const t = (key: string) => translate(key, language)

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

// Shorthand hook for just translation function
export function useTranslation() {
    const { t } = useLanguage()
    return t
}
