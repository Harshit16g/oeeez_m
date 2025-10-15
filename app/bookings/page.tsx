"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/enhanced-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { Calendar, MapPin, Clock, DollarSign, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface Booking {
  id: string
  artist_name: string
  event_name: string
  event_type: string
  event_date: string
  event_time: string
  venue: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  amount: number
  created_at: string
}

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled" | "completed">("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    // Mock bookings data - replace with actual API call
    const mockBookings: Booking[] = [
      {
        id: "1",
        artist_name: "DJ Sonic",
        event_name: "Corporate Event 2024",
        event_type: "Corporate",
        event_date: "2024-12-15",
        event_time: "18:00",
        venue: "Grand Hotel, Mumbai",
        status: "confirmed",
        amount: 25000,
        created_at: "2024-11-01",
      },
      {
        id: "2",
        artist_name: "The Jazz Collective",
        event_name: "Wedding Reception",
        event_type: "Wedding",
        event_date: "2024-12-20",
        event_time: "19:30",
        venue: "Beach Resort, Goa",
        status: "pending",
        amount: 45000,
        created_at: "2024-11-05",
      },
    ]
    setBookings(mockBookings)
  }, [])

  if (loading || !user) {
    return <Loading />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const filteredBookings = filter === "all" ? bookings : bookings.filter((b) => b.status === filter)

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">Manage and track all your event bookings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Bookings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Confirmed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
              All
            </Button>
            <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")} size="sm">
              Pending
            </Button>
            <Button variant={filter === "confirmed" ? "default" : "outline"} onClick={() => setFilter("confirmed")} size="sm">
              Confirmed
            </Button>
            <Button variant={filter === "completed" ? "default" : "outline"} onClick={() => setFilter("completed")} size="sm">
              Completed
            </Button>
          </div>

          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No bookings found</p>
                  <Button asChild className="mt-4">
                    <a href="/artists">Browse Artists</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{booking.event_name}</CardTitle>
                        <CardDescription className="text-base mt-1">with {booking.artist_name}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                          <p className="font-medium">{new Date(booking.event_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                          <p className="font-medium">{booking.event_time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Venue</p>
                          <p className="font-medium">{booking.venue}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                          <p className="font-medium">₹{booking.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">View Details</Button>
                      {booking.status === "pending" && <Button variant="outline" size="sm">Cancel Booking</Button>}
                      {booking.status === "completed" && <Button variant="outline" size="sm">Leave Review</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
