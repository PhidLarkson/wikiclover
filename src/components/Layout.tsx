import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const location = useLocation()
  const { user, isLoggedIn } = useAuth()
  const hideNav = ['/auth', '/capture', '/upload'].some(p => location.pathname.startsWith(p))

  return (
    <>
      <main className="page"><Outlet /></main>

      {!hideNav && (
        <>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => `btn ${isActive ? 'on' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </NavLink>


            <NavLink to="/capture" className={({ isActive }) => `btn ctr ${isActive ? 'on' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </NavLink>

            <NavLink to="/favorites" className={({ isActive }) => `btn ${isActive ? 'on' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={location.pathname === '/favorites' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </NavLink>

            <NavLink to="/mine" className={({ isActive }) => `btn ${isActive ? 'on' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </svg>
            </NavLink>
          </nav>

          {/* Username badge bottom right when logged in */}
          {isLoggedIn && user?.username && (
            <div className="user-badge glass">
              <span>{user.username}</span>
            </div>
          )}
        </>
      )}

      <style>{`
        .page { height: 100%; background: var(--bg); }
        
        .nav {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px;
          background: rgba(var(--bg-card-rgb), 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px;
          z-index: 100;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.2);
        }
        
        .btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--text-secondary);
          transition: all 0.2s ease-out;
        }
        
        .btn:active { transform: scale(0.9); }
        
        .btn.on { 
          color: var(--accent); 
          background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.1); 
        }
        
        .btn.ctr { width: 48px; height: 48px; margin: 0 2px; border-radius: 24px; }
        .btn.ctr.on { background: var(--accent); color: var(--black); box-shadow: 0 4px 12px -2px rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.4); }
        
        .glass {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.08);
        }

        .user-badge {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 4px 10px;
          border-radius: 12px;
          z-index: 90;
          pointer-events: none;
          animation: fadein 0.5s ease-out;
          background: rgba(var(--bg-rgb), 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-family: var(--font-mono);
          letter-spacing: -0.5px;
        }
        .user-badge span {
          font-size: 10px;
          font-weight: 500;
        }
        
        @keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  )
}
