"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { EnhancedAuthProvider, useAuth } from "@/lib/enhanced-auth-context"

export default function VerifySuccessPageWrapper() {
  return (
    <EnhancedAuthProvider>
      <VerifySuccessPage />
    </EnhancedAuthProvider>
  )
}

function VerifySuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/"
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(next)
      } else {
        router.push("/login")
      }
    }
  }, [loading, user, router, next])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 text-center p-4">
      <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-purple-600 mb-6"></div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Verifying your account...
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Please wait while we redirect you to your dashboard.
      </p>
    </div>
  )
}