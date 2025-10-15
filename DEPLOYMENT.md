# Deployment Guide

This guide covers deploying Artistly to various platforms and environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Other Platforms](#deploying-to-other-platforms)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Git Repository**: Code pushed to GitHub, GitLab, or Bitbucket
3. **Node.js 18+**: For local builds and testing
4. **Domain Name** (optional): For custom domain setup

## Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Optional Variables

```env
# Analytics
GOOGLE_SITE_VERIFICATION=your-verification-code

# Caching (if using Redis)
REDIS_URL=redis://localhost:6379

# Email (if using custom SMTP)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
```

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deploying to Vercel

Vercel is the recommended platform for deploying Next.js applications.

### Method 1: Deploy via Vercel Dashboard

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your Git provider

2. **Import Repository**
   - Click "Add New" → "Project"
   - Select your repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - In the "Environment Variables" section, add all required variables
   - Click "Deploy"

4. **Wait for Deployment**
   - Vercel builds and deploys your app
   - You'll get a URL like `https://your-app.vercel.app`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Setting Up Custom Domain

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Update your domain's DNS settings as instructed
5. Wait for DNS propagation (usually a few minutes to 24 hours)

### Environment-Specific Deployments

Vercel supports multiple environments:

- **Production**: Main branch deployments
- **Preview**: Pull request deployments
- **Development**: Local development

Set different environment variables for each:

1. Go to **Settings** → **Environment Variables**
2. Select the environment (Production/Preview/Development)
3. Add variables specific to that environment

## Deploying to Other Platforms

### Netlify

1. **Connect Repository**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**
   - Add all required env vars in Netlify dashboard
   - Go to Site settings → Build & deploy → Environment

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

### Railway

1. **Create New Project**
   - Connect your GitHub repository

2. **Add Environment Variables**
   - Add all required variables in Railway dashboard

3. **Deploy**
   - Railway automatically detects Next.js and deploys

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:

```bash
# Build Docker image
docker build -t artistly .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e NEXT_PUBLIC_SITE_URL=your-site-url \
  artistly
```

## Database Setup

### Initial Setup

1. **Create Tables**
   
   Run these SQL commands in your Supabase SQL editor:

   ```sql
   -- Users table (extends auth.users)
   create table public.users (
     id uuid references auth.users on delete cascade primary key,
     email text unique not null,
     full_name text,
     avatar_url text,
     user_type text check (user_type in ('client', 'artist', 'both')) default 'client',
     bio text,
     location text,
     phone text,
     website text,
     skills text[],
     hourly_rate numeric,
     availability text check (availability in ('available', 'busy', 'unavailable')) default 'available',
     is_onboarded boolean default false,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );

   -- Enable RLS
   alter table public.users enable row level security;

   -- RLS Policies
   create policy "Users can view their own profile"
     on public.users for select
     using (auth.uid() = id);

   create policy "Users can update their own profile"
     on public.users for update
     using (auth.uid() = id);

   -- Notifications table
   create table public.notifications (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references public.users(id) on delete cascade not null,
     type text check (type in ('booking', 'payment', 'review', 'system', 'reminder')) not null,
     title text not null,
     message text not null,
     read boolean default false,
     action_url text,
     created_at timestamptz default now()
   );

   -- Enable RLS
   alter table public.notifications enable row level security;

   -- RLS Policies
   create policy "Users can view their own notifications"
     on public.notifications for select
     using (auth.uid() = user_id);

   create policy "Users can update their own notifications"
     on public.notifications for update
     using (auth.uid() = user_id);

   create policy "Users can delete their own notifications"
     on public.notifications for delete
     using (auth.uid() = user_id);
   ```

2. **Enable Realtime** (for notifications)
   
   In Supabase Dashboard:
   - Go to **Database** → **Replication**
   - Enable replication for the `notifications` table

3. **Set Up Storage** (for avatars)
   
   In Supabase Dashboard:
   - Go to **Storage**
   - Create a bucket named `avatars`
   - Set it to public
   - Add RLS policies:
     ```sql
     -- Users can upload their own avatar
     create policy "Users can upload their own avatar"
       on storage.objects for insert
       with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
     
     -- Users can update their own avatar
     create policy "Users can update their own avatar"
       on storage.objects for update
       using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
     
     -- Everyone can view avatars
     create policy "Anyone can view avatars"
       on storage.objects for select
       using (bucket_id = 'avatars');
     ```

### Database Migrations

For future updates, use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create a migration
supabase migration new add_bookings_table

# Apply migrations
supabase db push
```

## Post-Deployment

### Verification Checklist

- [ ] Application loads correctly
- [ ] Can access all pages (/, /login, /signup, /artists, etc.)
- [ ] Authentication works (login, signup, logout)
- [ ] Email verification flow works
- [ ] User can update profile
- [ ] Avatar upload works
- [ ] Notifications appear
- [ ] Dark mode toggle works
- [ ] All environment variables are set
- [ ] Custom domain (if configured) resolves correctly
- [ ] HTTPS is enabled

### Monitoring

Set up monitoring to track:

1. **Application Performance**
   - Use Vercel Analytics (built-in)
   - Or integrate Google Analytics

2. **Error Tracking**
   - Integrate Sentry for error tracking:
     ```bash
     npm install @sentry/nextjs
     ```

3. **Uptime Monitoring**
   - Use services like UptimeRobot or Pingdom
   - Monitor critical endpoints

### Security

1. **Environment Variables**
   - Never commit `.env` files
   - Rotate keys periodically
   - Use different keys for different environments

2. **Supabase Security**
   - Enable RLS (Row Level Security) on all tables
   - Review and test RLS policies
   - Enable email confirmation
   - Set up proper CORS policies

3. **Content Security Policy**
   - Configure CSP headers in `next.config.js`

## Troubleshooting

### Build Failures

**Problem**: Build fails with module not found errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Environment Variable Issues

**Problem**: Environment variables not working in production

**Solution**:
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables
- Check Vercel logs for any missing variable errors

### Supabase Connection Issues

**Problem**: Can't connect to Supabase

**Solution**:
- Verify URL and anon key are correct
- Check if Supabase project is active
- Ensure network allows connections to Supabase
- Check Supabase status page for outages

### Build Timeout

**Problem**: Build times out on Vercel

**Solution**:
- Optimize dependencies
- Remove unused packages
- Use smaller image assets
- Consider upgrading Vercel plan for longer build times

### Database Migration Errors

**Problem**: Migration fails to apply

**Solution**:
```bash
# Check current migration status
supabase db remote commit

# Reset and reapply
supabase db reset
supabase db push
```

## Performance Optimization

### For Production

1. **Enable Caching**
   - Use Redis for caching (optional)
   - Configure CDN caching headers

2. **Optimize Images**
   - Use Next.js Image component
   - Compress images before uploading

3. **Code Splitting**
   - Use dynamic imports for large components
   - Lazy load non-critical components

4. **Database Optimization**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Enable query caching in Supabase

## Support

For deployment issues:
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Vercel Docs](https://vercel.com/docs)
- Open an issue on [GitHub](https://github.com/Harshit16g/Artistlydotcom/issues)

---

**Last Updated**: 2024-10-14
