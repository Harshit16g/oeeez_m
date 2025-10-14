"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/enhanced-auth-context"

export default function VerifySuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [countdown, setCountdown] = useState(5)
  const next = searchParams.get("next") || "/"

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirect based on onboarding status
          if (user && profile && !profile.is_onboarded) {
            router.push("/")
          } else {
            router.push(next)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, next, user, profile])

  const handleContinue = () => {
    if (user && profile && !profile.is_onboarded) {
      router.push("/")
    } else {
      router.push(next)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center animate-pulse">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">Your email has been successfully verified</p>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-900 dark:text-green-300">Welcome to Artistly!</h3>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              Your account is now active and ready to use. You can start exploring amazing artists for your events.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              You&apos;ll be redirected automatically in <span className="font-bold text-purple-600">{countdown}</span>{" "}
              seconds
            </p>

            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
            >
              Continue to Artistly
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            If you&apos;re not redirected automatically, click the button above
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
