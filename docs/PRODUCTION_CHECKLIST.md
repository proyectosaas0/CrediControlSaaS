# Production Readiness Checklist

## Pre-Deployment (48 Hours Before)

- [ ] All tests passing: `npm test`
- [ ] No ESLint warnings: `npm run lint`
- [ ] TypeScript strict mode: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] Database migrations tested in staging
- [ ] Environment variables set in Vercel
- [ ] Sentry project created and DSN configured
- [ ] Upstash Redis provisioned
- [ ] API documentation reviewed (docs/API.md)

## Infrastructure

- [ ] Supabase project connection pooling enabled (Transaction mode)
- [ ] Supabase backups configured (daily, weekly, monthly)
- [ ] Vercel project linked to repo
- [ ] GitHub secrets configured (SUPABASE_SERVICE_ROLE_KEY)
- [ ] Custom domain configured in Vercel
- [ ] SSL certificate auto-renewed by Vercel
- [ ] Health endpoint responds: `/api/health`
- [ ] Readiness endpoint responds: `/api/ready`
- [ ] Database disk usage < 80%

## Security

- [ ] CORS only allows production domain (not localhost)
- [ ] Security headers present (CSP, X-Frame-Options, etc.)
- [ ] Rate limiting active (5 auth, 100 API, 1000 global)
- [ ] No console.logs in production code
- [ ] Secrets never in `.env` (only in Vercel environment)
- [ ] RLS policies verified with test suite
- [ ] Service role key only accessible server-side
- [ ] JWT claims populated with role (super_admin, admin, cobrador)

## Testing

- [ ] Unit tests pass: `npm test`
- [ ] Integration tests pass: `npm test -- integration`
- [ ] RLS isolation test pass
- [ ] Load test: 100 concurrent users (use Artillery or similar)
  ```bash
  artillery quick --count 100 --num 10 https://app.credicontrol.com/api/pagos
  ```
- [ ] Payment flow: Create → register → verify
- [ ] Error handling: Missing fields → 422
- [ ] Rate limiting: 6th auth attempt → 429
- [ ] Database recovery: Restore from backup and verify

## Monitoring

- [ ] Sentry project created and DSN in Vercel
- [ ] Email alerts configured (error spike, 5xx errors)
- [ ] Uptime monitoring configured (StatusPage.io or similar)
- [ ] Database metrics in Supabase dashboard
- [ ] Vercel Analytics enabled
- [ ] Log aggregation configured (optional: Datadog, CloudWatch)

## Documentation

- [ ] docs/DEPLOYMENT.md completed
- [ ] docs/MONITORING.md completed
- [ ] docs/SECURITY.md completed
- [ ] docs/API.md completed
- [ ] docs/DATABASE.md completed
- [ ] Runbook created (incident response steps)
- [ ] Rollback procedure tested

## Sign-Off

**Date**: [YYYY-MM-DD]

**Decision**: GO / NO-GO

**Reason**: [Brief explanation]

**Approved By**: [PM/Tech Lead Name]

**Technical Lead Sign-off**: [Engineer Name]

---

## Go Criteria

Only proceed to production if ALL of the following are true:

1. ✅ All tests pass locally and in CI/CD
2. ✅ No unresolved security issues
3. ✅ All environment variables configured
4. ✅ Health and readiness endpoints respond
5. ✅ Database backups tested
6. ✅ Incident response runbook prepared
7. ✅ Team notified of deployment time

## No-Go Triggers

Stop and investigate if:

- Tests fail
- Security vulnerabilities found
- Load test shows > 5s p99 latency
- RLS policies test fails
- Database disk usage > 90%
- Rate limiting not working
- Secrets exposed in code
