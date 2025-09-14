import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const enhancedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Enhanced helper functions
export const enhancedSupabaseHelpers = {
  async getUserProfile(userId: string) {
    const { data, error } = await enhancedSupabase.from("user_profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  },

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await enhancedSupabase
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
  },

  async createUserProfile(userId: string, profileData: any) {
    const { data, error } = await enhancedSupabase
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
      return null
    }

    return data
  },

  async checkOnboardingStatus(userId: string): Promise<boolean> {
    const { data, error } = await enhancedSupabase
      .from("user_profiles")
      .select("is_onboarded")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error checking onboarding status:", error)
      return false
    }

    return data?.is_onboarded || false
  },

  async completeOnboarding(userId: string, profileData: any) {
    const { data, error } = await enhancedSupabase
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
  },

  async getArtists(filters: any = {}) {
    let query = enhancedSupabase.from("user_profiles").select("*").eq("is_artist", true)

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.overlaps("skills", filters.skills)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching artists:", error)
      return []
    }

    return data || []
  },

  async getArtistById(artistId: string) {
    const { data, error } = await enhancedSupabase
      .from("user_profiles")
      .select("*")
      .eq("id", artistId)
      .eq("is_artist", true)
      .single()

    if (error) {
      console.error("Error fetching artist:", error)
      return null
    }

    return data
  },

  async createBookingRequest(bookingData: any) {
    const { data, error } = await enhancedSupabase
      .from("booking_requests")
      .insert({
        ...bookingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating booking request:", error)
      return null
    }

    return data
  },

  async getUserBookings(userId: string) {
    const { data, error } = await enhancedSupabase
      .from("booking_requests")
      .select(`
        *,
        artist:artist_id(id, full_name, avatar_url),
        client:client_id(id, full_name, avatar_url)
      `)
      .or(`client_id.eq.${userId},artist_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user bookings:", error)
      return []
    }

    return data || []
  },

  async updateBookingStatus(bookingId: string, status: string) {
    const { data, error } = await enhancedSupabase
      .from("booking_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single()

    if (error) {
      console.error("Error updating booking status:", error)
      return null
    }

    return data
  },
}

// Export both the client and helpers
export { createClient }
export default enhancedSupabase
