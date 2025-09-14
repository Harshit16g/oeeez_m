"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { createClient } from "./supabase/enhanced-client"
import { sessionManager, type SessionData } from "./redis/session"

interface AuthContextType {
  user: User | null
  session: Session | null
  sessionData: SessionData | null
  profile: any
  loading: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: any) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// MAIN EXPORT - EnhancedAuthProvider
export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  const supabase = createClient()

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error)
          return { user: null, error }
        }

        return { user: data.user, error: null }
      } catch (err) {
        const authError = err as AuthError
        setError(authError)
        return { user: null, error: authError }
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const signUp = useCallback(
    async (email: string, password: string, metadata?: any) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        })

        if (error) {
          setError(error)
          return { user: null, error }
        }

        return { user: data.user, error: null }
      } catch (err) {
        const authError = err as AuthError
        setError(authError)
        return { user: null, error: authError }
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    try {
      setLoading(true)

      // Clean up Redis session (only if Redis is enabled)
      if (session && process.env.ENABLE_REDIS_CACHE === "true") {
        try {
          await sessionManager.deleteSession(session.access_token)
        } catch (redisError) {
          console.warn("Failed to clean up Redis session:", redisError)
          // Continue with sign out even if Redis cleanup fails
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error)
        return { error }
      }

      setUser(null)
      setSession(null)
      setSessionData(null)
      setProfile(null)

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }, [supabase, session])

  const updateProfile = useCallback(
    async (updates: any) => {
      if (!user) {
        const error = new Error("No user logged in") as AuthError
        setError(error)
        return { error }
      }

      try {
        setError(null)

        const { error: authError } = await supabase.auth.updateUser({
          data: updates,
        })

        if (authError) {
          setError(authError)
          return { error: authError }
        }

        return { error: null }
      } catch (err) {
        const authError = err as AuthError
        setError(authError)
        return { error: authError }
      }
    },
    [user, supabase],
  )

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error("Failed to refresh session:", error)
        return
      }

      if (data.session && data.user) {
        setSession(data.session)
        setUser(data.user)
      }
    } catch (error) {
      console.error("Session refresh error:", error)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (initialSession?.user) {
            setUser(initialSession.user)
            setSession(initialSession)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            setUser(session.user)
            setSession(session)
          }
          break
        case "SIGNED_OUT":
          setUser(null)
          setSession(null)
          setSessionData(null)
          setProfile(null)
          break
        case "TOKEN_REFRESHED":
          if (session?.user) {
            setUser(session.user)
            setSession(session)
          }
          break
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value: AuthContextType = {
    user,
    session,
    sessionData,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Alternative export for backward compatibility
export const AuthProvider = EnhancedAuthProvider

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider")
  }
  return context
}

// Add the missing useOnboardingStatus export
export function useOnboardingStatus() {
  const { user, profile } = useAuth()

  return {
    isOnboarded: profile?.is_onboarded || false,
    needsOnboarding: user && !profile?.is_onboarded,
  }
}

export default AuthContext
