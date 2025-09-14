import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Music, Users, Clock } from "lucide-react"
import { artists } from "@/data/artists"

interface ArtistProfilePageProps {
  params: {
    id: string
  }
}

export default function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const artist = artists.find((a) => a.id === Number.parseInt(params.id))

  if (!artist) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Artist Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden">
                <Image src={artist.image || "/placeholder.svg"} alt={artist.name} fill className="object-cover" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{artist.name}</h1>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{artist.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="h-4 w-4" />
                        <span>{artist.genre}</span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={artist.availability === "Available" ? "default" : "secondary"}
                    className={artist.availability === "Available" ? "bg-green-100 text-green-800" : ""}
                  >
                    {artist.availability}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{artist.rating}</span>
                    <span className="text-gray-500">({artist.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{artist.events}+ events</span>
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed">{artist.bio}</p>
              </div>
            </div>
          </div>

          {/* Performance Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.specialties?.map((specialty, index) => (
                      <Badge key={index} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Equipment</h4>
                  <ul className="text-gray-600 space-y-1">
                    {artist.equipment?.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Performance Duration</h4>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{artist.duration || "2-4 hours (flexible)"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((review) => (
                  <div key={review} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="font-medium">Event Planner {review}</span>
                      <span className="text-gray-500 text-sm">2 weeks ago</span>
                    </div>
                    <p className="text-gray-600">
                      Amazing performance! The crowd loved every minute. Professional, punctual, and incredibly
                      talented.
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Book This Artist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">₹{artist.price?.toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">Starting price per event</div>
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link href={`/artists/${artist.id}/book`}>Request Booking</Link>
                </Button>

                <div className="text-center">
                  <Button variant="outline" className="w-full">
                    Contact Manager
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Quick Facts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span>Within 2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Lead:</span>
                      <span>7 days minimum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel:</span>
                      <span>Within 100km</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
