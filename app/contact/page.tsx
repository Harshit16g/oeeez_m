"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/enhanced-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { 
  MessageCircle, 
  Shield, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Mail,
  Phone,
  Building
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    providerName: searchParams.get("provider") || "",
    category: searchParams.get("category") || "",
    subject: "",
    message: "",
    contactMethod: "platform", // platform, email, phone
    urgency: "normal", // low, normal, high
  })

  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/contact")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return <Loading />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      // Simulate sending message - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Message sent successfully! 📧",
        description: "The provider will receive your message and respond within 24 hours.",
      })

      // Reset form
      setFormData({
        providerName: "",
        category: "",
        subject: "",
        message: "",
        contactMethod: "platform",
        urgency: "normal",
      })

      // Redirect to messages page after short delay
      setTimeout(() => {
        router.push("/notifications")
      }, 2000)
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Contact & Connect
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Send a secure message to service providers and get responses quickly
            </p>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Secure Platform</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      All messages are encrypted and private
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Fast Response</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Average response time: 4 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Verified Providers</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      All providers are verified and rated
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Send a Message</CardTitle>
              <CardDescription>
                Fill out the form below to contact a service provider. They&apos;ll receive your message and respond directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Provider Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="providerName">
                      Provider Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="providerName"
                      placeholder="e.g., John&apos;s Photography"
                      value={formData.providerName}
                      onChange={(e) => handleInputChange("providerName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Service Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="category"
                      placeholder="e.g., Photography"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your project, requirements, timeline, and budget..."
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Be specific about your requirements to get accurate quotes
                  </p>
                </div>

                {/* Urgency */}
                <div className="space-y-2">
                  <Label>Request Urgency</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.urgency === "low" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("urgency", "low")}
                    >
                      Low
                    </Button>
                    <Button
                      type="button"
                      variant={formData.urgency === "normal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("urgency", "normal")}
                    >
                      Normal
                    </Button>
                    <Button
                      type="button"
                      variant={formData.urgency === "high" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("urgency", "high")}
                    >
                      High
                    </Button>
                  </div>
                </div>

                {/* Contact Method Preference */}
                <div className="space-y-2">
                  <Label>Preferred Response Method</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.contactMethod === "platform" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("contactMethod", "platform")}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Platform
                    </Button>
                    <Button
                      type="button"
                      variant={formData.contactMethod === "email" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("contactMethod", "email")}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={formData.contactMethod === "phone" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInputChange("contactMethod", "phone")}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </Button>
                  </div>
                </div>

                {/* Your Contact Info */}
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          Your Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-800 dark:text-blue-300">
                              {profile?.full_name || "Not set"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-800 dark:text-blue-300">{user.email}</span>
                          </div>
                          {profile?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-blue-800 dark:text-blue-300">{profile.phone}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                          This information will be shared with the provider
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    disabled={sending}
                  >
                    {sending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Tips for Better Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Be specific about your requirements and timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Include your budget range to get accurate quotes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Provide context about your project or event</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Ask any specific questions you have upfront</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Be professional and respectful in your communication</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
