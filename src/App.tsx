import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { AccessibilityProvider } from '@/context/AccessibilityContext'
import { PWAProvider } from '@/context/PWAContext'
import Layout from '@/components/Layout'
import PWAInstall from '@/components/PWAInstall'
import BackToTop from '@/components/BackToTop'
import OnboardingGuide, { useOnboarding } from '@/components/OnboardingGuide'
import Feed from '@/pages/Feed'
import Search from '@/pages/Search'
import Capture from '@/pages/Capture'
import Mine from '@/pages/Mine'
import Favorites from '@/pages/Favorites'
import Upload from '@/pages/Upload'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import AuthCallback from '@/pages/AuthCallback'
import UserProfile from '@/pages/UserProfile'
import Campaigns from '@/pages/Campaigns'
import Notifications from '@/pages/Notifications'

import { ToastProvider } from '@/context/ToastContext'
import { NotificationProvider } from '@/context/NotificationContext'

function AppContent() {
    const { isLoggedIn, isGuest, isLoading } = useAuth()
    const { shouldRender, completeOnboarding } = useOnboarding()
    const location = useLocation()
    // Simplified mobile check (optional, or remove if not needed)
    // const isMobile = window.innerWidth <= 768 

    // Allow access to auth callback and login page without being logged in
    const isPublicRoute = location.pathname.startsWith('/auth/callback') || location.pathname === '/login'

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner" />
            </div>
        )
    }

    if (!isLoggedIn && !isGuest && !isPublicRoute) {
        return <Login />
    }

    return (
        <>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Feed />} />
                    <Route path="search" element={<Search />} />
                    <Route path="capture" element={<Capture />} />
                    <Route path="favorites" element={<Favorites />} />
                    <Route path="mine" element={<Mine />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="user/:username" element={<UserProfile />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="notifications" element={<Notifications />} />
                </Route>
                <Route path="upload" element={<Upload />} />
                <Route path="login" element={<Login />} />
                <Route path="auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <BackToTop />
            <PWAInstall />
            {shouldRender && <OnboardingGuide onComplete={completeOnboarding} />}
        </>
    )
}

function App() {
    return (
        <LanguageProvider>
            <AccessibilityProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <PWAProvider>
                            <NotificationProvider>
                                <ToastProvider>
                                    <AppContent />
                                </ToastProvider>
                            </NotificationProvider>
                        </PWAProvider>
                    </AuthProvider>
                </ThemeProvider>
            </AccessibilityProvider>
        </LanguageProvider>
    )
}

export default App
