"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }

        return data
      } catch (error) {
        console.error("Error in fetchProfile:", error)
        return null
      }
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
  }, [user, fetchProfile])

  useEffect(() => {
    let mounted = true

    async function getInitialSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          return
        }

        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            const profileData = await fetchProfile(session.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          }
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        if (mounted) {
          setProfile(profileData)
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
  }, [supabase.auth, fetchProfile])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", user.id).select().single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error("No user logged in")

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

      await updateProfile({ avatar_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an EnhancedAuthProvider")
  }
  return context
}

// Export the provider as default for easier imports
export default EnhancedAuthProvider
