"use client"

import { useEffect, useState } from "react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface StatsCounterProps {
  number: string
  label: string
  delay?: number
}

export function StatsCounter({ number, label, delay = 0 }: StatsCounterProps) {
  const { ref, hasTriggered } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: "-12.5% 0px -12.5% 0px",
    triggerOnce: true,
  })

  const [displayNumber, setDisplayNumber] = useState("0")
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (hasTriggered && !isAnimating) {
      setIsAnimating(true)

      // Extract numeric value for animation
      const numericValue = Number.parseInt(number.replace(/[^\d]/g, ""))
      const suffix = number.replace(/[\d]/g, "")

      if (numericValue > 0) {
        let current = 0
        const increment = numericValue / 30 // 30 steps for smooth animation
        const timer = setInterval(() => {
          current += increment
          if (current >= numericValue) {
            setDisplayNumber(number)
            clearInterval(timer)
          } else {
            setDisplayNumber(Math.floor(current) + suffix)
          }
        }, 50)

        return () => clearInterval(timer)
      } else {
        setDisplayNumber(number)
      }
    }
  }, [hasTriggered, number, isAnimating])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        hasTriggered ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-90"
      }`}
      style={{
        transitionDelay: hasTriggered ? `${delay}ms` : "0ms",
      }}
    >
      <div className="text-4xl md:text-5xl font-bold mb-2">{displayNumber}</div>
      <div className="text-lg opacity-90">{label}</div>
    </div>
  )
}
