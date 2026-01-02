
/**
 * OnboardingGuide.tsx
 * "Jali Premium" - Cinematic Introductory Experience
 */

import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'jali_clover_intro_v3'

export function useOnboarding() {
    const [isComplete, setIsComplete] = useState(false)
    const [shouldRender, setShouldRender] = useState(true)

    useEffect(() => {
        // slight delay to let app load before checking (prevents flash)
        const completed = localStorage.getItem(ONBOARDING_KEY) === 'true'
        if (completed) {
            setIsComplete(true)
            setShouldRender(false)
        }
    }, [])

    const completeOnboarding = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setIsComplete(true)
        // delayed unmount for animation
        setTimeout(() => setShouldRender(false), 1000)
    }

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_KEY)
        setIsComplete(false)
        setShouldRender(true)
    }

    return { isComplete, shouldRender, completeOnboarding, resetOnboarding }
}

export default function OnboardingGuide({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0)
    const [exiting, setExiting] = useState(false)

    const handleNext = () => {
        if (step < 2) {
            setStep(s => s + 1)
        } else {
            handleFinish()
        }
    }

    const handleFinish = () => {
        setExiting(true)
        setTimeout(() => {
            onComplete()
        }, 800) // Match CSS transition duration
    }

    const steps = [
        {
            id: 'identity',
            title: 'WIKICLOVER',
            subtitle: 'Capture the world for Wikimedia.',
            visual: (
                <div className="visual-container identity">
                    <div className="pulse-circle c1" />
                    <div className="pulse-circle c2" />
                    <div className="pulse-circle c3" />
                    {/* Constructed Clover Logo - Organic & Clean */}
                    <svg className="clover-logo" viewBox="0 0 100 100" fill="none">
                        {/* Top Leaf */}
                        <path d="M50 50 C50 50, 20 20, 40 5 C55 -5, 70 10, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M50 50 C50 50, 80 20, 60 5 C45 -5, 30 10, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />

                        {/* Left Leaf */}
                        <path d="M50 50 C50 50, 20 80, 5 60 C-5 45, 10 30, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M50 50 C50 50, 20 20, 5 40 C-5 55, 10 70, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />

                        {/* Right Leaf */}
                        <path d="M50 50 C50 50, 80 80, 95 60 C105 45, 90 30, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />
                        <path d="M50 50 C50 50, 80 20, 95 40 C105 55, 90 70, 50 50" fill="var(--accent)" stroke="var(--accent)" strokeWidth="4" strokeLinejoin="round" />

                        {/* Stem */}
                        <path d="M50 50 Q50 80 60 95" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                </div>
            )
        },
        {
            id: 'capture',
            title: 'PRESERVE HISTORY',
            subtitle: 'Take high-quality photos of heritage and nature.',
            visual: (
                <div className="visual-container capture">
                    <div className="viewfinder">
                        <div className="corner tl" />
                        <div className="corner tr" />
                        <div className="corner bl" />
                        <div className="corner br" />
                        <div className="shutter-button" />
                    </div>
                </div>
            )
        },
        {
            id: 'contribute',
            title: 'OPEN KNOWLEDGE',
            subtitle: 'Your photos help educate the world.',
            visual: (
                <div className="visual-container contribute">
                    <svg className="globe-icon" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2.5 10H21.5" />
                        <path d="M2.5 14H21.5" />
                        <ellipse cx="12" cy="12" rx="4" ry="10" />
                    </svg>
                    <div className="upload-particle p1" />
                    <div className="upload-particle p2" />
                    <div className="upload-particle p3" />
                </div>
            )
        }
    ]

    const s = steps[step]

    return (
        <div className={`cinema-overlay ${exiting ? 'exiting' : ''}`}>
            {/* Background Glow */}
            <div className="ambient-glow" />

            <div className="content-stage">
                <div className="visual-stage" key={step}>
                    {s.visual}
                </div>

                <div className="text-stage">
                    <h1 key={`h-${step}`}>{s.title}</h1>
                    <p key={`p-${step}`}>{s.subtitle}</p>
                </div>

                <div className="action-stage">
                    <div className="stepper-dots">
                        {steps.map((_, i) => (
                            <div key={i} className={`dot ${i === step ? 'active' : ''}`} />
                        ))}
                    </div>

                    <button className="primary-btn glass" onClick={handleNext}>
                        {step === 2 ? "Begin Journey" : "Continue"}
                    </button>
                </div>
            </div>

            <style>{`
                .cinema-overlay {
                    position: fixed; inset: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    color: white;
                    transition: transform 0.8s cubic-bezier(0.8, 0, 0.2, 1), opacity 0.8s ease;
                }

                .cinema-overlay.exiting {
                    transform: translateY(-100%);
                    opacity: 0;
                    pointer-events: none;
                }

                .ambient-glow {
                    position: absolute; inset: 0;
                    background: radial-gradient(circle at 50% 50%, 
                        rgba(var(--accent-hue), var(--accent-saturation), 50%, 0.15), 
                        transparent 70%);
                    animation: breathe 4s ease-in-out infinite;
                }

                .content-stage {
                    position: relative; z-index: 10;
                    width: 100%; max-width: 400px;
                    height: 100%;
                    display: flex; flex-direction: column;
                    justify-content: center; /* Center content vertically */
                    padding: 40px 24px;
                }

                /* Visual Stage (Top/Center) */
                .visual-stage {
                    flex: unset; /* Don't expand */
                    height: 240px; /* Fixed height for consistency */
                    display: flex; align-items: center; justify-content: center;
                    animation: floatIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                    margin-bottom: 24px; /* Tighter gap */
                }

                .visual-container {
                    position: relative;
                    width: 200px; height: 200px;
                    display: flex; align-items: center; justify-content: center;
                }

                /* Identity Visuals */
                .clover-logo { width: 80px; height: 80px; z-index: 2; filter: drop-shadow(0 0 10px var(--accent)); }
                .pulse-circle {
                    position: absolute; border-radius: 50%;
                    border: 1px solid var(--accent);
                    opacity: 0;
                }
                .c1 { width: 100px; height: 100px; animation: repel 3s infinite; }
                .c2 { width: 140px; height: 140px; animation: repel 3s infinite 0.5s; }
                .c3 { width: 180px; height: 180px; animation: repel 3s infinite 1s; }

                /* Capture Visuals */
                .viewfinder {
                    width: 160px; height: 160px; position: relative;
                }
                .corner {
                    position: absolute; width: 24px; height: 24px;
                    border: 2px solid var(--accent);
                    opacity: 0.8;
                }
                .tl { top: 0; left: 0; border-right: none; border-bottom: none; }
                .tr { top: 0; right: 0; border-left: none; border-bottom: none; }
                .bl { bottom: 0; left: 0; border-right: none; border-top: none; }
                .br { bottom: 0; right: 0; border-left: none; border-top: none; }
                .shutter-button {
                    position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
                    width: 40px; height: 40px; border: 2px solid white; border-radius: 50%;
                    animation: snap 2s infinite;
                }

                /* Contribute Visuals */
                .globe-icon { width: 100px; height: 100px; opacity: 0.9; }
                .upload-particle {
                    position: absolute; width: 4px; height: 4px; background: var(--accent);
                    border-radius: 50%; top: 50%; left: 50%;
                }
                .p1 { animation: flyUp 2s infinite; }
                .p2 { animation: flyUp 2s infinite 0.7s; }
                .p3 { animation: flyUp 2s infinite 1.4s; }


                /* Text Stage */
                .text-stage {
                    text-align: center; margin-bottom: 60px;
                    min-height: 120px;
                }
                h1 {
                    font-size: 40px; font-weight: 800; margin-bottom: 16px;
                    line-height: 1.1; letter-spacing: -1px;
                    background: linear-gradient(to bottom, #fff, #888);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: slideUpFade 0.6s ease-out;
                }
                p {
                    font-size: 18px; color: #888;
                    line-height: 1.5; font-weight: 400;
                    animation: slideUpFade 0.6s ease-out 0.1s backwards;
                }

                /* Action Stage */
                .action-stage {
                    display: flex; flex-direction: column; align-items: center; gap: 24px;
                }
                
                .stepper-dots { display: flex; gap: 8px; }
                .dot {
                    width: 6px; height: 6px; background: #333; border-radius: 50%;
                    transition: all 0.3s;
                }
                .dot.active { width: 24px; background: var(--accent); border-radius: 4px; }

                .primary-btn {
                    width: 100%; height: 56px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; font-weight: 600; letter-spacing: 0.5px;
                    text-transform: uppercase;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    color: white;
                    transition: all 0.2s;
                }
                .primary-btn:active { transform: scale(0.98); background: rgba(255,255,255,0.15); }

                /* Animations */
                @keyframes breathe {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }

                @keyframes repel {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }

                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes floatIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes flyUp {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -200px) scale(0); opacity: 0; }
                }
                
                @keyframes snap {
                    0%, 90% { transform: translateX(-50%) scale(1); }
                    95% { transform: translateX(-50%) scale(0.9); background: white; }
                    100% { transform: translateX(-50%) scale(1); background: transparent; }
                }
            `}</style>
        </div>
    )
}
