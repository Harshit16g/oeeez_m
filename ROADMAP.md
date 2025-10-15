
# 🗺️ Oeeez Marketplace — Roadmap

A structured roadmap for the evolution of **Oeeez.online** — a modular, scalable, and real-time marketplace platform built with Next.js, Supabase, Redis, SpacetimeDB, and modern infrastructure integrations.

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

## ⚙️ Phase 2 — Marketplace Expansion & Realtime Foundation ✅ *(Completed)*

- [x] Redis caching layer for session & query optimization *(Upstash configured)*
- [x] Profile management and settings page  
- [x] Service listing and categorization  
- [x] Booking/order management  
- [x] Review & rating foundation  
- [x] Provider public pages  
- [x] Optimized dashboard design  
- [x] Configurable Redis SCAN batch size
- [x] Dynamic loading states and error handling

**Phase 2 Integration Notes:**
- ✅ **Redis (Upstash)** — Primary caching layer with ioredis v5
- ✅ **Environment-based configuration** — All services configured via env vars
- 🔄 **SpacetimeDB** — Deferred to Phase 3 for real-time features

---

## 🧩 Phase 3 — Community & Collaboration Layer *(Planned)*

### Core Features
- [ ] SpacetimeDB-based live community feed  
- [ ] Commenting, reactions, and discussions  
- [ ] Chat system (buyer ↔ provider)  
- [ ] Notification and activity center  
- [ ] Report/dispute management  
- [ ] Moderation tools for admins

### Integration Layer (Phase 3)
- [ ] **Neon Postgres** — Structured relational data, testing, and analytics
- [ ] **Mux** — Video/audio delivery for provider portfolios
- [ ] **Grok AI (X.AI)** — Intelligent recommendations and contextual assistance
- [ ] **Inngest** — Event-driven workflows and background job processing
- [ ] **SpacetimeDB** — Real-time data synchronization and live updates

**Technical Stack:**
- Neon Postgres for primary database (testing + production)
- Mux for media streaming and portfolio showcases
- Grok 3 Mini (X.AI) for AI-powered features
- Inngest for asynchronous event processing
- SpacetimeDB for real-time collaboration

---

<details>
<summary>💰 Phase 4 — Monetization & Payments</summary>

- [ ] Razorpay / Stripe integration  
- [ ] Provider subscription tiers  
- [ ] Revenue analytics dashboard  
- [ ] Payouts & tax/GST handling  
- [ ] Transaction history and reporting
- [ ] Payment gateway abstraction layer

**Integration Notes:**
- Payment processing via Razorpay/Stripe
- Financial analytics with Neon Postgres
- Event-driven payment notifications via Inngest
</details>

---

<details>
<summary>🏪 Phase 5 — Self-Hosting & Scaling</summary>

- [ ] Multi-tenant subdomains (`shopname.oeeez.online`)  
- [ ] Organization dashboards  
- [ ] Admin analytics and control center  
- [ ] Redis cluster for distributed caching  
- [ ] Auto-provisioned domains via API  
- [ ] Environment orchestration for multi-tenant deployments

**Integration Notes:**
- Redis (Upstash) cluster for multi-region caching
- Neon Postgres multi-tenant architecture
- Automated provisioning via Vercel API
- Load balancing and CDN optimization
</details>

---

<details>
<summary>📊 Phase 6 — Analytics, Insights & Governance</summary>

- [ ] Platform-wide data insights  
- [ ] Fraud and abuse detection  
- [ ] Sentiment analysis using SpacetimeDB streams  
- [ ] Trust and reputation scoring  
- [ ] Transparency dashboard  
- [ ] AI-driven recommendations and insights

**Integration Notes:**
- Grok AI for intelligent analytics and fraud detection
- SpacetimeDB for real-time sentiment analysis
- Neon Postgres for analytics data warehousing
- Inngest for scheduled analytics pipelines
- OpenTelemetry for observability (future)
</details>

---

## 🧠 Technical Notes

### Technology Stack

**Core Infrastructure:**
- **Frontend:** Next.js 14.2.33, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Supabase (Auth + Database), Neon Postgres (Testing)
- **Caching:** Redis via ioredis v5 (Upstash production)
- **Real-time:** SpacetimeDB (Phase 3)
- **Deployment:** Vercel, Docker (local development)

### Integration Services

#### Redis / Upstash (Phase 2 ✅)
- **Purpose:** Session storage, marketplace data caching, query optimization
- **Implementation:** ioredis v5 with cursor-based SCAN for cache invalidation
- **Configuration:** `REDIS_URL`, `KV_*` environment variables
- **Features:** Configurable batch size, graceful degradation, pipeline operations

#### Neon Postgres (Phase 3)
- **Purpose:** Primary relational database, analytics, testing environments
- **Implementation:** Supabase-compatible schema with connection pooling
- **Configuration:** `DATABASE_URL`, `POSTGRES_*` environment variables
- **Features:** Serverless, auto-scaling, branching for testing

#### Mux (Phase 3)
- **Purpose:** Video/audio streaming for provider portfolios
- **Configuration:** `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- **Use Cases:** Portfolio videos, service demonstrations, testimonials

#### Grok AI - X.AI (Phase 3+)
- **Purpose:** AI-powered recommendations, contextual assistance
- **Model:** Grok 3 Mini for inference and responses
- **Configuration:** `XAI_API_KEY`
- **Use Cases:** Smart search, automated moderation, customer support

#### Inngest (Phase 3+)
- **Purpose:** Event-driven workflows, background job processing
- **Configuration:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- **Use Cases:** Async notifications, scheduled tasks, workflow automation

#### SpacetimeDB (Phase 3)
- **Purpose:** Real-time collaboration, live feeds, presence tracking
- **Implementation:** Event-driven sync between Supabase → SpacetimeDB → Client
- **Use Cases:** Live community feeds, real-time chat, collaborative features

### Environment Configuration

All services are configured via environment variables — **no secrets in repository**.

See `.env.example` for complete variable reference organized by integration layer:
- Redis / Upstash (Phase 2)
- Neon Postgres (Phase 3)
- Neon Auth
- X.AI / Grok
- Mux
- Inngest

---

## 🧩 Contribution Roadmap

Want to contribute?  
Check [`CONTRIBUTING.md`](./CONTRIBUTING.md) to pick a **phase milestone**.

### Current Focus
- **Phase 2:** ✅ Complete — Redis integration finalized
- **Phase 3:** 🚧 Next — Real-time features and media integration

---

**Last updated:** October 2025  
**Maintainer:** [@Harshit16g](https://github.com/Harshit16g)