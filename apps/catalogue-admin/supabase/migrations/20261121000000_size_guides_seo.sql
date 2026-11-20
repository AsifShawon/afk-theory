-- Shared size guides and product SEO fields.
-- Run once in the Supabase SQL editor after 20261120000000_catalogue.sql.
-- Safe to re-run.
--
-- Product descriptions now hold formatted HTML from the admin's editor.
-- Older plain-text descriptions keep working: the site turns their
-- paragraphs into <p> tags. No column change is needed for that.

-- ---------------------------------------------------------------- size guides

create table if not exists public.size_guides (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  unit text not null default 'inches',
  columns text[] not null default '{Chest,Length,Sleeve}',
  -- [{ "size": "M", "values": ["22", "29", "9"] }, ...] in display order
  rows jsonb not null default '[]'::jsonb,
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists size_guides_set_updated_at on public.size_guides;
create trigger size_guides_set_updated_at
  before update on public.size_guides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- products

alter table public.products
  add column if not exists size_guide_id uuid references public.size_guides (id) on delete set null,
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '';

create index if not exists products_size_guide_idx on public.products (size_guide_id);

-- ---------------------------------------------------------------- access

grant select on public.size_guides to anon, authenticated;
grant all on public.size_guides to service_role;

alter table public.size_guides enable row level security;

drop policy if exists "Public can read size guides" on public.size_guides;
create policy "Public can read size guides" on public.size_guides
  for select to anon, authenticated using (true);
