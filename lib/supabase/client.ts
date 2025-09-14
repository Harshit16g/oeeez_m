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

  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document !== "undefined") {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(";").shift()
        }
        return undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof document !== "undefined") {
          let cookieString = `${name}=${value}`
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
          if (options?.path) cookieString += `; path=${options.path}`
          if (options?.domain) cookieString += `; domain=${options.domain}`
          if (options?.secure) cookieString += "; secure"
          if (options?.httpOnly) cookieString += "; httponly"
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
          document.cookie = cookieString
        }
      },
      remove(name: string, options: any) {
        if (typeof document !== "undefined") {
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          if (options?.path) cookieString += `; path=${options.path}`
          if (options?.domain) cookieString += `; domain=${options.domain}`
          document.cookie = cookieString
        }
      },
    },
  })

  return supabaseInstance
}

// Export the client instance
export const supabase = createClient()

// Export types
export type { Database } from "./types"
