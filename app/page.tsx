"use client"

import { useEffect } from "react"
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

  useEffect(() => {
    // Only redirect authenticated users who have completed onboarding
    if (!loading && user && profile?.is_onboarded) {
      router.push("/artists")
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Show onboarding for authenticated users who haven't completed it
  if (user && profile && !profile.is_onboarded) {
    return <OnboardingFlow onComplete={() => router.push("/artists")} />
  }

  // Show landing page for non-authenticated users or authenticated users who haven't been redirected
  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 min-h-screen overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Floating Badge */}
          <AnimatedCard delay={0} animationType="fade-up">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-purple-200 dark:border-purple-700 rounded-full px-6 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                India&apos;s Premier Artist Booking Platform
              </span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={200} animationType="fade-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8">
              Connect with Amazing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 block animate-gradient-x">
                Performing Artists
              </span>
            </h1>
          </AnimatedCard>

          <AnimatedCard delay={400} animationType="fade-up">
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover talented performers and book them for your events. Join thousands of event planners creating
              unforgettable experiences.
            </p>
          </AnimatedCard>

          <AnimatedCard delay={600} animationType="scale">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {user ? (
                // Show different CTA for authenticated users
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                >
                  <Link href="/artists" className="flex items-center gap-2">
                    Browse Artists
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                // Show login/signup for non-authenticated users
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-purple-300 hover:border-purple-400 px-8 py-4 text-lg rounded-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transform hover:scale-105 transition-all duration-300"
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
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Artistly?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            The easiest way to discover and book talented artists for your events
          </p>
        </AnimatedCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Music,
              title: "Diverse Talent",
              description: "From DJs to live bands, find artists across all genres",
              gradient: "from-purple-500 to-pink-500",
            },
            {
              icon: Users,
              title: "Verified Artists",
              description: "All artists are verified and professionally managed",
              gradient: "from-blue-500 to-indigo-500",
            },
            {
              icon: Calendar,
              title: "Easy Booking",
              description: "Simple booking process with instant availability",
              gradient: "from-green-500 to-teal-500",
            },
            {
              icon: Star,
              title: "Quality Assured",
              description: "Read reviews and ratings from previous events",
              gradient: "from-orange-500 to-red-500",
            },
          ].map((feature, index) => (
            <AnimatedCard key={index} delay={200 + index * 100} animationType="fade-up">
              <div className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full rounded-2xl p-6">
                <div className="text-center h-full flex flex-col">
                  <div
                    className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{feature.description}</p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* CTA Section - Only show for non-authenticated users */}
      {!user && (
        <section className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white py-16 overflow-hidden">
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <AnimatedCard delay={0} animationType="fade-up">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
              </AnimatedCard>

              <AnimatedCard delay={200} animationType="fade-up">
                <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                  Join Artistly today and start connecting with amazing performers for your events
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400} animationType="scale">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-purple-900 hover:bg-gray-100 px-10 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      Join Artistly
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-10 py-4 text-lg rounded-full"
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
