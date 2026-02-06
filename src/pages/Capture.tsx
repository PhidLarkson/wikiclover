
/**
 * Capture Page - With proper shutter and upload flow
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveDraft } from '@/lib/drafts'

type CameraFacing = 'user' | 'environment'

export default function Capture() {
    const navigate = useNavigate()

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const galleryInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [isReady, setIsReady] = useState(false)
    const [facing] = useState<CameraFacing>('environment')

    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [saving, setSaving] = useState(false)

    // Multi-capture session
    const [sessionCaptures, setSessionCaptures] = useState<string[]>([])
    const [viewingCapture, setViewingCapture] = useState<string | null>(null)

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setIsReady(false)
    }, [])

    const startCamera = useCallback(async () => {
        if (isStarting) return
        setIsStarting(true)
        setError(null)

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Camera not supported')
            setIsStarting(false)
            return
        }

        try {
            stopCamera()
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            })

            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await new Promise<void>((resolve, reject) => {
                    const video = videoRef.current!
                    video.onloadedmetadata = () => video.play().then(resolve).catch(reject)
                    video.onerror = () => reject(new Error('Video error'))
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                })
                setIsReady(true)
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Camera error'
            setError(msg.includes('Permission') ? 'Permission denied' : msg.includes('NotReadable') ? 'Camera in use' : msg)
        } finally {
            setIsStarting(false)
        }
    }, [facing, stopCamera, isStarting])

    useEffect(() => {
        const t = setTimeout(startCamera, 300)
        return () => { clearTimeout(t); stopCamera() }
    }, [])

    useEffect(() => {
        if (!viewingCapture && (isReady || error)) startCamera()
    }, [facing])

    const snap = () => {
        if (!videoRef.current || !canvasRef.current || !isReady) return
        const video = videoRef.current, canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        setSessionCaptures(prev => [...prev, dataUrl])
        // DON'T auto-show preview - let user continue snapping
        // They can tap the thumbnail to review
    }

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // Process all selected files with proper async handling
        const readFile = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = ev => {
                    if (ev.target?.result) {
                        resolve(ev.target.result as string)
                    } else {
                        reject(new Error('Failed to read file'))
                    }
                }
                reader.onerror = () => reject(new Error('FileReader error'))
                reader.readAsDataURL(file)
            })
        }

        try {
            const results = await Promise.all(Array.from(files).map(readFile))
            setSessionCaptures(prev => [...prev, ...results])
        } catch (err) {
            console.error('Failed to read files:', err)
        }
    }

    const handleFinishSession = async () => {
        if (sessionCaptures.length === 0) return
        setSaving(true)
        try {
            stopCamera() // Stop camera before navigating
            const draftIds: string[] = []
            for (const img of sessionCaptures) {
                const draft = await saveDraft(img, sessionCaptures.length > 1)
                draftIds.push(draft.id)
            }
            navigate('/upload', { state: { draftIds } })
        } catch (err) {
            console.error('Failed to save drafts:', err)
            setSaving(false)
            // Restart camera on error
            startCamera()
        }
    }

    // Updated UI to show session count and controls



    return (
        <div className="cap">
            {/* Error state */}
            {error && !viewingCapture && (
                <div className="err">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" /></svg>
                    <p>{error}</p>
                    <div className="err-btns">
                        <button className="glass-btn" onClick={() => galleryInputRef.current?.click()}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></button>
                        <button className="glass-btn primary" onClick={() => cameraInputRef.current?.click()} style={{ width: 64, height: 64 }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        </button>
                        <button className="glass-btn" onClick={startCamera}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
                        <button className="glass-btn" onClick={() => navigate(-1)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
                    </div>
                </div>
            )}

            {/* Camera view */}
            {!viewingCapture && !error && (
                <div className="cam">
                    <video ref={videoRef} autoPlay playsInline muted style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
                    {!isReady && <div className="ld"><div className="spinner" /></div>}

                    {/* Top Bar */}
                    <div className="top-bar">
                        <button className="glass-btn" onClick={() => { stopCamera(); navigate(-1) }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="ctrls">
                        <button className="glass-btn" onClick={() => galleryInputRef.current?.click()}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </button>

                        <button className="glass-btn" onClick={() => cameraInputRef.current?.click()}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        </button>

                        <button className="shutter" onClick={snap} disabled={!isReady}>
                            <span className="outer"><span className="inner" /></span>
                        </button>


                    </div>
                </div>
            )}

            {/* Preview with options */}
            {/* Session Preview / Done Bar */}
            {!viewingCapture && sessionCaptures.length > 0 && !error && (
                <div className="session-bar">
                    <div className="thumb-stack" onClick={() => setViewingCapture(sessionCaptures[sessionCaptures.length - 1])}>
                        <img src={sessionCaptures[sessionCaptures.length - 1]} alt="" />
                        <span className="badge">{sessionCaptures.length}</span>
                    </div>
                    <button className="done-btn" onClick={handleFinishSession} disabled={saving}>
                        {saving ? 'Processing...' : `Done (${sessionCaptures.length})`}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                </div>
            )}

            {/* Individual Capture Preview Overlay */}
            {viewingCapture && (
                <div className="prev">
                    <img src={viewingCapture} alt="" />
                    <div className="overlay-opts">
                        <button className="glass-btn" onClick={() => {
                            // Go back to camera view
                            setViewingCapture(null)
                            // Ensure camera is running
                            if (!isReady && !isStarting) startCamera()
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <button className="glass-btn primary" onClick={handleFinishSession} disabled={saving}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        </button>

                        {/* Option to delete from session? */}
                        <button className="glass-btn error" onClick={() => {
                            setSessionCaptures(prev => prev.filter(c => c !== viewingCapture))
                            setViewingCapture(null)
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <input ref={galleryInputRef} type="file" multiple accept="image/*" onChange={onFile} hidden />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
            <canvas ref={canvasRef} hidden />

            <style>{`
    .cap { position: fixed; inset: 0; background: transparent; display: flex; flex-direction: column; }
    .cam, .prev { flex: 1; position: relative; background: transparent; display: flex; flex-direction: column; overflow: hidden; }
    .cam video { width: 100%; height: 100%; object-fit: cover; }
    .prev img { flex: 1; width: 100%; height: 100%; object-fit: contain; background: #000; }
    
    .ld { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); z-index: 10; }
    
    .top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 20px; display: flex; justify-content: space-between; z-index: 10; }
    
    .ctrls {
        position: absolute; bottom: 0; left: 0; right: 0;
        padding: 20px 30px;
        padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
        display: flex; align-items: center; justify-content: space-evenly;
        background: transparent;
        z-index: 20;
    }
    
    .overlay-opts {
        position: absolute; bottom: 40px; left: 0; right: 0;
        display: flex; justify-content: center; gap: 24px;
        padding: 20px;
    }

    .glass-btn {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: white;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.1s;
    }
    .glass-btn:active { transform: scale(0.92); background: rgba(255, 255, 255, 0.2); }
    .glass-btn.primary {
        width: 72px; height: 72px;
        background: var(--accent); color: var(--black);
        box-shadow: 0 0 24px rgba(var(--accent-hue), var(--accent-saturation), var(--accent-lightness), 0.4);
        border: none;
    }

    .shutter {
        width: 84px; height: 84px;
        border-radius: 50%;
        background: transparent;
        padding: 0;
        display: flex; align-items: center; justify-content: center;
        border: 4px solid white;
    }
    .shutter.outer {
        width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    }
    .shutter.inner {
        width: 70px; height: 70px;
        border-radius: 50%;
        background: white;
        transition: transform 0.1s;
    }
    .shutter:active:not(:disabled) .inner { transform: scale(0.9); background: var(--accent); }
    
    .err { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #888; text-align: center; }
    .err-btns { display: flex; gap: 16px; }

    .session-bar {
        position: absolute; bottom: 120px; right: 20px;
        display: flex; align-items: center; gap: 12px;
        z-index: 30;
    }
    .thumb-stack {
        width: 60px; height: 60px; position: relative;
        border-radius: 8px; border: 2px solid white; overflow: hidden;
        cursor: pointer;
    }
    .thumb-stack img { width: 100%; height: 100%; object-fit: cover; }
    .thumb-stack .badge {
        position: absolute; top: 0; right: 0; background: var(--accent); color: white;
        width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: bold; border-bottom-left-radius: 8px;
    }
    .done-btn {
        padding: 12px 20px; background: white; color: black; border-radius: 30px;
        border: none; font-weight: bold; display: flex; align-items: center; gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
`}</style>
        </div>
    )
}
