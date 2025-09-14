"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)
  const { profile, updateProfile } = useAuth()

  useEffect(() => {
    setMounted(true)

    // Get theme from user profile or localStorage
    const savedTheme = profile?.preferences?.theme || (localStorage.getItem("theme") as Theme) || "system"
    setThemeState(savedTheme)

    const updateResolvedTheme = (themeValue: Theme) => {
      if (themeValue === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        setResolvedTheme(systemTheme)
        document.documentElement.classList.toggle("dark", systemTheme === "dark")
      } else {
        setResolvedTheme(themeValue)
        document.documentElement.classList.toggle("dark", themeValue === "dark")
      }
    }

    updateResolvedTheme(savedTheme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (savedTheme === "system") {
        updateResolvedTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [profile])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)

    // Update resolved theme
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setResolvedTheme(systemTheme)
      document.documentElement.classList.toggle("dark", systemTheme === "dark")
    } else {
      setResolvedTheme(newTheme)
      document.documentElement.classList.toggle("dark", newTheme === "dark")
    }

    // Update user profile if logged in
    if (profile) {
      try {
        await updateProfile({
          preferences: {
            ...profile.preferences,
            theme: newTheme,
          },
        })
      } catch (error) {
        console.error("Failed to update theme preference:", error)
      }
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-gray-900" />
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
