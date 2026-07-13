create table if not exists public.inspections (
  id text primary key,
  "driverName" text,
  plate text,
  "startedAt" timestamptz,
  "finishedAt" timestamptz,
  notes text,
  ai jsonb,
  photos jsonb,
  drive jsonb,
  storage jsonb,
  created_at timestamptz default now()
);

create index if not exists inspections_plate_finished_idx
on public.inspections (plate, "finishedAt" desc);

alter table public.inspections enable row level security;

create table if not exists public.dispatchers (
  email text primary key,
  name text,
  role text,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table public.dispatchers enable row level security;

create table if not exists public.route_plans (
  date text primary key,
  planned_routes integer not null default 0,
  updated_at timestamptz default now(),
  updated_by text
);

create index if not exists route_plans_date_idx
on public.route_plans (date desc);

alter table public.route_plans enable row level security;
