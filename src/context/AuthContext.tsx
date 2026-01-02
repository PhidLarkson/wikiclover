/**
 * Authentication Context
 * 
 * Provides auth state and actions to the entire app
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
    isLoggedIn as checkLoggedIn,
    fetchUserInfo,
    getStoredUserInfo,
    login as authLogin,
    logout as authLogout,
    type WikimediaUser,
} from '@/lib/wikimedia-auth'

interface AuthContextType {
    user: WikimediaUser | null
    isLoading: boolean
    isLoggedIn: boolean
    isGuest: boolean
    login: () => Promise<void>
    loginAsGuest: () => void
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<WikimediaUser | null>(() => getStoredUserInfo())
    const [isGuest, setIsGuest] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn())

    const refreshUser = useCallback(async () => {
        const loggedIn = checkLoggedIn()
        setIsLoggedIn(loggedIn)

        if (loggedIn) {
            const userInfo = await fetchUserInfo()
            setUser(userInfo)
        } else {
            setUser(null)
        }
    }, [])

    useEffect(() => {
        const init = async () => {
            await refreshUser()
            setIsLoading(false)
        }
        init()
    }, [refreshUser])

    const login = async () => {
        await authLogin()
    }

    const loginAsGuest = () => {
        setIsGuest(true)
    }

    const logout = () => {
        authLogout()
        setUser(null)
        setIsLoggedIn(false)
        setIsGuest(false)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, isLoggedIn, isGuest, login, loginAsGuest, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
