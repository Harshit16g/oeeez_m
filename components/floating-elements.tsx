export function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full animate-float opacity-60"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400 rounded-full animate-float animation-delay-1000 opacity-60"></div>
      <div className="absolute bottom-40 left-20 w-8 h-8 bg-blue-400 rounded-full animate-float animation-delay-2000 opacity-60"></div>
      <div className="absolute bottom-20 right-40 w-5 h-5 bg-indigo-400 rounded-full animate-float animation-delay-4000 opacity-60"></div>

      {/* Floating squares */}
      <div className="absolute top-60 left-1/4 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-400 rotate-45 animate-float animation-delay-1000 opacity-50"></div>
      <div className="absolute bottom-60 right-1/4 w-4 h-4 bg-gradient-to-br from-blue-400 to-indigo-400 rotate-12 animate-float animation-delay-3000 opacity-50"></div>
    </div>
  )
}
