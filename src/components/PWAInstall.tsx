/**
 * PWA Install Prompt Component
 * 
 * Shows a native-feeling install banner when PWA is installable
 */

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePWA } from '@/context/PWAContext'

export default function PWAInstall() {
  const { t } = useLanguage()
  const { canInstall, isInstalled, install, dismissInstall } = usePWA()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show banner if installable and not installed
    if (canInstall && !isInstalled) {
      // Simple delay to not be annoying immediately
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [canInstall, isInstalled])

  if (isInstalled || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    dismissInstall()
  }

  return (
    <div className="pwa-banner">
      <div className="pwa-content">
        <div className="pwa-icon">
          <svg width="24" height="24" viewBox="0 0 32 32">
            <g transform="translate(16,16)">
              <circle cx="-5" cy="-5" r="5.5" fill="#F59E0B" />
              <circle cx="5" cy="-5" r="5.5" fill="#F59E0B" opacity="0.8" />
              <circle cx="-5" cy="5" r="5.5" fill="#F59E0B" opacity="0.6" />
              <circle cx="5" cy="5" r="5.5" fill="#F59E0B" opacity="0.4" />
            </g>
          </svg>
        </div>
        <div className="pwa-text">
          <strong>{t('install.title')}</strong>
          <span>{t('install.description')}</span>
        </div>
      </div>
      <div className="pwa-actions">
        <button className="pwa-dismiss" onClick={handleDismiss}>
          {t('install.later')}
        </button>
        <button className="pwa-install" onClick={install}>
          {t('install.install')}
        </button>
      </div>

      <style>{`
          position: fixed;
          bottom: 96px;
          left: 12px;
          right: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          z-index: 150;
          animation: slideUp 0.3s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .pwa-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .pwa-icon {
          width: 40px;
          height: 40px;
          background: #fff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .pwa-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .pwa-text strong {
          font-size: 14px;
          font-weight: 600;
        }
        
        .pwa-text span {
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .pwa-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .pwa-dismiss {
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .pwa-install {
          padding: 8px 16px;
          background: var(--accent);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
        }
        
        @media (min-width: 768px) {
          .pwa-banner {
            max-width: 400px;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
