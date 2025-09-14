import { createClient as createSupabaseClient } from "./client"

export function createClient() {
  return createSupabaseClient()
}

export const supabase = createClient()

// Enhanced client with additional utilities
export class EnhancedSupabaseClient {
  private client: ReturnType<typeof createSupabaseClient>

  constructor() {
    this.client = createClient()
  }

  // User management
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await this.client.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.client.from("user_profiles").select("*").eq("id", userId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error getting user profile:", error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await this.client.from("user_profiles").update(updates).eq("id", userId).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  // File upload
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
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
  subscribeToUserProfile(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`user_profile_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${userId}`,
        },
        callback,
      )
      .subscribe()
  }

  // Get the underlying client
  getClient() {
    return this.client
  }
}

export const enhancedSupabase = new EnhancedSupabaseClient()

// Export types
export type { Database } from "./types"
