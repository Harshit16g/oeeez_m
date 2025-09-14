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
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper functions for common operations
export const supabaseHelpers = {
  // User profile operations
  async getUserProfile(userId: string) {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  async updateUserProfile(userId: string, updates: any) {
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
      return { data: null, error }
    }

    return { data, error: null }
  },

  async createUserProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Artist operations
  async getArtists(filters: any = {}) {
    let query = supabase.from("user_profiles").select("*").eq("user_type", "artist")

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains("skills", filters.skills)
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    if (filters.availability) {
      query = query.eq("availability", filters.availability)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching artists:", error)
      return []
    }

    return data || []
  },

  async getArtistById(artistId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", artistId)
      .eq("user_type", "artist")
      .single()

    if (error) {
      console.error("Error fetching artist:", error)
      return null
    }

    return data
  },

  // Booking operations
  async createBooking(bookingData: any) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...bookingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  async getUserBookings(userId: string, userType: "client" | "artist") {
    const column = userType === "client" ? "client_id" : "artist_id"

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        client:client_id(id, full_name, email, avatar_url),
        artist:artist_id(id, full_name, email, avatar_url, skills, hourly_rate)
      `,
      )
      .eq(column, userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user bookings:", error)
      return []
    }

    return data || []
  },

  async updateBookingStatus(bookingId: string, status: string, updatedBy: string) {
    const { data, error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (error) {
      console.error("Error updating booking status:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Notification operations
  async createNotification(notificationData: any) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        ...notificationData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  async getUserNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching notifications:", error)
      return []
    }

    return data || []
  },

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) {
      console.error("Error marking notification as read:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // File upload operations
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  async getFileUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async deleteFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting file:", error)
      return { data: null, error }
    }

    return { data, error: null }
  },

  // Real-time subscriptions
  subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
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
  },

  subscribeToBookingUpdates(bookingId: string, callback: (payload: any) => void) {
    return supabase
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
  },
}

export default supabase
