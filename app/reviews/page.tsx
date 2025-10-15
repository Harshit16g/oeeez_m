"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/enhanced-auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { Star, ThumbsUp, MessageCircle, Calendar } from "lucide-react"

interface Review {
  id: string
  reviewer_name: string
  reviewer_avatar: string
  reviewee_name: string
  rating: number
  title: string
  comment: string
  service_name: string
  booking_date: string
  created_at: string
  helpful_count: number
  is_verified: boolean
  detailed_ratings?: {
    quality?: number
    communication?: number
    professionalism?: number
    value?: number
  }
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "1",
    reviewer_name: "Sarah Johnson",
    reviewer_avatar: "",
    reviewee_name: "John Doe Photography",
    rating: 5,
    title: "Amazing photography session!",
    comment: "John did an incredible job capturing our wedding day. The photos are stunning and we could not be happier with the results. Highly professional and creative!",
    service_name: "Wedding Photography",
    booking_date: "2024-09-15",
    created_at: "2024-09-20",
    helpful_count: 12,
    is_verified: true,
    detailed_ratings: {
      quality: 5,
      communication: 5,
      professionalism: 5,
      value: 5,
    },
  },
  {
    id: "2",
    reviewer_name: "Michael Chen",
    reviewer_avatar: "",
    reviewee_name: "TechStudio Inc",
    rating: 4,
    title: "Great web development service",
    comment: "The team delivered a high-quality website on time. Communication was excellent throughout the project. Would definitely work with them again!",
    service_name: "E-commerce Website",
    booking_date: "2024-08-10",
    created_at: "2024-09-05",
    helpful_count: 8,
    is_verified: true,
    detailed_ratings: {
      quality: 5,
      communication: 4,
      professionalism: 4,
      value: 4,
    },
  },
  {
    id: "3",
    reviewer_name: "Emily Rodriguez",
    reviewer_avatar: "",
    reviewee_name: "Perfect Events Co",
    rating: 5,
    title: "Flawless event planning",
    comment: "Our corporate event was executed perfectly. Every detail was taken care of, and the team was incredibly responsive. Highly recommend!",
    service_name: "Corporate Event Planning",
    booking_date: "2024-09-25",
    created_at: "2024-09-28",
    helpful_count: 15,
    is_verified: true,
    detailed_ratings: {
      quality: 5,
      communication: 5,
      professionalism: 5,
      value: 4,
    },
  },
]

export default function ReviewsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [reviews] = useState<Review[]>(mockReviews)
  const [filter, setFilter] = useState<"all" | "given" | "received">("all")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading || !user || !profile) {
    return <Loading />
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reviews</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View reviews you have given and received
              </p>
            </div>
            <Button onClick={() => router.push("/bookings")}>View Bookings</Button>
          </div>

          {/* Filter Tabs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                >
                  All Reviews
                </Button>
                <Button
                  variant={filter === "given" ? "default" : "outline"}
                  onClick={() => setFilter("given")}
                >
                  Reviews Given
                </Button>
                <Button
                  variant={filter === "received" ? "default" : "outline"}
                  onClick={() => setFilter("received")}
                >
                  Reviews Received
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Rating</CardDescription>
                <CardTitle className="text-3xl">4.8</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  {renderStars(5)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Reviews</CardDescription>
                <CardTitle className="text-3xl">{reviews.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All verified purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Helpful Votes</CardDescription>
                <CardTitle className="text-3xl">
                  {reviews.reduce((sum, review) => sum + review.helpful_count, 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From community members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.reviewer_avatar} alt={review.reviewer_name} />
                        <AvatarFallback>
                          {review.reviewer_name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{review.reviewer_name}</h3>
                          {review.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          reviewed {review.reviewee_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium">{review.rating}.0</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                    <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Badge variant="outline">{review.service_name}</Badge>
                    <span>•</span>
                    <span>Booking date: {formatDate(review.booking_date)}</span>
                  </div>

                  {review.detailed_ratings && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      {Object.entries(review.detailed_ratings).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key}
                          </p>
                          <div className="flex gap-1">
                            {renderStars(value || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful ({review.helpful_count})
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {reviews.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No reviews found for this filter.
                </p>
                <Button onClick={() => setFilter("all")}>Show All Reviews</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
