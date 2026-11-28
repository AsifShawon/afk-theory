-- Custom design gallery examples for /custom-design/.
-- Run once in the Supabase SQL editor after earlier catalogue migrations.
-- Safe to re-run.
--
-- Until this runs, the public site keeps building (custom_designs is treated as empty)
-- and the admin shows a reminder on the Custom gallery screen.

create table if not exists public.custom_designs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  garment_type text not null default '' check (char_length(garment_type) <= 80),
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  image_path text,
  image_widths integer[] not null default '{}',
  image_width integer,
  image_height integer,
  image_alt text not null default '',
  detail_image_path text,
  detail_image_widths integer[] not null default '{}',
  detail_image_width integer,
  detail_image_height integer,
  detail_image_alt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_designs_status_sort_idx on public.custom_designs (status, sort_order);

drop trigger if exists custom_designs_set_updated_at on public.custom_designs;
create trigger custom_designs_set_updated_at
  before update on public.custom_designs
  for each row execute function public.set_updated_at();

grant select on public.custom_designs to anon, authenticated;
grant all on public.custom_designs to service_role;

alter table public.custom_designs enable row level security;

drop policy if exists "Public can read published custom designs" on public.custom_designs;
create policy "Public can read published custom designs" on public.custom_designs
  for select to anon, authenticated using (status = 'published');

-- No insert, update or delete policies: only the secret key can write.
