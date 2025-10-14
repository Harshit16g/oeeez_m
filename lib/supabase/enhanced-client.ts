import { createClient } from "./client"
import type { Database } from "./types"

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"]
type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"]

class EnhancedSupabaseHelpers {
  private supabase = createClient()

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase.from("user_profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getUserProfile:", error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
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

      return data
    } catch (error) {
      console.error("Error in updateUserProfile:", error)
      return null
    }
  }

  async createUserProfile(profileData: UserProfileInsert): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase.from("user_profiles").insert(profileData).select().single()

      if (error) {
        console.error("Error creating user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      return null
    }
  }

  async completeOnboarding(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
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

      return data
    } catch (error) {
      console.error("Error in completeOnboarding:", error)
      return null
    }
  }

  async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.from("user_profiles").select("is_onboarded").eq("id", userId).single()

      if (error) {
        console.error("Error checking onboarding status:", error)
        return false
      }

      return data?.is_onboarded || false
    } catch (error) {
      console.error("Error in checkOnboardingStatus:", error)
      return false
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await this.supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        return null
      }

      const { data } = this.supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await this.updateUserProfile(userId, { avatar_url: data.publicUrl })

      return data.publicUrl
    } catch (error) {
      console.error("Error in uploadAvatar:", error)
      return null
    }
  }

  async deleteAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `avatars/${fileName}`

      const { error } = await this.supabase.storage.from("avatars").remove([filePath])

      if (error) {
        console.error("Error deleting avatar:", error)
        return false
      }

      // Update user profile to remove avatar URL
      await this.updateUserProfile(userId, { avatar_url: null })

      return true
    } catch (error) {
      console.error("Error in deleteAvatar:", error)
      return false
    }
  }

  async getUserBookings(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("bookings")
        .select(`
          *,
          artists (
            name,
            avatar_url,
            specialties
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user bookings:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserBookings:", error)
      return []
    }
  }

  async createBooking(bookingData: Record<string, unknown>) {
    try {
      const { data, error } = await this.supabase.from("bookings").insert(bookingData).select().single()

      if (error) {
        console.error("Error creating booking:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createBooking:", error)
      return null
    }
  }
}

export const enhancedSupabaseHelpers = new EnhancedSupabaseHelpers()

// Named exports for compatibility
export { createClient }
export { createClient as createBrowserClient }

// Default export
export default enhancedSupabaseHelpers
