import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

  const supabase = await createClient()

  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "sms" | "phone_change",
      token,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/verify-success?next=${encodeURIComponent(next)}`)
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "sms" | "phone_change",
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/verify-success?next=${encodeURIComponent(next)}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/verify-error`)
}