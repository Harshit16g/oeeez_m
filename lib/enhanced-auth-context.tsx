"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { sessionManager, type SessionData } from "./redis/session"
import { toast } from "sonner"

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  skills?: string[]
  portfolio_url?: string
  hourly_rate?: number
  availability?: "available" | "busy" | "unavailable"
  is_onboarded: boolean
  user_type: "client" | "artist"
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  sessionData: SessionData | null
  loading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData?: Partial<UserProfile>) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  deleteAccount: () => Promise<{ error: Error | null }>
  trackEvent: (event: string, properties?: Record<string, any>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider")
  }
  return context
}

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    sessionData: null,
    loading: true,
    error: null,
  })

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      return null
    }
  }, [])

  // Update profile in database
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<{ error: Error | null }> => {
      if (!state.user) {
        return { error: new Error("No authenticated user") }
      }

      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", state.user.id)

        if (error) {
          console.error("Error updating profile:", error)
          return { error: new Error(error.message) }
        }

        // Refresh profile data
        await refreshProfile()
        toast.success("Profile updated successfully")
        return { error: null }
      } catch (error) {
        console.error("Error in updateProfile:", error)
        return { error: error as Error }
      }
    },
    [state.user],
  )

  // Refresh profile data
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!state.user) return

    const profile = await fetchProfile(state.user.id)
    setState((prev) => ({ ...prev, profile }))
  }, [state.user, fetchProfile])

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      toast.error(error.message)
      return { error }
    }

    toast.success("Signed in successfully")
    return { error: null }
  }, [])

  // Sign up
  const signUp = useCallback(async (email: string, password: string, userData?: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      toast.error(error.message)
      return { error }
    }

    toast.success("Account created! Please check your email to verify your account.")
    return { error: null }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))

    // Clean up Redis session if enabled
    if (state.session && process.env.ENABLE_REDIS_SESSIONS === "true") {
      try {
        await sessionManager.deleteSession(state.session.access_token)
      } catch (redisError) {
        console.warn("Failed to clean up Redis session:", redisError)
      }
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }))
      toast.error(error.message)
      return { error }
    }

    setState({
      user: null,
      profile: null,
      session: null,
      sessionData: null,
      loading: false,
      error: null,
    })

    toast.success("Signed out successfully")
    return { error: null }
  }, [state.session])

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      return { error }
    }

    toast.success("Password reset email sent")
    return { error: null }
  }, [])

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      return { error }
    }

    toast.success("Password updated successfully")
    return { error: null }
  }, [])

  // Delete account
  const deleteAccount = useCallback(async (): Promise<{ error: Error | null }> => {
    if (!state.user) {
      return { error: new Error("No authenticated user") }
    }

    try {
      // First delete the profile
      const { error: profileError } = await supabase.from("user_profiles").delete().eq("id", state.user.id)

      if (profileError) {
        console.error("Error deleting profile:", profileError)
        return { error: new Error(profileError.message) }
      }

      // Then sign out
      await signOut()
      toast.success("Account deletion initiated. Please contact support to complete the process.")
      return { error: null }
    } catch (error) {
      console.error("Error in deleteAccount:", error)
      return { error: error as Error }
    }
  }, [state.user, signOut])

  // Track events (analytics)
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, any>) => {
      try {
        // Log to console in development
        if (process.env.NODE_ENV === "development") {
          console.log("Event tracked:", event, properties)
        }

        // Add your analytics tracking here (Google Analytics, Mixpanel, etc.)
        if (typeof window !== "undefined" && (window as any).gtag) {
          ;(window as any).gtag("event", event, {
            ...properties,
            user_id: state.user?.id,
          })
        }
      } catch (error) {
        console.error("Error tracking event:", error)
      }
    },
    [state.user],
  )

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted) {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)

            // Create Redis session if enabled
            let sessionData = null
            if (process.env.ENABLE_REDIS_SESSIONS === "true") {
              try {
                sessionData = await sessionManager.createSession(session.user.id, {
                  userId: session.user.id,
                  email: session.user.email,
                  loginTime: new Date().toISOString(),
                })
              } catch (redisError) {
                console.warn("Failed to create Redis session:", redisError)
              }
            }

            setState({
              user: session.user,
              profile,
              session,
              sessionData,
              loading: false,
              error: null,
            })
          } else {
            setState({
              user: null,
              profile: null,
              session: null,
              sessionData: null,
              loading: false,
              error: null,
            })
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) {
          setState({
            user: null,
            profile: null,
            session: null,
            sessionData: null,
            loading: false,
            error: "Failed to initialize authentication",
          })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id)

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)

        // Create Redis session if enabled
        let sessionData = null
        if (process.env.ENABLE_REDIS_SESSIONS === "true") {
          try {
            sessionData = await sessionManager.createSession(session.user.id, {
              userId: session.user.id,
              email: session.user.email,
              loginTime: new Date().toISOString(),
            })
          } catch (redisError) {
            console.warn("Failed to create Redis session:", redisError)
          }
        }

        setState({
          user: session.user,
          profile,
          session,
          sessionData,
          loading: false,
          error: null,
        })
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          sessionData: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
    deleteAccount,
    trackEvent,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Alternative export for backward compatibility
export const AuthProvider = EnhancedAuthProvider

// MAIN HOOK EXPORT
export function useOnboardingStatus() {
  const { user, profile, loading } = useAuth()

  return {
    isLoggedIn: !!user,
    isOnboarded: profile?.is_onboarded || false,
    needsOnboarding: user && !profile?.is_onboarded,
    loading,
    userType: profile?.user_type,
  }
}

export default EnhancedAuthProvider
