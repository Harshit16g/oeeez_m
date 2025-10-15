
# 🗺️ Oeeez Marketplace — Roadmap

A structured roadmap for the evolution of **Oeeez.online** — a modular, scalable, and real-time marketplace platform built with Next.js, Supabase, Redis, and SpacetimeDB.

---

## 🚀 Phase 1 — Foundation ✅ *(Completed)*

- [x] Next.js + TypeScript core setup  
- [x] Supabase integration (Auth + Realtime)  
- [x] Email + Google authentication  
- [x] User onboarding and profile creation  
- [x] Tailwind + Radix UI integration  
- [x] Responsive dark/light mode  
- [x] Docker + Vercel deployment  
- [x] Initial notification system  

---

## ⚙️ Phase 2 — Marketplace Expansion & Realtime Foundation 🚧 *(In Progress)*

- [ ] Redis caching layer for session & query optimization  
- [ ] SpacetimeDB integration for real-time marketplace data  
- [ ] Profile management and settings page  
- [ ] Service listing and categorization  
- [ ] Booking/order management  
- [ ] Review & rating foundation  
- [ ] Provider public pages  
- [ ] Optimized dashboard design  

---

<details>
<summary>🧩 Phase 3 — Community & Collaboration Layer (Upcoming)</summary>

- [ ] SpacetimeDB-based live community feed  
- [ ] Commenting, reactions, and discussions  
- [ ] Chat system (buyer ↔ provider)  
- [ ] Notification and activity center  
- [ ] Report/dispute management  
- [ ] Moderation tools for admins  
</details>

---

<details>
<summary>💰 Phase 4 — Monetization & Payments</summary>

- [ ] Razorpay / Stripe integration  
- [ ] Provider subscription tiers  
- [ ] Revenue analytics dashboard  
- [ ] Payouts & tax/GST handling  
</details>

---

<details>
<summary>🏪 Phase 5 — Self-Hosting & Scaling</summary>

- [ ] Multi-tenant subdomains (`shopname.oeeez.online`)  
- [ ] Organization dashboards  
- [ ] Admin analytics and control center  
- [ ] Redis cluster for distributed caching  
- [ ] Auto-provisioned domains via API  
</details>

---

<details>
<summary>📊 Phase 6 — Analytics, Insights & Governance</summary>

- [ ] Platform-wide data insights  
- [ ] Fraud and abuse detection  
- [ ] Sentiment analysis using SpacetimeDB streams  
- [ ] Trust and reputation scoring  
- [ ] Transparency dashboard  
</details>

---

## 🧠 Technical Notes

### Redis Caching Strategy
- Used for session storage, user data, and marketplace query caching  
- Supports both **local dev** and **Redis Cloud (Upstash / self-hosted)**  
- Integrated via `@upstash/redis` or `ioredis`  

### SpacetimeDB Integration
- Enables **multi-user live sessions** and **marketplace collaboration**  
- Stores ephemeral data for real-time updates  
- Event-driven sync between Supabase → SpacetimeDB → Client  
- Ideal for feeds, chats, and presence tracking  

---

## 🧩 Contribution Roadmap

Want to contribute?  
Check [`CONTRIBUTING.md`](./CONTRIBUTING.md) to pick a **phase milestone**.

---

**Last updated:** October 2025  
**Maintainer:** [@Harshit16g](https://github.com/Harshit16g)