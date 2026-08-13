-- Auditoría de condonación de mora: quién condonó, cuándo y por qué.
alter table public.mora_registros
  add column if not exists motivo_condonacion text,
  add column if not exists condonado_por uuid references public.profiles(id),
  add column if not exists condonado_at timestamptz;
