"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/enhanced-client"
import { Music, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

interface FormData {
  email: string
  password: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitTime, setRateLimitTime] = useState(0)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle URL parameters
  useEffect(() => {
    const email = searchParams.get("email")
    const message = searchParams.get("message")
    const error = searchParams.get("error")

    if (email) {
      setFormData((prev) => ({ ...prev, email }))
    }

    if (message) {
      toast({
        title: "Information",
        description: decodeURIComponent(message),
      })
    }

    if (error) {
      setErrors({ general: decodeURIComponent(error) })
    }
  }, [searchParams, toast])

  // Rate limiting countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (rateLimited && rateLimitTime > 0) {
      interval = setInterval(() => {
        setRateLimitTime((prev) => {
          if (prev <= 1) {
            setRateLimited(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [rateLimited, rateLimitTime])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "rememberMe" ? e.target.checked : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || rateLimited) return

    setLoading(true)
    setErrors({})

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Email not confirmed")) {
          setErrors({
            general: "Please verify your email address before signing in. Check your inbox for a verification link.",
          })

          toast({
            title: "Email not verified",
            description: "Please check your email and click the verification link before signing in.",
            variant: "destructive",
          })
          return
        }

        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            general: "Invalid email or password. Please check your credentials and try again.",
          })
          return
        }

        if (error.message.includes("rate limit")) {
          setRateLimited(true)
          setRateLimitTime(60) // 60 seconds cooldown
          setErrors({
            general: "Too many login attempts. Please wait a moment before trying again.",
          })
          return
        }

        throw error
      }

      if (data.user) {
        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem("artistly_remember_email", formData.email)
        } else {
          localStorage.removeItem("artistly_remember_email")
        }

        toast({
          title: "Welcome back! 🎉",
          description: "You have been successfully logged in.",
        })

        // Track login event
        if (typeof window !== "undefined" && (window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
          const gtag = (window as Window & { gtag: (...args: unknown[]) => void }).gtag
          gtag("event", "login", {
            method: "email",
            user_id: data.user.id,
          })
        }

        // Redirect to intended page or default
        const redirectTo = searchParams.get("redirect") || "/artists"
        router.push(redirectTo)
      }
    } catch (error: unknown) {
      console.error("Login error:", error)

      let errorMessage = "Login failed. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before logging in."
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else {
          errorMessage = error.message
        }
      }

      setErrors({ general: errorMessage })

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const origin = typeof window !== "undefined" ? window.location.origin : "https://artistlydotcom.vercel.app"
      const redirectTo = searchParams.get("redirect") || "/artists"

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      console.error("Google login error:", error)
      const message = error instanceof Error ? error.message : "Failed to sign in with Google. Please try again."
      toast({
        title: "Google login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email address first" })
      return
    }

    try {
      setLoading(true)
      const origin = typeof window !== "undefined" ? window.location.origin : "https://artistlydotcom.vercel.app"

      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${origin}/auth/reset-password`,
      })

      if (error) throw error

      toast({
        title: "Password reset sent! 📧",
        description: "Check your email for a password reset link.",
      })
    } catch (error: unknown) {
      console.error("Password reset error:", error)
      const message = error instanceof Error ? error.message : "Failed to send password reset email. Please try again."
      toast({
        title: "Reset failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("artistly_remember_email")
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail, rememberMe: true }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">Sign in to your Artistly account</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {rateLimited && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Too many login attempts. Please wait {rateLimitTime} seconds before trying again.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  placeholder="Enter your email"
                  className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
                  disabled={loading}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              disabled={loading || rateLimited}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : rateLimited ? (
                `Wait ${rateLimitTime}s`
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogleLogin} className="w-full bg-transparent" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
            <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign up
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Protected by industry-standard security measures</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
