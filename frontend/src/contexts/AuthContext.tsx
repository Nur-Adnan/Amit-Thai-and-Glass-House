'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/apiBase'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load persisted session on mount.
  useEffect(() => {
    try {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('user')
      if (t && u) {
        setToken(t)
        setUser(JSON.parse(u))
      }
    } catch {
      // corrupt storage -> treat as logged out
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/login')
  }, [router])

  // Global 401 handler: any API response with 401 (expired/invalid token) clears
  // the session and redirects to login. Wraps window.fetch once so every page's
  // raw fetch() is covered without per-page changes.
  // ponytail: fetch interceptor, the standard global-401 approach; swap for an
  // axios/api-client interceptor if requests ever move off raw fetch.
  useEffect(() => {
    const original = window.fetch
    window.fetch = async (...args: Parameters<typeof window.fetch>) => {
      const res = await original(...args)
      try {
        const input = args[0]
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
        if (
          res.status === 401 &&
          url.startsWith(API_BASE) &&
          !url.includes('/api/auth/login')
        ) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
          if (window.location.pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch {
        // never let interception break a real request
      }
      return res
    }
    return () => {
      window.fetch = original
    }
  }, [router])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
