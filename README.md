# Artistly - Multipurpose Marketplace Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sl435abs-gmailcoms-projects/v0-create-webapp)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

## 🌟 Overview

Artistly is a comprehensive multipurpose marketplace platform that connects buyers and sellers across various categories. Originally designed for booking performing artists, it's now evolving into a full-featured marketplace supporting anything from services to products.

### Key Features

- 🎭 **Multi-Category Marketplace**: Support for artists, services, products, and more
- 👥 **Dual User Roles**: Both buyer and seller profiles with role switching
- 🔐 **Secure Authentication**: Email/password and OAuth (Google) authentication via Supabase
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🌙 **Dark Mode**: Complete dark mode support with system preference detection
- 💬 **Real-time Notifications**: Live notification system using Supabase Realtime
- 📊 **Profile Management**: Comprehensive user profiles with avatar upload
- 🎨 **Modern UI**: Built with Tailwind CSS and Radix UI components
- ⚡ **Performance**: Optimized with Next.js 14 App Router

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harshit16g/Artistlydotcom.git
   cd Artistlydotcom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   
   Get your Supabase credentials from: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

4. **Set up the database**
   
   Run the SQL migrations in your Supabase project (see [Database Schema](#database-schema))

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

### Project Structure

```
Artistlydotcom/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── artists/           # Artist browsing and booking
│   ├── auth/              # Authentication callbacks and verification
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── settings/          # User settings
│   ├── signup/            # Registration page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI primitives (buttons, cards, etc.)
│   ├── navbar.tsx        # Navigation bar
│   ├── footer.tsx        # Footer
│   ├── onboarding-flow.tsx  # User onboarding
│   └── ...               # Other components
├── lib/                   # Utility functions and contexts
│   ├── supabase/         # Supabase client configurations
│   ├── auth-context.tsx  # Authentication context
│   ├── enhanced-auth-context.tsx  # Enhanced auth with profiles
│   └── utils.ts          # Utility functions
├── data/                  # Static data
│   └── artists.ts        # Sample artist data
├── public/               # Static assets
├── styles/               # Additional styles
└── hooks/                # Custom React hooks
```

### Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

#### users
Stores user profile information.
```sql
create table users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  user_type text check (user_type in ('client', 'artist', 'both')),
  bio text,
  location text,
  phone text,
  website text,
  skills text[],
  hourly_rate numeric,
  availability text check (availability in ('available', 'busy', 'unavailable')),
  is_onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### notifications
Stores user notifications.
```sql
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('booking', 'payment', 'review', 'system', 'reminder')),
  title text not null,
  message text not null,
  read boolean default false,
  action_url text,
  created_at timestamptz default now()
);
```

#### bookings (planned)
Stores booking/order information.

### User Flows

#### 1. New User Registration Flow
1. User visits landing page
2. Clicks "Sign Up" button
3. Enters email and password or uses Google OAuth
4. Receives verification email
5. Clicks verification link
6. Completes onboarding flow (name, role, bio, avatar)
7. Redirected to marketplace/artists page

#### 2. Booking Flow
1. User browses artists/services
2. Clicks on an artist/service card
3. Views detailed profile
4. Clicks "Book Now"
5. Fills out booking form (event details, date, etc.)
6. Submits booking request
7. Receives confirmation notification

#### 3. Profile Management Flow
1. User navigates to Dashboard
2. Clicks "Edit Profile" or goes to Settings
3. Updates profile information (name, bio, skills, etc.)
4. Uploads avatar image
5. Saves changes
6. Profile updated across the platform

### Authentication

The app uses Supabase Auth with:
- Email/password authentication
- Email verification required
- Google OAuth
- Secure session management
- Protected routes with middleware

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Custom themes**: Light and dark mode support
- **Animations**: Framer Motion for smooth transitions

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Building
npm run build        # Create production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

### Code Style

- TypeScript for type safety
- ESLint with Next.js recommended config
- Functional components with hooks
- Proper error handling with try-catch
- Consistent naming conventions

### Best Practices

1. **Components**: Create reusable, single-responsibility components
2. **State Management**: Use React Context for global state
3. **Data Fetching**: Use Supabase client with proper error handling
4. **Type Safety**: Define TypeScript interfaces for all data structures
5. **Accessibility**: Follow WCAG 2.1 guidelines
6. **Performance**: Optimize images, lazy load components, minimize bundle size

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS) policies
- Input validation on client and server
- XSS protection with React
- CSRF protection with Supabase Auth
- Secure password requirements

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.example`

4. **Deploy**
   - Vercel automatically deploys on push to main
   - Get your production URL

### Environment Variables for Production

Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (your production URL)

## 🗺️ Roadmap

### Phase 1: Core Fixes ✅
- [x] Fix all lint errors
- [x] Remove external font dependencies
- [x] Fix build issues
- [x] Add comprehensive documentation

### Phase 2: Missing Pages (In Progress)
- [ ] Profile management page (separate from settings)
- [ ] Bookings/orders management page
- [ ] Marketplace categories page
- [ ] Payment/transaction history page
- [ ] Messages/chat page
- [ ] Notifications full page
- [ ] Help/support page
- [ ] Terms and privacy pages

### Phase 3: Multipurpose Marketplace
- [ ] Support multiple item categories
- [ ] Generic item cards (not just artists)
- [ ] Advanced search and filtering
- [ ] Category management
- [ ] Seller dashboard
- [ ] Buyer dashboard

### Phase 4: Enhanced Features
- [ ] Real-time chat system
- [ ] Payment integration (Stripe/Razorpay)
- [ ] Review and rating system
- [ ] Advanced notifications
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Social media sharing
- [ ] Favorites/wishlist

### Phase 5: Analytics & Admin
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] User management
- [ ] Content moderation
- [ ] Performance monitoring

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Harshit16g** - [GitHub Profile](https://github.com/Harshit16g)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Vercel for hosting
- Radix UI for accessible components
- Tailwind CSS for styling utilities
- All contributors and users of Artistly

## 📞 Support

For support, email support@artistly.com or join our Slack channel.

## 🔗 Links

- **Live Demo**: [https://artistlydotcom.vercel.app](https://artistlydotcom.vercel.app)
- **Documentation**: [Link to full docs]
- **API Reference**: [Link to API docs]
- **Issue Tracker**: [GitHub Issues](https://github.com/Harshit16g/Artistlydotcom/issues)

---

**Built with ❤️ using Next.js, TypeScript, and Supabase**

