/**
 * Settings Page
 * 
 * User preferences: theme, accent color, accessibility, language, account settings
 */

import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { useAccessibility } from '@/context/AccessibilityContext'
import { usePWA } from '@/context/PWAContext'
import UserManual from '@/components/UserManual'

type AccentColor = 'white' | 'yellow' | 'blue' | 'pink' | 'green' | 'orange' | 'gold' | 'red' | 'creme'

const ACCENT_COLORS: AccentColor[] = ['white', 'creme', 'gold', 'yellow', 'orange', 'red', 'pink', 'blue', 'green']

export default function Settings() {
    const navigate = useNavigate()
    const { isLoggedIn, user, logout } = useAuth()
    const { theme, accent, setTheme, setAccent } = useTheme()
    const { language, setLanguage, languages, t } = useLanguage()
    const { settings, updateSetting } = useAccessibility()
    const { isInstalled, canInstall, install } = usePWA()
    const [showManual, setShowManual] = useState(false)

    return (
        <div className="settings-page">
            <header className="settings-header">
                <button className="btn-icon" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="heading-3">{t('settings.title')}</h1>
                <div style={{ width: 44 }} />
            </header>

            <div className="container stack stack-6">
                {/* Appearance */}
                <section>
                    <h2 className="settings-group-title">{t('settings.display')}</h2>
                    <div className="settings-group">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <MoonIcon />
                                <span>Dark Mode</span>
                            </div>
                            <button
                                className="toggle"
                                data-checked={theme === 'dark'}
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                aria-label="Toggle dark mode"
                            />
                        </div>
                    </div>
                </section>

                {/* Accent Color */}
                <section>
                    <h2 className="settings-group-title">Accent Color</h2>
                    <div className="settings-group">
                        <div className="color-picker">
                            {ACCENT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={`color-swatch ${accent === color ? 'active' : ''}`}
                                    data-color={color}
                                    onClick={() => setAccent(color)}
                                    aria-label={`Set accent color to ${color}`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Language */}
                <section>
                    <h2 className="settings-group-title">{t('settings.language')}</h2>
                    <div className="settings-group" style={{ overflow: 'visible' }}>
                        <div className="settings-item" style={{ position: 'relative', overflow: 'visible' }}>
                            <div className="settings-item-label">
                                <GlobeIcon />
                                <span>Language</span>
                            </div>

                            <LanguageDropdown
                                current={language}
                                languages={languages}
                                onChange={setLanguage}
                            />
                        </div>
                    </div>
                </section>

                {/* Accessibility */}
                <section>
                    <h2 className="settings-group-title">{t('settings.accessibility')}</h2>
                    <div className="settings-group">
                        <div className="settings-item">
                            <div className="settings-item-info">
                                <div className="settings-item-label">
                                    <AccessibilityIcon />
                                    <span>{t('a11y.reduceMotion')}</span>
                                </div>
                                <span className="settings-item-desc">{t('a11y.reduceMotionDesc')}</span>
                            </div>
                            <button
                                className="toggle"
                                data-checked={settings.reduceMotion}
                                onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
                                aria-label={t('a11y.reduceMotion')}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="settings-item-info">
                                <div className="settings-item-label">
                                    <ContrastIcon />
                                    <span>{t('a11y.highContrast')}</span>
                                </div>
                                <span className="settings-item-desc">{t('a11y.highContrastDesc')}</span>
                            </div>
                            <button
                                className="toggle"
                                data-checked={settings.highContrast}
                                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                                aria-label={t('a11y.highContrast')}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="settings-item-info">
                                <div className="settings-item-label">
                                    <TextIcon />
                                    <span>{t('a11y.largeText')}</span>
                                </div>
                                <span className="settings-item-desc">{t('a11y.largeTextDesc')}</span>
                            </div>
                            <button
                                className="toggle"
                                data-checked={settings.largeText}
                                onClick={() => updateSetting('largeText', !settings.largeText)}
                                aria-label={t('a11y.largeText')}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="settings-item-info">
                                <div className="settings-item-label">
                                    <TextIcon /> {/* Reuse TextIcon or add FontIcon */}
                                    <span>Dyslexia Friendly Font</span>
                                </div>
                                <span className="settings-item-desc">Use OpenDyslexic / Comic Sans for better readability</span>
                            </div>
                            <button
                                className="toggle"
                                data-checked={settings.dyslexiaFont}
                                onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)}
                                aria-label="Toggle dyslexia friendly font"
                            />
                        </div>
                    </div>
                </section>

                {/* Account - when logged in */}
                {isLoggedIn && (
                    <section>
                        <h2 className="settings-group-title">{t('settings.account')}</h2>
                        <div className="settings-group">
                            <div className="settings-item">
                                <div className="settings-item-label">
                                    <UserIcon />
                                    <span>{user?.username}</span>
                                </div>
                                <span className="caption">{user?.editcount || 0} edits</span>
                            </div>

                            <button className="settings-item disconnect" onClick={() => { logout(); navigate('/') }}>
                                <div className="settings-item-label">
                                    <LogOutIcon />
                                    <span>{t('settings.logout')}</span>
                                </div>
                            </button>
                        </div>
                    </section>
                )}

                {/* Account - when not logged in */}
                {!isLoggedIn && (
                    <section>
                        <h2 className="settings-group-title">{t('settings.account')}</h2>
                        <div className="settings-group">
                            <button className="settings-item connect" onClick={() => navigate('/login')}>
                                <div className="settings-item-label">
                                    <UserIcon />
                                    <span>{t('settings.login')}</span>
                                </div>
                                <ChevronIcon />
                            </button>
                        </div>
                    </section>
                )}

                {/* Help & About */}
                <section>
                    <h2 className="settings-group-title">{t('settings.about')}</h2>
                    <div className="settings-group">
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <InfoIcon />
                                <span>Version</span>
                            </div>
                            <span className="mono">1.0.0</span>
                        </div>

                        {/* PWA Install */}
                        {!isInstalled && canInstall && (
                            <button className="settings-item" onClick={install}>
                                <div className="settings-item-label">
                                    <DownloadIcon />
                                    <span>Install App</span>
                                </div>
                                <ChevronIcon />
                            </button>
                        )}

                        {/* PWA Uninstall Info */}
                        {isInstalled && (
                            <div className="settings-item">
                                <div className="settings-item-label">
                                    <CheckIcon />
                                    <span>App Installed</span>
                                </div>
                                <span className="caption">See device settings to uninstall</span>
                            </div>
                        )}

                        <button className="settings-item" onClick={() => setShowManual(true)}>
                            <div className="settings-item-label">
                                <BookIcon />
                                <span>User Manual</span>
                            </div>
                            <ChevronIcon />
                        </button>

                        <a href="mailto:phiddyconcept@gmail.com" className="settings-item">
                            <div className="settings-item-label">
                                <MailIcon />
                                <span>Help & Support</span>
                            </div>
                            <ChevronIcon />
                        </a>

                        <a
                            href="https://commons.wikimedia.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="settings-item"
                        >
                            <div className="settings-item-label">
                                <GlobeIcon />
                                <span>Wikimedia Commons</span>
                            </div>
                            <ChevronIcon />
                        </a>
                    </div>
                </section>

                {/* Clear Data - Moved Up */}
                <section>
                    <h2 className="settings-group-title">Data</h2>
                    <div className="settings-group">
                        <button
                            className="settings-item"
                            onClick={() => {
                                if (confirm('Clear all cached data?')) {
                                    localStorage.clear()
                                    sessionStorage.clear()
                                    window.location.reload()
                                }
                            }}
                        >
                            <div className="settings-item-label">
                                <TrashIcon />
                                <span>Clear Cache</span>
                            </div>
                            <ChevronIcon />
                        </button>
                    </div>
                </section>

                {/* Footer Branding - The Absolute Last Thing */}
                <div className="settings-footer">
                    <span className="footer-label">A PROJECT BY</span>

                    <a href="https://larbi.xyz/jali" target="_blank" rel="noreferrer" className="jali-brand">
                        JALI
                    </a>

                    {/* Tiny social icons */}
                    <div className="footer-icons">
                        <a href="https://x.com/jalilabs" target="_blank" rel="noreferrer" className="icon-link" aria-label="X">
                            <XIcon />
                        </a>
                        <a href="https://github.com/PhidLarkson/wikiclover" target="_blank" rel="noreferrer" className="icon-link" aria-label="Code">
                            <GitHubIcon />
                        </a>
                    </div>
                </div>

                {/* Manual Modal */}
                {showManual && <UserManual onClose={() => setShowManual(false)} />}
            </div>

            <style>{`
        .settings-page {
          padding-bottom: var(--space-8);
        }
        
        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          position: sticky;
          top: 0;
          background: rgba(var(--bg-rgb), 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: var(--z-sticky);
          -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }
        
        .settings-header .btn-icon {
          background: transparent;
        }
        
        .settings-header h1 {
          flex: 1;
          text-align: center;
        }
        
        .settings-item-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .settings-item-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-left: 32px;
        }
        
        .language-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 12px;
        }
        
        .lang-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          border-radius: 12px;
          background: transparent;
          transition: all 0.2s;
        }
        
        .lang-btn.active {
          background: var(--accent);
        }
        
        .lang-btn.active .lang-native,
        .lang-btn.active .lang-name {
          color: var(--black);
        }
        
        .lang-native {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
        }
        
        .lang-name {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .disconnect {
          color: #ef4444;
        }
        .disconnect svg {
          color: #ef4444 !important;
        }
        .connect {
          color: var(--accent);
        }
        .connect svg {
          color: var(--accent) !important;
        }
        
        .color-swatch[data-color="gold"] {
          background: #F59E0B;
        }

        /* Minimal Footer */
        .settings-footer {
            margin-top: 48px;
            margin-bottom: 24px; /* Bottom padding */
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px; /* Tighter gap */
            opacity: 0.6; /* Subtle */
            transition: opacity 0.2s;
        }
        .settings-footer:hover { opacity: 1; }

        .footer-label {
            font-size: 10px; 
            font-weight: 600;
            letter-spacing: 0.2em;
            color: var(--text-muted);
            text-transform: uppercase;
        }

        .jali-brand {
            font-size: 32px; /* Big but distinct */
            font-weight: 900;
            color: var(--text);
            text-transform: uppercase; /* ALL CAPS */
            text-decoration: none;
            letter-spacing: -1px;
            line-height: 1;
        }
        
        .footer-icons {
            display: flex; gap: 16px; margin-top: 8px;
        }
        .icon-link { opacity: 0.5; transition: opacity 0.2s; color: var(--text); }
        .icon-link:hover { opacity: 1; }
      `}</style>
        </div>
    )
}

// Icons
function BackIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    )
}

function UserIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

function LogOutIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    )
}

function InfoIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    )
}

// Custom Language Dropdown
function LanguageDropdown({ current, languages, onChange }: { current: string, languages: any[], onChange: (code: any) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const currentLang = languages.find(l => l.code === current)

    return (
        <div className="custom-select" ref={dropdownRef}>
            <button
                className={`select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="select-value">
                    <span className="lang-native">{currentLang?.nativeName}</span>
                    <span className="lang-name">{currentLang?.name}</span>
                </div>
                <ChevronIcon />
            </button>

            {isOpen && (
                <div className="select-dropdown">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`select-option ${current === lang.code ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(lang.code)
                                setIsOpen(false)
                            }}
                        >
                            <span className="lang-native">{lang.nativeName}</span>
                            {current === lang.code && <div className="indicator" />}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                .custom-select {
                    position: relative;
                    min-width: 140px;
                }
                .select-trigger {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    color: var(--text);
                    width: 100%;
                    justify-content: space-between;
                    transition: all 0.2s;
                }
                .select-trigger:hover {
                    background: rgba(255,255,255,0.08);
                }
                .select-trigger.open {
                    border-color: var(--accent);
                    background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.1);
                }
                .select-value {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    line-height: 1.2;
                }
                .select-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    background: rgba(var(--bg-card-rgb), 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    z-index: 50;
                    min-width: 180px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                    animation: slide-up 0.2s ease-out;
                }
                .select-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 12px;
                    border-radius: 10px;
                    color: var(--text-secondary);
                    transition: all 0.2s;
                }
                .select-option:hover {
                    background: rgba(255,255,255,0.05);
                    color: var(--text);
                }
                .select-option.selected {
                    background: var(--accent);
                    color: var(--bg);
                }
                /* Black text on light accents */
                [data-accent="gold"] .select-option.selected,
                [data-accent="yellow"] .select-option.selected,
                [data-accent="creme"] .select-option.selected,
                [data-accent="white"] .select-option.selected {
                    color: var(--black);
                }
                .indicator {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }
            `}</style>
        </div>
    )
}

function GlobeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}

function AccessibilityIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="4" r="1" />
            <path d="M12 21v-8m0 0l-4-2m4 2l4-2m-6-4h4" />
        </svg>
    )
}

function ContrastIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v20" />
            <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" />
        </svg>
    )
}

function TextIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
    )
}



function TrashIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
}



function ChevronIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}>
            <path d="M9 18l6-6-6-6" />
        </svg>
    )
}

function DownloadIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )
}

function BookIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    )
}

function MailIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function XIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function GitHubIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
    )
}

