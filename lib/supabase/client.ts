import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}

// Default export for backward compatibility
export const supabase = createClient()

// Named export for createClient
export { createClient as createBrowserClient }

// Re-export for compatibility
export default createClient

// Export types
export type { Database } from "./types"
