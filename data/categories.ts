export interface Category {
  id: string
  name: string
  description: string
  icon: string
  itemCount: number
  trending: boolean
  searchCount?: number
  subcategories?: string[]
}

export const marketplaceCategories: Category[] = [
  {
    id: "performing-arts",
    name: "Performing Arts",
    description: "Musicians, DJs, bands, dancers, and live performers",
    icon: "🎭",
    itemCount: 150,
    trending: true,
    searchCount: 1250,
    subcategories: ["Music", "Dance", "Theater", "Comedy", "DJ Services"],
  },
  {
    id: "visual-arts",
    name: "Visual Arts",
    description: "Photographers, videographers, painters, and graphic designers",
    icon: "🎨",
    itemCount: 230,
    trending: true,
    searchCount: 980,
    subcategories: ["Photography", "Videography", "Painting", "Illustration", "Graphic Design"],
  },
  {
    id: "event-services",
    name: "Event Services",
    description: "Event planners, decorators, caterers, and coordinators",
    icon: "🎉",
    itemCount: 180,
    trending: true,
    searchCount: 1450,
    subcategories: ["Event Planning", "Catering", "Decoration", "Venue", "Coordination"],
  },
  {
    id: "digital-services",
    name: "Digital Services",
    description: "Web developers, app developers, digital marketers, and SEO experts",
    icon: "💻",
    itemCount: 320,
    trending: true,
    searchCount: 2100,
    subcategories: ["Web Development", "App Development", "Digital Marketing", "SEO", "Social Media"],
  },
  {
    id: "writing-content",
    name: "Writing & Content",
    description: "Content writers, copywriters, editors, and translators",
    icon: "✍️",
    itemCount: 190,
    trending: false,
    searchCount: 750,
    subcategories: ["Content Writing", "Copywriting", "Editing", "Translation", "Technical Writing"],
  },
  {
    id: "consulting",
    name: "Consulting",
    description: "Business consultants, career coaches, and advisors",
    icon: "💼",
    itemCount: 145,
    trending: false,
    searchCount: 620,
    subcategories: ["Business Consulting", "Career Coaching", "Financial Advisory", "Legal Consulting"],
  },
  {
    id: "home-services",
    name: "Home Services",
    description: "Cleaning, repairs, maintenance, and home improvement",
    icon: "🏠",
    itemCount: 280,
    trending: true,
    searchCount: 1680,
    subcategories: ["Cleaning", "Plumbing", "Electrical", "Carpentry", "Painting"],
  },
  {
    id: "wellness-fitness",
    name: "Wellness & Fitness",
    description: "Personal trainers, yoga instructors, nutritionists, and therapists",
    icon: "🧘",
    itemCount: 210,
    trending: true,
    searchCount: 1320,
    subcategories: ["Personal Training", "Yoga", "Nutrition", "Massage", "Mental Health"],
  },
  {
    id: "education-tutoring",
    name: "Education & Tutoring",
    description: "Teachers, tutors, online courses, and skill trainers",
    icon: "📚",
    itemCount: 165,
    trending: false,
    searchCount: 890,
    subcategories: ["Academic Tutoring", "Music Lessons", "Language Learning", "Test Prep", "Skill Development"],
  },
  {
    id: "beauty-fashion",
    name: "Beauty & Fashion",
    description: "Makeup artists, hairstylists, fashion designers, and stylists",
    icon: "💄",
    itemCount: 175,
    trending: true,
    searchCount: 1120,
    subcategories: ["Makeup", "Hair Styling", "Fashion Design", "Personal Styling", "Bridal Services"],
  },
  {
    id: "automotive",
    name: "Automotive",
    description: "Car repair, detailing, and automotive services",
    icon: "🚗",
    itemCount: 95,
    trending: false,
    searchCount: 540,
    subcategories: ["Car Repair", "Detailing", "Maintenance", "Towing", "Car Rental"],
  },
  {
    id: "pet-services",
    name: "Pet Services",
    description: "Pet grooming, training, sitting, and veterinary care",
    icon: "🐾",
    itemCount: 120,
    trending: false,
    searchCount: 710,
    subcategories: ["Pet Grooming", "Pet Training", "Pet Sitting", "Veterinary", "Pet Photography"],
  },
  {
    id: "legal-finance",
    name: "Legal & Finance",
    description: "Lawyers, accountants, tax consultants, and financial planners",
    icon: "⚖️",
    itemCount: 85,
    trending: false,
    searchCount: 480,
    subcategories: ["Legal Services", "Accounting", "Tax Consulting", "Financial Planning", "Insurance"],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Real estate agents, property management, and home staging",
    icon: "🏘️",
    itemCount: 110,
    trending: false,
    searchCount: 650,
    subcategories: ["Real Estate Agent", "Property Management", "Home Staging", "Real Estate Photography"],
  },
  {
    id: "crafts-handmade",
    name: "Crafts & Handmade",
    description: "Artisans, crafters, and makers of handmade products",
    icon: "🎁",
    itemCount: 200,
    trending: false,
    searchCount: 820,
    subcategories: ["Jewelry Making", "Woodworking", "Textiles", "Pottery", "Custom Gifts"],
  },
]

export function getTrendingCategories(): Category[] {
  return marketplaceCategories
    .filter((cat) => cat.trending)
    .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0))
}

export function getCategoryById(id: string): Category | undefined {
  return marketplaceCategories.find((cat) => cat.id === id)
}

export function searchCategories(query: string): Category[] {
  const lowerQuery = query.toLowerCase()
  return marketplaceCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery) ||
      cat.subcategories?.some((sub) => sub.toLowerCase().includes(lowerQuery))
  )
}
