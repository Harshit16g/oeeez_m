# Oeeez Marketplace

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sl435abs-gmailcoms-projects/v0-create-webapp)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

## 🌟 oeeez

---

🌍 Overview

Oeeez.online is a modular multipurpose marketplace platform that connects buyers and sellers for products, services, or talent — all under one platform.
Initially designed for artist bookings, it’s now evolving into a complete commerce ecosystem with extensible domains, self-hosting options, and a growing community layer.


---

✨ Highlights

🏪 Multi-Category Marketplace — Supports services, gigs, physical products & digital assets

👤 Dual Roles — Buyer ↔ Provider switching built-in

🔒 Authentication — Supabase Auth with OAuth (Google)

🌗 Theming — Dynamic light/dark mode with Tailwind + Radix UI

💬 Realtime Features — Notifications, chat (planned), and live updates via Supabase Realtime

⚙️ Self-Hosting & Custom Domains — Bring-your-own domain for organizations and providers

📈 Dashboard System — Unified buyer/seller analytics dashboard

🧱 Scalable Architecture — Next.js 14 (App Router), TypeScript, Docker-ready



---

🏗️ Project Architecture

📘 For detailed technical architecture — see ARCHITECTURE.md
📦 Deployment details — see DEPLOYMENT.md
🧩 Contribution guide — see CONTRIBUTING.md
🪵 Change history — see CHANGELOG.md
📄 Project summary — see PROJECT_SUMMARY.md



🌐 Custom Domain / Self-Hosted Model

Oeeez supports self-hosted deployments with custom domains for organizations, artists, or shop owners.

🔧 Setup Steps

1. Fork or deploy your instance (Docker or Vercel)


2. Set NEXT_PUBLIC_SITE_URL in .env.local to your custom domain


3. Configure DNS → CNAME to oeeez.online


4. Register your org/shop domain within the admin dashboard (coming soon)



Example:

mybrand.oeeez.online

eventsbyaria.com (mapped via custom CNAME)



---

📚 Quick Start

# Clone
git clone https://github.com/Harshit16g/Artistlydotcom.git
cd Artistlydotcom

# Install
npm install

# Run locally
npm run dev

Then open → http://localhost:3000


---

🧩 Tech Stack

Layer	Technology

Frontend	Next.js 14, TypeScript, Tailwind, Radix UI
Backend	Supabase (PostgreSQL + Auth + Realtime)
Deployment	Vercel / Docker Compose
Auth	Supabase Auth (Email & Google)
Data	Row Level Security + Realtime API
UI/UX	TailwindCSS, Framer Motion
Hosting	Vercel (default) / Self-hosted



---

🧱 Database Schema

👉 See full SQL in ARCHITECTURE.md

Key tables:

users — Profiles, skills, and identity

bookings — Transactions between clients & providers

notifications — Real-time system/user notifications

reviews — Ratings & feedback (upcoming)

shops — Custom domain/shop configurations (planned)



---

🧠 Community Hub (Planned)

We’re building an interactive community space inside Oeeez for:

💬 Discussions between providers and clients

🧾 Product/service references

⭐ Reviews & transparent feedback

💸 Direct negotiation and deal history

🧍 Verified community profiles


This will integrate forums + in-app messaging and category-based interaction zones.


---

🗺️ Roadmap (Summarized)

Phase	Goals

✅ Core Setup	Base marketplace, auth, Supabase integration
🚧 Expansion	Profile mgmt, booking flow, marketplace categories
🔜 Interaction	Reviews, chat, community hub, ratings
🏪 Custom Domains	Org-based marketplace subdomains
📊 Admin/Analytics	Global admin panel, analytics, moderation tools


[ROADMAP.md →](./ROADMAP.md)
---

🧰 Development Scripts

npm run dev       # Start development server
npm run build     # Build production version
npm run start     # Start production
npm run lint      # Lint the code


---

🧑‍💻 Contributing

Please check CONTRIBUTING.md

Fork → Feature branch → PR

Write clear commit messages

Follow existing code style

Update docs if necessary



---

🪪 License

Licensed under MIT


---

👤 Author

Harshit Lodhi (Harshit16g)

GitHub

Oeeez.online



---

🔗 Useful Links

🌍 Live App → https://oeeez.online

📘 Docs → Full Documentation

🧭 Issues / Feature Requests → GitHub Issues

🚢 Deploy on Vercel → Deploy

🧩 Architecture → ARCHITECTURE.md

🧱 Deployment Guide → DEPLOYMENT.md



---

Built with ❤️ by the Oeeez Team — Empowering creators, businesses, and communities.

