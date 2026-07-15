create table if not exists public.inspections (
  id text primary key,
  site text,
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

alter table public.inspections add column if not exists site text;
update public.inspections set site = 'UNASSIGNED' where site is null or trim(site) = '';

create index if not exists inspections_plate_finished_idx
on public.inspections (plate, "finishedAt" desc);

create index if not exists inspections_site_finished_idx
on public.inspections (site, "finishedAt" desc);

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
  site text not null default 'all',
  planned_routes integer not null default 0,
  updated_at timestamptz default now(),
  updated_by text
);

alter table public.route_plans add column if not exists site text not null default 'all';
alter table public.route_plans add column if not exists planned_routes integer not null default 0;
alter table public.route_plans add column if not exists updated_at timestamptz default now();
alter table public.route_plans add column if not exists updated_by text;
alter table public.route_plans drop constraint if exists route_plans_pkey;
alter table public.route_plans drop constraint if exists route_plans_date_site_key;
alter table public.route_plans add constraint route_plans_date_site_key unique (date, site);

create index if not exists route_plans_date_idx
on public.route_plans (date desc);

create index if not exists route_plans_date_site_idx
on public.route_plans (date desc, site);

alter table public.route_plans enable row level security;
