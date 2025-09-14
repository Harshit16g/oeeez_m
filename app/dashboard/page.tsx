"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
  Star,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Activity,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/lib/enhanced-auth-context"
import { useOnboardingStatus } from "@/lib/enhanced-auth-context"
import Link from "next/link"

interface Booking {
  id: string
  artist_name: string
  event_name: string
  event_date: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  amount: number
  booking_reference: string
}

interface DashboardStats {
  totalBookings: number
  activeEvents: number
  totalSpent: number
  artistsWorkedWith: number
  pendingBookings: number
  completedBookings: number
  averageBookingValue: number
  monthlyGrowth: number
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, supabase, trackEvent } = useAuth()
  const { isLoggedIn, needsOnboarding } = useOnboardingStatus()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeEvents: 0,
    totalSpent: 0,
    artistsWorkedWith: 0,
    pendingBookings: 0,
    completedBookings: 0,
    averageBookingValue: 0,
    monthlyGrowth: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(
    async (showRefreshing = false) => {
      if (!user || !supabase) return

      try {
        if (showRefreshing) setRefreshing(true)
        else setLoadingData(true)

        setError(null)

        // Fetch user bookings with artist information
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
          id,
          event_name,
          event_date,
          status,
          amount,
          booking_reference,
          artists (name)
        `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (bookingsError) throw bookingsError

        // Transform bookings data
        const transformedBookings: Booking[] =
          bookingsData?.map((booking: any) => ({
            id: booking.id,
            artist_name: booking.artists?.name || "Unknown Artist",
            event_name: booking.event_name,
            event_date: booking.event_date,
            status: booking.status,
            amount: booking.amount,
            booking_reference: booking.booking_reference,
          })) || []

        setBookings(transformedBookings)

        // Calculate comprehensive stats
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const totalBookings = bookingsData?.length || 0
        const activeEvents =
          bookingsData?.filter((b: any) => b.status === "confirmed" && new Date(b.event_date) > now).length || 0

        const completedBookings = bookingsData?.filter((b: any) => b.status === "completed").length || 0
        const pendingBookings = bookingsData?.filter((b: any) => b.status === "pending").length || 0

        const totalSpent =
          bookingsData?.reduce((sum: number, b: any) => (b.status === "completed" ? sum + b.amount : sum), 0) || 0

        const artistsWorkedWith = new Set(bookingsData?.map((b: any) => b.artists?.name)).size || 0
        const averageBookingValue = completedBookings > 0 ? totalSpent / completedBookings : 0

        // Calculate monthly growth (simplified)
        const thisMonthBookings = bookingsData?.filter((b: any) => new Date(b.created_at) >= thisMonth).length || 0

        const lastMonthBookings =
          bookingsData?.filter((b: any) => {
            const createdAt = new Date(b.created_at)
            return createdAt >= lastMonth && createdAt < thisMonth
          }).length || 0

        const monthlyGrowth =
          lastMonthBookings > 0
            ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
            : thisMonthBookings > 0
              ? 100
              : 0

        setStats({
          totalBookings,
          activeEvents,
          totalSpent,
          artistsWorkedWith,
          pendingBookings,
          completedBookings,
          averageBookingValue,
          monthlyGrowth,
        })

        // Track dashboard view
        trackEvent("dashboard_viewed", {
          user_id: user.id,
          total_bookings: totalBookings,
          active_events: activeEvents,
        })
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError(error.message || "Failed to load dashboard data")
      } finally {
        setLoadingData(false)
        setRefreshing(false)
      }
    },
    [user, supabase, trackEvent],
  )

  useEffect(() => {
    if (user && supabase) {
      fetchDashboardData()
    }
  }, [user, supabase, fetchDashboardData])

  // Set up real-time subscription for bookings
  useEffect(() => {
    if (!user || !supabase) return

    const subscription = supabase
      .channel("dashboard-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Booking update received:", payload)
          // Refresh data when bookings change
          fetchDashboardData(true)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, supabase, fetchDashboardData])

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-4">You need to be signed in to access your dashboard.</p>
            <Button asChild>
              <Link href="/login?redirect=/dashboard">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-4">Please complete your profile setup to access your dashboard.</p>
            <Button asChild>
              <Link href="/onboarding">Complete Setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Dashboard Header */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                  Welcome back, {profile?.name || user?.email?.split("@")[0]}! 👋
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">Manage your bookings and track your events</p>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full px-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Link href="/artists" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Booking
                  </Link>
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
                    {loadingData ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Events</p>
                    {loadingData ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeEvents}</p>
                    )}
                    <p className="text-xs text-orange-600 mt-1">Upcoming</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Artists Worked With</p>
                    {loadingData ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.artistsWorkedWith}</p>
                    )}
                    <p className="text-xs text-purple-600 mt-1">Unique artists</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
                    {loadingData ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.totalSpent)}
                      </p>
                    )}
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <p className="text-xs text-green-600">
                        {stats.monthlyGrowth > 0 ? "+" : ""}
                        {stats.monthlyGrowth.toFixed(1)}% this month
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Bookings</p>
                    {loadingData ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                    )}
                  </div>
                  <Activity className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Completed Events</p>
                    {loadingData ? (
                      <Skeleton className="h-6 w-12" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
                    )}
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg. Booking Value</p>
                    {loadingData ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.averageBookingValue)}</p>
                    )}
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg mb-12">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Recent Bookings</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-2 border-purple-200 hover:border-purple-300 bg-transparent"
                asChild
              >
                <Link href="/bookings">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center space-x-4 p-4 border border-gray-100 rounded-xl"
                    >
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Start by browsing our amazing artists</p>
                  <Button asChild>
                    <Link href="/artists">Browse Artists</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-6 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{booking.artist_name}</h3>
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          {booking.booking_reference && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {booking.booking_reference}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{booking.event_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(booking.event_date).toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {formatCurrency(booking.amount)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 group bg-transparent"
                          asChild
                        >
                          <Link href={`/bookings/${booking.id}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-bold text-lg mb-2">Browse Artists</h3>
                <p className="text-purple-100 text-sm mb-4">Discover amazing performers for your next event</p>
                <Button variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href="/artists">Explore Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-bold text-lg mb-2">Manage Profile</h3>
                <p className="text-blue-100 text-sm mb-4">Update your preferences and settings</p>
                <Button variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href="/settings">Settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-teal-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="font-bold text-lg mb-2">Leave Reviews</h3>
                <p className="text-green-100 text-sm mb-4">Share your experience with artists</p>
                <Button variant="secondary" size="sm" className="rounded-full" asChild>
                  <Link href="/reviews">Write Review</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
