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
