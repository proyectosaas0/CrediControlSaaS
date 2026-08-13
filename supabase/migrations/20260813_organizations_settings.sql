-- Configuracion operativa del negocio: horarios, moneda, dias de cobro,
-- geolocalizacion, plantilla de WhatsApp y color de marca.
alter table public.organizations
  add column if not exists horario_inicio text,
  add column if not exists horario_fin text,
  add column if not exists moneda text not null default 'COP',
  add column if not exists cobrar_sabados boolean not null default true,
  add column if not exists cobrar_domingos boolean not null default false,
  add column if not exists geolocalizacion_requerida boolean not null default false,
  add column if not exists whatsapp_template text,
  add column if not exists color_primario text;

alter table public.organizations
  add constraint organizations_moneda_check check (moneda in ('COP', 'USD'));
