# Database Configuration

## Connection Pooling

Supabase uses PgBouncer for connection pooling. This allows many concurrent web connections to share a limited pool of database connections.

### Default Limits

- Anon key: 5 concurrent connections (shared across all users)
- Service role: 10 concurrent connections
- Total pool: 100 connections

### For High Traffic Production Deployments

1. Go to Supabase Dashboard → Project Settings
2. Click Database → Connection pooling
3. Set mode to "Transaction" (recommended for web apps)
4. Increase max connections if needed:
   - Free tier: 100 connections
   - Pro tier: up to 200 connections
   - Teams: custom limits

### Transaction Mode (Recommended)

In transaction mode:
- Connection is returned to pool after each transaction
- Reduces connection churn
- Supports more concurrent users with fewer connections
- Perfect for serverless environments (Vercel, Netlify)

### Session Mode (Advanced)

Use session mode only if you need persistent connections:
- Connection held for entire session
- Higher memory usage
- Better for long-lived connections

## Query Optimization

### Indexed Columns

The following columns are indexed for fast filtering:

```sql
-- Tenant isolation (RLS)
CREATE INDEX idx_prestamos_organization_id ON prestamos(organization_id);
CREATE INDEX idx_clientes_organization_id ON clientes(organization_id);
CREATE INDEX idx_cronograma_pagos_organization_id ON cronograma_pagos(organization_id);
CREATE INDEX idx_pagos_organization_id ON pagos(organization_id);

-- Collector filtering
CREATE INDEX idx_cronograma_pagos_cobrador_id ON cronograma_pagos(cobrador_id);
CREATE INDEX idx_pagos_cobrador_id ON pagos(cobrador_id);

-- Time-based queries
CREATE INDEX idx_pagos_created_at ON pagos(created_at DESC);
```

### Connection Strings

- **Direct**: `postgres://user:pass@host:5432/db` (no pooling, for migrations only)
- **Pooled**: `postgres://user:pass@host:6543/db` (transaction mode, for apps)

Always use the pooled connection string for application code.

## Backups

Supabase automatically performs:
- Daily backups (retained 7 days)
- Weekly backups (retained 4 weeks)
- Monthly backups (retained 3 months)

### Manual Backup

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via psql
pg_dump postgres://user:pass@host:5432/db > backup.sql
```

### Restore from Backup

```bash
# Via psql
psql postgres://user:pass@host:5432/db < backup.sql
```

## Monitoring

### Disk Usage

Dashboard → Project Settings → Infrastructure

Alert if > 80% capacity.

### Connection Count

```sql
SELECT count(*) FROM pg_stat_activity;

-- By user
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;

-- Active queries
SELECT query, duration FROM pg_stat_activity WHERE state = 'active';
```

### Slow Queries

Enable slow query logging:

```sql
-- In Supabase dashboard, SQL Editor:
SET log_min_duration_statement = 1000; -- 1 second

-- Query slow log
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Performance Tips

1. **Use indexes wisely**: Index on `organization_id` and `cobrador_id` for RLS filtering
2. **Pagination**: Always paginate results, never fetch all rows
3. **Select specific columns**: Don't use `SELECT *`, specify columns needed
4. **Batch inserts**: Use multi-row insert instead of multiple single inserts
5. **Avoid N+1 queries**: Use `select()` with joins carefully

## Disaster Recovery

### RPO (Recovery Point Objective)
- Daily backups = 24-hour RPO

### RTO (Recovery Time Objective)
- Automated restore: 5-30 minutes depending on database size

### Procedure

1. Contact Supabase support or use dashboard
2. Select backup point in time
3. Supabase restores to new database
4. Update connection string to point to restored DB
5. Verify data integrity
6. Promote to production

See SECURITY.md for incident response runbook.
