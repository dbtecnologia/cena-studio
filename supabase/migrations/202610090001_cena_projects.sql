Attempting to perform the InitializeDefaultDrives operation on the 'FileSystem' provider failed.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Sem título',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- A API da CENA usa a service role somente no servidor Vercel.
-- Não abrimos a tabela anon/authenticated até autenticação de usuário ser adicionada.
revoke all on table public.projects from anon, authenticated;
grant all on table public.projects to service_role;

create index if not exists projects_updated_at_idx on public.projects (updated_at desc);


