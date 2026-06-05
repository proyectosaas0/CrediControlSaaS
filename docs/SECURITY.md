# Security Checklist

## Headers

✅ Content-Security-Policy — prevents XSS
✅ X-Content-Type-Options: nosniff — prevents MIME sniffing
✅ X-Frame-Options: DENY — prevents clickjacking
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: geolocation, camera, microphone disabled

## CORS

✅ Only allows whitelisted origins (localhost + prod domain)
✅ OPTIONS preflight properly handled
✅ Production enforces https://

## Authentication

✅ JWT with role claims (super_admin, admin, cobrador)
✅ Supabase Auth with email verification
✅ Service role key never exposed to client
✅ RLS enforced at database level

## Rate Limiting

✅ 5 login attempts per 15 minutes
✅ 100 API requests per minute per user
✅ 1000 global requests per hour per IP

## Environment Variables

✅ Sensitive keys in Vercel secrets (not in .env)
✅ .env.example never contains real secrets
✅ Service role key only used server-side

## Database Security

✅ Row-Level Security (RLS) policies enabled
✅ Users can only access their organization data
✅ Cobradores can only access assigned cronogramas
✅ All mutations go through RPC functions

## Secrets Management

- Never commit `.env` files
- Use Vercel environment variables for secrets
- Rotate secrets annually
- Audit access to production secrets

## Incident Response

1. **Detect**: Monitor Sentry for spike in errors
2. **Assess**: Check `/api/health` and `/api/ready`
3. **Mitigate**: Rate limit affected endpoint or rollback
4. **Restore**: `vercel rollback --prod`
5. **Post-mortem**: Review logs and update runbook
