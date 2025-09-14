import { ArtistCard } from "@/components/artist-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { artists } from "@/data/artists"
import { AnimatedCard } from "@/components/animated-card"

export default function ArtistsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative container mx-auto px-4">
          <AnimatedCard delay={0} animationType="fade-up" className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Amazing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 block">
                Artists
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Browse our curated collection of talented performers and find the perfect artist for your next event
            </p>
          </AnimatedCard>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16">
        {/* Enhanced Filters */}
        <AnimatedCard delay={200} animationType="fade-up" className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border-0">
            <div className="flex items-center gap-3 mb-6">
              <SlidersHorizontal className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Find Your Perfect Artist</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <Input
                  placeholder="Search artists..."
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </div>

              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 shadow-xl">
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="bollywood">Bollywood</SelectItem>
                  <SelectItem value="folk">Folk</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 shadow-xl">
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="jaipur">Jaipur</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 shadow-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AnimatedCard>

        {/* Results Header */}
        <AnimatedCard delay={400} animationType="fade-up" className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Featured Artists</h3>
              <p className="text-gray-600">Showing {artists.length} amazing performers</p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <Select>
                <SelectTrigger className="w-48 border-2 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Sort by Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AnimatedCard>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {artists.map((artist, index) => (
            <AnimatedCard key={artist.id} delay={600 + (index % 8) * 100} animationType="fade-up">
              <ArtistCard artist={artist} />
            </AnimatedCard>
          ))}
        </div>

        {/* Load More */}
        <AnimatedCard delay={1000} animationType="scale" className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Load More Artists
          </Button>
        </AnimatedCard>
      </div>
    </div>
  )
}
