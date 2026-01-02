/**
 * Auth Callback Page
 * 
 * Handles OAuth redirect from Wikimedia
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForToken, fetchUserInfo } from '@/lib/wikimedia-auth'
import { useAuth } from '@/context/AuthContext'

export default function AuthCallback() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { refreshUser } = useAuth()

    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
    const [errorMessage, setErrorMessage] = useState('')
    const processedRef = useRef(false)

    useEffect(() => {
        const handleCallback = async () => {
            if (processedRef.current) return
            processedRef.current = true

            const code = searchParams.get('code')
            const error = searchParams.get('error')
            const errorDescription = searchParams.get('error_description')

            if (error) {
                setStatus('error')
                setErrorMessage(errorDescription || error)
                return
            }

            if (!code) {
                setStatus('error')
                setErrorMessage('No authorization code received')
                return
            }

            try {
                // Exchange code for tokens
                await exchangeCodeForToken(code)

                // Fetch user info
                await fetchUserInfo()

                // Refresh auth context
                await refreshUser()

                setStatus('success')

                // Check if there's a pending upload
                const pendingUpload = sessionStorage.getItem('pendingUpload')
                if (pendingUpload) {
                    sessionStorage.setItem('capturedImage', pendingUpload)
                    sessionStorage.removeItem('pendingUpload')
                }

                // Redirect to home after short delay
                setTimeout(() => {
                    navigate('/')
                }, 1500)

            } catch (err) {
                console.error('Auth callback error:', err)
                setStatus('error')
                setErrorMessage(err instanceof Error ? err.message : 'Authentication failed')
            }
        }

        handleCallback()
    }, [searchParams, navigate, refreshUser])

    return (
        <div className="callback-page">
            <div className="callback-content">
                {status === 'processing' && (
                    <>
                        <div className="spinner large" />
                        <h2>Authenticating...</h2>
                        <p>Please wait while we complete your login.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="success-icon">
                            <CheckIcon />
                        </div>
                        <h2>Welcome!</h2>
                        <p>You've been successfully logged in.</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="error-icon">
                            <XIcon />
                        </div>
                        <h2>Authentication Failed</h2>
                        <p>{errorMessage}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/login')}
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>

            <style>{`
        .callback-page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
        }
        
        .callback-content {
          text-align: center;
          max-width: 320px;
        }
        
        .callback-content h2 {
          font-size: var(--font-size-2xl);
          margin-top: var(--space-lg);
          margin-bottom: var(--space-sm);
        }
        
        .callback-content p {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-lg);
        }
        
        .spinner.large {
          width: 48px;
          height: 48px;
          border-width: 3px;
          margin: 0 auto;
        }
        
        .success-icon,
        .error-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        
        .success-icon {
          background: var(--color-success);
        }
        
        .error-icon {
          background: var(--color-error);
        }
        
        .success-icon svg,
        .error-icon svg {
          width: 32px;
          height: 32px;
          color: white;
        }
      `}</style>
        </div>
    )
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function XIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
}
