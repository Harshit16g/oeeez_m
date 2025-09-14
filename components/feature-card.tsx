"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient: string
  delay?: number
  index: number
}

export function FeatureCard({ icon: Icon, title, description, gradient, delay = 0, index }: FeatureCardProps) {
  const { ref, hasTriggered } = useIntersectionObserver({
    threshold: 0.3,
    rootMargin: "-12.5% 0px -12.5% 0px",
    triggerOnce: true,
  })

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        hasTriggered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      }`}
      style={{
        transitionDelay: hasTriggered ? `${delay + index * 150}ms` : "0ms",
      }}
    >
      <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm h-full">
        <CardContent className="p-8 text-center h-full flex flex-col">
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg`}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-4 text-gray-900">{title}</h3>
          <p className="text-gray-600 leading-relaxed flex-1">{description}</p>
        </CardContent>
      </Card>
    </div>
  )
}
