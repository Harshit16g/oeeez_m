"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, X, Calendar, CreditCard, Star, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/enhanced-auth-context"
import type { SupabaseChannel } from "@supabase/supabase-js"
import { fetchNotifications } from "@/lib/supabase/notifications" // Declare the fetchNotifications variable

interface Notification {
  id: string
  type: "booking" | "payment" | "review" | "system" | "reminder"
  title: string
  message: string
  created_at: string
  read: boolean
  action_url?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()
  const channelRef = useRef<SupabaseChannel | null>(null)

  useEffect(() => {
    // Clean up any existing channel before we (re)subscribe
    const cleanup = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }

    if (!user) {
      cleanup()
      return
    }

    const channelName = `notifications:${user.id}` // unique per-user channel
    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications(supabase, user.id, setNotifications), // refresh list
      )
      .subscribe()

    // Initial fetch
    fetchNotifications(supabase, user.id, setNotifications)

    return () => {
      cleanup()
    }
  }, [user, supabase])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id)

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = async () => {
    if (!user) return

    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id)

    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case "payment":
        return <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "review":
        return <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case "reminder":
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case "system":
        return <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
    } else {
      return `${days}d ago`
    }
  }

  return (
    <div className="fixed top-4 right-20 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-12 w-12 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-200 dark:hover:border-purple-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-lg"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs border-2 border-white dark:border-gray-800">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-96 p-0 border shadow-xl bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          align="end"
          sideOffset={12}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{unreadCount} unread notifications</p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatTimestamp(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                View all notifications
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
