"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/enhanced-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { Bell, Calendar, CreditCard, Star, AlertCircle, CheckCircle2, X, Trash2 } from "lucide-react"

interface Notification {
  id: string
  type: "booking" | "payment" | "review" | "system" | "reminder"
  title: string
  message: string
  created_at: string
  read: boolean
  action_url?: string
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    // Mock notifications - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "booking",
        title: "Booking Confirmed",
        message: "Your booking with DJ Sonic for Corporate Event 2024 has been confirmed!",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "2",
        type: "reminder",
        title: "Event Reminder",
        message: "Your event with The Jazz Collective is tomorrow at 7:30 PM",
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: false,
      },
      {
        id: "3",
        type: "payment",
        title: "Payment Received",
        message: "Payment of ₹25,000 received for booking #12345",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
      {
        id: "4",
        type: "review",
        title: "New Review",
        message: "Rock Fusion left you a 5-star review!",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
      {
        id: "5",
        type: "system",
        title: "Profile Updated",
        message: "Your profile has been successfully updated",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ]
    setNotifications(mockNotifications)
  }, [])

  if (loading || !user) {
    return <Loading />
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
      case "review":
        return <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      case "reminder":
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      case "system":
        return <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diff = now.getTime() - notificationTime.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else if (days === 1) {
      return "Yesterday"
    } else {
      return `${days}d ago`
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const deleteAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read))
  }

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter((n) => !n.read)

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              {notifications.some((n) => n.read) && (
                <Button variant="outline" onClick={deleteAllRead}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete read
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              size="sm"
            >
              Unread ({unreadCount})
            </Button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    !notification.read ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <Badge variant="default" className="h-5 px-2">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
