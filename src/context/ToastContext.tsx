import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastContextType {
    showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ msg: string, id: number } | null>(null)

    const showToast = useCallback((msg: string) => {
        const id = Date.now()
        setToast({ msg, id })
        setTimeout(() => {
            setToast(prev => prev?.id === id ? null : prev)
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div className="toast-container">
                    <div className="toast-message">{toast.msg}</div>
                </div>
            )}
            <style>{`
                .toast-container {
                    position: fixed;
                    bottom: 90px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2000;
                    pointer-events: none;
                    animation: toast-in 0.3s ease-out;
                }
                .toast-message {
                    background: rgba(30, 30, 30, 0.95);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    text-align: center;
                    white-space: pre-wrap;
                    line-height: 1.4;
                    max-width: 90vw;
                }
                @keyframes toast-in {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
