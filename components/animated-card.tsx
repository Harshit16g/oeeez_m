"use client"

import type React from "react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface AnimatedCardProps {
  children: React.ReactNode
  delay?: number
  className?: string
  animationType?: "fade-up" | "fade-left" | "fade-right" | "scale" | "rotate"
}

export function AnimatedCard({ children, delay = 0, className = "", animationType = "fade-up" }: AnimatedCardProps) {
  const { ref, hasTriggered } = useIntersectionObserver({
    threshold: 0.2,
    rootMargin: "-12.5% 0px -12.5% 0px", // This creates the 75% viewport you requested
    triggerOnce: true,
  })

  const getAnimationClass = () => {
    if (!hasTriggered) {
      switch (animationType) {
        case "fade-left":
          return "opacity-0 translate-x-8"
        case "fade-right":
          return "opacity-0 -translate-x-8"
        case "scale":
          return "opacity-0 scale-90"
        case "rotate":
          return "opacity-0 rotate-6 scale-95"
        default:
          return "opacity-0 translate-y-8"
      }
    }
    return "opacity-100 translate-x-0 translate-y-0 scale-100 rotate-0"
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${getAnimationClass()} ${className}`}
      style={{
        transitionDelay: hasTriggered ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  )
}
