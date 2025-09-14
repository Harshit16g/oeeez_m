"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { enhancedSupabaseHelpers } from "@/lib/supabase/enhanced-client"
import { cacheManager } from "@/lib/redis/cache"
import { sessionManager } from "@/lib/redis/session"
import { toast } from "sonner"

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  location?: string
  phone?: string
  website?: string
  social_links?: Record<string, string>
  skills?: string[]
  portfolio_url?: string
  hourly_rate?: number
  availability?: "available" | "busy" | "unavailable"
  preferences?: Record<string, any>
  is_onboarded: boolean
  is_artist: boolean
  user_type: "client" | "artist"
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  signUp: (email: string, password: string, metadata?: any) => Promise<{ user: User | null; error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>
  refreshProfile: () => Promise<void>
  completeOnboarding: (profileData: Partial<UserProfile>) => Promise<boolean>
  isOnboarded: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Load user profile from cache or database
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      // Try to get from cache first
      const cachedProfile = await cacheManager.getCachedUserProfile(userId)
      if (cachedProfile) {
        return cachedProfile
      }

      // Fetch from database
      const profileData = await enhancedSupabaseHelpers.getUserProfile(userId)
      if (profileData) {
        // Cache the profile
        await cacheManager.cacheUserProfile(userId, profileData)
        return profileData as UserProfile
      }

      return null
    } catch (err) {
      console.error("Error loading user profile:", err)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError(sessionError)
        }

        if (mounted && initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)

          // Load user profile
          const userProfile = await loadUserProfile(initialSession.user.id)
          if (mounted) {
            setProfile(userProfile)
          }

          // Create Redis session if enabled
          try {
            await sessionManager.createSession(initialSession.user.id, {
              email: initialSession.user.email,
              loginTime: new Date().toISOString(),
            })
          } catch (redisError) {
            console.warn("Failed to create Redis session:", redisError)
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
        if (mounted) {
          setError(err as AuthError)
        }
      } finally {
        if (mounted) {
          setLoading(false)
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

      setSession(session)
      setUser(session?.user ?? null)
      setError(null)

      if (session?.user) {
        // Load user profile
        const userProfile = await loadUserProfile(session.user.id)
        if (mounted) {
          setProfile(userProfile)
        }

        // Create Redis session if enabled
        try {
          await sessionManager.createSession(session.user.id, {
            email: session.user.email,
            loginTime: new Date().toISOString(),
          })
        } catch (redisError) {
          console.warn("Failed to create Redis session:", redisError)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
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
        toast.error(error.message)
        return { user: null, error }
      }

      toast.success("Account created! Please check your email to verify your account.")
      return { user: data.user, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      toast.error(authError.message)
      return { user: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error)
        toast.error(error.message)
        return { user: null, error }
      }

      toast.success("Signed in successfully!")
      return { user: data.user, error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      toast.error(authError.message)
      return { user: null, error: authError }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Clear cached profile and Redis session
      if (user?.id) {
        await cacheManager.invalidateUser(user.id)
        try {
          await sessionManager.deleteAllUserSessions(user.id)
        } catch (redisError) {
          console.warn("Failed to clean up Redis sessions:", redisError)
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error)
        toast.error(error.message)
        return { error }
      }

      // Clear local state
      setUser(null)
      setProfile(null)
      setSession(null)

      toast.success("Signed out successfully!")
      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      toast.error(authError.message)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error)
        toast.error(error.message)
        return { error }
      }

      toast.success("Password reset email sent!")
      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      toast.error(authError.message)
      return { error: authError }
    }
  }, [])

  // Update profile function
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
      if (!user?.id) return null

      try {
        setError(null)

        const updatedProfile = await enhancedSupabaseHelpers.updateUserProfile(user.id, updates)

        if (updatedProfile) {
          setProfile(updatedProfile as UserProfile)
          // Update cache
          await cacheManager.cacheUserProfile(user.id, updatedProfile)
          toast.success("Profile updated successfully!")
          return updatedProfile as UserProfile
        }

        return null
      } catch (err) {
        console.error("Error updating profile:", err)
        setError(err as AuthError)
        toast.error("Failed to update profile")
        return null
      }
    },
    [user?.id],
  )

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      // Clear cache and reload
      await cacheManager.invalidateUser(user.id)
      const freshProfile = await loadUserProfile(user.id)
      setProfile(freshProfile)
    } catch (err) {
      console.error("Error refreshing profile:", err)
    }
  }, [user?.id, loadUserProfile])

  // Complete onboarding function
  const completeOnboarding = useCallback(
    async (profileData: Partial<UserProfile>): Promise<boolean> => {
      if (!user?.id) return false

      try {
        setError(null)

        const updatedProfile = await enhancedSupabaseHelpers.completeOnboarding(user.id, profileData)

        if (updatedProfile) {
          setProfile(updatedProfile as UserProfile)
          // Update cache
          await cacheManager.cacheUserProfile(user.id, updatedProfile)
          toast.success("Onboarding completed!")
          return true
        }

        return false
      } catch (err) {
        console.error("Error completing onboarding:", err)
        setError(err as AuthError)
        toast.error("Failed to complete onboarding")
        return false
      }
    },
    [user?.id],
  )

  // Computed values
  const isOnboarded = profile?.is_onboarded ?? false

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    completeOnboarding,
    isOnboarded,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider")
  }
  return context
}

// Hook to check onboarding status
export function useOnboardingStatus(): {
  isLoggedIn: boolean
  isOnboarded: boolean
  needsOnboarding: boolean
  loading: boolean
  userType?: "client" | "artist"
} {
  const { user, profile, loading } = useAuth()

  return {
    isLoggedIn: !!user,
    isOnboarded: profile?.is_onboarded || false,
    needsOnboarding: user && !profile?.is_onboarded,
    loading,
    userType: profile?.user_type,
  }
}

// Export the provider as default
export default EnhancedAuthProvider

// Alternative export for backward compatibility
export const AuthProvider = EnhancedAuthProvider
