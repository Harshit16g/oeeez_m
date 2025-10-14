"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Music, Users, Calendar, Star } from "lucide-react"
import { AnimatedCard } from "@/components/animated-card"
import { OnboardingFlow } from "@/components/onboarding-flow"
import { useAuth } from "@/lib/enhanced-auth-context"

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Only redirect authenticated users who have completed onboarding
    if (!loading && user && profile?.is_onboarded) {
      router.push("/artists")
    }
  }, [user, profile, loading, router])

  // Track scroll for button animation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-oeeez-red-700 via-oeeez-coral to-oeeez-teal-600 flex items-center justify-center relative overflow-hidden">
        <div className="relative backdrop-blur-sm bg-white/10 p-8 rounded-3xl">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-white/30 border-t-white"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">O</span>
          </div>
        </div>
      </div>
    )
  }

  // Show onboarding for authenticated users who haven't completed it
  if (user && profile && !profile.is_onboarded) {
    return <OnboardingFlow onComplete={() => router.push("/artists")} />
  }

  // Show landing page for non-authenticated users or authenticated users who haven't been redirected
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Clean Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-oeeez-red-700 via-oeeez-coral to-oeeez-teal-600"></div>
      
      {/* Subtle Radial Overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.2),transparent_50%)]"></div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Floating Badge */}
          <AnimatedCard delay={0} animationType="fade-up">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full px-6 py-2 mb-8 shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                The Multipurpose Marketplace Platform
              </span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={200} animationType="fade-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8">
              Welcome to
              <span className="text-gradient-oeeez block mt-2">
                Oeeez
              </span>
            </h1>
          </AnimatedCard>

          <AnimatedCard delay={400} animationType="fade-up">
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              From performing arts to home services, digital solutions to wellness - discover and book trusted
              providers across 15+ categories. Join thousands creating amazing experiences.
            </p>
          </AnimatedCard>

          <AnimatedCard delay={600} animationType="scale">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {user ? (
                // Show different CTA for authenticated users
                <>
                  <Button
                    asChild
                    size="lg"
                    className={`
                      bg-gradient-to-r from-orange-600 via-red-600 to-orange-700
                      hover:from-orange-500 hover:via-red-500 hover:to-orange-600
                      text-white px-8 py-4 text-lg rounded-full
                      backdrop-blur-xl bg-opacity-90
                      shadow-[0_8px_32px_0_rgba(255,100,50,0.4)]
                      hover:shadow-[0_12px_48px_0_rgba(255,100,50,0.6)]
                      border border-white/20
                      transform transition-all duration-500 ease-out
                      group
                      ${scrolled ? 'scale-110 shadow-[0_16px_64px_0_rgba(255,100,50,0.7)] animate-pulse' : 'scale-100'}
                    `}
                  >
                    <Link href="/categories" className="flex items-center gap-2">
                      <span className="relative z-10">Browse Categories</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg rounded-full border-2 border-white/40 text-white hover:bg-white/20 backdrop-blur-lg bg-white/10 shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/artists">View Artists</Link>
                  </Button>
                </>
              ) : (
                // Show login/signup for non-authenticated users
                <>
                  <Button
                    asChild
                    size="lg"
                    className={`
                      bg-gradient-to-r from-orange-600 via-red-600 to-orange-700
                      hover:from-orange-500 hover:via-red-500 hover:to-orange-600
                      text-white px-8 py-4 text-lg rounded-full
                      backdrop-blur-xl bg-opacity-90
                      shadow-[0_8px_32px_0_rgba(255,100,50,0.4)]
                      hover:shadow-[0_12px_48px_0_rgba(255,100,50,0.6)]
                      border border-white/20
                      transform transition-all duration-500 ease-out
                      group
                      ${scrolled ? 'scale-110 shadow-[0_16px_64px_0_rgba(255,100,50,0.7)] animate-pulse' : 'scale-100'}
                    `}
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      <span className="relative z-10">Get Started</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-white/40 text-white hover:bg-white/20 px-8 py-4 text-lg rounded-full backdrop-blur-lg bg-white/10 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-16">
        <AnimatedCard delay={0} animationType="fade-up" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Oeeez?</h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Your one-stop marketplace for services, products, and professional talent across all categories
          </p>
        </AnimatedCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Music,
              title: "15+ Categories",
              description: "From performing arts to home services, digital solutions to wellness",
              gradient: "from-orange-500 to-red-600",
            },
            {
              icon: Users,
              title: "2,600+ Providers",
              description: "All providers are verified, rated, and professionally managed",
              gradient: "from-red-600 to-orange-700",
            },
            {
              icon: Calendar,
              title: "Easy Booking",
              description: "Simple booking and secure communication with instant availability",
              gradient: "from-orange-600 to-red-700",
            },
            {
              icon: Star,
              title: "Quality Assured",
              description: "Trending system and reviews to help you find the best providers",
              gradient: "from-red-700 to-orange-800",
            },
          ].map((feature, index) => (
            <AnimatedCard key={index} delay={200 + index * 100} animationType="fade-up">
              <div className="group hover:shadow-[0_20px_60px_0_rgba(255,100,50,0.3)] transition-all duration-300 transform hover:-translate-y-1 border border-white/20 bg-white/10 backdrop-blur-xl h-full rounded-2xl p-6">
                <div className="text-center h-full flex flex-col">
                  <div
                    className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">{feature.title}</h3>
                  <p className="text-white/90 leading-relaxed flex-1">{feature.description}</p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* CTA Section - Only show for non-authenticated users */}
      {!user && (
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <AnimatedCard delay={0} animationType="fade-up">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
              </AnimatedCard>

              <AnimatedCard delay={200} animationType="fade-up">
                <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                  Join Oeeez today and start connecting with amazing service providers across all categories
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400} animationType="scale">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 hover:from-orange-500 hover:via-red-500 hover:to-orange-600 text-white px-10 py-4 text-lg rounded-full shadow-[0_8px_32px_0_rgba(255,100,50,0.4)] hover:shadow-[0_12px_48px_0_rgba(255,100,50,0.6)] backdrop-blur-xl border border-white/20 transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      Join Oeeez
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-white/40 text-white hover:bg-white/20 px-10 py-4 text-lg rounded-full backdrop-blur-lg bg-white/10 transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
