"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Mail, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function VerifyErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const supabase = createClient()

  const error = searchParams.get("error")

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsResending(true)

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://artistlydotcom.vercel.app"

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            {error ? `Error: ${error}` : "The verification link is invalid or has expired"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">What went wrong?</h3>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              <li>• The verification link may have expired</li>
              <li>• The link may have been used already</li>
              <li>• The link may be malformed</li>
              <li>• There was an error during the verification process</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resend Verification Email</h3>
            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isResending || !email}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center space-y-2">
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              Back to Login
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="w-full text-gray-600 dark:text-gray-400"
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
