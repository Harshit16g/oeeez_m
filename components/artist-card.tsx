import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Music, ArrowRight } from "lucide-react"

interface Artist {
  id: number
  name: string
  image: string
  genre: string
  location: string
  availability: string
  rating: number
  reviews: number
  price: number
  bio: string
}

interface ArtistCardProps {
  artist: Artist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-[1.02] animate-fade-in-up">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 z-10"></div>

      <div className="relative h-56 overflow-hidden">
        <Image
          src={artist.image || "/placeholder.svg"}
          alt={artist.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        {/* Floating availability badge */}
        <div className="absolute top-4 right-4 z-20">
          <Badge
            variant={artist.availability === "Available" ? "default" : "secondary"}
            className={`${
              artist.availability === "Available"
                ? "bg-green-500 text-white shadow-lg animate-pulse-glow"
                : "bg-gray-500 text-white"
            } backdrop-blur-sm border-0`}
          >
            {artist.availability}
          </Badge>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Quick action button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <Button
            asChild
            size="sm"
            className="bg-white/90 text-purple-600 hover:bg-white transform scale-90 group-hover:scale-100 transition-transform duration-300"
          >
            <Link href={`/artists/${artist.id}`} className="flex items-center gap-2">
              View Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <CardContent className="relative p-6 z-20">
        <div className="mb-4">
          <h3 className="font-bold text-xl mb-2 group-hover:text-purple-600 transition-colors duration-300">
            {artist.name}
          </h3>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span>{artist.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Music className="h-4 w-4 text-purple-500" />
              <span>{artist.genre}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm">{artist.rating}</span>
              <span className="text-gray-500 text-sm">({artist.reviews} reviews)</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">{artist.bio}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ₹{artist.price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-xs">per event</span>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <Link href={`/artists/${artist.id}`}>Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
