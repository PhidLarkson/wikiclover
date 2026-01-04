import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
registerSW({
    onNeedRefresh() {
        console.log('New content available, click on reload button to update.')
    },
    onOfflineReady() {
        console.log('App is ready to work offline')
    },
    onRegisterError(error: unknown) {
        console.error('SW registration error', error)
    }
})


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
)
