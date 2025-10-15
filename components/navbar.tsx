"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserProfileDropdown } from "@/components/user-profile-dropdown"
import { NotificationCenter } from "@/components/notification-center"
import { useAuth } from "@/lib/enhanced-auth-context"

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
          : "bg-oeeez-black/95 backdrop-blur-md shadow-lg border-b border-oeeez-steel-800"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-crimson opacity-30 blur-lg"></div>
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-crimson rounded transform rotate-45"></div>
            </div>
          </div>
          <span className="font-bold text-2xl text-gradient-crimson">Oeeez</span>
        </div>

        {/* Navigation (links for authenticated users) */}
        {user && (
          <div className="flex items-center space-x-6">
            <a
              href="/categories"
              className={`font-semibold text-sm text-oeeez-steel-400 hover:text-white transition-colors duration-300 ${
                pathname === "/categories" ? "text-oeeez-crimson" : ""
              }`}
            >
              Categories
            </a>
            <a
              href="/artists"
              className={`font-semibold text-sm text-oeeez-steel-400 hover:text-white transition-colors duration-300 ${
                pathname === "/artists" ? "text-oeeez-crimson" : ""
              }`}
            >
              Providers
            </a>
            <a
              href="/services"
              className={`font-semibold text-sm text-oeeez-steel-400 hover:text-white transition-colors duration-300 ${
                pathname === "/services" ? "text-oeeez-crimson" : ""
              }`}
            >
              Services
            </a>
            <a
              href="/bookings"
              className={`font-semibold text-sm text-oeeez-steel-400 hover:text-white transition-colors duration-300 ${
                pathname === "/bookings" ? "text-oeeez-crimson" : ""
              }`}
            >
              Bookings
            </a>
            <a
              href="/reviews"
              className={`font-semibold text-sm text-oeeez-steel-400 hover:text-white transition-colors duration-300 ${
                pathname === "/reviews" ? "text-oeeez-crimson" : ""
              }`}
            >
              Reviews
            </a>
          </div>
        )}

        {/* Auth Section (UserProfileDropdown and NotificationCenter) */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-8 h-8 bg-oeeez-steel-800 rounded-full animate-pulse" />
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
                className="text-oeeez-steel-400 hover:bg-oeeez-black-light hover:text-white transition-colors duration-300"
              >
                <a href="/login">Sign In</a>
              </Button>
              <Button
                asChild
                className="bg-gradient-crimson hover:opacity-90 text-white px-6 py-2 rounded-lg glossy-shadow"
              >
                <a href="/signup">Get Started</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
