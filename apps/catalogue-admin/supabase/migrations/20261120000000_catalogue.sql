-- AFK THEORY showcase catalogue schema.
-- Run once in the Supabase SQL editor (or with `supabase db push`).
-- Safe to re-run: every statement checks whether the object already exists.
--
-- Access model:
--   * The public site builds with the publishable (anon) key. RLS lets it read
--     published products, their colors and images, categories and settings.
--   * Nobody can write with the publishable key.
--   * The local admin uses the secret (service_role) key, which bypasses RLS.

-- ---------------------------------------------------------------- tables

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  tagline text not null default '',
  description text not null default '',
  price_bdt integer not null check (price_bdt >= 0),
  compare_at_bdt integer check (compare_at_bdt is null or compare_at_bdt > price_bdt),
  category_id uuid references public.categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  sizes text[] not null default '{S,M,L,XL,XXL}',
  sold_out_sizes text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  size_chart jsonb not null default '{"columns": [], "rows": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_sort_idx on public.products (status, sort_order);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  hex text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  in_stock boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists product_colors_product_idx on public.product_colors (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.product_colors (id) on delete set null,
  path text not null,
  widths integer[] not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt text not null default '',
  role text not null default 'detail' check (role in ('front', 'back', 'model', 'detail')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images (product_id);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '',
  messenger_page text not null default '',
  instagram_handle text not null default '',
  hero_title text not null default 'Pause the game. Keep your style.',
  hero_subtitle text not null default '',
  announcement text not null default '',
  delivery_zones jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------- updated_at

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- grants

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.product_colors,
  public.product_images, public.site_settings to anon, authenticated;
grant all on public.categories, public.products, public.product_colors,
  public.product_images, public.site_settings to service_role;

-- ---------------------------------------------------------------- row level security

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products" on public.products
  for select to anon, authenticated using (status = 'published');

drop policy if exists "Public can read colors of published products" on public.product_colors;
create policy "Public can read colors of published products" on public.product_colors
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_colors.product_id and p.status = 'published'
    )
  );

drop policy if exists "Public can read images of published products" on public.product_images;
create policy "Public can read images of published products" on public.product_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);

-- No insert, update or delete policies: only the secret key can write.

-- ---------------------------------------------------------------- storage

-- Public bucket: images are readable by URL. Uploads need the secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogue', 'catalogue', true, 5242880, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
