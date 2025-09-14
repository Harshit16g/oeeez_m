"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "event_planner" | "artist_manager" | "admin"
  verified: boolean
  phone?: string
  bio?: string
  location?: string
  company?: string
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      profileVisible: boolean
      showEmail: boolean
      showPhone: boolean
    }
  }
  stats: {
    bookings: number
    artists: number
    rating: number
    totalSpent: number
  }
}

interface UserContextType {
  user: User | null
  updateUser: (updates: Partial<User>) => void
  uploadAvatar: (file: File) => Promise<string>
  isOnboarded: boolean
  completeOnboarding: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)

  useEffect(() => {
    // Load user data from localStorage or API
    const savedUser = localStorage.getItem("user")
    const onboardingStatus = localStorage.getItem("onboarding_completed")

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // Mock user data
      const mockUser: User = {
        id: "1",
        name: "Priya Sharma",
        email: "priya.sharma@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
        role: "event_planner",
        verified: true,
        phone: "+91 98765 43210",
        bio: "Experienced event planner specializing in corporate events and weddings.",
        location: "Mumbai, India",
        company: "Elite Events",
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          privacy: {
            profileVisible: true,
            showEmail: false,
            showPhone: false,
          },
        },
        stats: {
          bookings: 12,
          artists: 8,
          rating: 4.9,
          totalSpent: 240000,
        },
      }
      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    }

    setIsOnboarded(onboardingStatus === "true")
  }, [])

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    // Simulate file upload
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        updateUser({ avatar: dataUrl })
        resolve(dataUrl)
      }
      reader.readAsDataURL(file)
    })
  }

  const completeOnboarding = () => {
    setIsOnboarded(true)
    localStorage.setItem("onboarding_completed", "true")
  }

  return (
    <UserContext.Provider value={{ user, updateUser, uploadAvatar, isOnboarded, completeOnboarding }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
