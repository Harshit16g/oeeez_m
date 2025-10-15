"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/navbar"
import { Loading } from "@/components/loading"
import { Search, MapPin, Star, Clock, DollarSign, Eye } from "lucide-react"

// Mock data for services (will be replaced with real data from Supabase)
const mockServices = [
  {
    id: 1,
    title: "Professional Photography Session",
    slug: "professional-photography",
    short_description: "High-quality photography for events, portraits, and commercial projects",
    price_type: "hourly",
    price: 150,
    duration: 120,
    category: "Visual Arts",
    provider_name: "John Doe Photography",
    rating: 4.8,
    reviews_count: 45,
    location: "New York, NY",
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400",
    views_count: 234,
  },
  {
    id: 2,
    title: "Web Development & Design",
    slug: "web-development-design",
    short_description: "Custom website development with modern technologies",
    price_type: "project",
    price_min: 1000,
    price_max: 5000,
    duration: null,
    category: "Digital Services",
    provider_name: "TechStudio Inc",
    rating: 4.9,
    reviews_count: 78,
    location: "San Francisco, CA",
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400",
    views_count: 567,
  },
  {
    id: 3,
    title: "Live Music Performance",
    slug: "live-music-performance",
    short_description: "Professional live band for weddings, parties, and corporate events",
    price_type: "fixed",
    price: 2500,
    duration: 240,
    category: "Performing Arts",
    provider_name: "The Jazz Collective",
    rating: 4.7,
    reviews_count: 34,
    location: "Austin, TX",
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400",
    views_count: 189,
  },
  {
    id: 4,
    title: "Event Planning Services",
    slug: "event-planning",
    short_description: "Complete event planning and coordination for any occasion",
    price_type: "project",
    price_min: 500,
    price_max: 10000,
    duration: null,
    category: "Event Services",
    provider_name: "Perfect Events Co",
    rating: 4.9,
    reviews_count: 92,
    location: "Los Angeles, CA",
    is_featured: true,
    image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
    views_count: 423,
  },
  {
    id: 5,
    title: "Personal Training Sessions",
    slug: "personal-training",
    short_description: "One-on-one fitness training tailored to your goals",
    price_type: "hourly",
    price: 80,
    duration: 60,
    category: "Wellness & Fitness",
    provider_name: "FitPro Training",
    rating: 4.8,
    reviews_count: 56,
    location: "Miami, FL",
    is_featured: false,
    image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    views_count: 312,
  },
]

export default function ServicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [allServices, setAllServices] = useState(mockServices) // Canonical source
  const [services, setServices] = useState(mockServices) // Filtered results

  // Initialize services - in production, this would fetch from API
  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        // TODO: Replace with actual API call when backend is ready
        // const response = await fetch('/api/services')
        // const data = await response.json()
        // setAllServices(data)
        
        // For now, using mock data with simulated delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setAllServices(mockServices)
      } catch (error) {
        console.error('Error loading services:', error)
        // Keep mock data on error
        setAllServices(mockServices)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Filter services based on search and filters
  useEffect(() => {
    // Start from canonical loaded data
    let filtered = allServices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.short_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((service) => service.category === selectedCategory)
    }

    // Price filter
    if (priceFilter === "low") {
      filtered = filtered.filter((service) => {
        const price = service.price || service.price_min || 0
        return price < 100
      })
    } else if (priceFilter === "medium") {
      filtered = filtered.filter((service) => {
        const price = service.price || service.price_min || 0
        return price >= 100 && price < 1000
      })
    } else if (priceFilter === "high") {
      filtered = filtered.filter((service) => {
        const price = service.price || service.price_min || 0
        return price >= 1000
      })
    }

    setServices(filtered)
  }, [searchTerm, selectedCategory, priceFilter, allServices])

  const formatPrice = (service: typeof mockServices[0]) => {
    // For hourly pricing, show "/hr" suffix
    if (service.price && service.price_type === "hourly") {
      return `$${service.price}/hr`
    }
    // For other types with price, just show the price
    if (service.price) {
      return `$${service.price}`
    }
    // For project pricing with range, show min-max
    if (service.price_type === "project" && service.price_min && service.price_max) {
      return `$${service.price_min} - $${service.price_max}`
    }
    return "Contact for pricing"
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
    }
    return `${mins}m`
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Browse Services
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover professional services from verified providers across all categories
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="md:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Visual Arts">Visual Arts</SelectItem>
                      <SelectItem value="Digital Services">Digital Services</SelectItem>
                      <SelectItem value="Performing Arts">Performing Arts</SelectItem>
                      <SelectItem value="Event Services">Event Services</SelectItem>
                      <SelectItem value="Wellness & Fitness">Wellness & Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Filter */}
                <div>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="low">Under $100</SelectItem>
                      <SelectItem value="medium">$100 - $1,000</SelectItem>
                      <SelectItem value="high">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {services.length} service{services.length !== 1 ? "s" : ""}
            </p>
            {services.length === 0 && (
              <Button variant="outline" onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setPriceFilter("all")
              }}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No services found matching your criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Service Image */}
                  {service.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={service.image_url}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                      {service.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-500">
                          Featured
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{service.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {service.short_description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant="outline">{service.category}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{service.rating}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          ({service.reviews_count} reviews)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{service.location}</span>
                      </div>

                      {service.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(service.duration)}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Eye className="h-4 w-4" />
                        <span>{service.views_count} views</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="font-bold text-lg">{formatPrice(service)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => router.push(`/services/${service.slug}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
