"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Building,
  Camera,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  Music,
  AlertCircle,
} from "lucide-react"

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, updateProfile, uploadAvatar, user, supabase } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    location: profile?.location || "",
    role: profile?.role || "event_planner",
    bio: profile?.bio || "",
    avatar: profile?.avatar_url || "",
  })

  const steps = [
    {
      id: "welcome",
      title: "Welcome to Artistly!",
      description: "Let&apos;s get you set up with a personalized experience",
      icon: Sparkles,
    },
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Tell us about yourself",
      icon: User,
    },
    {
      id: "professional",
      title: "Professional Details",
      description: "Your work and location information",
      icon: Building,
    },
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add a photo and bio to stand out",
      icon: Camera,
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Welcome to the Artistly community",
      icon: CheckCircle,
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleComplete = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      if (!user) {
        throw new Error("No user found")
      }

      // Try using the database function first
      try {
        const { error: rpcError } = await supabase.rpc("complete_user_onboarding", {
          user_id: user.id,
          user_name: formData.name,
          user_phone: formData.phone,
          user_company: formData.company,
          user_location: formData.location,
          user_role: formData.role,
          user_bio: formData.bio,
          user_avatar_url: formData.avatar,
        })

        if (rpcError) {
          console.warn("Database function failed, falling back to direct update:", rpcError)
          throw rpcError
        }
      } catch {
        // Fallback to direct profile update
        console.log("Using fallback profile update method")
        await updateProfile({
          name: formData.name,
          phone: formData.phone,
          company: formData.company,
          location: formData.location,
          role: formData.role as "event_planner" | "artist_manager" | "admin",
          bio: formData.bio,
          avatar_url: formData.avatar,
          onboarding_completed: true,
          is_onboarded: true,
        })
      }

      toast({
        title: "Welcome to Artistly!",
        description: "Your profile has been set up successfully.",
      })

      setCurrentStep(steps.length - 1) // Move to success step

      // Complete onboarding after a short delay
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (error: unknown) {
      console.error("Onboarding error:", error)
      const message = error instanceof Error ? error.message : "Failed to complete onboarding. Please try again."
      setError(message)
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const avatarUrl = await uploadAvatar(file)
        setFormData((prev) => ({ ...prev, avatar: avatarUrl }))
        toast({
          title: "Profile picture uploaded",
          description: "Your profile picture has been uploaded successfully.",
        })
      } catch {
        toast({
          title: "Upload failed",
          description: "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <Card className="bg-white dark:bg-gray-800 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{currentStepData.title}</CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{currentStepData.description}</p>

            {/* Progress Bar */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index <= currentStep ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700 dark:text-red-400 font-medium">Error</p>
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
              </div>
            )}

            {currentStep === 0 && (
              <div className="text-center space-y-6">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Connect</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Find amazing artists</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Book</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Schedule events easily</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Music className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enjoy</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Create memorable events</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Join thousands of event planners and artist managers who trust Artistly to create amazing experiences.
                </p>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="mt-2"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="role">I am a *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_planner">Event Planner</SelectItem>
                      <SelectItem value="artist_manager">Artist Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Enter your company name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State, Country"
                    className="mt-2"
                  />
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Why do we need this?</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This helps us show you relevant artists in your area and connect you with the right opportunities.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Avatar Upload */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 ring-4 ring-purple-200 dark:ring-purple-700">
                      <AvatarImage src={formData.avatar || "/placeholder.svg"} alt="Profile" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-semibold">
                        {formData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                      <Camera className="h-4 w-4" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Upload a profile picture to help others recognize you
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    className="mt-2"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This will be visible on your profile</p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile Complete!</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    You&apos;re now ready to start connecting with amazing artists and creating unforgettable events.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 mb-2">
                      Next Step
                    </Badge>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Browse Artists</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Discover talented performers</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 mb-2">
                      Explore
                    </Badge>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Manage your bookings</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 mb-2">
                      Connect
                    </Badge>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Network</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Build relationships</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2"
                >
                  Get Started
                  <Sparkles className="h-4 w-4" />
                </Button>
              ) : currentStep === steps.length - 2 ? (
                <Button
                  onClick={handleComplete}
                  disabled={
                    isSubmitting ||
                    (currentStep === 1 && (!formData.name || !formData.email)) ||
                    (currentStep === 2 && !formData.location)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && (!formData.name || !formData.email)) ||
                    (currentStep === 2 && !formData.location)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
