/**
 * PWA Install Prompt Component
 * 
 * Custom minimal install button hidden at bottom left
 */

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePWA } from '@/context/PWAContext'

export default function PWAInstall() {
  const { t } = useLanguage()
  const { canInstall, isInstalled, install } = usePWA()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (canInstall && !isInstalled) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])

  if (!isVisible || isInstalled) return null

  return (
    <button className="pwa-mini-fab" onClick={install} aria-label={t('install.install')}>
      <div className="pwa-icon">
        <svg width="24" height="24" viewBox="0 0 32 32">
          <g transform="translate(16,16)">
            <circle cx="-5" cy="-5" r="5.5" fill="currentColor" />
            <circle cx="5" cy="-5" r="5.5" fill="currentColor" opacity="0.8" />
            <circle cx="-5" cy="5" r="5.5" fill="currentColor" opacity="0.6" />
            <circle cx="5" cy="5" r="5.5" fill="currentColor" opacity="0.4" />
          </g>
        </svg>
      </div>
      <span className="pwa-label">{t('install.install')} App</span>

      <style>{`
        .pwa-mini-fab {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px 8px 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 100px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: slideInLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--text);
        }

        .pwa-mini-fab:hover {
          transform: translateY(-2px);
          background: var(--bg-card);
          box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        }

        .pwa-mini-fab:active {
          transform: scale(0.95);
        }

        .pwa-icon {
          width: 32px;
          height: 32px;
          background: var(--accent);
          color: var(--black);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwa-icon svg {
          width: 18px;
          height: 18px;
        }

        .pwa-label {
          font-size: 13px;
          font-weight: 600;
          padding-right: 4px;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </button>
  )
}
