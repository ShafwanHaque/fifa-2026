-- Stores each visitor's pick for a knockout-stage match, used to compute
-- their prediction score once results are known.
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  match_id bigint not null,
  stage text not null,
  predicted_team_id bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (username, match_id)
);

alter table public.predictions enable row level security;
