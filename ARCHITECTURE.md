# Architecture Documentation

## System Architecture

Artistly is built using a modern, scalable architecture with the following layers:

### Frontend Layer
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation

### Backend Layer
- **BaaS**: Supabase (PostgreSQL database + Authentication + Realtime + Storage)
- **API**: Next.js API Routes
- **Authentication**: Supabase Auth with JWT tokens

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Storage**: Supabase Storage for user avatars and media

## Data Flow

### Authentication Flow
```
User → Login Form → Supabase Auth → JWT Token → Client Storage → Protected Routes
```

### Data Fetching Flow
```
Component → Supabase Client → PostgreSQL → Row Level Security → Data → Component State
```

### Real-time Updates
```
Database Change → PostgreSQL Trigger → Supabase Realtime → WebSocket → Client Update
```

## Security Architecture

### Authentication
- Email/password with bcrypt hashing
- OAuth 2.0 for third-party providers (Google)
- JWT tokens for session management
- Refresh token rotation

### Authorization
- Row Level Security (RLS) policies in Supabase
- Role-based access control (RBAC)
- User-specific data isolation

### Data Protection
- HTTPS/TLS encryption in transit
- Encrypted at rest in Supabase
- Environment variables for secrets
- Input sanitization

## Component Architecture

### Component Hierarchy
```
App Layout (Root)
├── Navbar
├── Page Components
│   ├── Landing Page
│   ├── Artists Page
│   ├── Dashboard
│   ├── Settings
│   └── Auth Pages
├── Shared Components
│   ├── Cards
│   ├── Forms
│   ├── Modals
│   └── Notifications
└── Footer
```

### Context Providers
- `EnhancedAuthProvider`: Authentication and user profile
- `ThemeProvider`: Dark/light mode
- `ErrorBoundary`: Error handling

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│   auth.users│
└──────┬──────┘
       │
       │ (1:1)
       │
┌──────▼──────────┐      ┌──────────────┐
│     users       │      │ notifications│
│ (profiles)      │◄─────┤              │
└─────────────────┘ (1:N)└──────────────┘
       │
       │ (1:N)
       │
┌──────▼──────────┐
│    bookings     │
│   (future)      │
└─────────────────┘
```

### Key Tables

#### users
- Primary user profile data
- Skills, availability, rates
- Role (client/artist/both)

#### notifications
- User notifications
- Type-based categorization
- Read/unread status

## API Design

### REST Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

#### User Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update user profile
- `POST /api/profile/avatar` - Upload avatar

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Performance Optimizations

### Frontend
- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Lazy loading of components
- Memoization with React.memo and useMemo

### Backend
- Database query optimization
- Connection pooling
- Caching strategies (planned with Redis)

### CDN & Caching
- Static asset caching on Vercel Edge
- API route caching where appropriate
- Browser caching headers

## Scalability Considerations

### Current Scale
- Supports thousands of concurrent users
- Unlimited storage via Supabase
- Realtime connections: 500 concurrent (Supabase Pro)

### Future Scaling
- Horizontal scaling via serverless functions
- Database read replicas for read-heavy operations
- CDN for global content delivery
- Background job processing for heavy tasks

## Monitoring & Observability

### Metrics to Track
- Page load times
- API response times
- Error rates
- User engagement metrics
- Database query performance

### Tools (Planned)
- Vercel Analytics
- Supabase Dashboard metrics
- Error tracking (Sentry)
- Custom analytics events

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run development server
5. Make changes
6. Run tests
7. Submit PR

### CI/CD Pipeline
```
Git Push → GitHub → Vercel → Build → Test → Deploy → Production
```

### Deployment Strategy
- Automatic deployments from main branch
- Preview deployments for PRs
- Environment-specific configurations
- Database migrations via Supabase CLI

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | Next.js 14 | React framework with SSR/SSG |
| Language | TypeScript | Type-safe development |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | Radix UI | Accessible component primitives |
| State Management | React Context | Global state management |
| Backend | Supabase | BaaS with PostgreSQL |
| Authentication | Supabase Auth | User authentication |
| Real-time | Supabase Realtime | Live data updates |
| Storage | Supabase Storage | File storage |
| Hosting | Vercel | Serverless deployment |
| Database | PostgreSQL | Relational database |

## Future Architecture Enhancements

1. **Microservices**: Split into separate services (auth, bookings, payments)
2. **Message Queue**: Add RabbitMQ/Redis for async tasks
3. **Cache Layer**: Implement Redis for caching
4. **Search Engine**: Integrate Elasticsearch for advanced search
5. **CDN**: Dedicated CDN for media assets
6. **API Gateway**: Centralized API management
7. **Event Sourcing**: For audit trails and analytics
