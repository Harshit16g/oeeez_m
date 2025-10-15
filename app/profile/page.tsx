"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/enhanced-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Star,
  DollarSign,
  Edit,
  Share2
} from "lucide-react"

export default function ProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading || !user || !profile) {
    return <Loading />
  }

  const stats = {
    bookings: 12,
    reviews: 8,
    rating: 4.9,
    totalSpent: 240000,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-700 shadow-lg">
                  <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || ""} />
                  <AvatarFallback className="text-4xl">
                    {profile.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {profile.full_name || "User"}
                      </h1>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                        {profile.user_type === "artist" ? "Artist" : "Client"} • Member since{" "}
                        {new Date(profile.created_at || "").toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={profile.availability === "available" ? "default" : "secondary"}>
                      {profile.availability || "Not Set"}
                    </Badge>
                    {profile.user_type === "artist" && <Badge variant="outline">Artist Profile</Badge>}
                    {user.email_confirmed_at && <Badge variant="outline">Verified</Badge>}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                    <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach me</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                )}

                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.location && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-medium">{profile.location}</p>
                    </div>
                  </div>
                )}

                {profile.website && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Globe className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills (if artist) */}
          {profile.user_type === "artist" && profile.skills && profile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
                <CardDescription>Areas of specialization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.bookings}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Bookings</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rating}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Average Rating</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.reviews}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Reviews</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{(stats.totalSpent / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Spent</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="w-full" onClick={() => router.push("/bookings")}>
                  View My Bookings
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/artists")}>
                  Browse Artists
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/settings")}>
                  Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
