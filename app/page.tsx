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
      <div className="min-h-screen bg-oeeez-navy-dark flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-isometric-cubes opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-oeeez opacity-30 animate-gradient-shift"></div>
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-oeeez-coral border-t-oeeez-teal-600"></div>
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
    <div className="relative bg-oeeez-navy-dark min-h-screen overflow-hidden">
      {/* Isometric Cubes Background */}
      <div className="absolute inset-0 bg-isometric-cubes opacity-30"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-oeeez opacity-40 animate-gradient-shift"></div>
      
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Floating Badge */}
          <AnimatedCard delay={0} animationType="fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-oeeez-coral/30 rounded-full px-6 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-oeeez-coral-light" />
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
                    className="bg-gradient-oeeez hover:opacity-90 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group animate-gradient-shift"
                  >
                    <Link href="/categories" className="flex items-center gap-2">
                      Browse Categories
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg rounded-full border-2 border-oeeez-teal-600 text-oeeez-teal-600 hover:bg-oeeez-teal-600/10 backdrop-blur-md bg-white/10 shadow-lg"
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
                    className="bg-gradient-oeeez hover:opacity-90 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group animate-gradient-shift"
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
                    className="border-2 border-oeeez-coral text-white hover:bg-oeeez-coral/20 px-8 py-4 text-lg rounded-full backdrop-blur-md bg-white/10 transform hover:scale-105 transition-all duration-300"
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
