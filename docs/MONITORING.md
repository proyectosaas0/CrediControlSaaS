# Monitoring & Logging

## Structured Logging

All logs use Pino with structured format. Logs are JSON-formatted in production for easy parsing and indexing.

```typescript
logger.debug({ userId, action }, "Payment registered");
logger.error({ error, context }, "Failed to process payment");
```

## Health Checks

### Liveness Check (`/api/health`)

Returns health status with database latency.

```bash
curl https://app.credicontrol.com/api/health
```

Response:
```json
{
  "ok": true,
  "database": "connected",
  "latency": 45
}
```

### Readiness Check (`/api/ready`)

Used by Vercel/K8s for deployment readiness.

```bash
curl https://app.credicontrol.com/api/ready
```

## Error Tracking (Sentry)

- 5xx errors from API captured automatically
- Session replays on errors (10% sample)
- Performance monitoring enabled

## Rate Limiting

- Global: 1000 requests/hour per IP
- Auth: 5 attempts/15min per IP
- API: 100 requests/minute per user

Returns 429 (Too Many Requests) when exceeded.

## Metrics

- Request count and latency per endpoint
- Error rate by status code
- Database query performance
- Authentication success/failure rates

## Alerting

Configure alerts in Sentry for:
- Error rate > 5% per 5 minutes
- Response time > 5s for /api/pagos
- Database connection errors
