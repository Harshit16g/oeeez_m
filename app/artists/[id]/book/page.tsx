import { notFound } from "next/navigation"
import { BookingForm } from "@/components/booking-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { MapPin, Music } from "lucide-react"
import { artists } from "@/data/artists"

interface BookingPageProps {
  params: {
    id: string
  }
}

export default function BookingPage({ params }: BookingPageProps) {
  const artist = artists.find((a) => a.id === Number.parseInt(params.id))

  if (!artist) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Booking</h1>
          <p className="text-gray-600">Fill out the form below to request a booking with {artist.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Artist Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Artist Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image src={artist.image || "/placeholder.svg"} alt={artist.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{artist.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{artist.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{artist.genre}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge
                      variant={artist.availability === "Available" ? "default" : "secondary"}
                      className={artist.availability === "Available" ? "bg-green-100 text-green-800" : ""}
                    >
                      {artist.availability}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Starting Price:</span>
                    <span className="font-semibold">₹{artist.price?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Booking Process</h4>
                  <ol className="text-xs text-gray-600 space-y-1">
                    <li>1. Submit booking request</li>
                    <li>2. Artist manager reviews</li>
                    <li>3. Receive quote & availability</li>
                    <li>4. Confirm booking & payment</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Request Form</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingForm artistId={artist.id} artistName={artist.name} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
