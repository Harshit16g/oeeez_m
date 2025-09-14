import type { SupabaseClient } from "@supabase/supabase-js"

export interface Notification {
  id: string
  user_id: string
  type: "booking" | "payment" | "review" | "system" | "reminder"
  title: string
  message: string
  created_at: string
  read: boolean
  action_url?: string
}

/**
 * Fetches the most-recent notifications for a user and stores them using the supplied setter.
 *
 * @param supabase  A Supabase client instance (browser or server)
 * @param userId    The authenticated user’s ID
 * @param setState  React state setter that receives the fetched list
 */
export async function fetchNotifications(
  supabase: SupabaseClient,
  userId: string,
  setState: (notifications: Notification[]) => void,
) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (!error && data) {
    setState(data as Notification[])
  } else if (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch notifications:", error)
  }
}
