import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"
import { cacheManager } from "../redis/cache"

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

// MAIN EXPORT - createClient function
export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "artistly-webapp",
        },
      },
    },
  )

  return client
}

// Enhanced client class with caching capabilities
class EnhancedSupabaseClient {
  private client = createClient()

  // Get user profile with optional caching
  async getUserProfile(userId: string, useCache = true) {
    try {
      // Try cache first if enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true") {
        const cached = await cacheManager.getCachedUserProfile(userId)
        if (cached) {
          return { profile: cached, error: null }
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("users").select("*").eq("id", userId).single()

      if (error) {
        return { profile: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        await cacheManager.cacheUserProfile(userId, data)
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
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        return { profile: null, error }
      }

      // Invalidate cache if caching is enabled
      if (process.env.ENABLE_REDIS_CACHE === "true") {
        await cacheManager.invalidateUser(userId)
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
        const cached = await cacheManager.getCachedArtist(artistId)
        if (cached) {
          return { artist: cached, error: null }
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("artists").select("*").eq("id", artistId).single()

      if (error) {
        return { artist: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        await cacheManager.cacheArtist(artistId, data)
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
        const cached = await cacheManager.get(cacheKey)
        if (cached) {
          return { artists: cached, error: null }
        }
      }

      // Fetch from database
      const { data, error } = await this.client.from("artists").select("*").order("created_at", { ascending: false })

      if (error) {
        return { artists: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        await cacheManager.set(cacheKey, data, {
          ttl: "artistData",
          tags: ["artists"],
        })
      }

      return { artists: data, error: null }
    } catch (error) {
      console.error("Error fetching artists:", error)
      return { artists: null, error }
    }
  }

  // Search artists with caching
  async searchArtists(query: string, useCache = true) {
    try {
      // Try cache first if enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true") {
        const cached = await cacheManager.getCachedSearch(query)
        if (cached) {
          return { artists: cached, error: null }
        }
      }

      // Perform search
      const { data, error } = await this.client
        .from("artists")
        .select("*")
        .or(`name.ilike.%${query}%, bio.ilike.%${query}%, specialties.cs.{${query}}`)
        .order("created_at", { ascending: false })

      if (error) {
        return { artists: null, error }
      }

      // Cache the result if caching is enabled
      if (useCache && process.env.ENABLE_REDIS_CACHE === "true" && data) {
        await cacheManager.cacheSearch(query, data)
      }

      return { artists: data, error: null }
    } catch (error) {
      console.error("Error searching artists:", error)
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

// Export default client for backward compatibility
export default createClient
