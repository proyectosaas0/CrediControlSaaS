# API Documentation

## Base URL

`https://app.credicontrol.com/api`

## Authentication

All endpoints except `/auth/*` require a valid JWT bearer token.

```bash
curl -H "Authorization: Bearer <JWT>" https://app.credicontrol.com/api/prestamos
```

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Entrada invalida",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## Error Codes

- `UNAUTHENTICATED` (401) — No token or invalid token
- `FORBIDDEN` (403) — Insufficient permissions
- `NOT_FOUND` (404) — Resource doesn't exist
- `VALIDATION_ERROR` (422) — Invalid input
- `RATE_LIMITED` (429) — Too many requests
- `INTERNAL_ERROR` (500) — Server error

## Success Response Format

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "count": 100
  }
}
```

## Endpoints

### Health

- `GET /health` — Detailed health status
- `GET /ready` — Readiness check

### Loans (Prestamos)

- `GET /prestamos` — List loans (paginated)
- `GET /prestamos?prestamoId=<id>` — Filter by ID
- `POST /prestamos` — Create loan (admin only)
- `GET /prestamos/{id}` — Get loan details

### Payments (Pagos)

- `GET /pagos` — List payments (paginated)
- `GET /pagos?prestamoId=<id>` — Filter by loan
- `POST /pagos` — Register payment

Request:
```json
{
  "cronogramaPagoId": "uuid",
  "monto": 50000,
  "medioPago": "efectivo|nequi|transferencia",
  "tipo": "cuota|parcial|vencida|mora|liquidacion",
  "lat": 4.7110,
  "lng": -74.0087,
  "nota": "optional note"
}
```

### Clients (Clientes)

- `GET /clientes` — List clients
- `POST /clientes` — Create client (admin only)

### Reports (Reportes)

- `GET /reportes/resumen` — Summary report
- `GET /reportes/cartera-riesgo` — Risk portfolio
- `GET /reportes/cobradores` — Collector performance

## Pagination

Query parameters:
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

Response includes:
```json
{
  "meta": {
    "page": 1,
    "pageSize": 20,
    "count": 150
  }
}
```

## Rate Limiting

Headers:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 95
- `X-RateLimit-Reset`: 1234567890

## Common Patterns

### List with filtering

```bash
curl -H "Authorization: Bearer <JWT>" \
  "https://app.credicontrol.com/api/pagos?prestamoId=abc&page=1&pageSize=50"
```

### Create with validation

```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"cronogramaPagoId":"uuid","monto":50000,"medioPago":"efectivo","tipo":"cuota"}' \
  https://app.credicontrol.com/api/pagos
```

### Retry on rate limit

Wait until `X-RateLimit-Reset` timestamp before retrying.
