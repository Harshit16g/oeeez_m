import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { EnhancedAuthProvider } from "@/lib/enhanced-auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Artistly - Connect with Creative Professionals",
  description:
    "Discover and book talented artists, photographers, designers, and creative professionals for your projects.",
  keywords: ["artists", "creative", "booking", "photography", "design", "freelance"],
  authors: [{ name: "Artistly Team" }],
  creator: "Artistly",
  publisher: "Artistly",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Artistly - Connect with Creative Professionals",
    description:
      "Discover and book talented artists, photographers, designers, and creative professionals for your projects.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Artistly",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artistly - Connect with Creative Professionals",
    description:
      "Discover and book talented artists, photographers, designers, and creative professionals for your projects.",
    creator: "@artistly",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  generator: "v0.app",
}

// Safe Redis initialization only on server side
if (typeof window === "undefined") {
  // Dynamic import to avoid bundling Redis in client-side code
  import("@/lib/redis/client")
    .then(({ initializeRedis }) => {
      initializeRedis()
    })
    .catch(() => {
      console.log("Redis not available, continuing without caching")
    })
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <EnhancedAuthProvider>
              {children}
              <Toaster />
            </EnhancedAuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
