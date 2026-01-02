import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'

interface Props {
    item: {
        title: string
        url: string
        thumburl?: string
        descriptionurl: string
        author?: string
        license?: string
    }
    onClose: () => void
}

export default function MediaDetail({ item, onClose }: Props) {
    const { showToast } = useToast()
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleDownload = async () => {
        try {
            const response = await fetch(item.url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = item.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50) + '.jpg'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (e) {
            window.open(item.url, '_blank')
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `Check out this image on WikiClover: ${item.title}`,
                    url: item.descriptionurl
                })
            } catch (error) {
                // User cancelled or share failed
            }
        } else {
            try {
                await navigator.clipboard.writeText(item.descriptionurl)
                showToast('Link copied to clipboard')
            } catch (err) {
                showToast('Failed to copy link')
            }
        }
    }

    return (
        <div className="detail-overlay" onClick={onClose}>
            <div className="detail-glass" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>

                <div className="img-container">
                    <img src={item.url || item.thumburl} alt={item.title} />
                </div>

                <div className="info-sheet">
                    <div className="handle" />

                    <div className="source-badge">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/20px-Commons-logo.svg.png" alt="Commons" />
                        <span>Wikimedia Commons</span>
                    </div>

                    <h3>{item.title}</h3>

                    <div className="meta-row">
                        {item.author && (
                            <Link to={`/user/${item.author}`} className="pill user" onClick={onClose}>
                                By {item.author}
                            </Link>
                        )}
                        {item.license && <span className="pill license">{item.license}</span>}
                    </div>

                    <div className="actions">
                        <button onClick={handleDownload} className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></div>
                            <span>Download</span>
                        </button>

                        <button onClick={handleShare} className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg></div>
                            <span>Share</span>
                        </button>

                        <a href={item.descriptionurl} target="_blank" rel="noopener noreferrer" className="action-btn">
                            <div className="icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></div>
                            <span>Commons</span>
                        </a>
                    </div>
                </div>
            </div>

            <style>{`
                .detail-overlay {
                    position: fixed; inset: 0; z-index: 200;
                    background: black;
                    display: flex; flex-direction: column;
                    animation: fadein 0.3s ease-out;
                }
                .detail-glass {
                    flex: 1; display: flex; flex-direction: column; position: relative;
                }
                .close-btn {
                    position: absolute; top: 16px; right: 16px; width: 40px; height: 40px;
                    border-radius: 50%; background: rgba(0,0,0,0.3); color: white;
                    display: flex; align-items: center; justify-content: center; z-index: 10;
                    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                }
                
                .img-container {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                }
                .img-container img { width: 100%; height: 100%; object-fit: contain; }

                .info-sheet {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    padding: 60px 24px 40px;
                    color: white;
                    /* Gradient background for readability */
                    background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, transparent 100%);
                    z-index: 2;
                }
                
                /* The Blur Layer: Fades upwards using mask-image */
                .info-sheet::before {
                    content: '';
                    position: absolute; inset: 0; z-index: -1;
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    mask-image: linear-gradient(to top, black 40%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to top, black 40%, transparent 100%);
                    pointer-events: none;
                }

                .handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.3); margin: 0 auto 20px; }
                
                .source-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 4px 10px 4px 4px;
                    background: rgba(255,255,255,0.15);
                    border-radius: 100px;
                    font-size: 11px; font-weight: 500; color: white;
                    margin-bottom: 12px;
                    backdrop-filter: blur(10px);
                }
                .source-badge img { width: 16px; height: 16px; }

                h3 { font-size: 20px; font-weight: 600; margin-bottom: 12px; line-height: 1.3; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
                
                .meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
                .pill { font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 100px; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); }
                .user { color: rgba(255,255,255,0.9); text-decoration: none; display: inline-flex; }
                .license { background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.3); color: #fff; }

                .actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                .action-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 8px;
                    background: rgba(255,255,255,0.1);
                    padding: 16px 12px; border-radius: 20px;
                    transition: all 0.2s; text-decoration: none;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .action-btn:active { background: rgba(255,255,255,0.2); transform: scale(0.96); }
                .icon { color: white; display: flex; align-items: center; justify-content: center; }
                .action-btn span { font-size: 12px; font-weight: 500; color: white; }

                @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </div>
    )
}
