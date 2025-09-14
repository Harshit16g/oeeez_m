"use client"

import { Music, Users, Calendar, Star } from "lucide-react"
import { FeatureCard } from "@/components/feature-card"

const FEATURES = [
  {
    Icon: Music,
    title: "Diverse Talent",
    description: "From DJs to live bands, find artists across all genres and styles",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    Icon: Users,
    title: "Verified Artists",
    description: "All artists are verified and managed by professional artist managers",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    Icon: Calendar,
    title: "Easy Booking",
    description: "Simple booking process with instant availability checking",
    gradient: "from-green-500 to-teal-500",
  },
  {
    Icon: Star,
    title: "Quality Assured",
    description: "Read reviews and ratings from previous event organizers",
    gradient: "from-orange-500 to-red-500",
  },
]

export function FeatureGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {FEATURES.map((f, i) => (
        <FeatureCard
          key={i}
          icon={f.Icon}
          title={f.title}
          description={f.description}
          gradient={f.gradient}
          delay={200}
          index={i}
        />
      ))}
    </div>
  )
}
