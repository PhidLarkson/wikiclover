
export default function UserManual({ onClose }: { onClose: () => void }) {

    return (
        <div className="manual-overlay">
            <div className="manual-content">
                <header className="manual-header">
                    <h2>User Guide</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="manual-grid">
                    <div className="manual-card">
                        <div className="card-icon">📸</div>
                        <div className="card-text">
                            <h3>Taking Photos</h3>
                            <p>Use the Camera tab. Toggle flash or switch cameras with the on-screen controls.</p>
                        </div>
                    </div>

                    <div className="manual-card">
                        <div className="card-icon">📤</div>
                        <div className="card-text">
                            <h3>Upload</h3>
                            <p>Sign in to Wikimedia. Add a title, description, and categories to share your work.</p>
                        </div>
                    </div>

                    <div className="manual-card">
                        <div className="card-icon">📡</div>
                        <div className="card-text">
                            <h3>Offline Mode</h3>
                            <p>No internet? Photos save as Drafts. Upload them later from the "Mine" tab.</p>
                        </div>
                    </div>

                    <div className="manual-card">
                        <div className="card-icon">⚙️</div>
                        <div className="card-text">
                            <h3>Customize</h3>
                            <p>Change themes, accent colors, and fonts in Settings to match your style.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .manual-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(12px);
                    z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                    padding: 20px;
                    animation: fadeIn 0.3s ease-out;
                }
                
                .manual-content {
                    background: var(--bg-card);
                    width: 100%; max-width: 500px;
                    border-radius: 24px;
                    max-height: 85vh;
                    display: flex; flex-direction: column;
                    box-shadow: 0 24px 48px rgba(0,0,0,0.5);
                    border: 1px solid var(--border);
                    animation: slideUp 0.3s ease-out;
                }
                
                .manual-header {
                    padding: 24px;
                    display: flex; align-items: center; justify-content: space-between;
                    border-bottom: 1px solid var(--border-subtle);
                }
                
                .manual-header h2 {
                    font-size: 20px; font-weight: 700; margin: 0;
                }
                
                .close-btn {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    color: var(--text); border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .close-btn:hover { background: rgba(255,255,255,0.15); }
                
                .manual-grid {
                    padding: 24px;
                    overflow-y: auto;
                    display: grid; gap: 16px;
                }
                
                .manual-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex; gap: 16px;
                    align-items: flex-start;
                    transition: transform 0.2s, background 0.2s;
                }
                /* Interactive feel explicitly requested? No, but makes it premium */
                .manual-card:hover {
                    background: rgba(255,255,255,0.05);
                }
                
                .card-icon {
                    font-size: 24px;
                    width: 40px; height: 40px;
                    background: rgba(var(--accent-rgb), 0.1);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                
                .card-text h3 {
                    font-size: 16px; font-weight: 600; margin: 0 0 4px 0;
                    color: var(--text);
                }
                
                .card-text p {
                    font-size: 14px; color: var(--text-secondary); line-height: 1.5;
                    margin: 0;
                }
                
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    )
}
