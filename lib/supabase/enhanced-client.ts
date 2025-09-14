export const runtime = "nodejs"

import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser/client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Enhanced client with additional helpers
export class EnhancedSupabaseClient {
  private client: ReturnType<typeof createClient<Database>>
  private adminClient: ReturnType<typeof createClient<Database>>

  constructor() {
    this.client = supabase
    this.adminClient = supabaseAdmin
  }

  // User management helpers
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.client.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await this.client.from("profiles").update(updates).eq("id", userId).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating user profile:", error)
      return null
    }
  }

  async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client.from("profiles").select("is_onboarded").eq("id", userId).single()

      if (error) throw error
      return data?.is_onboarded || false
    } catch (error) {
      console.error("Error checking onboarding status:", error)
      return false
    }
  }

  async completeOnboarding(userId: string, profileData: any) {
    try {
      const { data, error } = await this.client
        .from("profiles")
        .update({
          ...profileData,
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error completing onboarding:", error)
      return null
    }
  }

  // Artist management helpers
  async getArtists(filters?: any) {
    try {
      let query = this.client.from("artists").select("*")

      if (filters?.genre) {
        query = query.contains("genres", [filters.genre])
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`)
      }

      if (filters?.priceRange) {
        query = query.gte("hourly_rate", filters.priceRange.min).lte("hourly_rate", filters.priceRange.max)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching artists:", error)
      return []
    }
  }

  async getArtistById(artistId: string) {
    try {
      const { data, error } = await this.client.from("artists").select("*").eq("id", artistId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching artist:", error)
      return null
    }
  }

  // Booking management helpers
  async createBooking(bookingData: any) {
    try {
      const { data, error } = await this.client.from("bookings").insert(bookingData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating booking:", error)
      return null
    }
  }

  async getUserBookings(userId: string) {
    try {
      const { data, error } = await this.client
        .from("bookings")
        .select(`
          *,
          artists (
            id,
            name,
            profile_image_url,
            genres
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching user bookings:", error)
      return []
    }
  }

  async getArtistBookings(artistId: string) {
    try {
      const { data, error } = await this.client
        .from("bookings")
        .select(`
          *,
          profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching artist bookings:", error)
      return []
    }
  }

  // Notification helpers
  async getUserNotifications(userId: string) {
    try {
      const { data, error } = await this.client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching notifications:", error)
      return []
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await this.client
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return null
    }
  }

  async createNotification(notificationData: any) {
    try {
      const { data, error } = await this.adminClient.from("notifications").insert(notificationData).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating notification:", error)
      return null
    }
  }

  // Admin helpers (using service role key)
  async adminGetUsers() {
    try {
      const { data, error } = await this.adminClient.auth.admin.listUsers()

      if (error) throw error
      return data.users || []
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  async adminDeleteUser(userId: string) {
    try {
      const { error } = await this.adminClient.auth.admin.deleteUser(userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      return false
    }
  }

  // File upload helpers
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error uploading file:", error)
      return null
    }
  }

  async getPublicUrl(bucket: string, path: string) {
    try {
      const { data } = this.client.storage.from(bucket).getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error("Error getting public URL:", error)
      return null
    }
  }

  // Real-time subscriptions
  subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe()
  }

  subscribeToBookingUpdates(bookingId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`booking:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${bookingId}`,
        },
        callback,
      )
      .subscribe()
  }
}

// Create and export the enhanced client instance
export const enhancedSupabase = new EnhancedSupabaseClient()

// Export createClient for compatibility
export { createClient }

// Export the regular clients

// Export as default
export default enhancedSupabase
