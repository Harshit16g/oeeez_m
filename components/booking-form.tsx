"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Users, MapPin } from "lucide-react"

interface BookingFormProps {
  artistId: number
  artistName: string
}

export function BookingForm({ artistName }: BookingFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    duration: "",
    venue: "",
    expectedGuests: "",
    budget: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    additionalRequirements: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Booking Request Submitted!",
      description: `Your booking request for ${artistName} has been sent. You'll receive a response within 24 hours.`,
    })

    setIsSubmitting(false)

    // Reset form
    setFormData({
      eventName: "",
      eventType: "",
      eventDate: "",
      eventTime: "",
      duration: "",
      venue: "",
      expectedGuests: "",
      budget: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      additionalRequirements: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="eventName">Event Name *</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) => handleInputChange("eventName", e.target.value)}
              placeholder="e.g., Annual Corporate Party"
              required
            />
          </div>

          <div>
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="corporate">Corporate Event</SelectItem>
                <SelectItem value="birthday">Birthday Party</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="concert">Concert</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="eventDate">Event Date *</Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleInputChange("eventDate", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="eventTime">Start Time *</Label>
            <Input
              id="eventTime"
              type="time"
              value={formData.eventTime}
              onChange={(e) => handleInputChange("eventTime", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2">1-2 hours</SelectItem>
                <SelectItem value="2-3">2-3 hours</SelectItem>
                <SelectItem value="3-4">3-4 hours</SelectItem>
                <SelectItem value="4+">4+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Venue & Audience */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Venue & Audience
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="venue">Venue Address *</Label>
            <Textarea
              id="venue"
              value={formData.venue}
              onChange={(e) => handleInputChange("venue", e.target.value)}
              placeholder="Full venue address with city and state"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="expectedGuests">Expected Guests *</Label>
            <Select
              value={formData.expectedGuests}
              onValueChange={(value) => handleInputChange("expectedGuests", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select guest count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50-100">50-100 guests</SelectItem>
                <SelectItem value="100-200">100-200 guests</SelectItem>
                <SelectItem value="200-500">200-500 guests</SelectItem>
                <SelectItem value="500+">500+ guests</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Budget & Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Budget & Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget Range</Label>
            <Select value={formData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10000-25000">₹10,000 - ₹25,000</SelectItem>
                <SelectItem value="25000-50000">₹25,000 - ₹50,000</SelectItem>
                <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                <SelectItem value="100000+">₹1,00,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contactName">Your Name *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleInputChange("contactName", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactEmail">Email Address *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="contactPhone">Phone Number *</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange("contactPhone", e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>
        </div>
      </div>

      {/* Additional Requirements */}
      <div>
        <Label htmlFor="additionalRequirements">Additional Requirements</Label>
        <Textarea
          id="additionalRequirements"
          value={formData.additionalRequirements}
          onChange={(e) => handleInputChange("additionalRequirements", e.target.value)}
          placeholder="Any special requirements, equipment needs, or other details..."
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting Request..." : "Submit Booking Request"}
        </Button>
        <p className="text-sm text-gray-500 mt-2 text-center">You&apos;ll receive a response within 24 hours</p>
      </div>
    </form>
  )
}
