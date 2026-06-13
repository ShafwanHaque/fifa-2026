-- Stores the unique display name chosen by each visitor, mirrored in the
-- "userName" browser cookie.
create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness: "Alice" and "alice" are treated as the same name.
create unique index visitors_username_lower_idx on public.visitors (lower(username));

alter table public.visitors enable row level security;
