"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Search, TrendingUp, ArrowRight, Grid3x3 } from "lucide-react"
import { marketplaceCategories, getTrendingCategories, searchCategories, type Category } from "@/data/categories"

export default function CategoriesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(marketplaceCategories)

  const trendingCategories = getTrendingCategories()

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      setFilteredCategories(searchCategories(query))
    } else {
      setFilteredCategories(marketplaceCategories)
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to category-specific page (to be implemented)
    router.push(`/browse?category=${categoryId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Explore Marketplace Categories
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover services and products across multiple categories. From performing arts to home services,
              find exactly what you need.
            </p>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories, services, or products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 text-lg py-6"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trending Categories Section */}
          {!searchQuery && trendingCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Categories</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingCategories.slice(0, 6).map((category) => (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-purple-200 dark:border-purple-700"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-4xl">{category.icon}</div>
                        <Badge className="bg-purple-600 text-white">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mt-2">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.itemCount}+ providers
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          {category.searchCount?.toLocaleString()} searches
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Grid3x3 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchQuery ? "Search Results" : "All Categories"}
              </h2>
              {searchQuery && (
                <Badge variant="secondary">
                  {filteredCategories.length} {filteredCategories.length === 1 ? "result" : "results"}
                </Badge>
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No categories found matching &quot;{searchQuery}&quot;
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleSearch("")}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCategories.map((category) => (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-4xl">{category.icon}</div>
                        {category.trending && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Hot
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-2">{category.name}</CardTitle>
                      <CardDescription className="text-sm">{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {category.itemCount}+ providers
                          </span>
                        </div>
                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories.slice(0, 3).map((sub, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {sub}
                              </Badge>
                            ))}
                            {category.subcategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.subcategories.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between group"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCategoryClick(category.id)
                          }}
                        >
                          Browse Category
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <CardContent className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-4xl font-bold">
                    {marketplaceCategories.length}+
                  </p>
                  <p className="text-purple-100 mt-1">Categories</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    {marketplaceCategories.reduce((sum, cat) => sum + cat.itemCount, 0).toLocaleString()}+
                  </p>
                  <p className="text-purple-100 mt-1">Service Providers</p>
                </div>
                <div>
                  <p className="text-4xl font-bold">
                    {trendingCategories.length}
                  </p>
                  <p className="text-purple-100 mt-1">Trending Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
