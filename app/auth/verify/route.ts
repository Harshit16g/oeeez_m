import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const token = searchParams.get("token")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

  const supabase = await createClient()

  // Handle token_hash (legacy flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc("create_sample_notifications", { user_id: user.id })
      }
      return NextResponse.redirect(`${origin}/auth/verify-success?next=${encodeURIComponent(next)}`)
    }
  }

  // Handle token (PKCE flow)
  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token,
    })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc("create_sample_notifications", { user_id: user.id })
      }
      return NextResponse.redirect(`${origin}/auth/verify-success?next=${encodeURIComponent(next)}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/verify-error`)
}
