import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"
import { cacheManager } from "../redis/cache"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

class EnhancedSupabaseClient {
  private client: ReturnType<typeof createClient>

  constructor() {
    this.client = createClient()
  }

  // Get the base client
  getClient() {
    return this.client
  }

  // Enhanced user profile methods
  async getUserProfile(userId: string, useCache = true) {
    const cacheKey = `user:profile:${userId}`

    if (useCache) {
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        return { data: { success: true, profile: cached }, error: null }
      }
    }

    try {
      const { data, error } = await this.client.from("users").select("*").eq("id", userId).single()

      if (error) throw error

      // Cache the result
      await cacheManager.set(cacheKey, data, {
        ttl: "userProfile",
        tags: ["user", `user:${userId}`],
      })

      return { data: { success: true, profile: data }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await this.client.from("users").update(updates).eq("id", userId).select().single()

      if (error) throw error

      // Invalidate cache
      await cacheManager.invalidateUser(userId)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Enhanced artist methods
  async getArtists(filters = {}, useCache = true) {
    const cacheKey = `artists:${JSON.stringify(filters)}`

    if (useCache) {
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        return { data: cached, error: null }
      }
    }

    try {
      const query = this.client.from("artists").select(`
          *,
          users (
            name,
            avatar_url,
            bio
          )
        `)

      const { data, error } = await query

      if (error) throw error

      // Cache the result
      await cacheManager.set(cacheKey, data, {
        ttl: "shortCache",
        tags: ["artists"],
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getArtist(artistId: string, useCache = true) {
    const cacheKey = `artist:${artistId}`

    if (useCache) {
      const cached = await cacheManager.get(cacheKey)
      if (cached) {
        return { data: cached, error: null }
      }
    }

    try {
      const { data, error } = await this.client
        .from("artists")
        .select(`
          *,
          users (
            name,
            avatar_url,
            bio
          )
        `)
        .eq("id", artistId)
        .single()

      if (error) throw error

      // Cache the result
      await cacheManager.set(cacheKey, data, {
        ttl: "artistData",
        tags: ["artist", `artist:${artistId}`],
      })

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

export const enhancedSupabaseClient = new EnhancedSupabaseClient()
export default enhancedSupabaseClient
