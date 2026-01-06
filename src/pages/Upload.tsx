/**
 * Upload Page - Bulk Upload Support
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { uploadToCommons, searchCategories, type UploadParams } from '@/lib/wikimedia-upload'
import { getAccessToken } from '@/lib/wikimedia-auth'
import { getDrafts, deleteDraft } from '@/lib/drafts'
import { generateSmartSuggestions } from '@/lib/smart-suggestions'

const LICENSES = [
    { value: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0' },
    { value: 'cc-by-4.0', label: 'CC BY 4.0' },
    { value: 'cc0', label: 'CC0 (Public Domain)' },
] as const

interface UploadItem {
    id: string
    imageData: string
    title: string
    description: string
    date: string
    location: string
    categories: string[]
    license: UploadParams['license']
    status: 'pending' | 'uploading' | 'success' | 'error'
    error?: string
}

export default function Upload() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isLoggedIn } = useAuth()

    const [queue, setQueue] = useState<UploadItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [globalUploading, setGlobalUploading] = useState(false)

    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [categoryInput, setCategoryInput] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])

    // Load drafts on mount
    useEffect(() => {
        if (!isLoggedIn) { navigate('/login'); return }

        const state = location.state as { draftIds?: string[] } | null
        if (!state?.draftIds || state.draftIds.length === 0) { navigate('/mine'); return }

        const allDrafts = getDrafts()
        const items: UploadItem[] = state.draftIds.map(id => {
            const draft = allDrafts.find(d => d.id === id)
            if (!draft) return null
            return {
                id: draft.id,
                imageData: draft.imageData,
                title: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                location: '',
                categories: [],
                license: 'cc-by-sa-4.0',
                status: 'pending'
            }
        }).filter(Boolean) as UploadItem[]

        if (items.length === 0) navigate('/mine')
        setQueue(items)
    }, [isLoggedIn, navigate, location.state])

    // Current item helper
    const currentItem = queue[currentIndex]

    // updateCurrentItem
    const updateItem = (updates: Partial<UploadItem>) => {
        setQueue(prev => prev.map((item, i) =>
            i === currentIndex ? { ...item, ...updates } : item
        ))
    }

    // Apply to All
    const applyToAll = () => {
        if (!currentItem) return
        if (confirm('Apply Title pattern, Description, and Categories to ALL images?')) {
            setQueue(prev => prev.map((item, i) => {
                if (i === currentIndex) return item
                return {
                    ...item,
                    description: currentItem.description,
                    categories: [...currentItem.categories],
                    license: currentItem.license,
                    // Smart title numbering
                    title: currentItem.title ? `${currentItem.title} ${i + 1}` : ''
                }
            }))
        }
    }

    // Smart Suggest
    const handleSmartSuggest = async () => {
        if (!currentItem) return
        const suggestions = await generateSmartSuggestions(currentItem.imageData)
        updateItem({
            title: suggestions.title || '',
            date: suggestions.date || currentItem.date,
            categories: [...currentItem.categories, ...suggestions.categories]
        })
    }

    // Category search
    const searchCats = useCallback(async (q: string) => {
        if (q.length < 2) { setSuggestions([]); return }
        const results = await searchCategories(q)
        setSuggestions(results)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => searchCats(categoryInput), 300)
        return () => clearTimeout(t)
    }, [categoryInput, searchCats])

    const addCategory = (cat: string) => {
        if (!currentItem) return
        if (!currentItem.categories.includes(cat)) {
            updateItem({ categories: [...currentItem.categories, cat] })
        }
        setCategoryInput('')
        setSuggestions([])
    }

    const removeCategory = (cat: string) => {
        if (!currentItem) return
        updateItem({ categories: currentItem.categories.filter(c => c !== cat) })
    }

    // Upload Logic
    const handleUploadAll = async () => {
        // Validate
        const invalid = queue.findIndex(i => !i.title.trim() || !i.description.trim())
        if (invalid !== -1) {
            setCurrentIndex(invalid)
            alert(`Please fix image #${invalid + 1} (Missing Title or Description)`)
            return
        }

        setGlobalUploading(true)
        const token = await getAccessToken()

        if (!token) {
            alert('Auth Error. Please log in again.')
            setGlobalUploading(false)
            return
        }

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i]
            if (item.status === 'success') continue // Skip already done

            // Update status to uploading
            setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'uploading' } : q))
            setCurrentIndex(i)

            // Prepare Filename
            const mime = item.imageData.match(/:(.*?);/)?.[1] || 'image/jpeg'
            const ext = mime === 'image/png' ? 'png' : 'jpg'
            const filename = `${item.title.trim().replace(/[^a-zA-Z0-9_\- ]/g, '')}.${ext}`

            // Upload
            const result = await uploadToCommons(item.imageData, {
                filename,
                description: item.description,
                source: '{{own}}',
                date: item.date,
                author: `[[User:${user?.username}|${user?.username}]]`,
                license: item.license,
                categories: item.categories,
                location: item.location || undefined
            }, token)

            if (result.success) {
                setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'success' } : q))
                deleteDraft(item.id)
            } else {
                setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'error', error: result.error } : q))
                // Stop on error? No, try next, but maybe pause?
                // For now continue
            }
        }

        setGlobalUploading(false)

        // If all success, go home
        if (queue.every(i => i.status === 'success')) {
            setTimeout(() => navigate('/mine'), 1000)
        }
    }

    if (!currentItem) return null

    return (
        <div className="upload-page">
            <header className="glass-header">
                <button className="icon-btn" onClick={() => navigate(-1)} disabled={globalUploading}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <span className="page-title">Bulk Upload ({queue.filter(i => i.status === 'success').length}/{queue.length})</span>
                <button className="text-btn" onClick={applyToAll} disabled={globalUploading}>Apply to All</button>
            </header>

            {/* Queue Carousel */}
            <div className="queue-rail">
                {queue.map((item, i) => (
                    <div
                        key={item.id}
                        className={`queue-thumb ${i === currentIndex ? 'active' : ''} ${item.status}`}
                        onClick={() => !globalUploading && setCurrentIndex(i)}
                    >
                        <img src={item.imageData} alt="" />
                        {item.status === 'success' && <div className="badge success"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg></div>}
                        {item.status === 'error' && <div className="badge error"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>}
                    </div>
                ))}
            </div>

            <main className="content">
                <div className="preview-container">
                    <img src={currentItem.imageData} alt="Preview" className="preview-img" />
                </div>

                <div className="form-section">
                    <div className="card glass">
                        <div className="row-between">
                            <label>Status: <span className={`status-text ${currentItem.status}`}>{currentItem.status}</span></label>
                            <button className="smart-btn" onClick={handleSmartSuggest} disabled={globalUploading}>
                                Smart Fill
                            </button>
                        </div>
                        {currentItem.error && <p className="error-text">{currentItem.error}</p>}

                        <div className="input-group">
                            <label>Title <span className="required">*</span></label>
                            <input
                                type="text"
                                value={currentItem.title}
                                onChange={e => updateItem({ title: e.target.value })}
                                placeholder="E.g., Sunset in Kyoto 2026"
                                disabled={globalUploading || currentItem.status === 'success'}
                            />
                        </div>

                        <div className="input-group">
                            <label>Description <span className="required">*</span></label>
                            <textarea
                                value={currentItem.description}
                                onChange={e => updateItem({ description: e.target.value })}
                                placeholder="Describe what is in this image..."
                                rows={2}
                                disabled={globalUploading || currentItem.status === 'success'}
                            />
                        </div>
                    </div>

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

                    {showAdvanced && (
                        <div className="card glass advanced-fields fade-in">
                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={currentItem.date}
                                        onChange={e => updateItem({ date: e.target.value })}
                                        disabled={globalUploading}
                                    />
                                </div>
                                <div className="input-group half">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={currentItem.location}
                                        onChange={e => updateItem({ location: e.target.value })}
                                        placeholder="Lat, Lon"
                                        disabled={globalUploading}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>License</label>
                                <select
                                    value={currentItem.license}
                                    onChange={e => updateItem({ license: e.target.value as UploadParams['license'] })}
                                    disabled={globalUploading}
                                >
                                    {LICENSES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Categories</label>
                                <div className="tags-container">
                                    {currentItem.categories.map(c => (
                                        <span key={c} className="tag">
                                            {c}
                                            <button onClick={() => removeCategory(c)} disabled={globalUploading}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={categoryInput}
                                    onChange={e => setCategoryInput(e.target.value)}
                                    placeholder="Search categories..."
                                    className="search-input"
                                    disabled={globalUploading}
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

                <div className="upload-actions-flow">
                    <button
                        className="primary-btn"
                        onClick={handleUploadAll}
                        disabled={globalUploading || queue.every(i => i.status === 'success')}
                    >
                        {globalUploading ? 'Uploading Queue...' : `Upload All (${queue.length})`}
                    </button>
                </div>
            </main>

            <style>{`
                .upload-page { display: flex; flex-direction: column; height: 100vh; background: var(--bg); color: var(--text); }
                .glass-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(var(--bg-card), 0.8); border-bottom: 1px solid var(--border); }
                .page-title { font-weight: 600; font-size: 16px; }
                .text-btn { background: none; border: none; color: var(--accent); font-weight: 600; cursor: pointer; font-size: 14px; }
                .icon-btn { background: none; border: none; color: var(--text); cursor: pointer; }

                .queue-rail {
                    display: flex; gap: 12px; padding: 16px; overflow-x: auto;
                    background: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border);
                }
                .queue-thumb {
                    width: 60px; height: 60px; flex-shrink: 0; position: relative;
                    border-radius: 8px; border: 2px solid transparent; overflow: hidden; opacity: 0.6; transition: 0.2s;
                }
                .queue-thumb.active { border-color: var(--accent); opacity: 1; transform: scale(1.1); }
                .queue-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .badge { position: absolute; bottom: 0; right: 0; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; }
                .badge.success { background: #10b981; }
                .badge.error { background: #ef4444; }

                .content { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
                .preview-container { display: flex; justify-content: center; height: 200px; }
                .preview-img { height: 100%; width: auto; max-width: 100%; border-radius: 12px; object-fit: contain; }

                .card { padding: 20px; border-radius: 20px; display: flex; flex-direction: column; gap: 16px; background: var(--bg-card); border: 1px solid var(--border); }
                .row-between { display: flex; justify-content: space-between; align-items: center; }
                .smart-btn { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); border: none; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; cursor: pointer; }
                
                .status-text { text-transform: uppercase; font-size: 12px; font-weight: 700; }
                .status-text.pending { color: var(--text-muted); }
                .status-text.success { color: #10b981; }
                .status-text.error { color: #ef4444; }
                .error-text { color: #ef4444; font-size: 12px; margin: 0; }

                .input-group { display: flex; flex-direction: column; gap: 8px; }
                .input-group label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
                .required { color: var(--accent); }
                input, textarea, select { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 12px; padding: 12px; color: var(--text); width: 100%; font-size: 16px; }
                input:focus, textarea:focus { border-color: var(--accent); outline: none; }

                .advanced-toggle { display: flex; justify-content: space-between; padding: 12px; background: none; border: none; color: var(--text-muted); font-weight: 500; width: 100%; cursor: pointer; }
                .input-row { display: flex; gap: 12px; } .half { flex: 1; }
                
                .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
                .tag { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(var(--accent-rgb), 0.15); color: var(--accent); border-radius: 100px; font-size: 13px; }
                .tag button { background: none; border: none; color: currentColor; cursor: pointer; padding: 0; font-size: 16px; }
                
                .primary-btn { width: 100%; padding: 16px; background: var(--accent); color: white; border: none; border-radius: 16px; font-weight: 600; font-size: 16px; cursor: pointer; margin-top: auto; }
                .primary-btn:disabled { opacity: 0.5; }
            `}</style>
        </div>
    )
}

