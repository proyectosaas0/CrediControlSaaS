# Deployment Guide

## Prerequisites

- Node.js 20+
- Vercel account
- Supabase project
- Upstash Redis (for rate limiting)
- Sentry account (optional)

## Environment Variables

Set these in Vercel project settings:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (for backend operations)

**Optional:**
- `UPSTASH_REDIS_REST_URL` — Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry DSN

## Deployment Steps

1. Push to `main` branch
2. GitHub Actions runs tests, lint, build
3. If all pass, manually trigger `.github/workflows/deploy.yml`
4. Vercel deploys to production
5. Check `/api/health` to verify deployment

## Rollback

```bash
vercel rollback --prod
```

## Database Migrations

Migrations run automatically on deployment via Supabase.

## Monitoring

- Health: `https://app.credicontrol.com/api/health`
- Readiness: `https://app.credicontrol.com/api/ready`
- Logs: Sentry dashboard
- Metrics: Vercel Analytics
