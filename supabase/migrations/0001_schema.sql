-- Extensiones
create extension if not exists pg_trgm;

-- Enums
create type rol as enum ('super_admin', 'admin', 'cobrador');
create type estado_suscripcion as enum ('activo', 'trial', 'vencido', 'suspendido');
create type modelo_interes as enum ('cuota_fija', 'solo_interes', 'sobre_saldo');
create type estado_prestamo as enum ('activo', 'en_mora', 'saldado', 'refinanciado', 'cancelado');
create type estado_cuota as enum ('pendiente', 'pagado', 'parcial', 'vencido');
create type medio_pago as enum ('efectivo', 'nequi', 'transferencia');
create type estado_mora as enum ('activa', 'pagada', 'condonada');

-- organizations (tenants)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  logo_url text,
  ciudad text,
  telefono text,
  plan text,
  estado_suscripcion estado_suscripcion not null default 'trial',
  trial_hasta date,
  created_at timestamptz not null default now()
);

-- profiles (usuarios; organization_id nullable solo para super_admin)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  nombre_completo text not null default '',
  rol rol not null,
  telefono text,
  activo boolean not null default true,
  ultimo_acceso timestamptz
);

-- clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  nombre text not null,
  cedula text,
  telefono text,
  direccion text,
  barrio text,
  notas text,
  score_pago numeric not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- prestamos
create table public.prestamos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  cobrador_id uuid references public.profiles(id) on delete set null,
  capital numeric(14,2) not null,
  modelo_interes modelo_interes not null,
  tasa_mensual numeric not null,
  total_pagar numeric(14,2),
  cuota_diaria numeric(14,2),
  plazo_dias integer not null,
  dias_habiles integer,
  excluir_sabados boolean not null default false,
  excluir_domingos boolean not null default false,
  fecha_inicio date,
  fecha_fin date,
  estado estado_prestamo not null default 'activo',
  prestamo_anterior_id uuid references public.prestamos(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- cronograma_pagos
create table public.cronograma_pagos (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  numero_cuota integer not null,
  fecha_esperada date not null,
  monto_esperado numeric(14,2) not null,
  estado estado_cuota not null default 'pendiente',
  fecha_pago timestamptz,
  monto_pagado numeric(14,2) not null default 0,
  medio_pago medio_pago,
  cobrador_id uuid references public.profiles(id) on delete set null,
  lat numeric,
  lng numeric
);

-- mora_registros
create table public.mora_registros (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  fecha_inicio_mora date,
  dias_mora integer,
  monto_mora numeric(14,2),
  monto_pagado_mora numeric(14,2) not null default 0,
  estado estado_mora not null default 'activa'
);

-- cierres_caja
create table public.cierres_caja (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  cobrador_id uuid references public.profiles(id) on delete set null,
  fecha date not null,
  total_esperado numeric(14,2),
  total_recaudado numeric(14,2),
  efectivo_declarado numeric(14,2),
  cerrado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Índices de aislamiento (organization_id en cada tabla)
create index idx_profiles_org on public.profiles (organization_id);
create index idx_clientes_org on public.clientes (organization_id);
create index idx_prestamos_org on public.prestamos (organization_id);
create index idx_cronograma_org on public.cronograma_pagos (organization_id);
create index idx_mora_org on public.mora_registros (organization_id);
create index idx_cierres_org on public.cierres_caja (organization_id);

-- Índices compuestos para consultas calientes
create index idx_cronograma_ruta on public.cronograma_pagos (organization_id, fecha_esperada, estado);
create index idx_cronograma_prestamo on public.cronograma_pagos (prestamo_id);
create index idx_prestamos_cobrador on public.prestamos (organization_id, cobrador_id, estado);
create index idx_prestamos_estado on public.prestamos (organization_id, estado);
create index idx_prestamos_cliente on public.prestamos (cliente_id);
create index idx_mora_estado on public.mora_registros (organization_id, estado);
create index idx_cierres_fecha on public.cierres_caja (organization_id, fecha);
create index idx_cierres_cobrador on public.cierres_caja (cobrador_id, fecha);
create index idx_profiles_rol on public.profiles (organization_id, rol);
create index idx_clientes_cedula on public.clientes (organization_id, cedula);

-- Búsqueda por nombre (trigram)
create index idx_clientes_nombre_trgm on public.clientes using gin (nombre gin_trgm_ops);
