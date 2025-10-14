"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Settings, CreditCard, Bell, HelpCircle, LogOut, Calendar, Star, Shield, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/enhanced-auth-context"

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useAuth()

  if (!profile) return null

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "event_planner":
        return { label: "Event Planner", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" }
      case "artist_manager":
        return {
          label: "Artist Manager",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        }
      case "admin":
        return { label: "Admin", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
      default:
        return { label: "User", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" }
    }
  }

  const roleInfo = getRoleDisplay(profile.role)

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-12 w-auto px-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 group border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-200 dark:hover:border-purple-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8 ring-2 ring-purple-200 dark:ring-purple-700 group-hover:ring-purple-300 dark:group-hover:ring-purple-600 transition-all duration-300">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <Shield className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{profile.name}</span>
                  {profile.verified && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{roleInfo.label}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-80 p-0 border shadow-xl bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          align="end"
          sideOffset={12}
          alignOffset={-8}
        >
          {/* User Info Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-purple-200 dark:ring-purple-700">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{profile.name}</h3>
                  {profile.verified && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{profile.email}</p>
                <Badge className={`text-xs ${roleInfo.color} border-0`}>{roleInfo.label}</Badge>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/profile" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">My Profile</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Manage your account</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Dashboard</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">View your events</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/settings" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Settings</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Preferences & privacy</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/billing" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Billing</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Payments & invoices</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/notifications" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center relative">
                  <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Notifications</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">3 unread messages</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="rounded-xl p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Link href="/help" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Help & Support</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Get assistance</div>
                </div>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* Logout */}
          <div className="p-2">
            <DropdownMenuItem
              className="rounded-xl p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              onClick={() => signOut()}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-red-500 dark:text-red-400">End your session</div>
                </div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
