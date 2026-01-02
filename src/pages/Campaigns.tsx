/**
 * Campaigns Page - Wiki Loves Competitions
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCampaigns, type MediaFile } from '@/lib/wikimedia-api'

export default function Campaigns() {
    const navigate = useNavigate()
    const [campaigns, setCampaigns] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getCampaigns(15)
            .then(setCampaigns)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="campaigns-page">
            <header className="glass">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="tt">Campaigns</span>
                <div style={{ width: 40 }} />
            </header>

            <div className="content">
                <div className="banner">
                    <h1>Join a Contest</h1>
                    <p>Participate in photography campaigns and help document the world.</p>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : (
                    <div className="list">
                        {campaigns.map(c => (
                            <a
                                key={c.pageid}
                                href={`https://commons.wikimedia.org/wiki/Category:${c.title}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="campaign-card"
                            >
                                <div className="c-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <div className="c-info">
                                    <h3>{c.title}</h3>
                                    <span>View on Commons &rarr;</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .campaigns-page { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
                
                header { 
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 16px; 
                    position: sticky; top: 0; z-index: 10;
                }
                .back-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text); }
                .tt { font-weight: 600; }

                .content { flex: 1; overflow-y: auto; padding: 20px; }

                .banner {
                    padding: 30px 20px;
                    background: linear-gradient(135deg, var(--accent), #a78bfa);
                    border-radius: 24px;
                    color: white;
                    margin-bottom: 24px;
                    text-align: center;
                }
                .banner h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
                .banner p { font-size: 14px; opacity: 0.9; line-height: 1.4; }

                .list { display: flex; flex-direction: column; gap: 12px; }
                
                .campaign-card {
                    display: flex; align-items: center; gap: 16px;
                    padding: 16px;
                    background: var(--bg-card);
                    border-radius: 20px;
                    text-decoration: none;
                    transition: transform 0.2s;
                    border: 1px solid var(--border);
                }
                .campaign-card:active { transform: scale(0.98); }
                
                .c-icon {
                    width: 48px; height: 48px; border-radius: 12px;
                    background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.1);
                    color: var(--accent);
                    display: flex; align-items: center; justify-content: center;
                }
                
                .c-info { flex: 1; }
                .c-info h3 { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
                .c-info span { font-size: 12px; color: var(--text-secondary); }
                
                .loading { display: flex; justify-content: center; padding: 40px; }
            `}</style>
        </div>
    )
}
