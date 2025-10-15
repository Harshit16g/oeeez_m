"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  Send
} from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const faqs: FAQItem[] = [
    {
      category: "Getting Started",
      question: "How do I create an account?",
      answer: "Click on 'Sign Up' in the top right corner and fill in your details. You'll receive a verification email to activate your account.",
    },
    {
      category: "Getting Started",
      question: "What is the onboarding process?",
      answer: "After verifying your email, you'll go through a simple onboarding flow where you provide your name, role (client or artist), and basic profile information.",
    },
    {
      category: "Booking",
      question: "How do I book an artist?",
      answer: "Browse our artists page, select an artist, click 'Book Now', fill in your event details, and submit your request. The artist will review and confirm your booking.",
    },
    {
      category: "Booking",
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel a booking from your bookings page. Cancellation policies may vary depending on how close to the event date you cancel.",
    },
    {
      category: "Booking",
      question: "How do I know if my booking is confirmed?",
      answer: "You'll receive a notification and email when your booking is confirmed. You can also check the status in your bookings page.",
    },
    {
      category: "Payment",
      question: "What payment methods do you accept?",
      answer: "We accept major credit cards, debit cards, and UPI payments. Payment integration is currently being enhanced.",
    },
    {
      category: "Payment",
      question: "Is my payment information secure?",
      answer: "Yes, all payment information is processed securely through PCI-compliant payment processors. We never store your full card details.",
    },
    {
      category: "Profile",
      question: "How do I update my profile?",
      answer: "Go to Settings from the navigation menu or dashboard. You can update your name, bio, location, skills, and avatar image.",
    },
    {
      category: "Profile",
      question: "Can I switch between client and artist roles?",
      answer: "Yes, you can set your user type to 'both' in your settings to act as both a client and an artist.",
    },
    {
      category: "Technical",
      question: "Which browsers are supported?",
      answer: "Oeeez works best on modern browsers including Chrome, Firefox, Safari, and Edge. Make sure your browser is up to date.",
    },
    {
      category: "Technical",
      question: "Is there a mobile app?",
      answer: "Currently, Oeeez is a web application optimized for mobile browsers. A native mobile app is in our roadmap.",
    },
  ]

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)))

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle contact form submission
    alert("Message sent! We'll get back to you soon.")
    setContactForm({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              How can we help you?
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Find answers to common questions or get in touch with our support team
            </p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Documentation</CardTitle>
                <CardDescription>Browse our comprehensive guides</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Community Forum</CardTitle>
                <CardDescription>Connect with other users</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit">
                  <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
                <CardDescription>Get help via email</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {filteredFAQs
                      .filter((faq) => faq.category === category)
                      .map((faq) => {
                        const globalIndex = faqs.indexOf(faq)
                        return (
                          <div
                            key={globalIndex}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <button
                              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              onClick={() =>
                                setExpandedFAQ(expandedFAQ === globalIndex ? null : globalIndex)
                              }
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {faq.question}
                              </span>
                              {expandedFAQ === globalIndex ? (
                                <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                            {expandedFAQ === globalIndex && (
                              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No FAQs found matching your search.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Still need help?</CardTitle>
              <CardDescription>Send us a message and we&apos;ll get back to you soon</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full md:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Other Ways to Reach Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium">Email</p>
                  <a 
                    href="mailto:support@artistly.com"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    support@artistly.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Available Monday-Friday, 9 AM - 6 PM IST
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
