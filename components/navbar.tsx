"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"
import { NotificationCenter } from "@/components/notification-center"
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down, hide header
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        // Scrolling up or at top, show header
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible
          ? "translate-y-0"
          : "-translate-y-full"
      } ${
        isHomePage && lastScrollY === 0
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-purple-600" />
          <span className="font-bold text-xl text-purple-600">Artistly</span>
        </div>

        {/* Navigation (links for authenticated users) */}
        {user && (
          <div className="flex items-center space-x-6">
            <a
              href="/artists"
              className={`font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 ${
                pathname === "/artists" ? "text-purple-600 dark:text-purple-400" : ""
              }`}
            >
              Artists
            </a>
            <a
              href="/bookings"
              className={`font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 ${
                pathname === "/bookings" ? "text-purple-600 dark:text-purple-400" : ""
              }`}
            >
              Bookings
            </a>
            <a
              href="/help"
              className={`font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300 ${
                pathname === "/help" ? "text-purple-600 dark:text-purple-400" : ""
              }`}
            >
              Help
            </a>
          </div>
        )}

        {/* Auth Section (UserProfileDropdown and NotificationCenter) */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <NotificationCenter />
              <UserProfileDropdown />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-300"
              >
                <a href="/login">Sign In</a>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2"
              >
                <a href="/signup">Sign Up</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
