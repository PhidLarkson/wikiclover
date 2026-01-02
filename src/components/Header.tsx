import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
    const { isLoggedIn } = useAuth()

    return (
        <header className="app-header glass-hdr">
            <Link to="/search" className="hb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </Link>

            <div className="logo-container">
                <svg width="28" height="28" viewBox="0 0 32 32">
                    <g transform="translate(16,16)">
                        <circle cx="-5" cy="-5" r="5.5" fill="var(--accent)" />
                        <circle cx="5" cy="-5" r="5.5" fill="var(--accent)" opacity="0.8" />
                        <circle cx="-5" cy="5" r="5.5" fill="var(--accent)" opacity="0.6" />
                        <circle cx="5" cy="5" r="5.5" fill="var(--accent)" opacity="0.4" />
                    </g>
                </svg>
                <span className="app-name">Clover</span>
            </div>

            <Link to={isLoggedIn ? '/settings' : '/login'} className="hb">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </Link>

            <style>{`
                .glass-hdr {
                    background: rgba(var(--bg-rgb), 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    /* border-bottom removed */
                    /* box-shadow removed per user request */
                    box-shadow: none;
                    -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                    mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                }
                .app-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px 24px;
                    position: sticky; top: 0; z-index: 50;
                    margin-bottom: 16px; /* Spacing under header */
                }
                .hb {
                    width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--text);
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .hb:active { background: rgba(255,255,255,0.1); }
                
                .logo-container { display: flex; align-items: center; gap: 8px; }
                .app-name { font-weight: 700; font-size: 18px; letter-spacing: -0.5px; }
            `}</style>
        </header>
    )
}
