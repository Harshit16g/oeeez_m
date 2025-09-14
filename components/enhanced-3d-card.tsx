"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface Enhanced3DCardProps {
  children: React.ReactNode
  className?: string
}

export function Enhanced3DCard({ children, className = "" }: Enhanced3DCardProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateXValue = (mouseY / (rect.height / 2)) * -10
    const rotateYValue = (mouseX / (rect.width / 2)) * 10

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <div className={`perspective-1000 ${className}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <Card
        className="transform-3d transition-transform duration-300 ease-out hover:shadow-2xl"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`,
        }}
      >
        {children}
      </Card>
    </div>
  )
}
