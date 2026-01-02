import { useState, useEffect } from 'react'

export default function BackToTop() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const toggle = () => {
            // Find scrollable container or check window
            const scrollY = window.scrollY
            setShow(scrollY > 300)
        }
        window.addEventListener('scroll', toggle)

        // Also check main content divs if they scroll independently
        const containers = document.querySelectorAll('.content, .grid, .feed, .profile-page')
        containers.forEach(c => {
            c.addEventListener('scroll', () => setShow(c.scrollTop > 300))
        })

        return () => {
            window.removeEventListener('scroll', toggle)
            containers.forEach(c => c.removeEventListener('scroll', () => { }))
        }
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        const containers = document.querySelectorAll('.content, .grid, .feed, .profile-page')
        containers.forEach(c => c.scrollTo({ top: 0, behavior: 'smooth' }))
    }

    if (!show) return null

    return (
        <button onClick={scrollToTop} className="btt-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6" />
            </svg>
            <style>{`
                .btt-btn {
                    position: fixed; 
                    bottom: 90px; 
                    right: 20px;
                    width: 44px; height: 44px;
                    border-radius: 50%;
                    background: rgba(var(--bg-elevated-rgb), 0.8);
                    color: var(--text);
                    border: 1px solid var(--border);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 100;
                    animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transition: all 0.2s;
                }
                .btt-btn:hover {
                    transform: translateY(-2px);
                    border-color: var(--accent);
                    color: var(--accent);
                }
                @keyframes popUp { from { transform: scale(0); } to { transform: scale(1); } }
            `}</style>
        </button>
    )
}
