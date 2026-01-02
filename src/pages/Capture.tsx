
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [isReady, setIsReady] = useState(false)
    const [facing, setFacing] = useState<CameraFacing>('environment')
    const [captured, setCaptured] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [saving, setSaving] = useState(false)

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
        if (!captured && (isReady || error)) startCamera()
    }, [facing])

    const snap = () => {
        if (!videoRef.current || !canvasRef.current || !isReady) return
        const video = videoRef.current, canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')!
        if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
        ctx.drawImage(video, 0, 0)
        setCaptured(canvas.toDataURL('image/jpeg', 0.92))
        stopCamera()
    }

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => { setCaptured(ev.target?.result as string); stopCamera() }
        reader.readAsDataURL(file)
    }

    const handleSaveDraft = async () => {
        if (!captured) return
        setSaving(true)
        try {
            await saveDraft(captured)
            navigate('/mine')
        } catch { /* */ }
        finally { setSaving(false) }
    }

    const handleUpload = () => {
        if (!captured) return
        navigate('/upload', { state: { imageData: captured } })
    }

    const retake = () => { setCaptured(null); setTimeout(startCamera, 100) }

    return (
        <div className="cap">
            {/* Error state */}
            {error && !captured && (
                <div className="err">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" /></svg>
                    <p>{error}</p>
                    <div className="err-btns">
                        <button className="glass-btn" onClick={() => fileInputRef.current?.click()}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg></button>
                        <button className="glass-btn" onClick={startCamera}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg></button>
                        <button className="glass-btn" onClick={() => navigate(-1)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg></button>
                    </div>
                </div>
            )}

            {/* Camera view */}
            {!captured && !error && (
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
                        <button className="glass-btn" onClick={() => fileInputRef.current?.click()}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </button>

                        <button className="shutter" onClick={snap} disabled={!isReady}>
                            <span className="outer"><span className="inner" /></span>
                        </button>

                        <button className="glass-btn" onClick={() => { setIsReady(false); setFacing(f => f === 'environment' ? 'user' : 'environment') }} disabled={!isReady}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Preview with options */}
            {captured && (
                <div className="prev">
                    <img src={captured} alt="" />
                    <div className="overlay-opts">
                        <button className="glass-btn" onClick={retake}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" /></svg>
                        </button>

                        <button className="glass-btn primary" onClick={handleUpload}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        </button>

                        <button className="glass-btn" onClick={handleSaveDraft} disabled={saving}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
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
        display: flex; align-items: center; justify-content: space-between;
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
`}</style>
        </div>
    )
}
