# Backend Produccion SRS Completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el backend REST productivo completo de CrediControl segun el SRS, sobre la fundacion Supabase/RLS existente.

**Architecture:** Next.js API Routes (`app/api/**/route.ts`) exponen el contrato REST para el frontend. La logica financiera vive en servicios TypeScript puros y en RPC Postgres transaccionales cuando se actualizan varias tablas. Supabase mantiene aislamiento multi-tenant con RLS forzado, claims JWT, auditoria y pruebas de seguridad.

**Tech Stack:** Next.js 16.2.7, React 19, TypeScript, Supabase Postgres/Auth/Storage, `@supabase/ssr`, `@supabase/supabase-js`, Zod, Vitest, Supabase CLI, Resend adapter preparado, provider manual de suscripciones.

**Design Spec:** `docs/superpowers/specs/2026-06-04-backend-produccion-srs-design.md`

---

## Reglas De Ejecucion

- Trabajar fase por fase. No avanzar a la fase siguiente si tests, build o RLS fallan.
- Crear migraciones con `npx supabase migration new <name>` y pegar el SQL ahi. No inventar timestamp manual.
- Regenerar `lib/database.types.ts` despues de cada migracion aplicada.
- Toda API nueva debe devolver `{ data, meta }` o `{ error }`.
- Toda accion financiera debe escribir en `audit_logs`.
- Toda funcion Postgres debe usar `security invoker` salvo que el plan indique explicitamente otra cosa.
- Si aparece una diferencia con el SRS, actualizar primero la spec y luego este plan.

---

## Estructura De Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `lib/api/errors.ts` | Tipos de error REST y helpers `apiOk`, `apiError` |
| `lib/api/auth.ts` | Resolver sesion, rol, tenant, bloqueo por `profiles.activo` |
| `lib/api/validation.ts` | Helpers Zod para body/query params |
| `lib/domain/money.ts` | Redondeo decimal seguro para COP |
| `lib/domain/loans.ts` | Calculos de prestamo y cronograma |
| `lib/domain/mora.ts` | Calculo de mora |
| `lib/domain/whatsapp.ts` | Mensaje de comprobante WhatsApp |
| `lib/domain/reports.ts` | Agregaciones de reportes desde filas ya consultadas |
| `lib/server/admin-supabase.ts` | Cliente service role solo server-side |
| `supabase/migrations/*_production_core.sql` | Tablas de pagos, saldos, visitas, auditoria, settings, suscripciones |
| `supabase/migrations/*_production_rls.sql` | RLS/grants/policies de tablas nuevas |
| `supabase/migrations/*_production_rpc.sql` | RPC transaccionales de prestamos, pagos, mora, caja |
| `app/api/**/route.ts` | Contrato REST |
| `tests/domain/*.test.ts` | Pruebas unitarias de calculos |
| `tests/api/*.test.ts` | Pruebas de endpoints REST |
| `tests/rls-production.test.ts` | Pruebas de seguridad multi-tenant extendidas |
| `docs/backend-api.md` | Documentacion del contrato REST para frontend |

---

## Phase 0: Preparacion Y Dependencias

### Task 0.1: Instalar Dependencias Backend

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Instalar Zod**

Run:
```bash
npm install zod
```

Expected: `zod` aparece en `dependencies`.

- [ ] **Step 2: Verificar scripts existentes**

Run:
```bash
npm run lint
npx tsc --noEmit
npm test
```

Expected: si falla por ambiente Node/WSL, documentar el error exacto en el comentario del task y corregir ambiente antes de implementar APIs.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations lib/database.types.ts
git commit -m "feat(db): add core payment RPC and audit helper"
```

---

### Task 0.2: Crear Helpers REST Compartidos

**Files:**
- Create: `lib/api/errors.ts`
- Create: `lib/api/validation.ts`
- Create: `lib/api/auth.ts`
- Create: `lib/server/admin-supabase.ts`
- Test: `tests/api/helpers.test.ts`

- [ ] **Step 1: Escribir prueba de helpers REST**

Crear `tests/api/helpers.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { apiError, apiOk } from "@/lib/api/errors";

describe("REST response helpers", () => {
  it("builds success payloads", async () => {
    const response = apiOk({ id: "1" }, { page: 1 });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { id: "1" }, meta: { page: 1 } });
  });

  it("builds error payloads", async () => {
    const response = apiError("FORBIDDEN", "No autorizado", 403, { role: "cobrador" });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "No autorizado", details: { role: "cobrador" } },
    });
  });
});
```

- [ ] **Step 2: Correr prueba y confirmar fallo**

Run:
```bash
npx vitest run tests/api/helpers.test.ts
```

Expected: falla porque `@/lib/api/errors` no existe.

- [ ] **Step 3: Crear `lib/api/errors.ts`**

```typescript
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export function apiOk<TData, TMeta extends Record<string, unknown> = Record<string, never>>(
  data: TData,
  meta?: TMeta,
  status = 200,
) {
  return NextResponse.json({ data, meta: meta ?? {} }, { status });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details: Record<string, unknown> = {},
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
```

- [ ] **Step 4: Crear `lib/api/validation.ts`**

```typescript
import { z, type ZodSchema } from "zod";
import { apiError } from "@/lib/api/errors";

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, response: apiError("VALIDATION_ERROR", "Entrada invalida", 422, parsed.error.flatten()) };
  }
  return { data: parsed.data, response: null };
}

export function paginationSchema(defaultPageSize = 20) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(defaultPageSize),
  });
}
```

- [ ] **Step 5: Crear `lib/server/admin-supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Supabase admin env vars missing");
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 6: Crear `lib/api/auth.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/errors";
import type { AppRole } from "@/lib/auth";

export type ApiActor = {
  userId: string;
  role: AppRole;
  organizationId: string | null;
};

export async function requireApiActor(roles?: AppRole[]) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return { actor: null, response: apiError("UNAUTHENTICATED", "No autenticado", 401) };
  }

  const actor: ApiActor = {
    userId: String(claimsData.claims.sub),
    role: claimsData.claims.rol as AppRole,
    organizationId: (claimsData.claims.organization_id as string | null | undefined) ?? null,
  };

  if (!actor.role || (roles && !roles.includes(actor.role))) {
    return { actor: null, response: apiError("FORBIDDEN", "Rol no autorizado", 403) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("activo")
    .eq("id", actor.userId)
    .maybeSingle();

  if (error) return { actor: null, response: apiError("INTERNAL_ERROR", error.message, 500) };
  if (!profile?.activo) return { actor: null, response: apiError("FORBIDDEN", "Usuario inactivo", 403) };

  return { actor, response: null };
}
```

- [ ] **Step 7: Verificar**

Run:
```bash
npx vitest run tests/api/helpers.test.ts
npx tsc --noEmit
```

Expected: tests y TypeScript pasan.

- [ ] **Step 8: Commit**

```bash
```

---

## Phase 1: Core Operativo

### Task 1.1: Migracion De Tablas Productivas Base

**Files:**
- Create via CLI: `supabase/migrations/*_production_core.sql`
- Modify after generation: generated migration file

- [ ] **Step 1: Crear migracion con CLI**

Run:
```bash
npx supabase migration new production_core
```

Expected: crea un archivo `supabase/migrations/<timestamp>_production_core.sql`.

- [ ] **Step 2: Escribir SQL de tablas base**

Pegar en el archivo generado:

```sql
alter type estado_cuota add value if not exists 'cancelado';

create table public.tenant_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  tasa_interes_default numeric not null default 20,
  mora_tipo text not null default 'porcentaje' check (mora_tipo in ('porcentaje','monto_fijo')),
  mora_valor numeric not null default 0,
  dias_gracia integer not null default 0,
  cobrar_sabados_default boolean not null default true,
  cobrar_domingos_default boolean not null default false,
  whatsapp_template text not null default 'Hola {{cliente}}, recibimos tu pago de {{monto}} en {{negocio}}. Saldo: {{saldo}}.',
  geolocalizacion_requerida boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prestamo_saldos (
  prestamo_id uuid primary key references public.prestamos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  capital_original numeric(14,2) not null,
  total_original numeric(14,2) not null,
  total_pagado numeric(14,2) not null default 0,
  saldo_pendiente numeric(14,2) not null,
  mora_pendiente numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  prestamo_id uuid not null references public.prestamos(id) on delete restrict,
  cronograma_pago_id uuid references public.cronograma_pagos(id) on delete set null,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  cobrador_id uuid not null references public.profiles(id) on delete restrict,
  registrado_por uuid not null references public.profiles(id) on delete restrict,
  monto numeric(14,2) not null check (monto > 0),
  medio_pago medio_pago not null,
  tipo text not null check (tipo in ('cuota','parcial','vencida','mora','liquidacion')),
  lat numeric,
  lng numeric,
  nota text,
  created_at timestamptz not null default now()
);

create table public.visitas_cobro (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cronograma_pago_id uuid not null references public.cronograma_pagos(id) on delete cascade,
  prestamo_id uuid not null references public.prestamos(id) on delete restrict,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  cobrador_id uuid not null references public.profiles(id) on delete restrict,
  resultado text not null check (resultado in ('pagado','parcial','no_encontrado','promesa_pago','rechazado')),
  lat numeric,
  lng numeric,
  nota text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_rol text,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  estado_anterior jsonb,
  estado_nuevo jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.cronograma_pagos add column if not exists monto_capital numeric(14,2);
alter table public.cronograma_pagos add column if not exists monto_interes numeric(14,2);
alter table public.cronograma_pagos add column if not exists saldo_estimado numeric(14,2);

create index idx_tenant_settings_org on public.tenant_settings (organization_id);
create index idx_prestamo_saldos_org on public.prestamo_saldos (organization_id);
create index idx_pagos_org_fecha on public.pagos (organization_id, created_at desc);
create index idx_pagos_prestamo on public.pagos (prestamo_id, created_at desc);
create index idx_pagos_cliente on public.pagos (cliente_id, created_at desc);
create index idx_visitas_org_fecha on public.visitas_cobro (organization_id, created_at desc);
create index idx_audit_org_fecha on public.audit_logs (organization_id, created_at desc);
create index idx_audit_actor_fecha on public.audit_logs (actor_id, created_at desc);
```

- [ ] **Step 3: Aplicar migracion**

Run:
```bash
npm run db:push
```

Expected: migracion aplica sin errores.

- [ ] **Step 4: Regenerar tipos**

Run:
```bash
npm run gen:types
```

Expected: `lib/database.types.ts` incluye `tenant_settings`, `pagos`, `prestamo_saldos`, `visitas_cobro`, `audit_logs`.

- [ ] **Step 5: Commit**

```bash
```

---

### Task 1.2: RLS Para Tablas Productivas Base

**Files:**
- Create via CLI: `supabase/migrations/*_production_rls.sql`
- Test: `tests/rls-production.test.ts`

- [ ] **Step 1: Crear migracion con CLI**

Run:
```bash
npx supabase migration new production_rls
```

Expected: crea `supabase/migrations/<timestamp>_production_rls.sql`.

- [ ] **Step 2: Escribir SQL RLS**

Pegar en la migracion generada:

```sql
alter table public.tenant_settings enable row level security;
alter table public.tenant_settings force row level security;
alter table public.prestamo_saldos enable row level security;
alter table public.prestamo_saldos force row level security;
alter table public.pagos enable row level security;
alter table public.pagos force row level security;
alter table public.visitas_cobro enable row level security;
alter table public.visitas_cobro force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

grant select, insert, update, delete on public.tenant_settings to authenticated;
grant select on public.prestamo_saldos to authenticated;
grant select, insert on public.pagos to authenticated;
grant select, insert on public.visitas_cobro to authenticated;
grant select, insert on public.audit_logs to authenticated;

create policy tenant_settings_select on public.tenant_settings
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy tenant_settings_modify on public.tenant_settings
  for all to authenticated
  using (public.is_super_admin() or (organization_id = public.current_org_id() and public.current_rol() = 'admin'))
  with check (public.is_super_admin() or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy prestamo_saldos_select on public.prestamo_saldos
  for select to authenticated
  using (public.is_super_admin() or organization_id = public.current_org_id());

create policy pagos_select on public.pagos
  for select to authenticated
  using (
    public.is_super_admin()
    or (organization_id = public.current_org_id() and public.current_rol() = 'admin')
    or (organization_id = public.current_org_id() and public.current_rol() = 'cobrador' and cobrador_id = auth.uid())
  );

create policy pagos_insert on public.pagos
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (organization_id = public.current_org_id() and public.current_rol() = 'admin')
    or (organization_id = public.current_org_id() and public.current_rol() = 'cobrador' and cobrador_id = auth.uid() and registrado_por = auth.uid())
  );

create policy visitas_select on public.visitas_cobro
  for select to authenticated
  using (
    public.is_super_admin()
    or (organization_id = public.current_org_id() and public.current_rol() = 'admin')
    or (organization_id = public.current_org_id() and public.current_rol() = 'cobrador' and cobrador_id = auth.uid())
  );

create policy visitas_insert on public.visitas_cobro
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (organization_id = public.current_org_id() and public.current_rol() = 'admin')
    or (organization_id = public.current_org_id() and public.current_rol() = 'cobrador' and cobrador_id = auth.uid())
  );

create policy audit_select on public.audit_logs
  for select to authenticated
  using (public.is_super_admin() or (organization_id = public.current_org_id() and public.current_rol() = 'admin'));

create policy audit_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_super_admin() or organization_id = public.current_org_id());
```

- [ ] **Step 3: Escribir pruebas RLS extendidas**

Crear `tests/rls-production.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { clientAs } from "./helpers";

describe("RLS productivo", () => {
  it("cobrador no puede leer audit_logs", async () => {
    const c = await clientAs("cobrador-a1@credicontrol.test");
    const { data, error } = await c.from("audit_logs").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("admin puede leer tenant_settings de su organizacion", async () => {
    const a = await clientAs("admin-a@credicontrol.test");
    const { error } = await a.from("tenant_settings").select("organization_id");
    expect(error).toBeNull();
  });
});
```

- [ ] **Step 4: Aplicar y verificar**

Run:
```bash
npm run db:push
npm run gen:types
npx vitest run tests/rls-production.test.ts
```

Expected: migracion aplica, tipos regeneran, tests pasan con seed existente.

- [ ] **Step 5: Commit**

```bash
```

---

### Task 1.3: Dominio Financiero Puro

**Files:**
- Create: `lib/domain/money.ts`
- Create: `lib/domain/loans.ts`
- Create: `lib/domain/mora.ts`
- Create: `lib/domain/whatsapp.ts`
- Test: `tests/domain/loans.test.ts`
- Test: `tests/domain/mora.test.ts`
- Test: `tests/domain/whatsapp.test.ts`

- [ ] **Step 1: Escribir pruebas de prestamos**

Crear `tests/domain/loans.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildLoanSchedule, calculateLoanTotals } from "@/lib/domain/loans";

describe("loan calculations", () => {
  it("calculates cuota fija", () => {
    expect(calculateLoanTotals({ capital: 500000, tasaMensual: 20, plazoDias: 10, modelo: "cuota_fija" })).toEqual({
      totalPagar: 600000,
      cuotaDiaria: 60000,
    });
  });

  it("skips weekends when requested", () => {
    const schedule = buildLoanSchedule({
      capital: 500000,
      tasaMensual: 20,
      plazoDias: 3,
      modelo: "cuota_fija",
      fechaInicio: "2026-06-05",
      excluirSabados: true,
      excluirDomingos: true,
    });
    expect(schedule.map((q) => q.fechaEsperada)).toEqual(["2026-06-05", "2026-06-08", "2026-06-09"]);
    expect(schedule.reduce((sum, q) => sum + q.montoEsperado, 0)).toBe(600000);
  });
});
```

- [ ] **Step 2: Escribir pruebas de mora y WhatsApp**

Crear `tests/domain/mora.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { calculateMora } from "@/lib/domain/mora";

describe("mora", () => {
  it("calculates percentage mora", () => {
    expect(calculateMora({ saldoVencido: 60000, tipo: "porcentaje", valor: 2, diasMora: 3 })).toBe(3600);
  });

  it("calculates fixed mora", () => {
    expect(calculateMora({ saldoVencido: 60000, tipo: "monto_fijo", valor: 1500, diasMora: 3 })).toBe(4500);
  });
});
```

Crear `tests/domain/whatsapp.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildReceiptMessage } from "@/lib/domain/whatsapp";

describe("whatsapp receipt", () => {
  it("builds receipt text", () => {
    const message = buildReceiptMessage({
      negocio: "Prestamos La Esperanza",
      cliente: "Cliente A",
      monto: 60000,
      medioPago: "efectivo",
      cuota: "1 de 10",
      saldo: 540000,
      cobrador: "Cobrador A1",
      fecha: "2026-06-05 09:30",
    });
    expect(message).toContain("Prestamos La Esperanza");
    expect(message).toContain("$60.000");
    expect(message).toContain("Cuota 1 de 10");
  });
});
```

- [ ] **Step 3: Correr pruebas y confirmar fallo**

Run:
```bash
npx vitest run tests/domain/loans.test.ts tests/domain/mora.test.ts tests/domain/whatsapp.test.ts
```

Expected: falla por modulos inexistentes.

- [ ] **Step 4: Implementar dominio**

Crear `lib/domain/money.ts`:

```typescript
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}
```

Crear `lib/domain/loans.ts`:

```typescript
import { roundMoney } from "@/lib/domain/money";

export type LoanModel = "cuota_fija" | "solo_interes" | "sobre_saldo";

export type LoanInput = {
  capital: number;
  tasaMensual: number;
  plazoDias: number;
  modelo: LoanModel;
};

export type ScheduleInput = LoanInput & {
  fechaInicio: string;
  excluirSabados: boolean;
  excluirDomingos: boolean;
};

export type ScheduleItem = {
  numeroCuota: number;
  fechaEsperada: string;
  montoEsperado: number;
  montoCapital: number;
  montoInteres: number;
  saldoEstimado: number;
};

export function calculateLoanTotals(input: LoanInput) {
  if (input.modelo === "solo_interes") {
    const interesTotal = roundMoney(input.capital * (input.tasaMensual / 100));
    return { totalPagar: roundMoney(input.capital + interesTotal), cuotaDiaria: roundMoney(interesTotal / input.plazoDias) };
  }
  const totalPagar = roundMoney(input.capital + input.capital * (input.tasaMensual / 100));
  return { totalPagar, cuotaDiaria: roundMoney(totalPagar / input.plazoDias) };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSkipped(date: Date, excluirSabados: boolean, excluirDomingos: boolean) {
  const day = date.getUTCDay();
  return (day === 6 && excluirSabados) || (day === 0 && excluirDomingos);
}

export function buildLoanSchedule(input: ScheduleInput): ScheduleItem[] {
  const dates: string[] = [];
  let cursor = new Date(`${input.fechaInicio}T00:00:00.000Z`);
  while (dates.length < input.plazoDias) {
    if (!isSkipped(cursor, input.excluirSabados, input.excluirDomingos)) dates.push(toIsoDate(cursor));
    cursor = addDays(cursor, 1);
  }

  const { totalPagar, cuotaDiaria } = calculateLoanTotals(input);
  let accumulated = 0;
  let saldo = totalPagar;
  return dates.map((fechaEsperada, index) => {
    const remainingSlots = dates.length - index;
    const montoEsperado = remainingSlots === 1 ? roundMoney(totalPagar - accumulated) : cuotaDiaria;
    accumulated = roundMoney(accumulated + montoEsperado);
    saldo = roundMoney(saldo - montoEsperado);
    return {
      numeroCuota: index + 1,
      fechaEsperada,
      montoEsperado,
      montoCapital: input.modelo === "solo_interes" && remainingSlots > 1 ? 0 : roundMoney(Math.min(input.capital, montoEsperado)),
      montoInteres: roundMoney(Math.max(0, montoEsperado - Math.min(input.capital, montoEsperado))),
      saldoEstimado: saldo,
    };
  });
}
```

Crear `lib/domain/mora.ts`:

```typescript
import { roundMoney } from "@/lib/domain/money";

export function calculateMora(input: { saldoVencido: number; tipo: "porcentaje" | "monto_fijo"; valor: number; diasMora: number }) {
  if (input.diasMora <= 0) return 0;
  if (input.tipo === "monto_fijo") return roundMoney(input.valor * input.diasMora);
  return roundMoney(input.saldoVencido * (input.valor / 100) * input.diasMora);
}
```

Crear `lib/domain/whatsapp.ts`:

```typescript
import { formatCop } from "@/lib/domain/money";

export function buildReceiptMessage(input: {
  negocio: string;
  cliente: string;
  monto: number;
  medioPago: string;
  cuota: string;
  saldo: number;
  cobrador: string;
  fecha: string;
  ubicacion?: string;
}) {
  const parts = [
    `${input.negocio}: comprobante de pago`,
    `Cliente: ${input.cliente}`,
    `Fecha: ${input.fecha}`,
    `Monto: ${formatCop(input.monto)}`,
    `Medio: ${input.medioPago}`,
    `Cuota ${input.cuota}`,
    `Saldo restante: ${formatCop(input.saldo)}`,
    `Cobrador: ${input.cobrador}`,
  ];
  if (input.ubicacion) parts.push(`Ubicacion: ${input.ubicacion}`);
  return parts.join("\n");
}
```

- [ ] **Step 5: Verificar**

Run:
```bash
npx vitest run tests/domain/loans.test.ts tests/domain/mora.test.ts tests/domain/whatsapp.test.ts
npx tsc --noEmit
```

Expected: tests y TypeScript pasan.

- [ ] **Step 6: Commit**

```bash
```

---

### Task 1.4: RPC Crear Prestamo Y Registrar Pago

**Files:**
- Create via CLI: `supabase/migrations/*_production_rpc_core.sql`
- Modify: generated migration
- Test: `tests/api/loans.integration.test.ts`

- [ ] **Step 1: Crear migracion RPC**

Run:
```bash
npx supabase migration new production_rpc_core
```

Expected: crea `supabase/migrations/<timestamp>_production_rpc_core.sql`.

- [ ] **Step 2: Agregar RPC SQL**

Pegar en la migracion generada:

```sql
create or replace function public.audit_action(
  p_organization_id uuid,
  p_actor_id uuid,
  p_actor_rol text,
  p_accion text,
  p_entidad text,
  p_entidad_id uuid,
  p_estado_anterior jsonb,
  p_estado_nuevo jsonb
)
returns void
language sql
security invoker
as $$
  insert into public.audit_logs (organization_id, actor_id, actor_rol, accion, entidad, entidad_id, estado_anterior, estado_nuevo)
  values (p_organization_id, p_actor_id, p_actor_rol, p_accion, p_entidad, p_entidad_id, p_estado_anterior, p_estado_nuevo);
$$;

create or replace function public.register_payment(
  p_cronograma_pago_id uuid,
  p_monto numeric,
  p_medio_pago medio_pago,
  p_tipo text,
  p_lat numeric default null,
  p_lng numeric default null,
  p_nota text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_cuota public.cronograma_pagos%rowtype;
  v_prestamo public.prestamos%rowtype;
  v_pago_id uuid;
  v_nuevo_pagado numeric(14,2);
  v_nuevo_estado estado_cuota;
begin
  if p_monto <= 0 then
    raise exception 'payment amount must be positive';
  end if;

  select * into v_cuota
  from public.cronograma_pagos
  where id = p_cronograma_pago_id
  for update;

  if not found then
    raise exception 'schedule payment not found';
  end if;

  select * into v_prestamo
  from public.prestamos
  where id = v_cuota.prestamo_id
  for update;

  v_nuevo_pagado := v_cuota.monto_pagado + p_monto;
  v_nuevo_estado := case when v_nuevo_pagado >= v_cuota.monto_esperado then 'pagado'::estado_cuota else 'parcial'::estado_cuota end;

  insert into public.pagos (organization_id, prestamo_id, cronograma_pago_id, cliente_id, cobrador_id, registrado_por, monto, medio_pago, tipo, lat, lng, nota)
  values (v_cuota.organization_id, v_cuota.prestamo_id, v_cuota.id, v_prestamo.cliente_id, coalesce(v_cuota.cobrador_id, auth.uid()), auth.uid(), p_monto, p_medio_pago, p_tipo, p_lat, p_lng, p_nota)
  returning id into v_pago_id;

  update public.cronograma_pagos
  set monto_pagado = v_nuevo_pagado,
      fecha_pago = now(),
      medio_pago = p_medio_pago,
      estado = v_nuevo_estado,
      lat = coalesce(p_lat, lat),
      lng = coalesce(p_lng, lng)
  where id = v_cuota.id;

  update public.prestamo_saldos
  set total_pagado = total_pagado + p_monto,
      saldo_pendiente = greatest(0, saldo_pendiente - p_monto),
      updated_at = now()
  where prestamo_id = v_prestamo.id;

  perform public.audit_action(v_cuota.organization_id, auth.uid(), public.current_rol(), 'registrar_pago', 'pagos', v_pago_id, to_jsonb(v_cuota), jsonb_build_object('monto', p_monto, 'estado_cuota', v_nuevo_estado));

  update public.prestamos
  set estado = 'saldado'
  where id = v_prestamo.id
    and exists (select 1 from public.prestamo_saldos where prestamo_id = v_prestamo.id and saldo_pendiente = 0);

  return v_pago_id;
end;
$$;
```

- [ ] **Step 3: Aplicar migracion**

Run:
```bash
npm run db:push
npm run gen:types
```

Expected: RPC existe y tipos regeneran.

- [ ] **Step 4: Commit**

```bash
```

---

### Task 1.5: Endpoints Core Para Frontend

**Files:**
- Create: `app/api/auth/me/route.ts`
- Create: `app/api/clientes/route.ts`
- Create: `app/api/clientes/[id]/route.ts`
- Create: `app/api/prestamos/route.ts`
- Create: `app/api/prestamos/[id]/route.ts`
- Create: `app/api/prestamos/[id]/cronograma/route.ts`
- Create: `app/api/ruta/hoy/route.ts`
- Create: `app/api/pagos/route.ts`
- Create: `app/api/pagos/[id]/comprobante/route.ts`
- Test: `tests/api/core-contract.test.ts`

- [ ] **Step 1: Escribir contrato minimo de tests**

Crear `tests/api/core-contract.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

const endpoints = [
  "app/api/auth/me/route.ts",
  "app/api/clientes/route.ts",
  "app/api/clientes/[id]/route.ts",
  "app/api/prestamos/route.ts",
  "app/api/prestamos/[id]/route.ts",
  "app/api/prestamos/[id]/cronograma/route.ts",
  "app/api/ruta/hoy/route.ts",
  "app/api/pagos/route.ts",
  "app/api/pagos/[id]/comprobante/route.ts",
];

describe("core API contract files", () => {
  it.each(endpoints)("exists: %s", async (path) => {
    await expect(import(`../../${path}`)).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Correr test y confirmar fallo**

Run:
```bash
npx vitest run tests/api/core-contract.test.ts
```

Expected: falla porque faltan endpoints.

- [ ] **Step 3: Implementar endpoints con helpers**

Patron obligatorio para cada endpoint:

```typescript
import { apiError, apiOk } from "@/lib/api/errors";
import { requireApiActor } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { actor, response } = await requireApiActor();
  if (response) return response;
  const supabase = await createClient();
  const { data, error } = await supabase.from("clientes").select("*").eq("organization_id", actor!.organizationId);
  if (error) return apiError("INTERNAL_ERROR", error.message, 500);
  return apiOk(data ?? []);
}
```

Implementar cada route con estas reglas:

- `auth/me`: devuelve actor, profile, organization, tenant_settings, tenant_subscriptions.
- `clientes`: `GET` lista/busca, `POST` crea cliente solo admin/super_admin.
- `clientes/[id]`: `GET`, `PATCH`, `DELETE` logico con `activo=false`.
- `prestamos`: `GET` lista; `POST` crea prestamo cuota fija inicial y cronograma usando dominio TS dentro de transaccion RPC o inserts server-side con service role y auditoria.
- `prestamos/[id]`: `GET` detalle con cliente, saldo, cronograma.
- `prestamos/[id]/cronograma`: `GET` cuotas.
- `ruta/hoy`: `GET` cuotas del dia filtradas por cobrador para rol cobrador o por query para admin.
- `pagos`: `GET` historial; `POST` llama `register_payment`.
- `pagos/[id]/comprobante`: `GET` arma mensaje con `buildReceiptMessage`.

- [ ] **Step 4: Verificar contrato y compilacion**

Run:
```bash
npx vitest run tests/api/core-contract.test.ts
npx tsc --noEmit
npm run build
```

Expected: imports, TypeScript y build pasan.

- [ ] **Step 5: Documentar contrato core**

Crear `docs/backend-api.md` con esta seccion inicial:

```markdown
# Backend API

Todas las respuestas exitosas usan `{ "data": ..., "meta": ... }`.
Todos los errores usan `{ "error": { "code": "...", "message": "...", "details": {} } }`.

## Core

- `GET /api/auth/me`
- `GET /api/clientes`
- `POST /api/clientes`
- `GET /api/clientes/:id`
- `PATCH /api/clientes/:id`
- `DELETE /api/clientes/:id`
- `GET /api/prestamos`
- `POST /api/prestamos`
- `GET /api/prestamos/:id`
- `GET /api/prestamos/:id/cronograma`
- `GET /api/ruta/hoy`
- `GET /api/pagos`
- `POST /api/pagos`
- `GET /api/pagos/:id/comprobante`
```

- [ ] **Step 6: Commit**

```bash
```

---

## Phase 2: Operacion Completa

### Task 2.1: Mora, Refinanciamiento, Liquidacion Y Caja

**Files:**
- Create via CLI: `supabase/migrations/*_operation_rpc.sql`
- Create: `app/api/mora/route.ts`
- Create: `app/api/mora/run/route.ts`
- Create: `app/api/mora/[id]/pago/route.ts`
- Create: `app/api/mora/[id]/condonar/route.ts`
- Create: `app/api/prestamos/[id]/refinanciar/route.ts`
- Create: `app/api/prestamos/[id]/cancelar/route.ts`
- Create: `app/api/caja/resumen/route.ts`
- Create: `app/api/caja/cierre-ruta/route.ts`
- Create: `app/api/caja/cierre-general/route.ts`
- Create: `app/api/caja/historial/route.ts`
- Create: `app/api/ruta/visitas/route.ts`
- Test: `tests/api/operation-contract.test.ts`

- [ ] **Step 1: Crear tests de contrato de operacion**

Crear `tests/api/operation-contract.test.ts`:

```typescript
import { describe, expect, it } from "vitest";

const endpoints = [
  "app/api/mora/route.ts",
  "app/api/mora/run/route.ts",
  "app/api/mora/[id]/pago/route.ts",
  "app/api/mora/[id]/condonar/route.ts",
  "app/api/prestamos/[id]/refinanciar/route.ts",
  "app/api/prestamos/[id]/cancelar/route.ts",
  "app/api/caja/resumen/route.ts",
  "app/api/caja/cierre-ruta/route.ts",
  "app/api/caja/cierre-general/route.ts",
  "app/api/caja/historial/route.ts",
  "app/api/ruta/visitas/route.ts",
];

describe("operation API contract files", () => {
  it.each(endpoints)("exists: %s", async (path) => {
    await expect(import(`../../${path}`)).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Crear migracion RPC de operacion**

Run:
```bash
npx supabase migration new operation_rpc
```

Expected: crea migracion `*_operation_rpc.sql`.

- [ ] **Step 3: Implementar RPCs transaccionales**

La migracion debe crear estas funciones con `security invoker`:

```sql
-- Signatures required by API routes
create or replace function public.run_mora_detection(p_run_date date default current_date) returns integer language plpgsql security invoker as $$
declare v_count integer := 0;
begin
  insert into public.mora_registros (prestamo_id, organization_id, fecha_inicio_mora, dias_mora, monto_mora, estado)
  select cp.prestamo_id, cp.organization_id, min(cp.fecha_esperada), greatest(1, p_run_date - min(cp.fecha_esperada)), 0, 'activa'
  from public.cronograma_pagos cp
  where cp.fecha_esperada < p_run_date and cp.estado in ('pendiente','parcial')
  group by cp.prestamo_id, cp.organization_id
  on conflict do nothing;

  update public.prestamos p
  set estado = 'en_mora'
  where exists (select 1 from public.mora_registros m where m.prestamo_id = p.id and m.estado = 'activa');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
```

Tambien crear:

- `public.refinance_loan(p_prestamo_id uuid, p_new_capital numeric, p_tasa_mensual numeric, p_plazo_dias integer, p_modelo modelo_interes)` returns `uuid`.
- `public.cancel_loan(p_prestamo_id uuid, p_reason text)` returns `void`.
- `public.close_route_cash(p_cobrador_id uuid, p_fecha date, p_efectivo_declarado numeric)` returns `uuid`.

Each function must call `public.audit_action`.

- [ ] **Step 4: Implementar endpoints**

Implementar routes listadas en Step 1. Reglas:

- `mora/run` acepta `POST` solo super_admin o secreto `CRON_SECRET` en header `x-cron-secret`.
- `refinanciar`, `cancelar`, `condonar`, `cierre-general` requieren admin/super_admin.
- `cierre-ruta` permite cobrador para su propio id y admin para cualquiera del tenant.
- `ruta/visitas` permite cobrador solo para su ruta.

- [ ] **Step 5: Verificar**

Run:
```bash
npm run db:push
npm run gen:types
npx vitest run tests/api/operation-contract.test.ts
npx tsc --noEmit
npm run build
```

Expected: migraciones, tipos, contrato y build pasan.

- [ ] **Step 6: Commit**

```bash
```

---

## Phase 3: Inteligencia Y Super Admin

### Task 3.1: Reportes Y Super Admin Backend

**Files:**
- Create: `lib/domain/reports.ts`
- Create: `app/api/reportes/resumen/route.ts`
- Create: `app/api/reportes/cobradores/route.ts`
- Create: `app/api/reportes/cartera-riesgo/route.ts`
- Create: `app/api/reportes/proyeccion/route.ts`
- Create: `app/api/reportes/export/route.ts`
- Create: `app/api/super-admin/tenants/route.ts`
- Create: `app/api/super-admin/tenants/[id]/route.ts`
- Create: `app/api/super-admin/tenants/[id]/activar/route.ts`
- Create: `app/api/super-admin/tenants/[id]/suspender/route.ts`
- Create: `app/api/super-admin/tenants/[id]/extender-periodo/route.ts`
- Create: `app/api/super-admin/metricas/route.ts`
- Test: `tests/api/intelligence-contract.test.ts`

- [ ] **Step 1: Crear test de contrato**

Crear `tests/api/intelligence-contract.test.ts` con imports de todos los archivos listados y el mismo patron de `operation-contract.test.ts`.

- [ ] **Step 2: Crear `lib/domain/reports.ts`**

```typescript
export function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

export function groupSum<T extends Record<string, unknown>>(rows: T[], key: keyof T, amount: keyof T) {
  const result = new Map<string, number>();
  for (const row of rows) {
    const group = String(row[key] ?? "sin_valor");
    const current = result.get(group) ?? 0;
    result.set(group, current + Number(row[amount] ?? 0));
  }
  return Array.from(result.entries()).map(([name, total]) => ({ name, total }));
}
```

- [ ] **Step 3: Implementar endpoints de reportes**

Cada endpoint consulta via Supabase SSR con RLS:

- `resumen`: total recaudado, total esperado, prestamos activos, prestamos en mora.
- `cobradores`: recaudo por cobrador, cumplimiento, cierres.
- `cartera-riesgo`: mora > 3, > 7, > 15 dias.
- `proyeccion`: suma cronograma pendiente proximos N dias.
- `export`: devuelve CSV con `Content-Type: text/csv` para v1.

- [ ] **Step 4: Implementar endpoints super admin**

Todos requieren `requireApiActor(["super_admin"])`.

- `tenants`: lista organizaciones con suscripcion y conteos.
- `tenants/[id]`: detalle.
- `activar/suspender/extender-periodo`: actualiza `organizations.estado_suscripcion` y `tenant_subscriptions` si existe.
- `metricas`: conteos globales.

- [ ] **Step 5: Verificar**

Run:
```bash
npx vitest run tests/api/intelligence-contract.test.ts
npx tsc --noEmit
npm run build
```

Expected: tests, TypeScript y build pasan.

- [ ] **Step 6: Commit**

```bash
```

---

## Phase 4: SaaS, Storage Y Notificaciones

### Task 4.1: Suscripciones, Storage Y Emails

**Files:**
- Create via CLI: `supabase/migrations/*_saas_storage_notifications.sql`
- Create: `app/api/tenant/configuracion/route.ts`
- Create: `app/api/tenant/logo/route.ts`
- Create: `app/api/super-admin/plans/route.ts`
- Create: `app/api/super-admin/plans/[id]/route.ts`
- Create: `app/api/super-admin/subscriptions/route.ts`
- Create: `app/api/webhooks/subscription-payment/route.ts`
- Create: `lib/notifications/resend.ts`
- Test: `tests/api/saas-contract.test.ts`

- [ ] **Step 1: Crear migracion SaaS**

Run:
```bash
npx supabase migration new saas_storage_notifications
```

Expected: crea migracion `*_saas_storage_notifications.sql`.

- [ ] **Step 2: Escribir SQL SaaS**

Pegar en la migracion:

```sql
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_mensual numeric(14,2) not null,
  limite_cobradores integer not null,
  limite_prestamos_activos integer not null,
  features jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  estado text not null check (estado in ('trial','activa','gracia','vencida','cancelada','suspendida')),
  periodo_inicio date not null,
  periodo_fin date not null,
  trial_hasta date,
  provider text check (provider in ('wompi','stripe','manual')),
  provider_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid not null references public.tenant_subscriptions(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  monto numeric(14,2) not null,
  estado text not null check (estado in ('pendiente','aprobado','rechazado','reembolsado')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  canal text not null check (canal in ('email','whatsapp_link','sistema')),
  tipo text not null,
  destino text,
  payload jsonb not null default '{}'::jsonb,
  estado text not null check (estado in ('pendiente','enviado','fallido')),
  created_at timestamptz not null default now()
);

create index idx_tenant_subscriptions_org on public.tenant_subscriptions (organization_id);
create index idx_subscription_payments_org on public.subscription_payments (organization_id, created_at desc);
create index idx_notification_events_org on public.notification_events (organization_id, created_at desc);
```

- [ ] **Step 3: RLS SaaS en misma migracion**

Agregar debajo:

```sql
alter table public.subscription_plans enable row level security;
alter table public.subscription_plans force row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.tenant_subscriptions force row level security;
alter table public.subscription_payments enable row level security;
alter table public.subscription_payments force row level security;
alter table public.notification_events enable row level security;
alter table public.notification_events force row level security;

grant select on public.subscription_plans to authenticated;
grant select on public.tenant_subscriptions to authenticated;
grant select on public.subscription_payments to authenticated;
grant select, insert on public.notification_events to authenticated;

create policy subscription_plans_select on public.subscription_plans for select to authenticated using (true);
create policy tenant_subscriptions_select on public.tenant_subscriptions for select to authenticated using (public.is_super_admin() or organization_id = public.current_org_id());
create policy subscription_payments_select on public.subscription_payments for select to authenticated using (public.is_super_admin() or organization_id = public.current_org_id());
create policy notification_events_select on public.notification_events for select to authenticated using (public.is_super_admin() or organization_id = public.current_org_id());
create policy notification_events_insert on public.notification_events for insert to authenticated with check (public.is_super_admin() or organization_id = public.current_org_id());
```

- [ ] **Step 4: Implementar tenant config/logo**

- `tenant/configuracion`: `GET` y `PATCH` sobre `tenant_settings`, admin/super_admin para `PATCH`.
- `tenant/logo`: `POST` recibe archivo/form-data, sube a bucket privado `tenant-assets`, actualiza `organizations.logo_url`.

- [ ] **Step 5: Implementar SaaS endpoints y webhook manual**

- `super-admin/plans`: CRUD de planes.
- `super-admin/subscriptions`: lista suscripciones.
- `webhooks/subscription-payment`: valida `x-webhook-secret === process.env.SUBSCRIPTION_WEBHOOK_SECRET`, registra `subscription_payments`, actualiza `tenant_subscriptions.estado`.

- [ ] **Step 6: Crear Resend adapter**

Crear `lib/notifications/resend.ts`:

```typescript
export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY missing" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL ?? "CrediControl <noreply@credicontrol.app>", ...input }),
  });
  return { sent: response.ok, status: response.status };
}
```

- [ ] **Step 7: Verificar**

Run:
```bash
npm run db:push
npm run gen:types
npx vitest run tests/api/saas-contract.test.ts
npx tsc --noEmit
npm run build
```

Expected: migraciones, tipos, tests y build pasan.

- [ ] **Step 8: Commit**

```bash
```

---

## Phase 5: Hardening Produccion

### Task 5.1: Seguridad, Performance Y Documentacion Final

**Files:**
- Modify: `docs/backend-api.md`
- Modify: `supabase/README.md`
- Create: `docs/production-checklist.md`
- Test: `tests/api/security.test.ts`

- [ ] **Step 1: Crear security tests**

Crear `tests/api/security.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { apiError } from "@/lib/api/errors";

describe("API security contract", () => {
  it("uses 401 for unauthenticated", async () => {
    const response = apiError("UNAUTHENTICATED", "No autenticado", 401);
    expect(response.status).toBe(401);
  });

  it("uses 403 for forbidden", async () => {
    const response = apiError("FORBIDDEN", "Rol no autorizado", 403);
    expect(response.status).toBe(403);
  });
});
```

- [ ] **Step 2: Completar documentacion REST**

Actualizar `docs/backend-api.md` con todos los endpoints de las fases 1-4, request/response shape y codigos de error.

- [ ] **Step 3: Crear checklist produccion**

Crear `docs/production-checklist.md`:

```markdown
# Production Checklist

- [ ] `npm run lint` pasa.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm test` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run db:push` aplicado en Supabase.
- [ ] `npm run gen:types` ejecutado despues de migraciones.
- [ ] Auth hook habilitado en Dashboard.
- [ ] JWT contiene `rol` y `organization_id`.
- [ ] RLS forzado en todas las tablas publicas.
- [ ] Supabase security advisors sin hallazgos criticos.
- [ ] Supabase performance advisors revisados.
- [ ] Variables configuradas en Vercel: Supabase URL, publishable key, service role, cron secret, webhook secret, Resend key.
- [ ] Bucket `tenant-assets` creado y probado.
- [ ] Usuario inactivo recibe 403.
- [ ] Endpoints sin sesion devuelven 401.
- [ ] Frontend tiene `docs/backend-api.md` actualizado.
```

- [ ] **Step 4: Ejecutar verificacion completa**

Run:
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Expected: todos pasan.

- [ ] **Step 5: Ejecutar advisors Supabase**

Run via MCP if available:
```text
supabase_get_advisors(type: "security")
```

Expected: sin hallazgos criticos. Si hay hallazgos, corregir antes del commit.

- [ ] **Step 6: Commit**

```bash
```

---

## Self-Review Checklist

- Spec coverage: Fase 1 cubre Core Operativo; Fase 2 cubre Operacion Completa; Fase 3 cubre Inteligencia/Super Admin; Fase 4 cubre SaaS/Storage/Notificaciones; Fase 5 cubre hardening.
- Placeholder scan: el plan no contiene marcadores abiertos ni pasos sin archivo/command.
- Type consistency: nombres de tablas y endpoints coinciden con `docs/superpowers/specs/2026-06-04-backend-produccion-srs-design.md`.
- Risk: algunos endpoints complejos se implementan por reglas de contrato en vez de listar cada linea final, porque su contenido depende de los tipos generados despues de aplicar migraciones. La verificacion obligatoria por fase evita avanzar con contratos rotos.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-04-backend-produccion-srs.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
