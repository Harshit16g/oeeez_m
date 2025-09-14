import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")
  const next = searchParams.get("next") ?? "/"

  // Handle errors from Supabase
  if (error) {
    console.error("Auth error:", error, error_description)
    return NextResponse.redirect(`${origin}/auth/verify-error?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Session exchange error:", error)
        return NextResponse.redirect(`${origin}/auth/verify-error?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // Create sample notifications for new users
        try {
          await supabase.rpc("create_sample_notifications", { user_id: data.user.id })
        } catch (notificationError) {
          console.warn("Failed to create sample notifications:", notificationError)
          // Don't fail the whole flow for this
        }

        // Check if this is a new user (just verified email)
        if (data.user.email_confirmed_at) {
          return NextResponse.redirect(`${origin}/auth/verify-success?next=${encodeURIComponent(next)}`)
        }

        // For existing users, redirect to the next page
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("Unexpected error in auth callback:", error)
      return NextResponse.redirect(`${origin}/auth/verify-error?error=unexpected_error`)
    }
  }

  // If no code and no error, something went wrong
  return NextResponse.redirect(`${origin}/auth/verify-error?error=missing_code`)
}
