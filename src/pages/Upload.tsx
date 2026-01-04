/**
 * Upload Page - Commons upload form
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { uploadToCommons, searchCategories, type UploadParams } from '@/lib/wikimedia-upload'
import { getAccessToken } from '@/lib/wikimedia-auth'
import { deleteDraft } from '@/lib/drafts'

const LICENSES = [
    { value: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0' },
    { value: 'cc-by-4.0', label: 'CC BY 4.0' },
    { value: 'cc0', label: 'CC0 (Public Domain)' },
] as const

export default function Upload() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isLoggedIn } = useAuth()

    // Get image from navigation state
    const imageData = location.state?.imageData as string | undefined
    const draftId = location.state?.draftId as string | undefined

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [locationStr, setLocationStr] = useState('')
    const [license, setLicense] = useState<UploadParams['license']>('cc-by-sa-4.0')

    // Toggle for advanced
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [categoryInput, setCategoryInput] = useState('')
    const [categories, setCategories] = useState<string[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])

    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isLoggedIn) navigate('/login')
        if (!imageData) navigate('/mine')
    }, [isLoggedIn, imageData, navigate])

    // Category search
    const searchCats = useCallback(async (q: string) => {
        if (q.length < 2) { setSuggestions([]); return }
        const results = await searchCategories(q)
        setSuggestions(results.filter(r => !categories.includes(r)))
    }, [categories])

    useEffect(() => {
        const t = setTimeout(() => searchCats(categoryInput), 300)
        return () => clearTimeout(t)
    }, [categoryInput, searchCats])

    const addCategory = (cat: string) => {
        if (!categories.includes(cat)) {
            setCategories(prev => [...prev, cat])
        }
        setCategoryInput('')
        setSuggestions([])
    }

    const removeCategory = (cat: string) => {
        setCategories(prev => prev.filter(c => c !== cat))
    }

    const handleSubmit = async () => {
        if (!imageData || !title.trim() || !description.trim()) {
            setError('Please fill in title and description')
            return
        }

        setUploading(true)
        setError('')
        setProgress('Getting authorization...')

        try {
            const token = await getAccessToken()
            if (!token) throw new Error('Not authenticated')

            setProgress('Uploading to Commons...')

            const mime = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg'
            const ext = mime === 'image/png' ? 'png' : 'jpg'
            const filename = `${title.trim().replace(/[^a-zA-Z0-9_\- ]/g, '')}.${ext}`

            const result = await uploadToCommons(imageData, {
                filename,
                description: description.trim(),
                source: '{{own}}',
                date,
                author: `[[User:${user?.username}|${user?.username}]]`,
                license,
                categories,
                location: locationStr.trim() || undefined
            }, token)

            if (result.success) {
                setProgress('Success!')
                // Delete draft if it was from drafts
                if (draftId) deleteDraft(draftId)
                setTimeout(() => {
                    navigate('/mine', { state: { uploaded: true } })
                }, 1500)
            } else {
                setError(result.error || 'Upload failed')
                setProgress('')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
            setProgress('')
        } finally {
            setUploading(false)
        }
    }

    if (!imageData) return null

    return (
        <div className="upload-page">
            <header className="glass-header">
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="page-title">Upload Details</span>
                <div style={{ width: 40 }} />
            </header>

            <main className="content">
                <div className="preview-container">
                    <img src={imageData} alt="Preview" className="preview-img" />
                </div>

                <div className="form-section">
                    {/* Basic Info */}
                    <div className="card glass">
                        <div className="input-group">
                            <label>Title <span className="required">*</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="E.g., Sunset in Kyoto 2026"
                                disabled={uploading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Description <span className="required">*</span></label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe what is in this image..."
                                rows={3}
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    {/* Advanced Toggle */}
                    <button
                        className={`advanced-toggle ${showAdvanced ? 'active' : ''}`}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <span>Advanced Details</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {/* Advanced Section */}
                    {showAdvanced && (
                        <div className="card glass advanced-fields fade-in">
                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="input-group half">
                                    <label>Location (Optional)</label>
                                    <input
                                        type="text"
                                        value={locationStr}
                                        onChange={e => setLocationStr(e.target.value)}
                                        placeholder="e.g. 40.7128, -74.0060"
                                        disabled={uploading}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>License</label>
                                <select
                                    value={license}
                                    onChange={e => setLicense(e.target.value as UploadParams['license'])}
                                    disabled={uploading}
                                >
                                    {LICENSES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Categories</label>
                                <div className="tags-container">
                                    {categories.map(c => (
                                        <span key={c} className="tag">
                                            {c}
                                            <button onClick={() => removeCategory(c)} disabled={uploading}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={categoryInput}
                                    onChange={e => setCategoryInput(e.target.value)}
                                    placeholder="Search categories..."
                                    className="search-input"
                                    disabled={uploading}
                                />
                                {suggestions.length > 0 && (
                                    <div className="suggestions-list">
                                        {suggestions.map(s => (
                                            <button key={s} onClick={() => addCategory(s)} className="suggestion-item">
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="footer-actions glass-footer">
                {error && <div className="status-msg error">{error}</div>}
                {progress && <div className="status-msg info">{progress}</div>}

                <button
                    className="primary-btn"
                    onClick={handleSubmit}
                    disabled={uploading || !title.trim() || !description.trim()}
                >
                    {uploading ? 'Uploading...' : 'Publish to Commons'}
                </button>
                <p className="terms-text">By publishing, you agree to the <a href="#">Terms of Use</a></p>
            </footer>

            <style>{`
                .upload-page {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: var(--bg);
                    color: var(--text);
                }

                .glass-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: rgba(var(--bg-card-rgb), 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--border);
                    z-index: 10;
                }

                .page-title {
                    font-weight: 600;
                    font-size: 16px;
                }

                .icon-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }

                .content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding-bottom: 100px; /* Space for footer */
                }

                .preview-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 10px;
                }

                .preview-img {
                    max-height: 300px;
                    max-width: 100%;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    object-fit: contain;
                }

                .card {
                    padding: 20px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 10px;
                }

                .glass {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .input-group label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .required { color: var(--accent); }

                input, textarea, select {
                    background: var(--bg-input, rgba(255,255,255,0.05));
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 12px;
                    color: var(--text);
                    font-size: 16px;
                    font-family: inherit;
                    width: 100%;
                    transition: border-color 0.2s;
                }

                input:focus, textarea:focus, select:focus {
                    border-color: var(--accent);
                    outline: none;
                }

                textarea { resize: none; min-height: 100px; }

                .advanced-toggle {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 12px;
                }

                .advanced-toggle:hover {
                    background: rgba(255,255,255,0.03);
                    color: var(--text);
                }

                .advanced-fields {
                    margin-top: 10px;
                }

                .input-row {
                    display: flex;
                    gap: 12px;
                }
                .half { flex: 1; }

                .tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .tag {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(var(--accent-rgb), 0.15);
                    color: var(--accent);
                    border-radius: 100px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .tag button {
                    background: none;
                    border: none;
                    color: currentColor;
                    opacity: 0.6;
                    font-size: 18px;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0;
                }

                .suggestions-list {
                    margin-top: 8px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }

                .suggestion-item {
                    padding: 12px;
                    text-align: left;
                    background: none;
                    border: none;
                    border-bottom: 1px solid var(--border);
                    color: var(--text);
                    cursor: pointer;
                }

                .suggestion-item:hover {
                    background: rgba(255,255,255,0.05);
                }

                .footer-actions {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 20px;
                    background: var(--bg);
                    border-top: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    z-index: 20;
                }

                .glass-footer {
                    background: rgba(var(--bg-rgb), 0.9);
                    backdrop-filter: blur(20px);
                }

                .primary-btn {
                    width: 100%;
                    padding: 16px;
                    background: var(--accent);
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    border: none;
                    border-radius: 16px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(var(--accent-rgb), 0.3);
                    transition: transform 0.2s, opacity 0.2s;
                }

                .primary-btn:active { transform: scale(0.98); }
                .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .terms-text {
                    text-align: center;
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .status-msg {
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    text-align: center;
                    font-weight: 500;
                }
                .error { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
                .info { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    )
}
