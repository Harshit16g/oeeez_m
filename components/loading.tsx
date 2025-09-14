import { Music } from "lucide-react"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function Loading({ message = "Loading...", size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4">
          <div className={`${sizeClasses[size]} mx-auto animate-spin`}>
            <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="h-6 w-6 text-purple-600 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">{message}</p>
      </div>
    </div>
  )
}
