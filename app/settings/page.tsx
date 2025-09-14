"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/lib/theme-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Bell,
  Shield,
  Palette,
  Camera,
  Save,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  Lock,
  Monitor,
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, profile, updateProfile, uploadAvatar } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    company: "",
    role: "event_planner" as const,
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        location: profile.location || "",
        company: profile.company || "",
        role: profile.role || "event_planner",
      })
    }
  }, [profile])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateProfile(formData)
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await uploadAvatar(file)
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        })
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const updateNotificationPreference = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        preferences: {
          ...profile?.preferences,
          notifications: {
            ...profile?.preferences?.notifications,
            [key]: value,
          },
        },
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preference.",
        variant: "destructive",
      })
    }
  }

  const updatePrivacyPreference = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        preferences: {
          ...profile?.preferences,
          privacy: {
            ...profile?.preferences?.privacy,
            [key]: value,
          },
        },
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy preference.",
        variant: "destructive",
      })
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ]

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and settings</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                            activeTab === tab.id
                              ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{tab.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-purple-200 dark:ring-purple-700">
                          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-semibold">
                            {profile.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                          <Camera className="h-4 w-4" />
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{profile.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {profile.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Form Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-2"
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: any) => setFormData({ ...formData, role: value })}
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

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="mt-2"
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Receive notifications via email</p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.notifications?.email ?? true}
                          onCheckedChange={(checked) => updateNotificationPreference("email", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Receive push notifications on your device
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.notifications?.push ?? true}
                          onCheckedChange={(checked) => updateNotificationPreference("push", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Receive important updates via SMS
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.notifications?.sms ?? false}
                          onCheckedChange={(checked) => updateNotificationPreference("sms", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "privacy" && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Shield className="h-5 w-5" />
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Public Profile</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Make your profile visible to other users
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.privacy?.profileVisible ?? true}
                          onCheckedChange={(checked) => updatePrivacyPreference("profileVisible", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Show Email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Display email address on your profile
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.privacy?.showEmail ?? false}
                          onCheckedChange={(checked) => updatePrivacyPreference("showEmail", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Show Phone</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Display phone number on your profile
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={profile.preferences?.privacy?.showPhone ?? false}
                          onCheckedChange={(checked) => updatePrivacyPreference("showPhone", checked)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <Lock className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-red-900 dark:text-red-300">Danger Zone</h3>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                        These actions are permanent and cannot be undone.
                      </p>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "appearance" && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Palette className="h-5 w-5" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Theme Preference</h3>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => setTheme("light")}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === "light"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                            <p className="text-sm font-medium">Light</p>
                          </button>
                          <button
                            onClick={() => setTheme("dark")}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === "dark"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <Moon className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                            <p className="text-sm font-medium">Dark</p>
                          </button>
                          <button
                            onClick={() => setTheme("system")}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              theme === "system"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <Monitor className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                            <p className="text-sm font-medium">System</p>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Theme Preview</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="w-full h-2 bg-purple-600 rounded mb-2"></div>
                            <div className="space-y-1">
                              <div className="w-3/4 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              <div className="w-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              <div className="w-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                            <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
