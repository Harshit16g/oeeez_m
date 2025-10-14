import Link from "next/link"
import { Sparkles, Mail, Phone, Twitter, Linkedin, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-oeeez-black border-t border-oeeez-steel-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-black text-xl mb-4">
              <div className="w-8 h-8 bg-gradient-crimson rounded transform rotate-45"></div>
              <span className="text-gradient-crimson">Oeeez</span>
            </Link>
            <p className="text-oeeez-steel-400 mb-4 max-w-md leading-relaxed">
              Your premium marketplace connecting you with verified professionals across 15+ categories. 
              Quality, trust, and excellence in every interaction.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-oeeez-steel-400">
                <Mail className="h-4 w-4 text-oeeez-crimson" />
                hello@oeeez.online
              </div>
              <div className="flex items-center gap-2 text-sm text-oeeez-steel-400">
                <Phone className="h-4 w-4 text-oeeez-crimson" />
                +91 98765 43210
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categories" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/artists" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Providers
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-oeeez-steel-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-oeeez-steel-500 text-sm">
              &copy; 2024 Oeeez. All rights reserved. Built with excellence.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-oeeez-steel-400 hover:text-oeeez-crimson transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
