import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"
import { cacheManager } from "../redis/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Create the client function - MAIN EXPORT
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        "X-Client-Info": "artistly-webapp",
      },
    },
  })
}

// Create singleton instance for named export
export const supabase = createClient()

// Enhanced client class with caching capabilities
class EnhancedSupabaseClient {
  private client = createClient()

  // Get user profile with optional caching
  async getUserProfile(userId: string, useCache = true) {
    try {
      // Try cache first if enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true") {
        try {
          const cached = await cacheManager.getCachedUserProfile(userId)
          if (cached) {
            return { profile: cached, error: null }
          }
        } catch (cacheError) {
          console.warn("Cache error, falling back to database:", cacheError)
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("user_profiles").select("*").eq("id", userId).single()

      if (error) {
        return { profile: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        try {
          await cacheManager.cacheUserProfile(userId, data)
        } catch (cacheError) {
          console.warn("Failed to cache user profile:", cacheError)
        }
      }

      return { profile: data, error: null }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return { profile: null, error }
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await this.client
        .from("user_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        return { profile: null, error }
      }

      // Invalidate cache if caching is enabled
      if (process.env.ENABLE_REDIS_CACHE === "true") {
        try {
          await cacheManager.invalidateUser(userId)
        } catch (cacheError) {
          console.warn("Failed to invalidate user cache:", cacheError)
        }
      }

      return { profile: data, error: null }
    } catch (error) {
      console.error("Error updating user profile:", error)
      return { profile: null, error }
    }
  }

  // Get artist data with caching
  async getArtist(artistId: string, useCache = true) {
    try {
      // Try cache first if enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true") {
        try {
          const cached = await cacheManager.getCachedArtist(artistId)
          if (cached) {
            return { artist: cached, error: null }
          }
        } catch (cacheError) {
          console.warn("Cache error, falling back to database:", cacheError)
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("artists").select("*").eq("id", artistId).single()

      if (error) {
        return { artist: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        try {
          await cacheManager.cacheArtist(artistId, data)
        } catch (cacheError) {
          console.warn("Failed to cache artist:", cacheError)
        }
      }

      return { artist: data, error: null }
    } catch (error) {
      console.error("Error fetching artist:", error)
      return { artist: null, error }
    }
  }

  // Get all artists with caching
  async getArtists(useCache = true) {
    try {
      const cacheKey = "all_artists"

      // Try cache first if enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true") {
        try {
          const cached = await cacheManager.get(cacheKey)
          if (cached) {
            return { artists: cached, error: null }
          }
        } catch (cacheError) {
          console.warn("Cache error, falling back to database:", cacheError)
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("artists").select("*").order("created_at", { ascending: false })

      if (error) {
        return { artists: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        try {
          await cacheManager.set(cacheKey, data, {
            ttl: "artistData",
            tags: ["artists"],
          })
        } catch (cacheError) {
          console.warn("Failed to cache artists:", cacheError)
        }
      }

      return { artists: data, error: null }
    } catch (error) {
      console.error("Error fetching artists:", error)
      return { artists: null, error }
    }
  }

  // Get the raw Supabase client
  getClient() {
    return this.client
  }
}

// Export singleton instance
export const enhancedSupabaseClient = new EnhancedSupabaseClient()

// Default export for backward compatibility
export default createClient
