"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp, Search, Users, Star } from "lucide-react"
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
      <div className="min-h-screen bg-oeeez-black flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-oeeez-steel-700 border-t-oeeez-crimson"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-gradient-crimson">O</span>
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
    <div className="relative min-h-screen bg-oeeez-black overflow-hidden">
      {/* Mechanical Grid Background */}
      <div className="absolute inset-0 bg-mechanical-grid"></div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-oeeez-black via-transparent to-oeeez-black"></div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Premium Badge */}
          <AnimatedCard delay={0} animationType="fade-up">
            <div className="inline-flex items-center gap-2 bg-glossy-card rounded-full px-6 py-3 mb-8 glossy-shadow">
              <Sparkles className="h-4 w-4 text-oeeez-crimson" />
              <span className="text-sm font-semibold text-oeeez-steel-400 tracking-wide">
                PREMIUM MARKETPLACE PLATFORM
              </span>
            </div>
          </AnimatedCard>

          {/* Hero Heading */}
          <AnimatedCard delay={200} animationType="fade-up">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
              Discover
              <span className="block text-gradient-crimson mt-2">
                Excellence
              </span>
            </h1>
          </AnimatedCard>

          <AnimatedCard delay={400} animationType="fade-up">
            <p className="text-xl md:text-2xl text-oeeez-steel-400 mb-12 max-w-3xl leading-relaxed">
              Connect with verified professionals across 15+ categories. From creative services to technical solutions - 
              <span className="text-white font-semibold"> powered by trust, driven by quality.</span>
            </p>
          </AnimatedCard>

          {/* CTA Buttons */}
          <AnimatedCard delay={600} animationType="scale">
            <div className="flex flex-col sm:flex-row gap-6">
              {user ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className={`
                      bg-gradient-crimson text-white px-10 py-6 text-lg rounded-xl
                      glossy-shadow hover:glossy-shadow-lg
                      transform transition-all duration-500 ease-out
                      group relative overflow-hidden
                      ${scrolled ? 'scale-105 animate-pulse-glow' : 'scale-100'}
                    `}
                  >
                    <Link href="/categories" className="flex items-center gap-3 relative z-10">
                      <span className="font-bold">Explore Categories</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="px-10 py-6 text-lg rounded-xl border-2 border-oeeez-steel-700 text-white hover:bg-oeeez-black-light bg-oeeez-black-light/50 backdrop-blur-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/artists">View Providers</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className={`
                      bg-gradient-crimson text-white px-10 py-6 text-lg rounded-xl
                      glossy-shadow hover:glossy-shadow-lg
                      transform transition-all duration-500 ease-out
                      group relative overflow-hidden
                      ${scrolled ? 'scale-105 animate-pulse-glow' : 'scale-100'}
                    `}
                  >
                    <Link href="/login" className="flex items-center gap-3 relative z-10">
                      <span className="font-bold">Get Started</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-oeeez-steel-700 text-white hover:bg-oeeez-black-light px-10 py-6 text-lg rounded-xl bg-oeeez-black-light/50 backdrop-blur-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/signup">Create Account</Link>
                  </Button>
                </>
              )}
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Trust Indicators / Stats Section */}
      <section className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            { value: "2,600+", label: "Verified Providers", icon: Users },
            { value: "15+", label: "Categories", icon: TrendingUp },
            { value: "98%", label: "Satisfaction Rate", icon: Star },
            { value: "24/7", label: "Support", icon: Shield },
          ].map((stat, index) => (
            <AnimatedCard key={index} delay={index * 100} animationType="fade-up">
              <div className="bg-glossy-card rounded-2xl p-6 text-center glossy-shadow transform hover:scale-105 transition-all duration-300">
                <stat.icon className="h-8 w-8 text-oeeez-crimson mx-auto mb-3" />
                <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-oeeez-steel-400 font-semibold tracking-wide">{stat.label.toUpperCase()}</div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="relative container mx-auto px-4 py-20">
        <AnimatedCard delay={0} animationType="fade-up" className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Explore Categories</h2>
          <p className="text-xl text-oeeez-steel-400 max-w-2xl mx-auto">
            From creative services to technical solutions - find the perfect provider for your needs
          </p>
        </AnimatedCard>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { name: "Performing Arts", count: "320+ Providers", icon: "🎭" },
            { name: "Visual Arts", count: "280+ Providers", icon: "🎨" },
            { name: "Home Services", count: "450+ Providers", icon: "🏠" },
            { name: "Digital Services", count: "380+ Providers", icon: "💻" },
            { name: "Wellness", count: "240+ Providers", icon: "🧘" },
            { name: "Professional", count: "330+ Providers", icon: "💼" },
          ].map((category, index) => (
            <AnimatedCard key={index} delay={200 + index * 100} animationType="fade-up">
              <Link href="/categories">
                <div className="bg-glossy-card rounded-2xl p-8 glossy-shadow hover:glossy-shadow-lg transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 group cursor-pointer">
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-oeeez-crimson transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-oeeez-steel-400 font-semibold">{category.count}</p>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative container mx-auto px-4 py-20">
        <AnimatedCard delay={0} animationType="fade-up" className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How It Works</h2>
          <p className="text-xl text-oeeez-steel-400 max-w-2xl mx-auto">
            Simple, secure, and efficient - get started in three easy steps
          </p>
        </AnimatedCard>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              step: "01",
              title: "Search & Discover",
              description: "Browse verified providers across 15+ categories with detailed profiles and reviews",
              icon: Search,
            },
            {
              step: "02",
              title: "Connect & Book",
              description: "Direct messaging, instant availability, and secure booking with transparent pricing",
              icon: Zap,
            },
            {
              step: "03",
              title: "Experience Quality",
              description: "Rated services, quality assurance, and 24/7 support for peace of mind",
              icon: Shield,
            },
          ].map((step, index) => (
            <AnimatedCard key={index} delay={200 + index * 100} animationType="fade-up">
              <div className="bg-glossy-card rounded-2xl p-8 glossy-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 text-9xl font-black text-oeeez-steel-900 opacity-20 leading-none p-4">
                  {step.step}
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-gradient-crimson flex items-center justify-center mb-6 glossy-shadow transform group-hover:scale-110 transition-transform">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-oeeez-steel-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Final CTA Section - Only show for non-authenticated users */}
      {!user && (
        <section className="relative py-24">
          <div className="absolute inset-0 bg-gradient-to-t from-oeeez-black to-transparent"></div>
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <AnimatedCard delay={0} animationType="fade-up">
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">Ready to Get Started?</h2>
              </AnimatedCard>

              <AnimatedCard delay={200} animationType="fade-up">
                <p className="text-xl text-oeeez-steel-400 mb-12 max-w-2xl mx-auto">
                  Join thousands of satisfied customers connecting with top-tier professionals on Oeeez
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400} animationType="scale">
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-crimson text-white px-12 py-6 text-xl rounded-xl glossy-shadow hover:glossy-shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/signup" className="flex items-center gap-3">
                      <span className="font-bold">Join Oeeez</span>
                      <ArrowRight className="h-6 w-6" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-oeeez-steel-700 text-white hover:bg-oeeez-black-light px-12 py-6 text-xl rounded-xl bg-oeeez-black-light/50 backdrop-blur-xl transform hover:scale-105 transition-all duration-300"
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
