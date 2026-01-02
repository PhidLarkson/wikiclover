/**
 * Login Page - Blue clover, original button styling
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { isLoggedIn, login, isLoading, loginAsGuest } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && isLoggedIn) navigate('/profile')
  }, [isLoading, isLoggedIn, navigate])

  const handleLogin = async () => {
    if (isLoggingIn) return
    setIsLoggingIn(true)
    setError(null)
    try { await login() }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-content">
        {/* Blue clover logo */}
        <div className="logo-container">
          <svg width="80" height="80" viewBox="0 0 32 32">
            <g transform="translate(16,16)">
              <circle cx="-5" cy="-5" r="5.5" fill="#fde68a" />
              <circle cx="5" cy="-5" r="5.5" fill="#fde68a" opacity="0.8" />
              <circle cx="-5" cy="5" r="5.5" fill="#fde68a" opacity="0.6" />
              <circle cx="5" cy="5" r="5.5" fill="#fde68a" opacity="0.4" />
            </g>
          </svg>
          <h1 className="app-name">WikiCommons</h1>
          <p className="tagline">Capture. Share. Contribute.</p>
        </div>

        <ul className="features">
          <li><Check /><span>Browse millions of free images</span></li>
          <li><Check /><span>Take photos and upload</span></li>
          <li><Check /><span>Discover content nearby</span></li>
        </ul>

        {error && <div className="error-msg"><p>{error}</p></div>}

        <button className="login-btn" onClick={handleLogin} disabled={isLoading || isLoggingIn}>
          {isLoggingIn ? <div className="spinner" /> : 'Continue with Wikimedia'}
        </button>

        <p className="login-info">Secure OAuth 2.0 authentication</p>
        <button className="skip-btn" onClick={() => { loginAsGuest(); navigate('/'); }}>Browse without account</button>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: var(--bg);
        }
        
        .login-content {
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }
        
        .logo-container {
          text-align: center;
        }
        
        .logo-container svg {
          margin-bottom: 16px;
        }
        
        .app-name {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        
        .tagline {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .features {
          width: 100%;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .features svg {
          width: 16px;
          height: 16px;
          color: var(--text);
          flex-shrink: 0;
        }
        
        .error-msg {
          width: 100%;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          text-align: center;
        }
        
        .error-msg p {
          color: #ef4444;
          font-size: 13px;
        }
        
        .login-btn {
          width: 100%;
          height: 52px;
          background: var(--text);
          color: var(--bg);
          border-radius: 14px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-btn:disabled { opacity: 0.7; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        
        .login-info {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .skip-btn {
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .skip-btn:hover {
          color: var(--text);
        }
      `}</style>
    </div>
  )
}

function Check() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
}
