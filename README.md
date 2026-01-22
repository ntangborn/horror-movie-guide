# Ghost Guide

Horror & Sci-Fi TV Guide - Discover where to stream your favorite horror movies and sci-fi thrillers.

**Live at [ghostguide.co](https://ghostguide.co)**

## Features

- Browse 500+ curated horror and sci-fi titles
- Real-time streaming availability from multiple services
- Filter by genre, decade, runtime, and streaming service
- User watchlists and personalized lists
- Admin panel for content management
- OMDB/TMDB integration for movie metadata

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **APIs**: OMDB, TMDB, Watchmode

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase project

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-safe) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-only) |
| `OMDB_API_KEY` | OMDB API key for movie metadata |
| `TMDB_API_KEY` | TMDB API key for posters/metadata |
| `WATCHMODE_API_KEY` | Watchmode API key for streaming data |

Optional:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Production URL for OG images |

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment to Vercel

### 1. Connect Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" > "Project"
4. Import your repository

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OMDB_API_KEY`
- `TMDB_API_KEY`
- `WATCHMODE_API_KEY`

**Recommended:**
- `NEXT_PUBLIC_SITE_URL` - Set to your production domain (e.g., `https://your-app.vercel.app`)

### 3. Deploy

Click "Deploy" and Vercel will:
- Detect Next.js framework automatically
- Build and deploy your app
- Provide a production URL

### 4. Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test Supabase connection (browse page should load movies)
- [ ] Test API routes (`/api/browse`, `/api/user/watchlist`)
- [ ] Verify OG images work (share a link on social media)
- [ ] Check that all streaming availability data loads
- [ ] Test admin functionality (if applicable)

### 5. Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_SITE_URL` to match
4. Configure DNS as instructed

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── browse/            # Browse page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── contexts/             # React contexts
├── lib/                  # Utilities and data fetching
└── types/                # TypeScript types
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/browse` | GET | Fetch paginated movie cards |
| `/api/user/watchlist` | GET | Get user's watchlist |
| `/api/track` | POST | Track user events |

## Performance

The app is optimized for performance:

- **Images**: Blur placeholders, responsive sizing
- **Code Splitting**: Lazy-loaded modals and components
- **Caching**: API responses cached with stale-while-revalidate
- **Database**: Queries select only needed columns

## Security

- Row Level Security (RLS) enabled on Supabase
- Service key only used server-side
- Security headers configured in `vercel.json`
- No secrets exposed to client

## License

Private project - All rights reserved.
