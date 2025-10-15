"use client"
import { useAuth } from "@/lib/enhanced-auth-context"

export function ConditionalComponents() {
  const { user, loading } = useAuth()

  // Don't render anything while loading or if user is not authenticated
  if (loading || !user) {
    return null
  }

  return <>{/* These components are now rendered in the navbar instead */}</>
}
