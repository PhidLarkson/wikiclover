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
    const [license, setLicense] = useState<UploadParams['license']>('cc-by-sa-4.0')
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
                date: new Date().toISOString().split('T')[0],
                author: `[[User:${user?.username}|${user?.username}]]`,
                license,
                categories,
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
        <div className="upload">
            <header className="glass">
                <button className="hb" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="tt">Upload details</span>
                <div style={{ width: 40 }} />
            </header>

            <div className="form-container">
                <div className="preview-card glass">
                    <img src={imageData} alt="Preview" />
                </div>

                <div className="fields">
                    <div className="group glass">
                        <label>Title <span className="req">*</span></label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Sunset in Kyoto 2024" />
                    </div>

                    <div className="group glass">
                        <label>Description <span className="req">*</span></label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what is in this image..." rows={3} />
                    </div>

                    <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                        <span>Advanced Details</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>

                    {showAdvanced && (
                        <div className="advanced-section">
                            <div className="group glass">
                                <label>License</label>
                                <select value={license} onChange={e => setLicense(e.target.value as UploadParams['license'])}>
                                    {LICENSES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>

                            <div className="group glass">
                                <label>Categories</label>
                                <div className="cats">
                                    {categories.map(c => (
                                        <span key={c} className="cat">
                                            {c}
                                            <button onClick={() => removeCategory(c)}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={categoryInput}
                                    onChange={e => setCategoryInput(e.target.value)}
                                    placeholder="Search categories..."
                                    className="cat-input"
                                />
                                {suggestions.length > 0 && (
                                    <div className="sugg">
                                        {suggestions.map(s => (
                                            <button key={s} onClick={() => addCategory(s)}>{s}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {error && <div className="alert error">{error}</div>}
                {progress && <div className="alert info">{progress}</div>}

                <div className="action-area">
                    <button className="submit-btn" onClick={handleSubmit} disabled={uploading || !title.trim() || !description.trim()}>
                        {uploading ? 'Uploading...' : 'Publish to Commons'}
                    </button>
                    <p className="terms">By publishing, you agree to the <a href="#">Terms of Use</a></p>
                </div>
            </div>

            <style>{`
        .upload { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
        .glass { background: rgba(var(--bg-card-rgb), 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        
        header { display: flex; align-items: center; justify-content: space-between; padding: 16px; position: sticky; top: 0; z-index: 10; margin-bottom: 10px; }
        .hb { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--text); }
        .tt { font-weight: 600; font-size: 16px; }

        .form-container { flex: 1; overflow-y: auto; padding: 0 20px 40px; display: flex; flex-direction: column; gap: 20px; }

        .preview-card { padding: 10px; border-radius: 20px; text-align: center; }
        .preview-card img { max-height: 240px; max-width: 100%; border-radius: 12px; object-fit: contain; }

        .fields { display: flex; flex-direction: column; gap: 16px; }
        .group { padding: 16px; border-radius: 20px; display: flex; flex-direction: column; gap: 10px; }
        .group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .req { color: var(--accent); }
        
        input, textarea, select {
            background: transparent; border: none; outline: none;
            color: var(--text); font-size: 16px; font-family: inherit; width: 100%;
        }
        select { background: var(--bg-card); color: var(--text); padding: 8px; border-radius: 8px; }
        textarea { resize: none; min-height: 80px; }
        .cat-input { border-bottom: 1px solid var(--border); padding-bottom: 8px; }

        .advanced-toggle {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            padding: 12px;
            color: var(--text-muted); font-size: 14px; font-weight: 500;
            cursor: pointer;
        }
        
        .cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .cat { display: flex; align-items: center; gap: 4px; padding: 6px 10px; background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.2); color: var(--accent); border-radius: 100px; font-size: 12px; font-weight: 600; }
        .cat button { font-size: 16px; opacity: 0.7; }

        .sugg { margin-top: 10px; max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; }
        .sugg button { padding: 10px; text-align: left; font-size: 14px; border-bottom: 1px solid var(--border); }

        .alert { padding: 16px; border-radius: 16px; font-size: 14px; text-align: center; font-weight: 500; }
        .error { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
        .info { background: rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.1); color: var(--accent); }

        .action-area { margin-top: 20px; text-align: center; }
        .submit-btn {
            width: 100%; padding: 16px;
            background: var(--accent); color: white;
            font-size: 16px; font-weight: 600;
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.4);
            transition: transform 0.2s;
        }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.5; transform: none; box-shadow: none; }
        
        .terms { margin-top: 16px; font-size: 12px; color: var(--text-muted); }
        .terms a { color: var(--text-secondary); text-decoration: underline; }
      `}</style>
        </div>
    )
}
