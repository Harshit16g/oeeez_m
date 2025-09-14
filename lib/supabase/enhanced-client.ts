import { supabase, createClient } from "./client"
import type { UserProfile } from "../enhanced-auth-context"

export const enhancedSupabaseHelpers = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error("Error in getUserProfile:", err)
      return null
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user profile:", error)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error("Error in updateUserProfile:", err)
      return null
    }
  },

  // Complete onboarding
  async completeOnboarding(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...profileData,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error completing onboarding:", error)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error("Error in completeOnboarding:", err)
      return null
    }
  },

  // Check onboarding status
  async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from("user_profiles").select("is_onboarded").eq("id", userId).single()

      if (error) {
        console.error("Error checking onboarding status:", error)
        return false
      }

      return data?.is_onboarded || false
    } catch (err) {
      console.error("Error in checkOnboardingStatus:", err)
      return false
    }
  },

  // Create user profile
  async createUserProfile(userId: string, email: string, metadata?: any): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          email,
          full_name: metadata?.full_name || "",
          is_onboarded: false,
          is_artist: false,
          user_type: "client",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating user profile:", error)
        return null
      }

      return data as UserProfile
    } catch (err) {
      console.error("Error in createUserProfile:", err)
      return null
    }
  },

  // Get artist profiles
  async getArtistProfiles(limit = 10, offset = 0): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("is_artist", true)
        .eq("is_onboarded", true)
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching artist profiles:", error)
        return []
      }

      return data as UserProfile[]
    } catch (err) {
      console.error("Error in getArtistProfiles:", err)
      return []
    }
  },

  // Search artists
  async searchArtists(query: string, limit = 10): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("is_artist", true)
        .eq("is_onboarded", true)
        .or(`full_name.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(limit)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error searching artists:", error)
        return []
      }

      return data as UserProfile[]
    } catch (err) {
      console.error("Error in searchArtists:", err)
      return []
    }
  },
}

// Export createClient for compatibility
export { createClient }

// Export the main client
export { supabase }

export default enhancedSupabaseHelpers
