/**
 * Search Page - Explore Commons images
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchMedia, type MediaFile } from '@/lib/wikimedia-api'
import MediaDetail from '@/components/MediaDetail'

export default function Search() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [continueToken, setContinueToken] = useState<number | undefined>(undefined)
    const [detailItem, setDetailItem] = useState<MediaFile | null>(null)
    const [sortOrder, setSortOrder] = useState<'relevance' | 'newest'>('relevance')
    const observer = useRef<IntersectionObserver | null>(null)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500)
        return () => clearTimeout(timer)
    }, [query])

    const executeSearch = useCallback(async (q: string, token?: number) => {
        if (!q.trim()) return
        const isInitial = token === undefined

        try {
            if (isInitial) setLoading(true)
            else setLoadingMore(true)

            const res = await searchMedia(q, 30, token)

            setResults(prev => isInitial ? res.data : [...prev, ...res.data])
            setContinueToken(res.continueToken ? Number(res.continueToken) : undefined)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    // Perform search
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([])
            setContinueToken(undefined)
            return
        }
        executeSearch(debouncedQuery)
    }, [debouncedQuery, executeSearch])

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && continueToken !== undefined) {
                executeSearch(debouncedQuery, continueToken)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, loadingMore, continueToken, debouncedQuery, executeSearch])

    return (
        <div className="search-page">
            <header className="glass">
                <div className="search-bar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search Wikimedia Commons..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery('')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    )}
                </div>

            </header >

            {
                results.length > 0 && (
                    <div className="filter-bar">
                        <button
                            className="filter-pill"
                            onClick={() => setSortOrder(prev => prev === 'relevance' ? 'newest' : 'relevance')}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M3 12h12M3 18h6" />
                            </svg>
                            {sortOrder === 'relevance' ? 'Relevance' : 'Newest'}
                        </button>
                    </div>
                )
            }

            <div className="content">
                <div className="grid">
                    {[...results]
                        .sort((a, b) => {
                            if (sortOrder === 'relevance') return 0 // Keep API order
                            const timeA = new Date(a.imageinfo?.[0]?.timestamp || 0).getTime()
                            const timeB = new Date(b.imageinfo?.[0]?.timestamp || 0).getTime()
                            return timeB - timeA
                        })
                        .map((item, index) => (
                            <div
                                key={`${item.pageid}-${index}`}
                                ref={index === results.length - 1 ? lastElementRef : null}
                                className="item"
                                onClick={() => setDetailItem(item)}
                            >
                                <img src={item.imageinfo?.[0]?.thumburl} alt={item.title} loading="lazy" />
                            </div>
                        ))}
                </div>

                {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
                {loadingMore && <div className="loading"><div className="spinner small"></div></div>}

                {
                    !loading && results.length === 0 && (
                        debouncedQuery ? (
                            <div className="empty">No results found</div>
                        ) : (
                            <div className="empty intro">
                                <p>Search for cats, architecture, space...</p>
                            </div>
                        )
                    )
                }
            </div >

            {detailItem && detailItem.imageinfo?.[0] && (
                <MediaDetail
                    item={detailItem}
                    onClose={() => setDetailItem(null)}
                />
            )
            }

            <style>{`
                .search-page { display: flex; flex-direction: column; height: 100%; background: var(--bg); }
                
                header { 
                    padding: 16px; 
                    position: sticky; top: 0; z-index: 10;
                    border-bottom: 0; margin: 16px; border-radius: 24px;
                }
                
                .search-bar {
                    display: flex; align-items: center; gap: 12px;
                    height: 44px; padding: 0 16px;
                    color: var(--text-secondary);
                }
                
                input {
                    flex: 1; bg: transparent; border: none; outline: none;
                    background: transparent; color: var(--text);
                    font-size: 16px; font-family: var(--font-sans);
                }
                input::placeholder { color: var(--text-muted); }
                
                .content { flex: 1; overflow-y: auto; padding-bottom: 100px; }
                
                .grid { 
                    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; 
                    padding: 0 16px; 
                }
                @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); } }

                .filter-bar { 
                    padding: 0 16px 12px; display: flex; gap: 8px; margin-top: -8px;
                }
                .filter-pill {
                    background: rgba(255,255,255,0.05); color: var(--text-muted);
                    border: 1px solid transparent; padding: 6px 12px; border-radius: 20px;
                    font-size: 13px; font-weight: 500; cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                }
                .filter-pill:hover { background: rgba(255,255,255,0.1); color: var(--text); }
                
                .item { 
                    position: relative; aspect-ratio: 1; 
                    background: var(--bg-card); border-radius: 16px; overflow: hidden; 
                    cursor: pointer;
                }
                .item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
                .item:active img { transform: scale(0.96); }
                
                .empty { 
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    height: 300px; color: var(--text-muted); font-size: 15px;
                }
                .loading { display: flex; justify-content: center; padding: 40px; }
            `}</style>
        </div>
    )
}
