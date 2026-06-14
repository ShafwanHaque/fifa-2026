-- Stores each visitor's chosen team to support/cheer for in a given match.
create table public.supports (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  match_id bigint not null,
  supported_team_id bigint not null,
  created_at timestamptz not null default now(),
  unique (username, match_id)
);

alter table public.supports enable row level security;
