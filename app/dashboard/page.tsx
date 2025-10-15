"use client"

import { useAuth, useOnboardingStatus } from "@/lib/enhanced-auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MapPin, Mail, Phone, Globe, User, Settings, LogOut } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const { isLoggedIn, isOnboarded, needsOnboarding } = useOnboardingStatus()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        router.push("/login")
        return
      }

      if (needsOnboarding) {
        router.push("/?onboarding=true")
        return
      }
    }
  }, [loading, isLoggedIn, needsOnboarding, router])

  if (loading) {
    return <Loading />
  }

  if (!isLoggedIn || !isOnboarded) {
    return <Loading />
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleEditProfile = () => {
    router.push("/settings")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.full_name || user?.email}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">Manage your profile and view your activity</p>
          </div>

          {/* Profile Overview Card */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                    <AvatarFallback className="text-lg">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{profile?.full_name || "User"}</CardTitle>
                    <CardDescription className="text-base">
                      {profile?.user_type === "artist" ? "Artist" : "Client"} • Member since{" "}
                      {new Date(profile?.created_at || "").toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleEditProfile}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Status */}
              <div className="flex items-center space-x-4">
                <Badge variant={profile?.availability === "available" ? "default" : "secondary"}>
                  {profile?.availability || "Not Set"}
                </Badge>
                {profile?.is_artist && <Badge variant="outline">Artist Profile</Badge>}
                <Badge variant="outline">Profile Complete</Badge>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{user?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center space-x-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center space-x-3 text-sm">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Profile Details</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Account Type:</span>{" "}
                      <span className="capitalize">{profile?.user_type || "Not Set"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Member Since:</span>{" "}
                      <span>{new Date(profile?.created_at || "").toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Last Updated:</span>{" "}
                      <span>{new Date(profile?.updated_at || "").toLocaleDateString()}</span>
                    </div>
                    {profile?.is_artist && profile?.hourly_rate && (
                      <div className="text-sm">
                        <span className="font-medium">Hourly Rate:</span> <span>${profile.hourly_rate}/hour</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {profile?.bio && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">About</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
                  </div>
                </>
              )}

              {/* Skills Section */}
              {profile?.skills && profile.skills.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/categories")}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Browse Categories</CardTitle>
                <CardDescription>Explore all marketplace categories</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/artists")}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Browse Artists</CardTitle>
                <CardDescription>Discover talented professionals</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/bookings")}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">View Bookings</CardTitle>
                <CardDescription>Manage your appointments</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleEditProfile}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Edit Profile</CardTitle>
                <CardDescription>Update your information</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/profile")}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">View Public Profile</CardTitle>
                <CardDescription>See how others see your profile</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/help")}>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Help & Support</CardTitle>
                <CardDescription>Get help with your account</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
